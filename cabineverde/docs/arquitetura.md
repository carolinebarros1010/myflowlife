# Arquitetura Cabine Verde

## Decisão de stack
Foi adotada uma base modular com duas camadas:
1. **Operacional imediata** em HTML/CSS/JavaScript modular (`public/js`), sem build obrigatório.
2. **Base evolutiva** em TypeScript (`src/`), organizada por domínio para evolução em produção.

## Camadas
- `public/js/`: versão funcional ativa da triagem, classificação, payload e relatório.
- `components/`: blocos visuais (layout, fluxo em etapas, formulário, painéis de risco, sessão, listas, detalhe, logs, relatório).
- `modules/`: orquestrações por domínio (triagem, desaparecidos, relatórios).
- `utils/`: funções puras (faixa etária, risco, prioridade, payload, resumo).
- `services/`: integrações externas e persistência local (cases, rascunhos e auditoria).
- `types/`: contratos de dados do caso e payload.

## Núcleo de estado da triagem

`src/modules/triagem/triagemState.ts` centraliza o estado operacional:
- etapa atual;
- dados do formulário normalizados;
- caso enriquecido com risco/prioridade;
- validações por etapa;
- status da operação.

Esse padrão reduz estado espalhado no `app.ts` e melhora rastreabilidade de comportamento.

## Componentes operacionais

### Navegação e status
- `OperationalHeader` (`components/layout/Header.ts`)
- `CaseProgress` (`components/triagem/ProgressSteps.ts`)
- `CaseStatusBanner` (`components/triagem/CaseStatusBanner.ts`)

### Formulário, condicionais e sessão
- `TriageForm` em etapas (`components/form/TriageForm.ts`)
- `ConditionalSection` (`components/triagem/ConditionalSection.ts`)
- `ActionFooter` (`components/triagem/ActionFooter.ts`)
- `SessionPanel` (`components/triagem/SessionPanel.ts`)
- Subfluxo etário e perguntas dinâmicas (`AgeSections` + `ConditionalQuestions`)

### Leitura operacional e governança
- `RiskBadgePanel` (`components/triagem/RiskBadgePanel.ts`)
- `CaseLiveSummary` (`components/triagem/CaseLiveSummary.ts`)
- `RecentCasesPanel` + `CaseList` + `CaseDetails`
- `AuditLogPanel` (log de criação/atualização)
- `ReportView`

## Compatibilidade preservada
- Sem quebra de contrato nos módulos de integração com Google Sheets.
- `sheetsPayload.ts` preservado.
- `triageEngine.ts` e utilitários de cálculo mantidos como núcleo lógico auditável.

## Evolução futura
Permite evolução para sincronização de rascunho por backend/GAS, autenticação de operador e trilha de auditoria persistente em planilha sem quebra do núcleo funcional.
