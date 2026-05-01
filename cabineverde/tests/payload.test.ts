import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarPayloadSheets } from '../src/utils/sheetsPayload.js';
import { casosMock } from '../src/data/mockCases.js';

test('gera payload com aba desaparecidos e colunas estáveis', () => {
  const payload = gerarPayloadSheets(casosMock[0]);
  assert.equal(payload.aba, 'CASOS');
  assert.equal(payload.colunas.length, 52);
  assert.equal(payload.colunas[0], 'idCaso');
  assert.equal(payload.colunas[1], 'talaoPMESP');
  assert.equal(payload.colunas[payload.colunas.length - 1], 'observacoesOperacionais');
  assert.equal(payload.valores.length, payload.colunas.length);
  assert.equal(payload.dados.talaoPMESP, casosMock[0].talaoPMESP);
  assert.ok(payload.abas.length >= 3);
  assert.equal(payload.dados.classificacaoRisco, casosMock[0].classificacaoRisco);
  assert.equal(payload.dados.idCaso, casosMock[0].id);
});


test('observacoesOperacionais mantém apenas texto livre resumido', () => {
  const caso = {
    ...casosMock[0],
    observacoesOperacionais: 'Resumo objetivo do operador sem árvore e sem indicadores.'
  };
  const payload = gerarPayloadSheets(caso);
  assert.equal(payload.dados.observacoesOperacionais, 'Resumo objetivo do operador sem árvore e sem indicadores.');
  assert.equal(payload.dados.observacoesOperacionais.includes('[ÁRVORE DE DECISÃO'), false);
  assert.equal(payload.dados.observacoesOperacionais.includes('[INDICADORES OPERACIONAIS]'), false);
  assert.equal(payload.dados.observacoesOperacionais.includes(caso.talaoPMESP), false);
});
