import type { CasoCompleto } from '../../types/case.js';

export const filtrarPorStatus = (casos: CasoCompleto[], status: string): CasoCompleto[] => {
  if (!status) return casos;
  return casos.filter((caso) => caso.statusCaso === status);
};
