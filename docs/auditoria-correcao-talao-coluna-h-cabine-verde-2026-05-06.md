# Correção da coluna H (`talaoBopm`) na aba CASOS — 2026-05-06

## Causa raiz
- O frontend da triagem priorizava `talaoPMESP` (chave operacional) no formulário e no payload.
- O schema da aba `CASOS` usa `talaoBopm` como coluna física de planilha (coluna H).
- Sem normalização obrigatória em todos os pontos, havia cenários em que `talaoBopm` chegava vazio.

## Ajustes implementados
1. Normalização no frontend (`public/js/core.js`) para sempre espelhar o talão em ambos os campos:
   - `talaoPMESP`
   - `talaoBopm`
2. Normalização no backend GAS (`GAS/Code.gs`) antes de persistir:
   - `normalizarTalaoPayload(dados)`
   - aplicação no `doPost` e no `persistirRegistro` para `CASOS`.
3. Normalização equivalente no código TypeScript (`src/utils/sheetsPayload.ts`) para manter coerência com a versão fonte.
4. Teste automatizado atualizado para validar que `gerarPayloadSheets` preenche os dois campos com o mesmo valor.

## Resultado esperado
- Ao finalizar triagem, a coluna H (`talaoBopm`) da aba `CASOS` recebe o número do talão.
- Busca/auditoria continuam funcionando por `talaoPMESP`.
- Compatibilidade de transição preservada com aliases de talão.
