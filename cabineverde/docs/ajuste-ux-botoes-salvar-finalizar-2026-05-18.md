# Ajuste UX — Botões Salvar caso e Finalizar triagem (2026-05-18)

## Objetivo
Melhorar a percepção operacional durante o envio ao backend/GAS, sem alterar payload, validações, upload de foto, lógica de `idCaso` ou fluxo de backend.

## Alterações aplicadas
- Inclusão de funções reutilizáveis no front-end:
  - `iniciarProcessamentoCabineVerde(mensagem)`
  - `finalizarProcessamentoCabineVerde()`
  - `erroProcessamentoCabineVerde(mensagem)`
- Ao submeter o formulário por **Salvar** ou **Finalizar triagem**:
  - botões ficam desabilitados temporariamente;
  - botão acionado troca o texto para `Salvando...` ou `Finalizando...`;
  - overlay leve é exibido com:
    - **Cabine Verde Esperança**
    - **Processando dados com segurança...**
  - spinner discreto durante processamento.
- Em sucesso:
  - overlay mostra `Dados salvos com sucesso.` por 1 segundo e encerra.
- Em falha:
  - overlay é removido imediatamente;
  - botões são reabilitados;
  - mensagem operacional: `Não foi possível salvar. Verifique a conexão e tente novamente.`;
  - erro registrado no console.

## Impacto operacional
- Reduz percepção de travamento durante latência de rede.
- Bloqueia clique duplicado e reenvio acidental no período pendente.
- Preserva dados em tela e fluxo original de negócio.
