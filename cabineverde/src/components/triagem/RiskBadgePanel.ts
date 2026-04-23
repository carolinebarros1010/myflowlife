export const renderRiskBadgePanel = (): string => `
<section class="cv-card cv-risk-panel" aria-label="painel de risco e prioridade">
  <h3>Leitura rápida de prioridade</h3>
  <div class="cv-risk-grid" id="risk-panel-content">
    <span class="cv-badge">Faixa etária: -</span>
    <span class="cv-badge">Risco: -</span>
    <span class="cv-badge">Prioridade: -</span>
    <span class="cv-badge">Apto Cabine Verde: -</span>
    <span class="cv-badge cv-badge--action">Ação sugerida: -</span>
  </div>
</section>`;
