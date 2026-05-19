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

const cabecalho = ['idCaso','talaoBopm','statusCaso','classificacaoRisco','prioridade','observacoesOperacionais','cpf','rg','nomeMae','dataHoraUltimaVisualizacao','localUltimaVisualizacao','roupaUltimaVisualizacao','meioTransporte','operadorUltimaAlteracaoAuditoria','emailOperadorUltimaAlteracaoAuditoria','perfilOperadorUltimaAlteracaoAuditoria','dataHoraUltimaAlteracaoAuditoria'];

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

test('expande cpf/rg de campo composto e mantém prioridade do campo específico', () => {
  const { context } = criarContexto(cabecalho, ['CASO-1','T-1','aberto','medio','baixa','obs','99999999999','RG-OLD','','','','','','','','','']);
  const r = context.salvarAuditoriaCaso_({
    idCaso: 'CASO-1',
    caso: { cpf: '111.111.111-11', cpfRg: 'CPF: 222.222.222-22 / RG: 33.333.333-3' },
    operadorNome: 'Op'
  }, { nome: 'Op' });
  assert.equal(r.ok, true);
  assert.equal(r.diagnostico.camposExpandidos.includes('rg'), true);
  assert.equal(r.diagnostico.camposAtualizados.includes('cpf'), true);
  assert.equal(r.diagnostico.camposAtualizados.includes('rg'), true);
});

test('expande nome da mãe e última visualização com marcadores claros', () => {
  const { context } = criarContexto(cabecalho, ['CASO-1','T-1','aberto','medio','baixa','obs','','','','','','','','','','','']);
  const r = context.salvarAuditoriaCaso_({
    idCaso: 'CASO-1',
    caso: {
      dadosPessoais: 'Nome da mãe: Maria da Silva',
      ultimaVisualizacao: 'Data/Hora: 18/05/2026 14:00; Local: Praça Central; Roupa: camiseta azul; Transporte: a pé'
    },
    operadorNome: 'Op'
  }, { nome: 'Op' });
  assert.equal(r.ok, true);
  assert.equal(r.diagnostico.camposAtualizados.includes('nomeMae'), true);
  assert.equal(r.diagnostico.camposAtualizados.includes('dataHoraUltimaVisualizacao'), true);
  assert.equal(r.diagnostico.camposAtualizados.includes('localUltimaVisualizacao'), true);
});
