# Hardening de idempotência e auditoria enterprise (2026-05-12)

## Escopo
- Camada híbrida de deduplicação no backend GAS:
  1. CacheService
  2. Busca por `CHAVE_UNICA` na aba `CASOS`
- Criação automática da aba `LOG_AUDITORIA`.
- Log de toda tentativa de gravação com status operacional/técnico.
- Troca de `appendRow` por `setValues` na inserção de `CASOS`.
- Preservação do lock transacional (`LockService`) em toda operação crítica.

## Mudanças aplicadas
- `Code.gs`:
  - constantes para `LOG_AUDITORIA` e TTL de idempotência;
  - funções auxiliares de chave única + consulta por `CHAVE_UNICA`;
  - escrita estruturada em `LOG_AUDITORIA`;
  - `doPost` passa a usar `chaveUnica` como chave canônica de idempotência;
  - `persistirRegistro` adiciona/propaga `CHAVE_UNICA`, deduplica por planilha e registra status `sucesso`, `duplicado_ignorado` e `atualizado`;
  - inserção de `CASOS` com `setValues`.
- `public/js/core.js`:
  - envio explícito de `chaveUnica` e espelhamento de `CHAVE_UNICA` no payload.

## Fluxo final (resumo)
1. Requisição entra no `doPost` com lock ativo.
2. Se `chaveUnica` estiver no cache: ignora como duplicado e registra em `LOG_AUDITORIA`.
3. Se não estiver no cache, `persistirRegistro` consulta `CASOS.CHAVE_UNICA`:
   - encontrou: ignora duplicado e registra log;
   - não encontrou: segue UPSERT por `idCaso`/talão/assinatura.
4. Se UPSERT encontrar linha existente: atualiza e retorna `atualizado`.
5. Se não encontrar: insere novo caso com `setValues` e retorna `sucesso`.
6. Em todos os cenários de tentativa, há registro em `LOG_AUDITORIA`.
