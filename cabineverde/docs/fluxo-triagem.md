# Fluxo de Triagem Dinâmica (UI Operacional)

## Organização da tela principal

1. **Cabeçalho institucional** (`Header`)
2. **Etapas de triagem com progresso** (`ProgressSteps`)
3. **Banner de status persistente** (`CaseStatusBanner`)
4. **Grade operacional**
   - formulário em etapas (`TriageForm`)
   - blocos condicionais (`ConditionalSection` + subfluxo etário)
   - rodapé de ação com persistência parcial (`ActionFooter`)
   - painel de risco (`RiskBadgePanel`)
   - resumo ao vivo do caso (`CaseLiveSummary`)
   - sessão operacional (`SessionPanel`)
5. **Consulta de casos recentes** (`RecentCasesPanel` + `CaseList`)
6. **Detalhe estruturado do caso** (`CaseDetails`)
7. **Log operacional** (`AuditLogPanel`)
8. **Relatório operacional revisável** (`ReportView`)

## Estado centralizado da triagem

A tela passou a usar um estado único no módulo `src/modules/triagem/triagemState.ts`:

```ts
triagemState = {
  etapa,
  dados,
  casoCompleto,
  validacoes,
  status
}
```

Benefícios:
- evita inconsistência entre UI e dados;
- centraliza validação por etapa;
- facilita manutenção/auditoria de regras de risco;
- simplifica modo criação, edição e rascunho.

## Regras de risco e prioridade

A derivação de risco/prioridade/ação segue centralizada por domínio:
- `triageEngine.ts` compõe resultados do caso completo;
- `risk.ts` define classificação de risco;
- `priority.ts` define prioridade e ação sugerida.

A UI consome apenas o `casoCompleto` derivado do estado.

## Persistência parcial e continuidade entre estações

Além da persistência local de casos:
- rascunho salvo por `sessionId` (`save-draft` / `load-draft`);
- geração de token de sessão para migração entre dispositivos (`share-session`);
- importação por token no painel de sessão (`apply-session`).

## Modo criação e edição forte

- Abertura de caso da listagem carrega automaticamente no formulário (modo edição).
- Botão **Atualizar caso** exige `idCaso`.
- Botão **Iniciar novo caso** reinicia estado e gera nova sessão.

## Logs operacionais

Foi adicionado log de auditoria local com:
- timestamp;
- ação (criação/atualização);
- usuário (solicitante/operador);
- alteração resumida (`idCaso` + status).

## Compatibilidade preservada

- Mantida compatibilidade com `env.ts`, `sheetsService.ts` e `sheetsPayload.ts`.
- Payload de integração com Google Sheets não teve quebra de contrato.
- Apps Script em `cabineverde/GAS/` permanece compatível.
