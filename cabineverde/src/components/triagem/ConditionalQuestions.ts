import { perguntasPorFaixa } from './AgeSections.js';

export const renderPerguntasFaixa = (faixa: keyof typeof perguntasPorFaixa): string => {
  return `<ul class="cv-question-list">${perguntasPorFaixa[faixa].map((p) => `<li>${p}</li>`).join('')}</ul>`;
};
