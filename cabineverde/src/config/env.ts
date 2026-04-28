const ENDPOINT_OFICIAL_APPS_SCRIPT =
  'https://script.google.com/macros/s/AKfycbyWmW1-MNFprc83mtns2FrQCL2x-k5rckwUDI2p6d0L4dzVYxLLQRg4cyB28JLG_501zw/exec';

const runtimeConfig = globalThis as {
  CABINE_VERDE_SPREADSHEET_ID?: string;
};

export const sheetsConfig = {
  endpoint: ENDPOINT_OFICIAL_APPS_SCRIPT,
  spreadsheetId: runtimeConfig.CABINE_VERDE_SPREADSHEET_ID || ''
};

export { ENDPOINT_OFICIAL_APPS_SCRIPT };
