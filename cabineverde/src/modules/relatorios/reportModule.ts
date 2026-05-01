import type { CasoCompleto } from '../../types/case.js';
import { gerarRelatorioEstatistico, gerarRelatorioOperacional, gerarRelatorioTextoSIOPM_, type RelatorioParams } from '../../utils/report.js';

export const montarRelatorio = (casos: CasoCompleto[], params: RelatorioParams): string => {
  return gerarRelatorioOperacional(casos, params);
};

export const montarRelatorioSIOPM = (casos: CasoCompleto[]): string => gerarRelatorioTextoSIOPM_(casos);
export const montarRelatorioEstatistico = (casos: CasoCompleto[]): string => gerarRelatorioEstatistico(casos);
