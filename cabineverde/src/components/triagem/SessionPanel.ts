export const renderSessionPanel = (): string => `
<section class="cv-card">
  <h3>Sessão operacional</h3>
  <p>ID de sessão para continuidade entre estações:</p>
  <div class="cv-actions">
    <input id="session-id" placeholder="SESS-..." />
    <button type="button" id="apply-session" class="cv-button cv-button--ghost">Aplicar</button>
  </div>
</section>`;
