# Auditoria técnica — campo `talaoPMESP` (Cabine Verde)

Data: 2026-05-01

## Resultado por critério

1. **Presença no domínio TypeScript**: **OK**.
   - `CasoDesaparecimento` define `talaoPMESP: string`.
2. **Campo no início do formulário**: **OK**.
   - Em `TriageForm`, etapa 0 começa com `idCaso` e em seguida `talaoPMESP`.
3. **Obrigatório na etapa inicial**: **OK**.
   - Input HTML com `required` e validação de etapa 0 exigindo `talaoPMESP`.
4. **Payload multiabas envia na aba CASOS**: **OK**.
   - `COLUNAS_CASOS` inclui `talaoPMESP` e o registro `CASOS` usa esse mapeamento.
5. **GAS inclui no header CASOS**: **OK**.
   - `COLUNAS_CASOS` do GAS contém `talaoPMESP`.
6. **GAS adiciona header faltante sem apagar dados**: **OK**.
   - `garantirColunasDaEstrutura` só anexa colunas faltantes ao fim do header.
7. **Gravação por nome de header, não posição fixa**: **OK**.
   - `persistirRegistro` mapeia por nome (`mapearPorColuna`) e remonta linha conforme `cabecalhoAtual`.
8. **`observacoesOperacionais` não recebe `talaoPMESP` nem árvore**: **OK no código TypeScript principal**.
   - Em `src/app.ts`, `observacoesOperacionais` vem apenas do campo livre do formulário.
   - Em `src/utils/sheetsPayload.ts`, é normalizada como texto curto.
   - Removido legado em `public/js`: observações voltaram a carregar apenas texto livre do operador.
9. **Teste de payload valida presença do campo**: **OK**.
   - `tests/payload.test.ts` verifica coluna e dado `talaoPMESP`.
10. **Documentação sobre `idCaso` técnico e `talaoPMESP` oficial PMESP**: **OK**.
   - A documentação de integração agora explicita a distinção operacional e as regras de consistência/duplicidade.

## Avaliação complementar — upsert por `idCaso`

### Situação atual
- No GAS, o upsert de `CASOS` localiza linha por `idCaso`.
- Não há validação de consistência/duplicidade operacional por `talaoPMESP`.

### Risco operacional
- Se um mesmo atendimento PMESP for reenviado com novo `idCaso`, o sistema pode criar duplicidade operacional.
- Se um `idCaso` for reutilizado com `talaoPMESP` divergente, pode haver sobrescrita inconsistente.

### Recomendação
1. Manter `idCaso` como chave técnica de escrita.
2. Adicionar regra de consistência por `talaoPMESP` na aba `CASOS`:
   - Se `idCaso` já existe e `talaoPMESP` diverge do registro atual, bloquear atualização e registrar log de conflito.
   - Se `idCaso` não existe, mas `talaoPMESP` já existe, retornar alerta de potencial duplicidade (ou modo "merge assistido").
3. Registrar decisão em documentação operacional para auditoria.


## Implementações concluídas após auditoria
- Frontend legado (`public/js`) atualizado para não concatenar árvore/indicadores em `observacoesOperacionais`.
- Backend GAS com busca por `idCaso` e por `talaoPMESP` na aba `CASOS`.
- Regra de bloqueio implementada para `idCaso` existente com `talaoPMESP` divergente (`CONFLITO_TALAO_PMESP`).
- Regra de alerta implementada para possível duplicidade quando `talaoPMESP` já existir com outro `idCaso` (`POSSIVEL_DUPLICIDADE_TALAO_PMESP`).
- Eventos de consistência registrados em `EVENTOS_OCORRENCIA`.
- Mantida diretriz de evolução futura para merge assistido, sem merge automático no fluxo atual.


## Regras explícitas de consistência implementadas
- `idCaso` existente com `talaoPMESP` vazio pode receber `talaoPMESP` novo.
- `idCaso` existente com `talaoPMESP` preenchido e divergente é bloqueado com evento `CONFLITO_TALAO_PMESP`.
- `talaoPMESP` já existente em outro `idCaso` gera bloqueio por possível duplicidade operacional com evento `POSSIVEL_DUPLICIDADE_TALAO_PMESP`.
