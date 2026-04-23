# Integração Google Sheets

## Objetivo
Registrar cada caso na aba `Desaparecidos` com mapeamento estável.

## Arquivos-chave
- `src/config/env.ts`: ponto único de configuração.
- `src/services/sheetsService.ts`: serviço desacoplado de envio.
- `src/utils/sheetsPayload.ts`: mapeamento dos campos para a planilha.

## Passos sugeridos
1. Publicar endpoint HTTP (Apps Script Web App ou API intermediária).
2. Configurar:
   - `CABINE_VERDE_SHEETS_ENDPOINT`
   - `CABINE_VERDE_SPREADSHEET_ID`
   - `CABINE_VERDE_SHEETS_API_KEY` (se exigido)
3. Validar ordem das colunas da aba `Desaparecidos`.
4. Testar envio real e registrar retorno de erro/sucesso para auditoria.

## Expansão prevista
Abas futuras já contempladas no contrato:
- `Listas`
- `Relatorio`
- `Painel`
