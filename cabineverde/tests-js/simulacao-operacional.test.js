import test from 'node:test';
import assert from 'node:assert/strict';

const ENDPOINT = 'https://exemplo.invalid/gas';

const chamarAcao = async (action, payload = {}) => {
  const resposta = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });
  const body = await resposta.json();
  if (!resposta.ok || body.ok === false) {
    throw new Error(body.erro || body.message || 'Falha de integração com GAS');
  }
  return body.data;
};

const mockFetch = (falhas = new Set()) => {
  const chamadas = [];
  global.fetch = async (_url, init = {}) => {
    chamadas.push(init);
    const payload = JSON.parse(String(init.body || '{}'));
    if (falhas.has(payload.action)) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: false, erro: `Falha simulada em ${payload.action}` })
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { action: payload.action, recebido: true } })
    };
  };
  return chamadas;
};

test('simulação operacional concorrente valida contrato CORS e actions', async () => {
  const chamadas = mockFetch();

  const operacoes = [
    ...Array.from({ length: 5 }, (_, i) => chamarAcao('salvarCaso', { operador: `operador${i + 1}` })),
    ...Array.from({ length: 3 }, (_, i) => chamarAcao('gerarTimelineCaso', { supervisor: `sup${i + 1}`, idCaso: `CASO-${i + 1}` })),
    ...Array.from({ length: 2 }, (_, i) => chamarAcao('validarFotoDesaparecido', { supervisor: `sup${i + 1}`, idFoto: `FOTO-${i + 1}`, status: 'VALIDADA' })),
    ...Array.from({ length: 5 }, (_, i) => chamarAcao('gerarRelatorioTextoSIOPM', { operador: `operador${i + 1}`, idCaso: `CASO-${i + 1}` })),
    chamarAcao('auditarQualidadeDados', { auditor: 'auditor1' }),
    chamarAcao('healthcheck', { admin: 'admin1' })
  ];

  const resultados = await Promise.all(operacoes);
  assert.equal(resultados.length, 17);

  for (const req of chamadas) {
    assert.equal(req.method, 'POST');
    assert.equal(req.headers['Content-Type'], 'text/plain;charset=utf-8');
    assert.ok(!String(req.headers['Content-Type']).includes('application/json'));
    const payload = JSON.parse(String(req.body));
    assert.ok(payload.action);
  }

  const actions = chamadas.map((req) => JSON.parse(String(req.body)).action);
  assert.equal(actions.filter((a) => a === 'salvarCaso').length, 5);
  assert.equal(actions.filter((a) => a === 'gerarTimelineCaso').length, 3);
  assert.equal(actions.filter((a) => a === 'validarFotoDesaparecido').length, 2);
  assert.equal(actions.filter((a) => a === 'gerarRelatorioTextoSIOPM').length, 5);
  assert.equal(actions.filter((a) => a === 'auditarQualidadeDados').length, 1);
  assert.equal(actions.filter((a) => a === 'healthcheck').length, 1);
});

test('erro padronizado gera mensagem amigável sem quebrar concorrência', async () => {
  mockFetch(new Set(['validarFotoDesaparecido']));

  const tarefas = [
    chamarAcao('salvarCaso', { operador: 'op-1' }),
    chamarAcao('validarFotoDesaparecido', { supervisor: 'sup-1', idFoto: 'FOTO-1', status: 'REJEITADA' }),
    chamarAcao('healthcheck', { admin: 'admin1' })
  ];

  const resultado = await Promise.allSettled(tarefas);
  assert.equal(resultado[0].status, 'fulfilled');
  assert.equal(resultado[2].status, 'fulfilled');
  assert.equal(resultado[1].status, 'rejected');
  assert.match(resultado[1].reason.message, /Falha simulada em validarFotoDesaparecido/);
});
