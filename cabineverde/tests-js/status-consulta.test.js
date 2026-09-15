import test from 'node:test';
import assert from 'node:assert/strict';
import { statusConsulta } from '../local-app/src/utils/statusConsulta.ts';

test('não confunde não localizado com localizado', () => {
  assert.equal(statusConsulta({ status: 'Não localizado' }).classe, 'andamento');
  assert.equal(statusConsulta({ status: 'LOCALIZADO_SEM_VIDA' }).classe, 'localizado');
});

test('mostra status atualizado de atendimento e preserva situação explícita', () => {
  assert.equal(statusConsulta({ status: 'Em andamento', dadosJson: '{"statusAtendimento":"Em triagem"}' }).rotulo, 'Em triagem');
  assert.equal(statusConsulta({ status: 'DESAPARECIDO' }).rotulo, 'DESAPARECIDO');
});
