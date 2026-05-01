export const renderActionFooter = (): string => `
<footer class="cv-action-footer">
  <button type="button" id="prev-step" class="cv-button cv-button--ghost">Voltar etapa</button>
  <button type="button" id="next-step" class="cv-button">Avançar etapa</button>
  <button type="submit" form="triage-form" id="save-case" class="cv-button">Salvar caso</button>
  <button type="button" id="update-case" class="cv-button cv-button--secondary">Atualizar caso</button>
  <button type="button" id="generate-report" class="cv-button cv-button--secondary">Gerar relatório</button>
  <button type="button" id="save-draft" class="cv-button cv-button--ghost">Salvar rascunho</button>
  <button type="button" id="load-draft" class="cv-button cv-button--ghost">Carregar rascunho</button>
  <button type="button" id="share-session" class="cv-button cv-button--ghost">Gerar token sessão</button>
  <button type="reset" form="triage-form" id="clear-form" class="cv-button cv-button--ghost">Limpar formulário</button>
  <button type="button" id="new-case" class="cv-button cv-button--ghost">Iniciar novo caso</button>
  <button type="button" id="send-feedback" class="cv-button cv-button--secondary">Enviar feedback</button>
</footer>`;
