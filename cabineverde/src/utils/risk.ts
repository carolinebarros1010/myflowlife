import type { CasoDesaparecimento } from '../types/case.js';
import { ClassificacaoRisco, FaixaEtaria } from '../types/enums.js';
import { calcularFaixaEtaria } from './age.js';
import type { IndicadoresOperacionais } from '../modules/triagem/indicadoresOperacionais.js';

export const calcularRisco = (caso: CasoDesaparecimento, indicadores?: IndicadoresOperacionais): ClassificacaoRisco => {
  const faixa = calcularFaixaEtaria(caso.idade);
  const alertaEstruturadoAlto = Boolean(
    indicadores?.criancaVeiculoSuspeito ||
      indicadores?.preadolescenteAliciamentoVirtual ||
      indicadores?.adolescenteSofrimentoPsiquico ||
      indicadores?.adultoSuspeitaCrime ||
      indicadores?.idosoDesorientado ||
      indicadores?.criancaSemSupervisao
  );

  const altoRisco =
    faixa === FaixaEtaria.CRIANCA ||
    (faixa === FaixaEtaria.IDOSO && caso.condicaoMentalCognitivaComportamental.length > 0) ||
    caso.suspeitaCrime ||
    caso.vulnerabilidade ||
    caso.usoMedicacaoEssencial ||
    alertaEstruturadoAlto;

  if (altoRisco) return ClassificacaoRisco.ALTO;

  const moderado =
    faixa === FaixaEtaria.ADOLESCENTE ||
    caso.usoAlcoolOutrasDrogas ||
    caso.historicoDesaparecimentoAnterior ||
    caso.conflitoPrevio;

  if (moderado) return ClassificacaoRisco.MODERADO;
  return ClassificacaoRisco.BAIXO;
};
