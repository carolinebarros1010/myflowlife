# Auditoria dinâmica da triagem por talão (Cabine Verde)

Data: 2026-05-06

## Objetivo
Desacoplar `cabineverde/auditoria.html` da dependência principal do formulário legado `q1`–`q40`, mantendo compatibilidade operacional.

## Alterações implementadas
- Criação de `renderizarPerguntasTriagemModoAuditoria(caso)` para montar painel dinâmico com pergunta/campo, resposta, complemento, validação, status e observação por campo.
- Inclusão de `normalizarTalaoCaso(caso)` para padronizar `talaoPMESP` como chave principal e absorver aliases (`talaoBopm`, `talao`, `numeroTalao`).
- Ajuste de `buscarCasoPorTalao()` para enviar filtro com todos os aliases de talão e renderizar espelho legado + painel dinâmico.
- Ajuste de `carregarCasoAuditoria()` para aplicar normalização e renderização dinâmica.
- Ajuste de `enviarAuditoriaParaBackend()` para salvar apenas payload de auditoria, sem sobrescrever dados originais da triagem.
- Marcação explícita do espelho antigo como `[LEGADO]` e manutenção do formulário legado para compatibilidade.

## Impacto operacional
A tela de auditoria passa a funcionar como painel auditável da triagem completa retornada pelo backend, sem perder preenchimento dos campos legados já usados em fluxo existente.
