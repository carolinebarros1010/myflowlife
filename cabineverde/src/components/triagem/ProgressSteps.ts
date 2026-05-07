export interface EtapaTriagem {
  id: string;
  titulo: string;
  descricao: string;
}

export const etapasTriagem: EtapaTriagem[] = [
  { id: 'identificacao', titulo: 'Identificação do caso', descricao: 'Controle de ID, status e registro.' },
  { id: 'desaparecido', titulo: 'Dados do desaparecido', descricao: 'Perfil principal e sinais iniciais.' },
  { id: 'visualizacao', titulo: 'Última visualização', descricao: 'Contexto espacial e temporal.' },
  { id: 'solicitante', titulo: 'Solicitante', descricao: 'Contato e vínculo de referência.' },
  { id: 'risco', titulo: 'Vulnerabilidade e risco', descricao: 'Indícios críticos e priorização.' },
  { id: 'tecnologia', titulo: 'Apoio tecnológico', descricao: 'Dispositivos, câmeras e foto.' },
  { id: 'resumo', titulo: 'Tela 2 — Triagem | PASSO 5 de 5', descricao: 'Conferência final, salvamento e anexo de foto.' }
];

export const renderProgressSteps = (): string => `
<section class="cv-card">
  <h2>Fluxo guiado da triagem</h2>
  <p id="triage-progress-text" class="cv-progress-text" aria-live="polite">Triagem: 0% concluída</p>
  <ol class="cv-steps" id="progress-steps" aria-label="etapas da triagem">
    ${etapasTriagem
      .map(
        (etapa, indice) => `<li class="cv-step-item" data-step="${indice}">
            <button type="button" class="cv-step-button" data-go-step="${indice}">
              <span class="cv-step-index">${indice + 1}</span>
              <span>
                <strong>${etapa.titulo}</strong>
                <small>${etapa.descricao}</small>
              </span>
            </button>
          </li>`
      )
      .join('')}
  </ol>
</section>`;
