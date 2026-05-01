# Simulação operacional local — Cabine Verde

## Cenários testados
1. 5 operadores salvando casos simultaneamente.
2. 3 supervisores consultando timeline.
3. 2 supervisores validando fotos.
4. 5 operadores gerando relatório SIOPM.
5. 1 auditor consultando qualidade dos dados.
6. 1 admin executando healthcheck.

## Ações simuladas
- `salvarCaso`
- `gerarTimelineCaso`
- `validarFotoDesaparecido`
- `gerarRelatorioTextoSIOPM`
- `auditarQualidadeDados`
- `healthcheck`

Todas as chamadas são simuladas com `fetch` mockado e validam contrato:
- `method: POST`
- `Content-Type: text/plain;charset=utf-8`
- `body: JSON.stringify(payload)`
- sem `application/json`.

## Limites do teste
- Não valida latência de rede, quota do Apps Script, bloqueios de Drive ou escrita real em planilha.
- Não cobre autenticação Google real (`Session.getActiveUser`) nem ACLs reais de conta.
- Valida somente montagem de requisição e tratamento de resposta no frontend local.

## Diferença: simulação local vs produção
- **Simulação local**: deterministicamente reproduz concorrência de chamadas e contrato HTTP sem dependência externa.
- **Produção**: inclui variáveis reais (rede, sessão Google, limites de execução GAS, concorrência no Sheet, permissões de pasta/arquivo).

## Recomendação de teste real controlado
- Executar teste assistido com **2 máquinas e 2 operadores reais**:
  - Máquina A: operador executa criação/edição de casos e upload/consulta de foto.
  - Máquina B: supervisor valida foto e consulta timeline em paralelo.
- Rodar janela curta (15–20 min), com observação de logs em `Logs_GAS`, `EVENTOS_OCORRENCIA` e `LOG_ACESSO_FOTOS`.
- Coletar taxa de sucesso, tempo médio de resposta e erros por action para decidir rollout.
