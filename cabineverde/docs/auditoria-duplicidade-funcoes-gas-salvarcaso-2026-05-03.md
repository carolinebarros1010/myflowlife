# Auditoria de duplicidade de funções GAS no fluxo salvarCaso (2026-05-03)

## Escopo da busca
- `garantirAbaComCabecalhos_`
- `garantirAbaComCabecalho`
- `persistirRegistro`
- `salvarCaso`
- `registrarEventoOperacional_`
- `garantirEstruturaCabineVerde_`

## Resultado
Busca de definições (`function ...`) em `cabineverde/GAS/*.gs`:
- `garantirAbaComCabecalhos_`: **1 definição** (`Utils.gs`)
- `garantirAbaComCabecalho`: **1 definição** (`Utils.gs`)
- `persistirRegistro`: **1 definição** (`Code.gs`)
- `registrarEventoOperacional_`: **1 definição** (`Code.gs`)
- `garantirEstruturaCabineVerde_`: **1 definição** (`Utils.gs`)
- `salvarCaso`: **não existe função nominal duplicada**; o fluxo é roteado por `action === 'salvarCaso'` em `doPost`.

Não foram encontradas duplicidades de definição para essas funções no módulo GAS da Cabine Verde.

## Endurecimento aplicado
- Inserido log sentinela no início da função oficial:
  - `Logger.log("PERSISTIR_REGISTRO_OFICIAL_ATIVO");`
- Todas as garantias de `CASOS` auditadas/ajustadas para usar `obterSchemaCabineVerdeUnificado_().CASOS`.
- Leitura de `EVENTOS_CASO` para timeline ajustada para `obterSchemaCabineVerdeUnificado_().EVENTOS_CASO`.

## Conclusão
O fluxo oficial permanece:
`doPost (action salvarCaso) -> persistirRegistro (oficial) -> garantirAbaComCabecalho/garantirAbaComCabecalhos_`.
