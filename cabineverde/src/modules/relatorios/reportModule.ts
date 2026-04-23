import type { CasoCompleto } from '../../types/case.js';
import { gerarRelatorioOperacional, type RelatorioParams } from '../../utils/report.js';

export const montarRelatorio = (casos: CasoCompleto[], params: RelatorioParams): string => {
  return gerarRelatorioOperacional(casos, params);
};
