import type { CasoCompleto } from '../../types/case.js';

export const renderCaseList = (casos: CasoCompleto[]): string => `
<section class="cv-card">
  <h3>Casos registrados</h3>
  <ul class="cv-case-list">
    ${casos.map((caso) => `<li data-id="${caso.id}"><strong>${caso.nomeCompletoDesaparecido}</strong> · ${caso.classificacaoRisco} · ${caso.statusCaso}</li>`).join('') || '<li>Nenhum caso registrado ainda.</li>'}
  </ul>
</section>`;
