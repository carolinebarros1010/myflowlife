# GAS Workspace - Cabine Verde

Esta pasta (`cabineverde/GAS/`) é a área de trabalho versionada do **Google Apps Script** responsável pela integração entre o frontend da Cabine Verde e a aba **Desaparecidos** no Google Sheets.

## Objetivo

Centralizar o código do Apps Script para:
- versionar e revisar alterações do endpoint;
- manter o mapeamento da aba `Desaparecidos` desacoplado;
- facilitar publicação e manutenção do Web App;
- preparar evolução futura para novas abas e relatórios.

## Estrutura

- `Code.gs`: entrada do Web App (`doGet` e `doPost`) e orquestração da escrita na planilha.
- `SheetsMapping.gs`: colunas da aba `Desaparecidos` + transformação de payload em linha.
- `Utils.gs`: parse seguro, normalização de valores e resposta JSON padrão.
- `appsscript.json`: manifesto mínimo para runtime V8.
- `MockPayload.json`: exemplo realista de payload enviado pelo frontend.

## Como publicar no Google Apps Script

1. Acesse [script.google.com](https://script.google.com) e crie um projeto em branco.
2. Copie os arquivos `.gs` deste diretório para o projeto (mantendo nomes e separação).
3. Substitua o conteúdo do manifesto com o `appsscript.json` desta pasta.
4. Em **Project Settings > Script properties**, adicione:
   - `CABINE_VERDE_SPREADSHEET_ID` = ID da planilha alvo;
   - `CABINE_VERDE_SHEET_NAME` = `Desaparecidos` (opcional).
5. Faça deploy em **Deploy > New deployment > Web app**:
   - **Execute as**: Me
   - **Who has access**: Anyone with the link (ou regra interna da operação)
6. Copie a URL `/exec` e configure no frontend como endpoint.

## Como configurar o ID da planilha

Opções aceitas pelo endpoint:

1. **Script Properties** (recomendado):
   - `CABINE_VERDE_SPREADSHEET_ID` configurado uma vez no projeto Apps Script.
2. **Body da requisição**:
   - Enviar `spreadsheetId` no JSON do `POST`.

Se ambos existirem, o valor enviado no body tem prioridade.

## Testar o `doGet` (healthcheck)

```bash
curl 'https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec'
```

Resposta esperada (exemplo):

```json
{
  "ok": true,
  "service": "cabineverde",
  "message": "Endpoint ativo"
}
```

## Testar o `doPost`

1. Use o `MockPayload.json` como base.
2. Execute:

```bash
curl -X POST 'https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec' \
  -H 'Content-Type: application/json' \
  --data @MockPayload.json
```

Resposta esperada (exemplo):

```json
{
  "ok": true,
  "service": "cabineverde",
  "message": "Caso salvo com sucesso",
  "aba": "Desaparecidos",
  "linha": 42
}
```

## Conexão com a aba `Desaparecidos`

- A escrita é feita em `appendRow`.
- A ordem dos campos é definida por `COLUNAS_DESAPARECIDOS` em `SheetsMapping.gs`.
- Para manter compatibilidade operacional, preserve a mesma sequência usada pelo frontend em `src/utils/sheetsPayload.ts`.

## Evolução futura recomendada

- Criar `SheetsMappingRelatorios.gs` para novas abas operacionais.
- Adicionar validações por tipo de campo antes do `appendRow`.
- Implementar chave de autenticação simples via header/token.
- Preparar logs de auditoria para erros de integração.
- Automatizar sync com `clasp` para fluxo local/CI.
