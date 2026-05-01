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
