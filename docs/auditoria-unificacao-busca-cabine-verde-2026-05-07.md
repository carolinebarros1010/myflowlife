# Unificação da busca na auditoria da Cabine Verde (2026-05-07)

## Objetivo
Padronizar a busca de casos em `cabineverde/auditoria.html` para os mesmos filtros operacionais da área de Consulta e Auditoria.

## Alterações realizadas
- Substituição do bloco de busca por talão único por seção de consulta unificada com:
  - busca livre (`termo`),
  - `idCaso`,
  - `talaoPMESP`,
  - `nomeCompletoDesaparecido`,
  - botão único de busca.
- Implementação de `buscarCasoAuditoria()` como fluxo principal de consulta com `action=buscarCasoCompleto`.
- Manutenção de `buscarCasoPorTalao()` apenas como alias, delegando para `buscarCasoAuditoria()`.
- Preservação de `obterFiltroAuditoriaUrl()` com suporte aos aliases de talão e demais chaves de consulta já usadas no redirecionamento.

## Comportamento esperado
- Caso os quatro filtros estejam vazios, a UI alerta: `Informe ao menos um filtro para consulta.`
- Qualquer filtro informado dispara consulta backend única e centralizada.
- Retorno de caso aplica normalização de talão e renderizações de formulário, espelho e painel dinâmico de auditoria.
