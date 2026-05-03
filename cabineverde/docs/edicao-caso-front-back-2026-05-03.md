# Fluxo de edição de caso (Cabine Verde)

Data: 2026-05-03

## Alterações
- Implementado modo de formulário com estados `criacao` e `edicao` no front.
- Inclusão da função `preencherFormularioComCaso(caso)` para carregar inputs, selects, textareas e checkboxes por `name/id`.
- Preservação de `idCaso` original ao abrir edição.
- Envio de `modo=edicao` no payload `salvarCaso` quando aplicável.
- No backend, `salvarCaso` passou a respeitar `modo=edicao`, exigindo `idCaso` existente e atualizando a mesma linha.
- Registro de evento `EDICAO_CASO` na aba `EVENTOS_CASO` quando atualização ocorre em modo edição.

## Resultado esperado
- Não gerar novo `idCaso` em edição.
- Não duplicar casos ao salvar alterações.
- Timeline do caso deve incluir `EDICAO_CASO`.
