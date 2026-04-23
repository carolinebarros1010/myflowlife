const runtimeConfig = globalThis as {
  CABINE_VERDE_SHEETS_ENDPOINT?: string;
  CABINE_VERDE_SPREADSHEET_ID?: string;
};

export const sheetsConfig = {
  endpoint:
    runtimeConfig.CABINE_VERDE_SHEETS_ENDPOINT ||
    'https://script.google.com/macros/s/AKfycby0K8dr5dvHAK_graS1qoYq_r4n0116w7VHup3MDk_3TNkfUB_9T-x1kL_a-EKhqtmDdQ/exec',
  spreadsheetId: runtimeConfig.CABINE_VERDE_SPREADSHEET_ID || ''
};
