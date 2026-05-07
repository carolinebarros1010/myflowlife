# Saneamento de duplicados - Cabine Verde (2026-05-07)

## Novas actions
- `analisarDuplicadosCasos`: identifica grupos duplicados na aba `CASOS`.
- `gerarRelatorioDuplicadosCasos`: retorna relatório JSON para conferência.
- `marcarDuplicadosCasos`: marca principal/duplicado sem excluir linhas.

## Controle de acesso
- `ADMIN`: pode analisar, gerar relatório e marcar.
- `SUPERVISOR`: pode analisar e gerar relatório.
- `OPERADOR`: sem acesso.

## Colunas de controle adicionadas automaticamente (se ausentes)
- `assinaturaCaso`
- `duplicadoDe`
- `statusDuplicidade`
- `dataAnaliseDuplicidade`
- `observacaoDuplicidade`

## Fluxo seguro recomendado
1. Executar `gerarRelatorioDuplicadosCasos`.
2. Validar `totalGruposDuplicados`, `idsDuplicados` e `idCasoPrincipal`.
3. Rodar `marcarDuplicadosCasos` com `simulacao=true` para dry-run.
4. Conferir logs `SANEAMENTO_DUPLICADOS_MARCACAO_SIMULACAO`.
5. Executar `marcarDuplicadosCasos` com `simulacao=false`.
6. Revisar planilha e buscar casos principais.

## Logs relevantes
- `SANEAMENTO_DUPLICADOS_ANALISE`
- `SANEAMENTO_DUPLICADOS_RELATORIO`
- `SANEAMENTO_DUPLICADOS_MARCACAO_SIMULACAO`
- `SANEAMENTO_DUPLICADOS_MARCACAO_EXECUTADA`

## Ajuste de busca
`buscarCasoCompleto` passa a redirecionar automaticamente para o `idCaso` principal quando o caso consultado estiver com:
- `statusDuplicidade = duplicado`
- `duplicadoDe` preenchido
