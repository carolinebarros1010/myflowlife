/**
 * Cabine Verde - Endpoint Web App (Google Apps Script)
 *
 * Propriedades esperadas:
 * - CABINE_VERDE_SPREADSHEET_ID: ID da planilha de destino
 * - CABINE_VERDE_SHEET_NAME (opcional): nome da aba (default: Desaparecidos)
 */

function doGet() {
  return criarRespostaJson({
    ok: true,
    service: 'cabineverde',
    message: 'Endpoint ativo',
    versao: '1.0.0',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    var body = parseJsonSeguro(e);
    var planilhaId = obterSpreadsheetId(body);
    var nomeAba = obterNomeAba(body);
    var planilha = SpreadsheetApp.openById(planilhaId);
    var aba = planilha.getSheetByName(nomeAba);

    if (!aba) {
      throw new Error('Aba "' + nomeAba + '" não encontrada na planilha.');
    }

    var payload = body && body.payload && typeof body.payload === 'object' ? body.payload : {};
    var linha = mapearPayloadParaLinhaDesaparecidos(payload);

    aba.appendRow(linha);
    var numeroLinha = aba.getLastRow();

    return criarRespostaJson({
      ok: true,
      service: 'cabineverde',
      message: 'Caso salvo com sucesso',
      aba: nomeAba,
      linha: numeroLinha,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return criarRespostaJson(
      {
        ok: false,
        service: 'cabineverde',
        message: 'Falha ao salvar caso na planilha',
        erro: error && error.message ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      400
    );
  }
}

function obterSpreadsheetId(body) {
  var valorBody = body && body.spreadsheetId ? limparTexto(body.spreadsheetId) : '';
  var valorProperties = limparTexto(
    PropertiesService.getScriptProperties().getProperty('CABINE_VERDE_SPREADSHEET_ID')
  );
  var spreadsheetId = valorBody || valorProperties;

  if (!spreadsheetId) {
    throw new Error('CABINE_VERDE_SPREADSHEET_ID não configurado no body ou Script Properties.');
  }

  return spreadsheetId;
}

function obterNomeAba(body) {
  var nomeAbaBody = body && (body.aba || body.sheetName) ? String(body.aba || body.sheetName) : '';
  var nomeAbaConfig = PropertiesService.getScriptProperties().getProperty('CABINE_VERDE_SHEET_NAME');
  var nomeAba = limparTexto(nomeAbaBody) || limparTexto(nomeAbaConfig) || ABA_DESAPARECIDOS;

  return nomeAba;
}
