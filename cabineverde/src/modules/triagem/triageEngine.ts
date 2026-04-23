import type { CasoCompleto, CasoDesaparecimento } from '../../types/case.js';
import { calcularFaixaEtaria } from '../../utils/age.js';
import { calcularRisco } from '../../utils/risk.js';
import { calcularPrioridade, calcularAcaoSugerida } from '../../utils/priority.js';

export const calcularAptoCabineVerde = (caso: CasoDesaparecimento): boolean => {
  const pontos = [caso.fotoDisponivel, caso.dispositivoLigado, !!caso.localUltimaVisualizacao, caso.camerasResidencia || caso.camerasUltimoLocal];
  return pontos.filter(Boolean).length >= 3;
};

export const enriquecerCaso = (base: CasoDesaparecimento): CasoCompleto => ({
  ...base,
  faixaEtaria: calcularFaixaEtaria(base.idade),
  classificacaoRisco: calcularRisco(base),
  prioridade: calcularPrioridade(base),
  acaoSugerida: calcularAcaoSugerida(base),
  aptoCabineVerde: calcularAptoCabineVerde(base)
});
