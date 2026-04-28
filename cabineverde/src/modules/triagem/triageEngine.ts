import type { CasoCompleto, CasoDesaparecimento } from '../../types/case.js';
import { calcularFaixaEtaria } from '../../utils/age.js';
import { calcularRisco } from '../../utils/risk.js';
import { calcularPrioridade, calcularAcaoSugerida } from '../../utils/priority.js';
import {
  anexarBlocoIndicadoresObservacoes,
  calcularCriticidadeIndicadores,
  mapearIndicadoresOperacionais,
  sugerirAcaoIndicadores
} from './indicadoresOperacionais.js';

export const calcularAptoCabineVerde = (caso: CasoDesaparecimento): boolean => {
  const indicadores = mapearIndicadoresOperacionais(caso);
  const pontos = [caso.fotoDisponivel, caso.dispositivoLigado, !!caso.localUltimaVisualizacao, caso.camerasResidencia || caso.camerasUltimoLocal];
  const baseApta = pontos.filter(Boolean).length >= 3;

  const criticidadeSemSuporteTecnologico =
    (indicadores.criancaVeiculoSuspeito || indicadores.adultoSuspeitaCrime || indicadores.preadolescenteAliciamentoVirtual) &&
    !(caso.dispositivoLigado || caso.camerasResidencia || caso.camerasUltimoLocal);

  return baseApta && !criticidadeSemSuporteTecnologico;
};

export const enriquecerCaso = (base: CasoDesaparecimento): CasoCompleto => {
  const indicadoresOperacionais = mapearIndicadoresOperacionais(base);
  const criticidadeIndicadores = calcularCriticidadeIndicadores(indicadoresOperacionais);
  const observacoesOperacionais = anexarBlocoIndicadoresObservacoes(base.observacoesOperacionais, indicadoresOperacionais);
  const baseComIndicadores: CasoDesaparecimento = {
    ...base,
    observacoesOperacionais
  };

  return {
    ...baseComIndicadores,
    faixaEtaria: calcularFaixaEtaria(base.idade),
    classificacaoRisco: calcularRisco(baseComIndicadores, indicadoresOperacionais),
    prioridade: calcularPrioridade(baseComIndicadores, indicadoresOperacionais),
    acaoSugerida: `${calcularAcaoSugerida(baseComIndicadores, indicadoresOperacionais)} ${sugerirAcaoIndicadores(indicadoresOperacionais)}`,
    aptoCabineVerde: calcularAptoCabineVerde(baseComIndicadores),
    indicadoresOperacionais,
    criticidadeIndicadores
  };
};
