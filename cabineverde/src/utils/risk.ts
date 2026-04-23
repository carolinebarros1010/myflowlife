import type { CasoDesaparecimento } from '../types/case.js';
import { ClassificacaoRisco, FaixaEtaria } from '../types/enums.js';
import { calcularFaixaEtaria } from './age.js';

export const calcularRisco = (caso: CasoDesaparecimento): ClassificacaoRisco => {
  const faixa = calcularFaixaEtaria(caso.idade);
  const altoRisco =
    faixa === FaixaEtaria.CRIANCA ||
    (faixa === FaixaEtaria.IDOSO && caso.condicaoMentalCognitivaComportamental.length > 0) ||
    caso.suspeitaCrime ||
    caso.vulnerabilidade ||
    caso.usoMedicacaoEssencial;

  if (altoRisco) return ClassificacaoRisco.ALTO;

  const moderado =
    faixa === FaixaEtaria.ADOLESCENTE ||
    caso.usoAlcoolOutrasDrogas ||
    caso.historicoDesaparecimentoAnterior ||
    caso.conflitoPrevio;

  if (moderado) return ClassificacaoRisco.MODERADO;
  return ClassificacaoRisco.BAIXO;
};
