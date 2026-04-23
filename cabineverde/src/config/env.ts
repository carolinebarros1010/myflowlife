const runtimeConfig = globalThis as {
  CABINE_VERDE_SHEETS_ENDPOINT?: string;
  CABINE_VERDE_SPREADSHEET_ID?: string;
};

export const sheetsConfig = {
  endpoint:
    runtimeConfig.CABINE_VERDE_SHEETS_ENDPOINT ||
    'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec',
  spreadsheetId: runtimeConfig.CABINE_VERDE_SPREADSHEET_ID || ''
};
