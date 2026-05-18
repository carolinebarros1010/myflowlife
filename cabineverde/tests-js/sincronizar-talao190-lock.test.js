import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function carregarFuncaoSincronizar() {
  const source = fs.readFileSync(new URL('../GAS/Code.gs', import.meta.url), 'utf8');
  const ini = source.indexOf('function sincronizarTalao190(caso) {');
  const fim = source.indexOf('\nfunction encontrarPrimeiraLinhaVaziaRelatorio', ini);
  if (ini < 0 || fim < 0) throw new Error('Função sincronizarTalao190 não localizada.');
  return source.slice(ini, fim);
}

test('simulação controlada: duas chamadas rápidas com mesmo talão fazem insert + update sem duplicidade', () => {
  const fnSource = carregarFuncaoSincronizar();
  const linhas = [];
  const logs = [];
  let lockSegurado = false;
  const lock = {
    waitLock(ms) {
      assert.equal(ms, 30000);
      if (lockSegurado) throw new Error('lock ocupado');
      lockSegurado = true;
    },
    releaseLock() {
      lockSegurado = false;
    }
  };

  const sheet = {
    getName: () => 'RELATÓRIO DIA 18.05.2026',
    getRange: (row, col, numRows, numCols) => ({
      setValues: (values) => {
        const idx = row - 1;
        const registro = values[0].slice(0, numCols);
        linhas[idx] = registro;
      }
    })
  };

  const context = {
    LockService: { getDocumentLock: () => lock },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({}) },
    Logger: { log: () => {} },
    formatarDataHora: () => '18/05/2026 10:00:00',
    limparTexto: (v) => (v == null ? '' : String(v)).trim(),
    resolverDataOperacionalCaso_: () => ({ dataOperacional: new Date('2026-05-18T10:00:00Z'), dataOperacionalISO: '2026-05-18' }),
    obterOuCriarAbaTalao190_: () => sheet,
    validarConsistenciaEstruturalTalao190_: () => {},
    montarLinhaTalao190: (caso) => ['2026-05-18 10:00', caso.talaoPMESP, '', caso.nomeCompletoDesaparecido, '', '', '', '', '', '', caso.idCaso],
    localizarRegistroEmAbaIncompativel_: () => '',
    localizarLinhaAncoraRodape_: () => 200,
    localizarPrimeiraLinhaOperacionalLivre_: () => 4,
    inserirLinhaOperacionalAntesRodape_: () => (linhas[3] ? 5 : 4),
    registrarLogAuditoriaPersistencia_: (_ss, payload) => logs.push(payload.acaoExecutada || payload.mensagemTecnica),
    registrarLogAuditoria_: (payload) => logs.push(payload.evento),

    gerarHashOperacionalTalao_: () => 'hash-1',
    localizarCasoPorIndiceTaloes_: () => ({ encontrado: false }),
    validarReferenciaIndiceTaloes_: () => ({ valido: false, motivo: 'na' }),
    atualizarIndiceTaloes_: () => {},
    normalizarDocumentoRelatorio_: (v) => String(v || '').replace(/[^0-9A-Za-z]/g, '').toUpperCase(),
    normalizarTextoAssinatura_: (v) => String(v || '').trim().toLowerCase(),
    normalizarTelefoneRelatorio_: (v) => String(v || '').replace(/\D/g, ''),
    localizarLinhaDuplicadaRelatorio_: (_sheet, caso) => {
      for (let i = 0; i < linhas.length; i += 1) {
        const row = linhas[i];
        if (row && (row[10] === caso.idCaso || row[1] === caso.talaoPMESP)) return i + 1;
      }
      return -1;
    }
  };

  vm.createContext(context);
  vm.runInContext(fnSource, context);

  const caso = { idCaso: 'CASO-190-001', talaoPMESP: '190A123', nomeCompletoDesaparecido: 'Pessoa Teste' };
  const r1 = context.sincronizarTalao190(caso);
  const r2 = context.sincronizarTalao190(caso);

  assert.equal(r1.status, 'sucesso');
  assert.equal(r2.status, 'atualizado');

  const naoVazias = linhas.filter(Boolean);
  assert.equal(naoVazias.length, 1);
  assert.equal(naoVazias[0][10], 'CASO-190-001');
  assert.equal(naoVazias[0][1], '190A123');
  assert.equal(sheet.getName(), 'RELATÓRIO DIA 18.05.2026');

  assert.ok(logs.includes('LOCK_TALAO_190_ADQUIRIDO'));
  assert.ok(logs.includes('LOCK_TALAO_190_LIBERADO'));
});
