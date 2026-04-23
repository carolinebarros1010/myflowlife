# GAS Workspace - Cabine Verde

Esta pasta (`cabineverde/GAS/`) é a área versionada do Google Apps Script usada pela integração do Cabine Verde com Google Sheets.

## Endpoint principal publicado
`https://script.google.com/macros/s/AKfycby0K8dr5dvHAK_graS1qoYq_r4n0116w7VHup3MDk_3TNkfUB_9T-x1kL_a-EKhqtmDdQ/exec`

- `GET`: healthcheck simples do serviço.
- `POST`: grava casos em `Desaparecidos` e garante estrutura operacional das abas.

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

## Testes rápidos
### Healthcheck
```bash
curl 'https://script.google.com/macros/s/AKfycby0K8dr5dvHAK_graS1qoYq_r4n0116w7VHup3MDk_3TNkfUB_9T-x1kL_a-EKhqtmDdQ/exec'
```

### Gravação
```bash
curl -X POST 'https://script.google.com/macros/s/AKfycby0K8dr5dvHAK_graS1qoYq_r4n0116w7VHup3MDk_3TNkfUB_9T-x1kL_a-EKhqtmDdQ/exec' \
  -H 'Content-Type: application/json' \
  --data @MockPayload.json
```
