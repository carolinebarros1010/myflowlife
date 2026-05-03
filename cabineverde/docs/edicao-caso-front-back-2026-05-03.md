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

## Hardening adicional (merge de campos invisíveis)
- Introduzido estado `casoOriginalEdicao` para manter snapshot integral do caso retornado na busca.
- Criado helper `coletarCamposVisiveisDoFormulario()` para mapear apenas campos realmente presentes/editáveis no DOM.
- Criado `montarPayloadCasoParaSalvar()` com merge seguro em modo edição:
  - base = `casoOriginalEdicao` (preserva todos os campos da aba CASOS, inclusive `arv_*` invisíveis);
  - sobrescrita = somente campos presentes no formulário;
  - metadados = `idCaso` preservado + `modo=edicao`.
- Inclusão de logs de auditoria front `[EDICAO]` para contagem de chaves (original/formulário/payload final) e validação do `idCaso` preservado.
- Ajuste visual de status para `Editando caso: CV-XXXX`.
- Pós-sucesso da gravação em edição limpa estado de edição (`casoOriginalEdicao`, `idCasoEdicaoAtual`) e retorna para `criacao`.
