# Ajuste técnico — fluxo Buscar caso -> auditoria.html (2026-05-06)

## Resumo
- Botão **Buscar caso** na interface principal agora redireciona para `auditoria.html` com identificador na querystring.
- Backend GAS passa a aceitar `action=buscarCasoCompleto` (GET e POST), retornando JSON padronizado `{ ok, data: { caso } }`.
- Backend GAS passa a aceitar `action=salvarAuditoriaCaso`, reaproveitando o fluxo de persistência de `salvarCaso`.
- `auditoria.html` lê parâmetros de URL, consulta backend, pré-preenche campos e permite reenvio auditado via POST.

## Justificativa arquitetural
A abordagem baseada em **ID na URL + GET/POST no backend** foi escolhida por ser simples, rastreável, sem acoplamento com `localStorage` compartilhado e compatível com Apps Script.

## Erros tratados
- Falta de identificador (`ID_OBRIGATORIO`).
- Caso não encontrado (`CASO_NAO_ENCONTRADO`).
- Falhas de rede e respostas inválidas no frontend de auditoria.

## Ajuste complementar (perguntas atualizadas)
- O pré-preenchimento da `auditoria.html` passou a priorizar o schema vigente de perguntas da Cabine Verde (`respostasArvore` e `complementosArvore`) com fallback para campos antigos.
- Isso evita regressão ao usar perguntas legadas e mantém compatibilidade com casos já gravados.
