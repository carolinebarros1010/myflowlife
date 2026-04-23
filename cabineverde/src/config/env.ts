export const sheetsConfig = {
  endpoint: (globalThis as { CABINE_VERDE_SHEETS_ENDPOINT?: string }).CABINE_VERDE_SHEETS_ENDPOINT || '',
  apiKey: (globalThis as { CABINE_VERDE_SHEETS_API_KEY?: string }).CABINE_VERDE_SHEETS_API_KEY || '',
  spreadsheetId: (globalThis as { CABINE_VERDE_SPREADSHEET_ID?: string }).CABINE_VERDE_SPREADSHEET_ID || ''
};
