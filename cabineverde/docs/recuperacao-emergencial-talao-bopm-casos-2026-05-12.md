# Recuperação emergencial de talões BOPM em CASOS (2026-05-12)

## Função
- `recuperarTaloesAusentesCasos()` adicionada em `cabineverde/GAS/Code.gs`.

## Objetivo operacional
- Preencher apenas a coluna `talaoBopm` da aba `CASOS` quando o valor estiver vazio.
- Não cria novas linhas e não altera casos já preenchidos.

## Estratégia aplicada
Ordem de tentativa por caso sem talão:
1. `observacoesOperacionais` da própria linha em `CASOS`;
2. histórico do caso (`HISTORICO_EDICOES`);
3. `LOG_AUDITORIA`;
4. `EVENTOS_CASO`;
5. `COPOM - CABINE VERDE` por chave `nome + telefone + dataServico`.

## Padrões aceitos
- Regex de captura para padrões textuais como `TALÃO 17202`, `TALAO 17202`, `BOPM 17202`, `Talão nº 17202`, `talão: 17202`.

## Auditoria e reversibilidade
- Toda execução gera registros em `LOG_AUDITORIA` com:
  - `status=talao_recuperado` + origem (`observacao`, `historico`, `log`, `evento`, `relatorio`) + `valor_recuperado`;
  - ou `status=talao_nao_recuperado`.
- Atualizações em `CASOS` são feitas em lote com `setValues`, permitindo auditoria da execução e rollback orientado por logs.

## Relatório final retornado pela função
- `totalAnalisado`
- `totalSemTalao`
- `totalRecuperado`
- `totalNaoRecuperado`
- `casosNaoRecuperados`
