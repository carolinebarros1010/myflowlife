# Auditoria de conflito `talaoPMESP` x `talaoBopm` — 2026-05-07

## Escopo
- Verificação de coerência entre payload TypeScript e layout físico da aba `CASOS`.
- Validação específica do posicionamento de `talaoBopm` na coluna **H**.

## Diagnóstico
- O payload em `cabineverde/src/utils/sheetsPayload.ts` estava com `talaoBopm` após `municipio`.
- Nesse arranjo, `talaoBopm` era emitido na 11ª coluna lógica do array (`K`), conflitando com o layout operacional que exige coluna `H`.

## Correção aplicada
- Reordenação de `COLUNAS_CASOS` para posicionar `talaoBopm` como 8ª coluna (coluna `H`).
- Mantida a normalização que espelha o número do talão entre `talaoPMESP` e `talaoBopm`.

## Resultado esperado
- Persistência do talão BOPM em `CASOS!H:H`.
- Eliminação de conflito de posição entre frontend TypeScript e planilha operacional.
