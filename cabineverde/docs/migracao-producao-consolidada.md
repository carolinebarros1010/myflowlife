# Migração da produção consolidada

A planilha `Relatório Diário de PRODUÇÃO da CABINE VERDE.xlsx` foi convertida para a pasta de consulta:

`dados/consulta/producao-consolidada/`

O arquivo `producao-consolidada.json` preserva as quatro abas, cabeçalhos e linhas originais, além de disponibilizar registros diários e resumos mensais normalizados. O `manifest.json` identifica a fonte, a versão da migração e a quantidade de registros.

O servidor expõe os dados pela rota `GET /api/consulta/producao-consolidada`, com filtros opcionais `inicio` e `fim`. A aba de resumo mensal consulta essa rota quando está no modo servidor. A produção diária continua sendo gravada separadamente e pode ser preenchida pelos operadores sem sobrescrever o histórico consolidado.

Para atualizar o consolidado, gere novamente a pasta com:

```powershell
python tools/importar-producao-consolidada.py caminho\arquivo.xlsx dados\consulta\producao-consolidada
```

Na base oficial do servidor, a aplicação aceita os dois formatos: copie o arquivo para `dados/consulta/producao-consolidada.json` ou mantenha a pasta `dados/consulta/producao-consolidada/` com o arquivo dentro dela. A aplicação não altera a planilha de origem.
