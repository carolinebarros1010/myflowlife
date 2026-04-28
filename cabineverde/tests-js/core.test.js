import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularFaixaEtaria,
  calcularRisco,
  calcularPrioridade,
  gerarPayloadSheets,
  salvarCasoSheets,
  healthcheckSheets,
  ENDPOINT_OFICIAL_APPS_SCRIPT
} from '../public/js/core.js';

test('faixa etaria', () => {
  assert.equal(calcularFaixaEtaria(7), 'Criança');
  assert.equal(calcularFaixaEtaria(61), 'Idoso');
});

test('risco/prioridade', () => {
  const caso = { idade: 20, suspeitaCrime: true, vulnerabilidade: false, usoMedicacaoEssencial: false };
  assert.equal(calcularRisco(caso), 'Alto risco');
  assert.equal(calcularPrioridade(caso), 'Crítica');
});

test('payload completo com 51 colunas para Desaparecidos', () => {
  const payload = gerarPayloadSheets({ nomeCompletoDesaparecido: 'x', idade: 30 });
  assert.equal(payload.aba, 'Desaparecidos');
  assert.equal(payload.colunas.length, 51);
  assert.equal(payload.valores.length, 51);
  assert.equal(payload.colunas[0], 'idCaso');
  assert.equal(payload.colunas[50], 'observacoesOperacionais');
});

test('salvarCasoSheets usa POST + JSON no endpoint oficial', async () => {
  const originalFetch = globalThis.fetch;
  let fetchArgs;
  globalThis.fetch = async (...args) => {
    fetchArgs = args;
    return new Response(JSON.stringify({ ok: true, action: 'created', idCaso: 'CV-2026-0001', linha: 2 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const retorno = await salvarCasoSheets({ nomeCompletoDesaparecido: 'Teste', idade: 18 });
  assert.equal(retorno.ok, true);
  assert.equal(retorno.action, 'created');
  assert.equal(fetchArgs[0], ENDPOINT_OFICIAL_APPS_SCRIPT);
  assert.equal(fetchArgs[1].method, 'POST');
  assert.equal(fetchArgs[1].headers['Content-Type'], 'application/json');

  globalThis.fetch = originalFetch;
});

test('healthcheckSheets retorna erro claro quando doGet não está publicado', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('<html><body>Script function not found: doGet</body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  const retorno = await healthcheckSheets();
  assert.equal(retorno.ok, false);
  assert.equal(retorno.message, 'Backend GAS não publicado ou doGet ausente');

  globalThis.fetch = originalFetch;
});
