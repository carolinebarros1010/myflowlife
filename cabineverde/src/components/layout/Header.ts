export const renderHeader = (): string => `
<header class="cv-header" role="banner">
  <div>
    <p class="cv-header__kicker">Centro de Comando · Pessoas Desaparecidas</p>
    <h1>Cabine Verde</h1>
    <p class="cv-header__subtitle">Triagem dinâmica operacional, priorização de risco e encaminhamento de informações orientado por evidências.</p>
  </div>
  <div class="cv-header__meta" aria-label="status de operação">
    <span class="cv-chip" id="status-banco-central">Banco central: verificando...</span>
    <span class="cv-chip cv-chip--muted" id="status-sincronizacao">Sincronização: pendente</span>
  </div>
</header>`;
