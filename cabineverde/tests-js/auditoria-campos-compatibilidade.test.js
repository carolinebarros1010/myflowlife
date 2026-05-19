import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function extrairTrecho() {
  const source = fs.readFileSync(new URL('../GAS/Code.gs', import.meta.url), 'utf8');
  const iniNorm = source.indexOf('function normalizarCamposAuditoriaParaCasos_(dados, headersCasos) {');
  const iniSalvar = source.indexOf('function salvarAuditoriaCaso_(body, operadorAtual) {');
  const fimSalvar = source.indexOf('\nfunction atualizarFotoCaso_', iniSalvar);
  if (iniNorm < 0 || iniSalvar < 0 || fimSalvar < 0) throw new Error('Funções de auditoria não localizadas.');
  return source.slice(iniSalvar, fimSalvar) + '\n' + source.slice(iniNorm, iniSalvar);
}

function criarContexto(cabecalho, linhaInicial) {
  const rows = [cabecalho.slice(), linhaInicial.slice()];
  const casosSheet = {
    getLastColumn: () => rows[0].length,
    getLastRow: () => rows.length,
    getRange: (row, col, numRows, numCols) => ({
      getValues: () => rows.slice(row - 1, row - 1 + numRows).map((r) => r.slice(col - 1, col - 1 + numCols)),
      setValues: (values) => {
        for (let i = 0; i < numRows; i += 1) {
          rows[row - 1 + i] = values[i].slice();
        }
      },
      setValue: (value) => {
        if (!rows[row - 1]) rows[row - 1] = [];
        rows[row - 1][col - 1] = value;
      }
    })
  };
  let historicoRows = [];
  const historicoSheet = {
    getLastColumn: () => rows[0].length,
    getLastRow: () => historicoRows.length + 1,
    getRange: (row, col, numRows, numCols) => ({
      getValues: () => [new Array(numCols).fill('')],
      setValues: (values) => { historicoRows = historicoRows.concat(values); },
      setValue: () => {}
    })
  };
  const ss = {
    getSheetByName: (name) => (name === 'CASOS' ? casosSheet : name === 'HISTORICO_EDICOES' ? historicoSheet : null),
    insertSheet: () => historicoSheet
  };
  const context = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    Logger: { log: () => {} },
    limparTexto: (v) => (v == null ? '' : String(v)).trim(),
    normalizarTalaoPayload: (x) => x
  };
  vm.createContext(context);
  vm.runInContext(extrairTrecho(), context);
  return { context, rows, historicoRowsRef: () => historicoRows };
}

const cabecalho = ['idCaso','talaoBopm','statusCaso','classificacaoRisco','prioridade','observacoesOperacionais','operadorUltimaAlteracaoAuditoria','emailOperadorUltimaAlteracaoAuditoria','perfilOperadorUltimaAlteracaoAuditoria','dataHoraUltimaAlteracaoAuditoria'];

test('mapeia aliases e registra campo real no histórico', () => {
  const { context } = criarContexto(cabecalho, ['CASO-1','T-1','aberto','medio','baixa','obs','','','','']);
  const r = context.salvarAuditoriaCaso_({
    idCaso: 'CASO-1',
    caso: { classificacaoOperacional: 'alto', prioridadeAutomatica: 'alta', status: 'fechado' },
    operadorNome: 'Op'
  }, { nome: 'Op' });
  assert.equal(r.ok, true);
  assert.deepEqual(Array.from(r.diagnostico.camposMapeados).sort(), ['classificacaoRisco','prioridade','statusCaso'].sort());
  assert.deepEqual(Array.from(r.diagnostico.camposAtualizados).sort(), ['classificacaoRisco','prioridade','statusCaso'].sort());
});

test('retorna erro quando todos os campos são incompatíveis', () => {
  const { context } = criarContexto(cabecalho, ['CASO-1','T-1','aberto','medio','baixa','obs','','','','']);
  const r = context.salvarAuditoriaCaso_({ idCaso: 'CASO-1', caso: { campoX: '1' } }, {});
  assert.equal(r.ok, false);
  assert.equal(r.codigo, 'CAMPOS_AUDITORIA_NAO_COMPATIVEIS_COM_CASOS');
  assert.deepEqual(Array.from(r.diagnostico.camposIgnorados), ['campoX']);
});
