# Migração segura da planilha Cabine Verde

## Abas e headers esperados

### CASOS
Usa o header existente em `COLUNAS_CASOS` com adição de `statusMigracao`.

### TRIAGEM_RESPOSTAS
`idCaso`, `perguntaChave`, `resposta`, `complemento`.

### EVENTOS_OCORRENCIA
`idCaso`, `timestampEvento`, `tipoEvento`, `descricaoEvento`, `statusCaso`, `prioridade`, `classificacaoRisco`.

### INDICADORES_OPERACIONAIS
`idCaso`, `criancaSemSupervisao`, `criancaVeiculoSuspeito`, `preadolescenteAliciamentoVirtual`, `adolescenteSofrimentoPsiquico`, `adultoSuspeitaCrime`, `idosoDesorientado`.

### LOG_MIGRACAO
`dataHora`, `funcaoExecutada`, `status`, `modoExecucao`, `backupConfirmado`, `idCaso`, `mensagem`, `usuario`, `origemExecucao`.

### LEGADO_OBSERVACOES_BRUTAS
`dataHora`, `idCaso`, `linhaOrigem`, `hashConteudo`, `conteudoBruto`, `operador`.

## Sequência operacional segura
1. Manter `DRY_RUN_MIGRACAO = true` no script (obrigatório no primeiro teste).
2. Executar menu **Cabine Verde > 5. Rodar rotina completa segura** para simulação completa.
3. Revisar `LOG_MIGRACAO` e confirmar todas as entradas `SIMULADO`.
4. Ajustar inconsistências operacionais identificadas.
5. Alterar manualmente `DRY_RUN_MIGRACAO = false`.
6. Executar menu **Cabine Verde > 5. Rodar rotina completa segura** novamente para execução real (com backup, ajuste, migração e validação).

## Regras de preservação implementadas
- Nunca remove linhas.
- Nunca recria aba apagando conteúdo existente.
- Cria backup antes da migração quando executado o passo 1 (ou passo 5 completo).
- Preserva `idCaso`; se ausente, gera `LEGADO-LINHA-<n>`.
- Migra talões legados (`talaoBopm`, `talaoBOPM`, `talão`, `talao`, `numeroTalao`) para `talaoPMESP`.
- Preserva `statusCaso`; quando ausente, aplica `Legado migrado`.
- Arquiva observações extensas ou com marcador de árvore em `LEGADO_OBSERVACOES_BRUTAS` e mantém resumo curto no campo principal.
- Registra eventos de execução em `LOG_MIGRACAO`.
- No dry run (`DRY_RUN_MIGRACAO = true`), nenhuma célula da aba `CASOS` é modificada; apenas logs `SIMULADO` são gerados.
- A rotina completa sempre roda primeiro a simulação e só executa a migração real quando a constante for alterada manualmente para `false`.

## Como desfazer com backup
1. Abra a aba de backup criada com sufixo `BACKUP_yyyyMMdd_HHmmss`.
2. Valide visualmente os dados de origem.
3. Para rollback, copie os dados da aba de backup e cole na aba operacional correspondente.
4. Registre o rollback manual em `LOG_MIGRACAO` para trilha de auditoria.

## Checklist final antes de produção
- [ ] `DRY_RUN_MIGRACAO` foi executado e validado com sucesso no `LOG_MIGRACAO`.
- [ ] Não existem alertas críticos não tratados (duplicidades relevantes ou id ausente sem tratativa).
- [ ] Backup foi executado no mesmo dia da janela de migração.
- [ ] Operador responsável está identificado no log.
- [ ] `DRY_RUN_MIGRACAO` foi alterado manualmente para `false` antes da execução real.


## Controles obrigatórios de produção (maio/2026)
- **Bloqueio de execução sem backup**: `validarPreExecucaoMigracao_` impede migração real sem backup recente (até 30 minutos), com log bloqueante em `LOG_MIGRACAO`.
- **Duplicidade crítica de talão**: `validarConsistenciaCaso` registra `POSSIVEL_DUPLICIDADE_TALAO_PMESP` com severidade crítica, marca `flagDuplicidade` e bloqueia persistência.
- **Rollback assistido**: `restaurarBackupMaisRecente_` restaura `CASOS`, `TRIAGEM_RESPOSTAS`, `EVENTOS_OCORRENCIA` e `INDICADORES_OPERACIONAIS` a partir do backup mais recente por aba, sem apagar o backup de origem.


## Contexto de execução autorizada
- As funções críticas (`ajustarEstruturaPlanilha_`, `migrarDadosLegados_`, `validarIntegridadeMigracao_`, `restaurarBackupMaisRecente_`) agora exigem contexto autorizado.
- O contexto é aberto por `iniciarContextoExecucao_()` e encerrado por `finalizarContextoExecucao_()`.
- Chamadas isoladas fora do fluxo seguro são bloqueadas com erro e log `BLOQUEADA` em `LOG_MIGRACAO`.
- Ações de menu executam wrappers com `try/finally` para garantir reset do contexto, evitando bypass manual no Apps Script.

## Rotina de saneamento DESAPARECIDOS -> CASOS_TRATADOS

Foi adicionada a função `migrarLegadoParaCasosTratados_()` para copiar e sanear dados legados da aba `Desaparecidos` sem alterar a origem.

Principais garantias:
- Cria/usa aba `CASOS_TRATADOS` com cabeçalho padronizado de 15 colunas.
- Preserva dados brutos de observações em `LEGADO_OBSERVACOES_BRUTAS` e salva resumo operacional em `observacoesOperacionais`.
- Normaliza campos críticos (`sexoGenero`, `meioTransporte`, caixa alta, espaços duplicados).
- Mantém booleanos (`TRUE`/`FALSE`) como tipo booleano.
- Marca `statusMigracao` como `MIGRADO`, `INCOMPLETO` ou `ERRO` (quando aplicável por validações futuras).
- É idempotente por `idCaso`: não duplica nem sobrescreve registros já migrados.
- Registra eventos e inconsistências em `LOG_MIGRACAO`.

### Fluxo definitivo da migração legada (Desaparecidos -> CASOS_TRATADOS)

- **Origem oficial**: aba `Desaparecidos` (com busca flexível por nome: `Desaparecidos`, `DESAPARECIDOS`, `desaparecidos`).
- **Destino**: aba `CASOS_TRATADOS`.
- **Leitura segura**: usa `getDataRange().getValues()` para não perder registros com linhas em branco no meio.
- **Mapeamento por cabeçalho**: dados são mapeados por nome de coluna (não por posição fixa).
- **Critério de linha válida**: somente linhas com `idCaso` preenchido.
- **Linhas ignoradas**: linhas vazias e linhas sem `idCaso` são ignoradas e contabilizadas no log.
- **Idempotência**: se `idCaso` já existir em `CASOS_TRATADOS`, o caso não é duplicado nem sobrescrito.
- **Observações longas/árvore**:
  - quando `observacoesOperacionais` contiver `[ÁRVORE DE DECISÃO` ou for extensa, o texto bruto vai para `LEGADO_OBSERVACOES_BRUTAS`;
  - em `CASOS_TRATADOS`, fica apenas um resumo curto.
- **Status da migração (`statusMigracao`)**:
  - `MIGRADO`: `idCaso` válido + `talaoPMESP` preenchido;
  - `INCOMPLETO`: `idCaso` válido sem `talaoPMESP`;
  - `ERRO`: falha de tratamento do registro.
- **Normalizações aplicadas**:
  - `sexoGenero`: `masculimpo`/`masculino` => `MASCULINO`; `feminino` => `FEMININO`;
  - `meioTransporte`: `n/d` e `nd` => `NAO INFORMADO`;
  - textos: remoção de espaços duplicados preservando legibilidade;
  - booleanos textuais `TRUE`/`FALSE`: convertidos para booleanos reais quando possível.

### DRY RUN (`DRY_RUN_MIGRACAO`)

- `DRY_RUN_MIGRACAO = true`:
  - não grava em `CASOS_TRATADOS`;
  - registra no `LOG_MIGRACAO` como **SIMULADO**;
  - mensagem esperada: `Migração simulada: X registros seriam migrados, Y incompletos por falta de talaoPMESP.`
- `DRY_RUN_MIGRACAO = false`:
  - grava em `CASOS_TRATADOS`;
  - registra no `LOG_MIGRACAO` como **EXECUTADO**;
  - mensagem esperada: `Migração executada: X registros migrados, Y incompletos.`

### Diagnóstico no LOG_MIGRACAO

Mensagens específicas esperadas:
- `Aba origem Desaparecidos não encontrada.`
- `Aba origem encontrada, mas sem registros abaixo do cabeçalho.`
- `Linhas encontradas, mas nenhum idCaso preenchido.`
- `Todos os casos válidos já estavam em CASOS_TRATADOS.`
- `Migração simulada: X registros seriam migrados, Y incompletos por falta de talaoPMESP.`
- `Migração executada: X registros migrados, Y incompletos.`

Resumo técnico registrado:
- aba origem utilizada;
- `totalLinhasLidas`;
- `totalLinhasComIdCaso`;
- `totalSemIdCaso`;
- `totalMigrados`;
- `totalIncompletos`;
- `totalJaExistentes`;
- `totalErros`;
- modo (`SIMULADO` ou `EXECUTADO`).

### Como confirmar que funcionou

1. Execute a rotina em `DRY_RUN_MIGRACAO=true` e valide os números no `LOG_MIGRACAO`.
2. Confirme se há contagem coerente para `totalLinhasLidas`, `totalLinhasComIdCaso`, `totalMigrados`, `totalIncompletos` e `totalJaExistentes`.
3. Altere para `DRY_RUN_MIGRACAO=false` e execute novamente.
4. Verifique:
   - crescimento de `CASOS_TRATADOS` somente para novos `idCaso`;
   - ausência de duplicatas de `idCaso`;
   - presença de `statusMigracao`;
   - preservação de observações brutas em `LEGADO_OBSERVACOES_BRUTAS` quando aplicável.

## Validação pós-migração de CASOS_TRATADOS

A função `validarCasosTratados_()` executa verificação de completude, coerência e utilidade operacional dos dados migrados.

Saída:
- Aba `VALIDACAO_MIGRACAO` com os campos: `dataHoraValidacao`, `idCaso`, `talaoPMESP`, `campo`, `problema`, `severidade`, `statusValidacao`.

Regras aplicadas:
- `nomeCompletoDesaparecido` vazio -> `CRITICA`.
- `idade` inválida -> `ALTA`.
- `dataHoraUltimaVisualizacao` inválida -> `ALTA`.
- `localUltimaVisualizacao` vazio -> `ALTA`.
- `classificacaoRisco` vazio -> `CRITICA`.
- `prioridade` vazia -> `CRITICA`.
- `observacoesOperacionais` muito curtas -> `MEDIA`.

Evento de auditoria:
- Registra `VALIDACAO_MIGRACAO_EXECUTADA` no `LOG_MIGRACAO`, com total de problemas encontrados.

## Consolidação do status final de uso (CASOS_TRATADOS)

A função `consolidarStatusUsoCasosTratados_()` atribui selo final de uso por registro em `CASOS_TRATADOS` com base nas severidades da aba `VALIDACAO_MIGRACAO`.

Colunas adicionadas/atualizadas em `CASOS_TRATADOS`:
- `statusUso`
- `dataHoraConsolidacaoUso`

Regras de consolidação:
- qualquer `CRITICA` -> `NAO_APTO`
- sem `CRITICA`, mas com `ALTA` -> `APTO_COM_RESTRICAO`
- apenas `MEDIA`/`BAIXA` -> `APTO_COM_OBSERVACAO`
- sem problemas -> `APTO_PARA_USO`

Auditoria:
- Registra `STATUS_USO_CONSOLIDADO` no `LOG_MIGRACAO` com totais:
  - `totalApto`
  - `totalRestricao`
  - `totalNaoApto`
