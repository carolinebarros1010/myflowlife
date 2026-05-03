# Auditoria do erro "Colunas obrigatórias inválidas para aba: CASOS" (2026-05-03)

## Objetivo
Rastrear exatamente o ponto de chamada que poderia enviar colunas inválidas para `CASOS` no fluxo `doPost -> salvarCaso -> persistirRegistro`.

## Ajustes implementados
1. Instrumentação adicionada em:
   - `doPost`
   - `persistirRegistro`
   - `garantirEstruturaCabineVerde_`
   - `garantirAbaComCabecalho`
   - `garantirAbaComCabecalhos_` (incluindo stack antes do throw)
2. Fluxo `action=salvarCaso` em `doPost` passou a evitar garantia estrutural genérica no início e garantir apenas `CASOS` com:
   - `payload.colunas` quando válido;
   - fallback em `obterSchemaCabineVerdeUnificado_().CASOS`.
3. `registrarEventoOcorrenciaDetalhado_` passou a priorizar `schema.EVENTOS_CASO` unificado.
4. Ação temporária `testeSalvarCasoWebApp` adicionada em `doPost`, retornando `testarSalvarCasoPayloadMinimo181()`.

## Resultado esperado de debug
Se houver nova chamada inválida, o log `ERRO_COLUNAS_INVALIDAS_DEBUG` registrará:
- aba alvo;
- tipo e tamanho do parâmetro de colunas;
- stack completa para identificar origem exata.

## Verificação de chamadas CASOS
Não há chamada nova com `undefined` para `CASOS` no fluxo de `salvarCaso` após o ajuste. O fluxo principal usa array validado de 181 colunas (`payload` ou `schema`).
