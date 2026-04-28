import type { CasoCompleto } from '../types/case.js';
import { listarIndicadoresAtivos, sugerirAcaoIndicadores } from '../modules/triagem/indicadoresOperacionais.js';

export const gerarResumoCaso = (caso: CasoCompleto): string => {
  const indicadoresAtivos = listarIndicadoresAtivos(caso.indicadoresOperacionais);

  return [
    `Caso ${caso.id} | ${caso.nomeCompletoDesaparecido} (${caso.idade} anos - ${caso.faixaEtaria})`,
    `Município: ${caso.municipio} | Última visualização: ${caso.localUltimaVisualizacao} em ${caso.dataHoraUltimaVisualizacao}`,
    `Risco: ${caso.classificacaoRisco} | Prioridade: ${caso.prioridade}`,
    `Criticidade indicadores: ${caso.criticidadeIndicadores}`,
    `Indicadores ativos: ${indicadoresAtivos.length ? indicadoresAtivos.join('; ') : 'Nenhum indicador ativo'}`,
    `Sugestão operacional: ${sugerirAcaoIndicadores(caso.indicadoresOperacionais)}`,
    `Ação sugerida: ${caso.acaoSugerida}`,
    `Apto Cabine Verde: ${caso.aptoCabineVerde ? 'Sim' : 'Não'}`
  ].join('\n');
};
