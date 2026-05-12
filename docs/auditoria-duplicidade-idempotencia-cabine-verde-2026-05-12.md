# Auditoria e mitigação de duplicidade — Cabine Verde (2026-05-12)

## Resumo técnico

- Causa provável: envios concorrentes/repetidos de `salvarCaso` sem trava transacional no GAS e sem bloqueio de botão no frontend.
- Mitigações aplicadas:
  - bloqueio de botão durante envio no frontend;
  - chave de idempotência (`chaveRequisicao`) enviada no payload;
  - deduplicação por `CacheService` no `doPost`;
  - lock transacional com `LockService` na persistência de `salvarCaso`;
  - retorno padronizado de status: `sucesso`, `duplicado_ignorado`, `erro`.

- Ajuste de robustez: `LockService` passou a envolver também a validação de idempotência (cache), reduzindo janela de corrida entre consulta e gravação.
- Ajuste de chave: `chaveRequisicao` determinística por caso/solicitante/status/data para cobrir retries com mesmo conteúdo.
