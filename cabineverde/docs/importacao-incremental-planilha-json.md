# Importação incremental da planilha F2 para a base offline

O pacote `CabineVerde_Pacote_D_19AGO2026\CabineVerde` já contém a base JSON usada pelo servidor. A planilha operacional é um arquivo Excel armazenado no Google Drive, apesar de ser aberta pela interface do Google Planilhas; por isso, a importação é feita a partir de uma cópia `.xlsx` exportada.

O importador usa `aba + linha` como chave de idempotência. Antes de alterar os arquivos canônicos, cria uma cópia em `backup\antes-importacao-incremental-*`. Linhas sem `idCaso` não são forçadas para `casos.json`: entram em `pessoas.json`, `analises-f2.json` e `eventos.json` para posterior qualificação operacional.

Exemplo:

```powershell
& "C:\caminho\python.exe" tools\importar_incremento_planilha_json.py `
  --planilha "C:\caminho\Planilha de Dados F2 CABINE VERDE ABRIL.xlsx" `
  --data-root "CabineVerde_Pacote_D_19AGO2026\CabineVerde" `
  --ate 2026-08-20
```

Após a execução, conferir `dados\metadados.json`, a pasta de backup e os testes do servidor antes de transportar o pacote por pendrive.

## Aplicação do manifesto F2 na base central

Quando os registros já tiverem sido preparados no manifesto JSON, a aplicação direta na base oficial pode ser feita com:

```powershell
python tools\aplicar-manifesto-f2-central.py `
  --manifesto data\imports\f2-atualizacao-18-20-ago-2026.json `
  --data-root D:\CabineVerde
```

O procedimento é idempotente por aba e linha de origem, cria backup antes da gravação e mantém os novos registros em triagem; a localização deve ser informada posteriormente pela aplicação.
