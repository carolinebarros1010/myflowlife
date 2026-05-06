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

## Espelhamento entre preenchimento rápido e árvore oficial

A interface operacional mantém os campos repetidos de propósito:

- **Dados principais**: preenchimento rápido para encaminhamento e coleta inicial.
- **Árvore oficial**: questionário completo para consolidação do caso.

Para evitar divergências, os campos equivalentes funcionam com espelhamento bidirecional (ex.: nome, município, sexo/gênero, idade, última visualização, vulnerabilidade, suspeita de crime e apoio tecnológico). Assim, alteração em qualquer lado atualiza automaticamente o campo correspondente no outro.

O envio para backend continua consolidado: apenas o valor final sincronizado é usado no payload, sem alteração de endpoint, contrato `no-cors` ou estrutura de 51 colunas.

## Camada de indicadores operacionais estruturados

A triagem agora deriva um objeto interno `indicadoresOperacionais` a partir das respostas da árvore e do subfluxo etário, mantendo compatibilidade total com o payload atual de 51 colunas.

### Indicadores base
- `criancaSemSupervisao`
- `criancaVeiculoSuspeito`
- `preadolescenteAliciamentoVirtual`
- `adolescenteSofrimentoPsiquico`
- `adultoSuspeitaCrime`
- `idosoDesorientado`

### Aplicações operacionais da camada
- realimentação automática de `classificacaoRisco`, `prioridade` e `aptoCabineVerde`;
- cálculo de criticidade (`Crítica`, `Alta`, `Moderada`, `Baixa`);
- sugestão de ação operacional no resumo lateral;
- inclusão automática de bloco `[INDICADORES OPERACIONAIS]` em `observacoesOperacionais` para auditoria e futura indexação.

### Base para painel futuro
A estrutura foi mantida somente no front-end neste ciclo, pronta para filtros e painéis sem dependência imediata de alteração de endpoint, GAS ou colunas existentes.

## Fluxo progressivo e condicional (maio/2026)

Evoluções aplicadas para reduzir carga cognitiva do operador:

- **Progressão por etapas com ação contextual**: botão **Próximo** fica visível apenas até a última etapa; no fechamento, o operador usa **Finalizar triagem**.
- **Indicador explícito de progresso**: texto vivo com percentual (`Triagem: X% concluída`) sincronizado à etapa ativa.
- **Lógica condicional de vulnerabilidade**: ao marcar **Vulnerabilidade = não** (checkbox desmarcado), o bloco detalhado de vulnerabilidade é ocultado.
- **Lógica condicional de crime**: blocos de indícios de crime permanecem ocultos quando **Suspeita de crime = não**.
- **Cálculo em tempo real preservado**: risco, prioridade e indicadores seguem recalculados a cada digitação no resumo lateral.
- **Finalização operacional**: no submit final, o caso é consolidado e o status evolui automaticamente para **Em busca**.

### Salvamento automático de rascunho local

- A cada alteração relevante no fluxo Registro/Triagem, o estado é salvo automaticamente no navegador (com debounce curto).
- A chave de rascunho usa prioridade: `idCaso`; na ausência, usa `talaoPMESP`.
- Ao reabrir o sistema, o operador recebe prompt para continuar o último rascunho local identificado.
- Após finalização com sucesso, o rascunho local correspondente é removido automaticamente.
- Arquivos de foto **não** são persistidos em `localStorage`; apenas metadados já estruturados no estado textual.
- **Limitação importante**: rascunho local é mecanismo de continuidade operacional e **não substitui** o salvamento oficial no banco central/Google Sheets.
- Feedback visual diferenciado no banner:
  - **Rascunho local**: mensagem `Rascunho salvo no dispositivo.` com destaque **amarelo**.
  - **Salvamento oficial**: mensagem `Caso salvo no sistema com sucesso.` com destaque **verde**.
  - Mensagens distintas evitam confusão entre continuidade local e persistência oficial.

## Atualização 2026-05-06 — Foto pós-triagem

- A triagem passou a permitir salvamento com `fotoDisponivel = "Pendente"`, `linkFoto`/`urlFoto` vazios.
- O envio da foto foi desacoplado para etapa posterior, via action `atualizarFotoCaso` no backend.
- O vínculo posterior da foto preserva o mesmo `idCaso`/`talaoPMESP` e não sobrescreve respostas da triagem.
