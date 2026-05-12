# Reconciliação de talões COPOM na aba CASOS — 2026-05-12

## Nova rotina
- Função adicionada: `reconciliarTaloesComRelatoriosCOPOM(simulacao)`.
- Modo padrão: `SIMULACAO=true` (passar `false` para execução real).

## Regras operacionais implementadas
- Percorre `CASOS` e analisa apenas linhas com `talaoBopm` vazio.
- Nunca sobrescreve talão já existente.
- Nunca cria novas linhas em `CASOS`.
- Usa abas diárias (`^\d{2}[A-Z]{3}\d{2}$`), ignorando: `MODELO_TALAO`, `LOG_AUDITORIA`, `EVENTOS_CASO`, `CASOS`.
- Cruzamento por:
  - `nomeCompletoDesaparecido` normalizado + `telefoneSolicitante` normalizado (índice em memória);
  - `dataServico`;
  - `nomeSolicitante`;
  - similaridade de `observacoesOperacionais`.
- Se houver match forte:
  - preenche `CASOS!H` (`talaoBopm`) em lote com `setValues`;
  - atualiza `assinaturaCaso`.
- Ambiguidade:
  - marca `conflito_manual` no `LOG_AUDITORIA`;
  - não preenche automaticamente.

## Segurança e desempenho
- Usa `LockService` para exclusão mútua.
- Em execução real (`SIMULACAO=false`), cria backup oculto `BACKUP_CASOS_RECONCILIACAO_<timestamp>` antes de alterar dados.
- Escrita em lote com `setValues` (sem `appendRow`).
- Carrega abas diárias em memória e indexa por `nome + telefone`.

## Relatório retornado
- `totalAnalisado`
- `totalSemTalao`
- `totalReconciliado`
- `totalAmbiguo`
- `totalNaoEncontrado`
- `casosRecuperados`
- `conflitos`


## Ajuste de layout COPOM (linha 6)
- Leitura dos cabeçalhos da aba diária ocorre na **linha 6**.
- Coluna de talão é localizada dinamicamente por aliases: `BOPM`, `TALÃO`, `TALAO`, `Nº TALÃO`, `NUMERO TALAO`.
- Também são localizadas dinamicamente as colunas de nome, telefone, solicitante, data e observações para o cruzamento operacional.
