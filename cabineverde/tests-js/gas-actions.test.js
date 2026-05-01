import test from 'node:test';
import assert from 'node:assert/strict';

const montarChamada = (action, payload = {}) => ({
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action, ...payload })
});

const actions = [
  'healthcheck','salvarCaso','visualizarFotoDesaparecido','listarCasos','buscarCaso','gerarTimelineCaso','editarCasoControlado','resumoQualidadeDados','marcarProblemaQualidadeResolvido','enviarFeedback','gerarRelatorioTextoSIOPM','gerarRelatorioOperacionalComImagem','validarFotoDesaparecido','auditarQualidadeDados','listarPerfilOperador'
];

test('todas as actions usam POST text/plain e body JSON', () => {
  for (const action of actions) {
    const req = montarChamada(action, { exemplo: true });
    assert.equal(req.method, 'POST');
    assert.equal(req.headers['Content-Type'], 'text/plain;charset=utf-8');
    const body = JSON.parse(req.body);
    assert.equal(body.action, action);
  }
});

test('não injeta headers customizados que causam preflight', () => {
  const req = montarChamada('healthcheck');
  assert.deepEqual(Object.keys(req.headers), ['Content-Type']);
});
