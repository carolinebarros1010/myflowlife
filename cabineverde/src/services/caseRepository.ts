import type { CasoCompleto } from '../types/case.js';

const chave = 'cabine-verde-casos';

export const listarCasos = (): CasoCompleto[] => {
  const bruto = localStorage.getItem(chave);
  return bruto ? (JSON.parse(bruto) as CasoCompleto[]) : [];
};

export const salvarCasoLocal = (caso: CasoCompleto): CasoCompleto[] => {
  const lista = listarCasos();
  const atualizada = [caso, ...lista];
  localStorage.setItem(chave, JSON.stringify(atualizada));
  return atualizada;
};
