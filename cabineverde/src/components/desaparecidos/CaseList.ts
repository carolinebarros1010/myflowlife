import type { CasoCompleto } from '../../types/case.js';

const badgeClass = (risco: string): string => {
  if (risco.includes('Alto')) return 'cv-badge cv-badge--danger';
  if (risco.includes('moderado')) return 'cv-badge cv-badge--warn';
  return 'cv-badge cv-badge--ok';
};

export const renderCaseList = (casos: CasoCompleto[]): string => `
<section class="cv-card">
  <h3>Listagem operacional</h3>
  <ul class="cv-case-list">
    ${
      casos
        .map(
          (caso) => `<li class="cv-case-row ${caso.classificacaoRisco.includes('Alto') ? 'critical' : ''}" data-id="${caso.id}">
          <button type="button" data-open-case="${caso.id}" class="cv-case-open">
            <strong>${caso.nomeCompletoDesaparecido}</strong>
            <small>${caso.id} · ${caso.municipio || 'Município não informado'}</small>
            <span class="${badgeClass(caso.classificacaoRisco)}">${caso.classificacaoRisco}</span>
            <span class="cv-badge">${caso.statusCaso}</span>
          </button>
        </li>`
        )
        .join('') || '<li>Nenhum caso registrado ainda.</li>'
    }
  </ul>
</section>`;
