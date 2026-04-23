export const renderReportView = (): string => `
<section class="cv-card">
  <h3>Relatório operacional diário</h3>
  <textarea id="report-content" rows="16" placeholder="O relatório gerado aparecerá aqui."></textarea>
  <button type="button" id="copy-report">Copiar relatório</button>
</section>`;
