import type { CasoCompleto } from '../types/case.js';
import { normalizarCamposFisicos } from './camposFisicos.js';

export interface RelatorioParams {
  numeroRelatorio: string;
  dataReferencia: string;
  equipe: string;
  complementoManual: string;
}

export const gerarRelatorioOperacional = (casos: CasoCompleto[], params: RelatorioParams): string => {
  const relevantes = casos.filter((c) => c.classificacaoRisco === 'Alto risco');
  const produtividade = `Total de registros: ${casos.length}. Casos de alto risco: ${relevantes.length}.`;

  return `RELATÓRIO OPERACIONAL DIÁRIO Nº ${params.numeroRelatorio}\nData: ${params.dataReferencia}\n\n1) ASSUNÇÃO E CONFERÊNCIA\nEquipe de serviço: ${params.equipe}. Sistema de triagem Cabine Verde em operação regular.\n\n2) PRODUTIVIDADE OPERACIONAL\n${produtividade}\n\n3) OCORRÊNCIAS DE RELEVÂNCIA\n${relevantes.map((c) => `- ${c.nomeCompletoDesaparecido} | ${c.classificacaoRisco} | ${c.acaoSugerida}`).join('\n') || '- Sem ocorrências críticas no período.'}\n\n4) ORIENTAÇÕES AO PÚBLICO\n- Manter canais de contato ativos.\n- Compartilhar foto e locais habituais com equipe de busca.\n\n5) ENCERRAMENTO E PASSAGEM DE SERVIÇO\nPassagem realizada com atualização de status e pendências registradas.\n\n6) COMPLEMENTO OPERACIONAL\n${params.complementoManual || 'Sem complemento adicional.'}\n\n7) ASSINATURA/EQUIPE\n${params.equipe}`;
};


export const gerarRelatorioTextoSIOPM_ = (casos: CasoCompleto[]): string => {
  const total = casos.length;
  const localizados = casos.filter((c) => c.statusCaso === 'Localizado' || c.statusCaso === 'Encerrado').length;
  return [
    'SIOPM - CABINE VERDE',
    `Total de casos: ${total}`,
    `Localizados: ${localizados}`,
    'Resumo operacional:',
    ...casos.slice(0, 10).map((c) => `- ${c.id} | ${c.nomeCompletoDesaparecido} | ${c.classificacaoRisco} | ${c.statusCaso}`)
  ].join('\n');
};

export const gerarRelatorioEstatistico = (casos: CasoCompleto[]): string => {
  const casosPadronizados = casos.map((caso) => normalizarCamposFisicos(caso));
  const adultos = casosPadronizados.filter((c) => c.idade >= 18).length;
  const criancas = casosPadronizados.filter((c) => c.idade > 0 && c.idade < 18).length;
  const localizados = casosPadronizados.filter((c) => c.statusCaso === 'Localizado' || c.statusCaso === 'Encerrado').length;
  const total = casosPadronizados.length;
  const taxa = total ? ((localizados / total) * 100).toFixed(1) : '0.0';
  const tempos = casosPadronizados
    .map((c) => new Date(c.dataHoraRegistro).getTime())
    .filter((t) => Number.isFinite(t));
  const mediaHoras = tempos.length ? ((Date.now() - tempos.reduce((a,b)=>a+b,0)/tempos.length) / 36e5).toFixed(1) : '0.0';
  const distribuicaoCorPele = ['BRANCA','PARDA','PRETA','AMARELA','INDIGENA','NAO INFORMADO']
    .map((cor) => `${cor}: ${casosPadronizados.filter((c) => c.corPele === cor).length}`)
    .join(', ');
  return `RELATÓRIO ESTATÍSTICO\nAdultos x crianças: ${adultos} x ${criancas}\nTotal/localizados: ${total}/${localizados}\nTaxa de sucesso: ${taxa}%\nTempo médio desde registro: ${mediaHoras}h\nDistribuição cor da pele: ${distribuicaoCorPele}`;
};
