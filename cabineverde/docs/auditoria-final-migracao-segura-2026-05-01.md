# Auditoria final — rotina de migração segura (Cabine Verde)

Data da auditoria: **2026-05-01**
Escopo auditado: `cabineverde/GAS/MigracaoLegado.gs` e documentação operacional associada.

## Resultado dos 12 critérios

1. **`DRY_RUN_MIGRACAO` true por padrão**: **CONFORME**.
   - Evidência: constante definida como `true`.
2. **Nenhuma célula da aba `CASOS` alterada durante dry run**: **CONFORME**.
   - Evidência: gravações em `CASOS` ocorrem apenas no ramo `!dryRun`; no ramo `dryRun` apenas logs são registrados.
3. **Dry run registra no `LOG_MIGRACAO` o que seria alterado**: **CONFORME**.
   - Evidência: mensagens `SIMULADO` para criação/padronização de headers, atualização de campos, arquivamento de observações e backup simulado.
4. **Rotina completa segura bloqueia execução real enquanto `DRY_RUN_MIGRACAO=true`**: **CONFORME**.
   - Evidência: `rodarRotinaCompletaSegura_` interrompe após simulação quando a flag está `true`.
5. **Backup real obrigatório antes da migração definitiva**: **PARCIALMENTE CONFORME**.
   - Evidência: na rotina completa, backup real é executado antes da migração; porém funções internas podem ser invocadas isoladamente sem backup prévio obrigatório por trava técnica.
6. **Nenhuma função apaga linhas existentes**: **CONFORME**.
   - Evidência: não há chamadas de remoção de linhas/abas (`deleteRow`, `deleteRows`, `deleteSheet`) no script de migração.
7. **Headers adicionados sem remover colunas antigas**: **CONFORME**.
   - Evidência: rotina adiciona colunas ao final quando ausentes e padroniza por renomeação de sinônimos, sem exclusão de colunas.
8. **`observacoesOperacionais` não recebe mais árvore de decisão**: **CONFORME**.
   - Evidência: no frontend atual, campo recebe texto livre; testes validam ausência de marcadores de árvore/indicadores.
9. **Observações legadas arquivadas em `LEGADO_OBSERVACOES_BRUTAS`**: **CONFORME**.
   - Evidência: observações longas/com marcador de árvore são arquivadas com hash e metadados.
10. **`talaoPMESP` preservado/migrado corretamente**: **CONFORME**.
    - Evidência: mapeamento legado inclui variantes do talão; valor legado é migrado para `talaoPMESP`.
11. **Duplicidades por `idCaso` e `talaoPMESP` registradas**: **CONFORME (com ressalva)**.
    - Evidência: validação contabiliza e registra quantidades de duplicados para ambos; ressalva: severidade `ALERTA` hoje depende apenas de duplicidade de `idCaso`.
12. **Documentação clara de rollback por backup**: **CONFORME**.
    - Evidência: documentação descreve passo a passo de rollback manual a partir de aba backup.

## Parecer final de segurança

A rotina está **majoritariamente segura para execução assistida**, com proteção efetiva de dry run, trilha de auditoria em log e mecanismo de arquivamento do legado textual. O fluxo padrão via menu “rotina completa segura” impõe simulação prévia e bloqueia execução real enquanto `DRY_RUN_MIGRACAO=true`.

## Riscos residuais

1. **Bypass operacional do backup**: execução direta de funções internas (`migrarDadosLegados_({ dryRun:false })`) permite migração sem backup obrigatório técnico.
2. **Semântica de alerta incompleta para duplicidade de talão**: duplicidade de `talaoPMESP` é contabilizada, porém não eleva `status` para `ALERTA` por si só na validação final.
3. **Rollback manual**: processo de desfazer depende de procedimento humano (copiar/colar), sujeito a erro operacional.

## Checklist operacional antes de rodar em dados reais

- [ ] Confirmar `DRY_RUN_MIGRACAO = true` e executar rotina completa segura (simulação).
- [ ] Revisar `LOG_MIGRACAO` e resolver todos os alertas relevantes.
- [ ] Validar contagem de duplicidades (`idCaso` e `talaoPMESP`) e plano de saneamento.
- [ ] Executar backup real no mesmo dia da janela de mudança.
- [ ] Registrar operador responsável e janela da execução.
- [ ] Alterar manualmente `DRY_RUN_MIGRACAO = false` somente após aprovação formal.
- [ ] Executar rotina completa segura em modo real (não executar funções avulsas).
- [ ] Validar amostra pós-migração e registrar aceite/rollback.

## Recomendação

**Recomendação: NÃO APTO (condicional)** para produção imediata sem ajustes de governança.

Para mudar para **APTO**, recomenda-se no mínimo:
1. Bloqueio técnico para impedir migração real sem backup na mesma execução.
2. Tratar duplicidade de `talaoPMESP` como `ALERTA` na validação final.
3. Restringir execução operacional ao fluxo único “rotina completa segura”.
