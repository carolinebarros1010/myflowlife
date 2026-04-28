import test from 'node:test';
import assert from 'node:assert/strict';
import { GoogleSheetsService } from '../src/services/sheetsService.js';
import type { SheetPayload } from '../src/types/case.js';

const payloadBase: SheetPayload = {
  aba: 'Desaparecidos',
  colunas: ['municipio', 'nomeCompletoDesaparecido'],
  dados: {
    municipio: 'Belém',
    nomeCompletoDesaparecido: 'Teste'
  },
  valores: ['Belém', 'Teste']
};

test('retorna sucesso quando endpoint responde created', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: true, action: 'created', idCaso: 'CV-2026-0001', linha: 2 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })) as typeof fetch;

  const service = new GoogleSheetsService();
  const response = await service.salvar(payloadBase);

  assert.equal(response.ok, true);
  assert.equal(response.action, 'created');
  assert.equal(response.idCaso, 'CV-2026-0001');
  assert.equal(response.linha, 2);
  assert.match(response.message.toLowerCase(), /criado|sucesso/);
  globalThis.fetch = originalFetch;
});

test('retorna mensagem de atualização quando endpoint informa action updated', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: true, action: 'updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })) as typeof fetch;

  const service = new GoogleSheetsService();
  const response = await service.salvar(payloadBase);

  assert.equal(response.ok, true);
  assert.equal(response.action, 'updated');
  assert.match(response.message.toLowerCase(), /atualizado/);
  globalThis.fetch = originalFetch;
});

test('retorna falha quando endpoint responde erro', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: false, error: 'Falha ao salvar caso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })) as typeof fetch;

  const service = new GoogleSheetsService();
  const response = await service.salvar(payloadBase);

  assert.equal(response.ok, false);
  assert.match(response.message.toLowerCase(), /falha/);
  globalThis.fetch = originalFetch;
});
