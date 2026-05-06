# Auditoria — Redirecionamento da busca para `auditoria.html` (2026-05-06)

## Objetivo
Centralizar a busca e carregamento de casos no fluxo de auditoria dedicado (`auditoria.html`), eliminando o preenchimento local no frontend de origem.

## Alterações implementadas

### Frontend de origem (`public/js/app.js`)
- Inclusão de campo de busca livre (`#audit-campoBusca`) na seção de consulta/auditoria.
- Implementação da função `encaminharParaAuditoria()` para:
  - capturar termo digitado (com fallback para `idCaso`, `talaoPMESP` e `nomeCompletoDesaparecido`);
  - aplicar `trim()`;
  - validar vazio com feedback operacional;
  - redirecionar para `./auditoria.html?termo=...`.
- Botão `Buscar caso` passa a apenas redirecionar para a auditoria, sem preencher inputs na tela atual.

### `auditoria.html`
- `obterFiltroAuditoriaUrl()` agora lê também: `talaoBopm`, `talao`, `numeroTalao` e `termo`.
- `carregarCasoAuditoria()` passou a acionar `buscarCasoCompleto` também quando existir somente `termo`.
- Fluxo pós-retorno mantido no padrão operacional:
  - `normalizarTalaoCaso(caso)`;
  - `preencherFormularioAuditoria(caso)`;
  - `renderizarEspelhoTriagem(caso)`;
  - `renderizarPerguntasTriagemModoAuditoria(caso)`.

### Backend GAS (`GAS/Code.gs`)
- `buscarCaso_` ampliado para aceitar e priorizar múltiplos critérios de busca:
  1. correspondência por `idCaso` (exata/parcial);
  2. correspondência por talão (`talaoPMESP`, `talaoBopm`, `talao`, `numeroTalao`);
  3. correspondência por `nomeCompletoDesaparecido`;
  4. busca parcial livre (`termo`) em campos relevantes.
- Campos incluídos na busca livre prioritária:
  - `idCaso`;
  - `talaoPMESP`, `talaoBopm`, `talao`, `numeroTalao`;
  - `nomeCompletoDesaparecido`;
  - `municipio`;
  - `telefoneSolicitante`;
  - `nomeSolicitante`.
- `doGet?action=buscarCasoCompleto` atualizado para aceitar os novos aliases de talão.
