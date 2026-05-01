import test from 'node:test';
import assert from 'node:assert/strict';

const PERFIS_VALIDOS = ['OPERADOR', 'SUPERVISOR', 'ADMIN', 'AUDITOR'];

function normalizarPerfilOperador(perfil) {
  return String(perfil || '').trim().toUpperCase();
}

function validarPerfilOperador(operador, perfisPermitidos) {
  const perfil = normalizarPerfilOperador(operador?.perfil);
  const permitidos = (perfisPermitidos?.length ? perfisPermitidos : PERFIS_VALIDOS).map(normalizarPerfilOperador);
  if (!PERFIS_VALIDOS.includes(perfil)) return { permitido: false, motivo: 'Perfil inválido' };
  if (!permitidos.includes(perfil)) return { permitido: false, motivo: 'Sem permissão' };
  return { permitido: true, perfil };
}

test('normaliza perfil para caixa alta', () => {
  assert.equal(normalizarPerfilOperador('operador'), 'OPERADOR');
});

test('bloqueia perfil fora da whitelist', () => {
  assert.equal(validarPerfilOperador({ perfil: 'gestor' }, PERFIS_VALIDOS).permitido, false);
});

test('aplica permissão por ação com mock de perfil', () => {
  assert.equal(validarPerfilOperador({ perfil: 'auditor' }, ['ADMIN']).permitido, false);
  assert.equal(validarPerfilOperador({ perfil: 'supervisor' }, ['SUPERVISOR', 'ADMIN']).permitido, true);
});
