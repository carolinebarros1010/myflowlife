import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarPayloadSheets } from '../src/utils/sheetsPayload.js';
import { casosMock } from '../src/data/mockCases.js';

test('gera payload com aba desaparecidos e colunas estáveis', () => {
  const payload = gerarPayloadSheets(casosMock[0]);
  assert.equal(payload.aba, 'Desaparecidos');
  assert.equal(payload.colunas.length, 41);
  assert.equal(payload.colunas[0], 'dataHoraRegistro');
  assert.equal(payload.colunas[payload.colunas.length - 1], 'statusCaso');
  assert.equal(payload.valores.length, payload.colunas.length);
  assert.equal(payload.dados.classificacaoRisco, casosMock[0].classificacaoRisco);
});
