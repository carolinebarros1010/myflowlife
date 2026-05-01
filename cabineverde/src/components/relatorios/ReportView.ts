export const renderReportView = (): string => `
<section class="cv-card"> 
  <h3>Relatório operacional</h3>
  <p>Revise antes do envio para equipes de campo e coordenação.</p>
  <div class="cv-actions"> 
    <button type="button" id="view-report" class="cv-button">Visualizar relatório</button>
    <button type="button" id="export-report-pdf" class="cv-button cv-button--secondary">Exportar PDF</button>
    <button type="button" id="export-report-siopm" class="cv-button cv-button--secondary">Exportar texto SIOPM</button>
    <button type="button" id="copy-report" class="cv-button cv-button--ghost">Copiar relatório</button>
  </div>
  <textarea id="report-content" rows="14" placeholder="O relatório gerado aparecerá aqui com estrutura operacional."></textarea>
</section>`;
