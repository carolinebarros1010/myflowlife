export const renderRecentCasesPanel = (): string => `
<section class="cv-card">
  <h3>Consulta de casos recentes</h3>
  <div class="cv-grid cv-grid--filters">
    <label>Busca por ID
      <input type="search" id="filter-idCaso" placeholder="Ex.: CV-2026-001" />
    </label>
    <label>Talão (PMESP/BOPM)
      <input type="search" id="filter-talao" placeholder="Ex.: 7764 ou PMESP-2026-000123" />
    </label>
    <label>Status
      <select id="filter-status">
        <option value="">Todos</option>
        <option value="Em triagem">Em triagem</option>
        <option value="Em busca">Em busca</option>
        <option value="Localizado">Localizado</option>
        <option value="Encerrado">Encerrado</option>
      </select>
    </label>
    <label>Risco
      <select id="filter-risco">
        <option value="">Todos</option>
        <option value="Alto risco">Alto risco</option>
        <option value="Risco moderado">Risco moderado</option>
        <option value="Baixo risco">Baixo risco</option>
      </select>
    </label>
    <label>Data (registro)
      <input type="date" id="filter-data" />
    </label>
  </div>
</section>`;
