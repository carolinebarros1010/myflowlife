/**
 * Cabine Verde - Web App para integração com Google Sheets.
 *
 * Configure Script Properties:
 * - CABINE_VERDE_SPREADSHEET_ID
 * - CABINE_VERDE_SHEET_NAME (opcional, default: Desaparecidos)
 */

const DEFAULT_SHEET_NAME = 'Desaparecidos';
const DEFAULT_COLUMNS = [
  'dataHoraRegistro',
  'municipio',
  'talaoBopm',
  'nomeCompletoDesaparecido',
  'sexoGenero',
  'idade',
  'faixaEtaria',
  'cpf',
  'rg',
  'nomeMae',
  'dataNascimento',
  'fotoDisponivel',
  'linkFoto',
  'telefoneDesaparecido',
  'dispositivoLigado',
  'dataHoraUltimaVisualizacao',
  'localUltimaVisualizacao',
  'roupaUltimaVisualizacao',
  'meioTransporte',
  'dadosVeiculo',
  'nomeSolicitante',
  'vinculoSolicitante',
  'telefoneSolicitante',
  'vulnerabilidade',
  'condicaoMentalCognitivaComportamental',
  'limitacaoFisica',
  'usoMedicacaoEssencial',
  'usoAlcoolOutrasDrogas',
  'historicoDesaparecimentoAnterior',
  'conflitoPrevio',
  'suspeitaCrime',
  'locaisHabituais',
  'buscasPreliminares',
  'camerasResidencia',
  'camerasUltimoLocal',
  'classificacaoRisco',
  'prioridade',
  'acaoSugerida',
  'aptoCabineVerde',
  'observacoesOperacionais',
  'statusCaso'
];

function doGet() {
  return toJsonOutput({
    ok: true,
    service: 'cabineverde',
    message: 'Endpoint ativo'
  });
}

function doPost(e) {
  try {
    const body = parseRequestBody(e);
    const spreadsheetId =
      body.spreadsheetId ||
      PropertiesService.getScriptProperties().getProperty('CABINE_VERDE_SPREADSHEET_ID');

    if (!spreadsheetId) {
      throw new Error('CABINE_VERDE_SPREADSHEET_ID não configurado.');
    }

    const sheetName =
      body.aba ||
      body.sheetName ||
      PropertiesService.getScriptProperties().getProperty('CABINE_VERDE_SHEET_NAME') ||
      DEFAULT_SHEET_NAME;

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`Aba "${sheetName}" não encontrada na planilha.`);
    }

    const colunas = Array.isArray(body.colunas) && body.colunas.length ? body.colunas : DEFAULT_COLUMNS;
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    const linha = mapColumnsToRow(colunas, payload);

    sheet.appendRow(linha);

    return toJsonOutput({
      ok: true,
      service: 'cabineverde',
      message: 'Caso salvo com sucesso',
      sheet: sheetName,
      row: sheet.getLastRow()
    });
  } catch (error) {
    return toJsonOutput({
      ok: false,
      service: 'cabineverde',
      message: 'Falha ao salvar',
      error: error && error.message ? error.message : String(error)
    });
  }
}

function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (parseError) {
    throw new Error('JSON inválido no corpo da requisição.');
  }
}

function mapColumnsToRow(columns, payload) {
  return columns.map(function (column) {
    const value = payload[column];
    return value === undefined || value === null ? '' : value;
  });
}

function toJsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
