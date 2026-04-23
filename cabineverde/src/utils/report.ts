import type { CasoCompleto } from '../types/case.js';

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
