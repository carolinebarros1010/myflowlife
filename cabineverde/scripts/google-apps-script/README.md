# Google Apps Script - Cabine Verde

Este diretório contém o script pronto para publicar o endpoint da integração com Google Sheets.

## Arquivo
- `Code.gs`: implementação com `doGet()` (healthcheck) e `doPost(e)` (gravação em `Desaparecidos`).

## Configuração rápida
1. Criar projeto no Google Apps Script.
2. Colar `Code.gs`.
3. Em **Project Settings > Script Properties**, definir:
   - `CABINE_VERDE_SPREADSHEET_ID` (obrigatório)
   - `CABINE_VERDE_SHEET_NAME` (opcional, padrão `Desaparecidos`)
4. Publicar como **Web app** (URL `/exec`).

## Testes
### GET (healthcheck)
```bash
curl 'https://script.google.com/macros/s/.../exec'
```

### POST (gravação)
```bash
curl -X POST 'https://script.google.com/macros/s/.../exec' \
  -H 'Content-Type: application/json' \
  -d '{"aba":"Desaparecidos","payload":{"nomeCompletoDesaparecido":"Teste","idade":12}}'
```

Veja documentação completa em `../../docs/integracao-sheets.md`.
