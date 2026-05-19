# Correção da referência de aba no fluxo `auditoria.html` (2026-05-19)

## Causa raiz
A função `enviarAuditoriaParaBackend()` montava payload parcial só com campos de auditoria (`idCaso`, `talaoPMESP`, observações e inconsistências), descartando metadados técnicos do caso original como `dataServico`, `dataHoraRegistro`, `nomeAbaTalao190`, `abaOrigem`, `linhaOrigem` e `referenciaIndice`.

Com isso, ao editar/salvar pela auditoria, o backend perdia referência operacional da aba diária do Talão 190 para sincronização segura.

## Correções aplicadas
- Preservação explícita do caso completo carregado em memória (`window.casoAtualAuditoria` + `casoAtualAuditoria`).
- Inclusão de `inputs hidden` para carregar e manter metadados técnicos mínimos de referência.
- Montagem do payload de salvamento por merge do caso original com campos editados (`{ ...casoOriginal, ...camposEditados }`).
- Validação pré-envio no frontend: bloqueia salvamento sem qualquer referência de data/aba e exibe mensagem operacional clara.
- Backend reforçado para retornar erro estruturado `ABA_TALAO_190_NAO_IDENTIFICADA` ao detectar ausência total de referências (`dataServico`, `dataHoraRegistro`, `nomeAbaTalao190`, `abaOrigem`).

## Impacto esperado
- Edição via `auditoria.html` passa a manter contexto técnico do caso.
- Atualização segue fluxo de UPSERT sem criação indevida de aba vazia.
- Erros de referência deixam de aparecer como mensagem genérica.
