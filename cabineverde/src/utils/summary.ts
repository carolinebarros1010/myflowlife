import type { CasoCompleto } from '../types/case.js';

export const gerarResumoCaso = (caso: CasoCompleto): string => {
  return [
    `Caso ${caso.id} | ${caso.nomeCompletoDesaparecido} (${caso.idade} anos - ${caso.faixaEtaria})`,
    `Município: ${caso.municipio} | Última visualização: ${caso.localUltimaVisualizacao} em ${caso.dataHoraUltimaVisualizacao}`,
    `Risco: ${caso.classificacaoRisco} | Prioridade: ${caso.prioridade}`,
    `Ação sugerida: ${caso.acaoSugerida}`,
    `Apto Cabine Verde: ${caso.aptoCabineVerde ? 'Sim' : 'Não'}`
  ].join('\n');
};
