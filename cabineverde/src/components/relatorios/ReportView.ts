export const renderReportView = (): string => `
<section class="cv-card">
  <h3>Relatório operacional</h3>
  <p>Revise antes do envio para equipes de campo e coordenação.</p>
  <textarea id="report-content" rows="14" placeholder="O relatório gerado aparecerá aqui com estrutura operacional."></textarea>
  <div class="cv-actions">
    <button type="button" id="copy-report" class="cv-button cv-button--ghost">Copiar relatório</button>
  </div>
</section>`;
