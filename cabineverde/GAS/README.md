# GAS Workspace - Cabine Verde

Esta pasta (`cabineverde/GAS/`) é a área versionada do Google Apps Script usada pela integração do Cabine Verde com Google Sheets.

## Endpoint principal publicado
`https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec`

- `GET`: healthcheck simples do serviço.
- `POST`: cria ou atualiza casos em `Desaparecidos` sem duplicidade de `idCaso` (única aba permitida).

## Estrutura de arquivos
- `Code.gs`: `doGet`, `doPost` e orquestração da estrutura da planilha.
- `SheetsMapping.gs`: colunas oficiais da aba `Desaparecidos`.
- `Utils.gs`: parse, normalização e resposta JSON.
- `MockPayload.json`: payload de teste compatível com a estrutura atual.
- `appsscript.json`: manifesto V8.

## Abas gerenciadas automaticamente
Quando um `POST` é recebido, o script garante as abas:
1. `Desaparecidos`
2. `Listas`
3. `Relatorio_Diario`
4. `Painel`
5. `Ocorrencias_Relevancia`
6. `Config`

Além do cabeçalho da linha 1, o script também semeia dados iniciais em:
- `Listas` (listas padronizadas);
- `Painel` (indicadores-base);
- `Config` (metadados de versão/estrutura).

## Configuração de Script Properties
Defina no projeto Apps Script:
- `CABINE_VERDE_SPREADSHEET_ID` (obrigatório)
- `CABINE_VERDE_SHEET_NAME` (opcional, padrão `Desaparecidos`)

## Deploy obrigatório após sincronizar arquivos
Sempre que atualizar os arquivos `.gs` no Apps Script real, publique uma nova versão da Web App:

```text
Deploy > Manage deployments > Edit > New version > Deploy
```

Se esse passo não for executado, a URL pública pode permanecer em versão anterior e retornar erro de `doGet` ausente.

## Checklist operacional de validação
1. Abrir o endpoint no navegador.
2. Confirmar retorno JSON de healthcheck (`ok: true` e `message: "Endpoint ativo"`).
3. Executar `POST` com `MockPayload.json`.
4. Confirmar nova linha na aba `Desaparecidos`.

## Testes rápidos
### Healthcheck
```bash
curl 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec'
```

### Gravação
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec' \
  -H 'Content-Type: application/json' \
  --data @MockPayload.json
```


## URL oficial do frontend
- Produção: `https://myflowlife.com.br/cabineverde/`
- `https://myflowlife.com.br/public/index.html` não deve ser tratado como URL oficial do Cabine Verde.
