import test from 'node:test';
import assert from 'node:assert/strict';
import { gerarPayloadSheets } from '../src/utils/sheetsPayload.js';
import { casosMock } from '../src/data/mockCases.js';

test('gera payload com aba desaparecidos', () => {
  const payload = gerarPayloadSheets(casosMock[0]);
  assert.equal(payload.aba, 'Desaparecidos');
  assert.ok(payload.valores.length > 30);
});
