import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularFaixaEtaria, calcularRisco, calcularPrioridade, gerarPayloadSheets } from '../public/js/core.js';

test('faixa etaria', () => {
  assert.equal(calcularFaixaEtaria(7), 'Criança');
  assert.equal(calcularFaixaEtaria(61), 'Idoso');
});

test('risco/prioridade', () => {
  const caso = { idade: 20, suspeitaCrime: true, vulnerabilidade: false, usoMedicacaoEssencial: false };
  assert.equal(calcularRisco(caso), 'Alto risco');
  assert.equal(calcularPrioridade(caso), 'Crítica');
});

test('payload', () => {
  const payload = gerarPayloadSheets({ nome: 'x' });
  assert.equal(payload.aba, 'Desaparecidos');
});
