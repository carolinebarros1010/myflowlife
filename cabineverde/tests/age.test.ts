import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularFaixaEtaria } from '../src/utils/age.js';
import { FaixaEtaria } from '../src/types/enums.js';

test('calcula faixa etária corretamente', () => {
  assert.equal(calcularFaixaEtaria(6), FaixaEtaria.CRIANCA);
  assert.equal(calcularFaixaEtaria(10), FaixaEtaria.PRE_ADOLESCENTE);
  assert.equal(calcularFaixaEtaria(16), FaixaEtaria.ADOLESCENTE);
  assert.equal(calcularFaixaEtaria(35), FaixaEtaria.ADULTO);
  assert.equal(calcularFaixaEtaria(73), FaixaEtaria.IDOSO);
});
