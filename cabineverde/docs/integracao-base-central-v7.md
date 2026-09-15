# Integração da base central com o histórico V7

## Regra de armazenamento

Os 4.088 casos operacionais permanecem em `dados/casos.json`. O recorte V7
é armazenado separadamente em `dados/historicos-v7.json`, com 213 registros
individualizados e seus metadados administrativos (214 registros).

Isso permite uma pesquisa única sem transformar o histórico V7 em novos casos
operacionais e sem substituir o status atual das pessoas ou dos casos centrais.

## Importação

A importação é explícita e idempotente; não é executada na inicialização do
servidor:

```powershell
python server/import_v7.py `
  --data-root .\CabineVerde_Pacote_D_19AGO2026\CabineVerde `
  --v7-root .\CabineVerde_V7_JSON_Dashboard_19AGO2026\CabineVerde_V7_JSON_Dashboard
```

O processo preserva `casos.json`, faz gravação atômica pelo repositório JSON e
registra a origem, data de referência e ressalvas de validação em
`dados/metadados.json`.

## API

- `GET /api/busca?termo=...&status=...`: pesquisa unificada em casos centrais e histórico V7.
- `GET /api/indicadores`: retorna indicadores atuais da base central e o bloco histórico V7 separado.
- `GET /api/ocorrencias/{id}`: também permite abrir um registro `HIST-V7-*` importado.

Todo resultado possui `tipoRegistro`: `CASO_OPERACIONAL` ou `HISTORICO_V7`.

## Indicadores

O bloco V7 mantém as categorias 81, 68, 29, 23 e 13, totalizando 214. Esse
total não deve ser somado aos 4.088 casos centrais. O dashboard deve apresentar
as duas fontes identificadas, mantendo a base central como fonte operacional.
