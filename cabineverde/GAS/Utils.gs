/**
 * Utilitários compartilhados do Apps Script.
 */

function parsePayload(e) {
  var rawPostData = extrairRawPostData(e);

  if (rawPostData) {
    var parsedRaw = tentarParseJson(rawPostData);
    if (parsedRaw) {
      return parsedRaw;
    }
  }

  var payloadParametro =
    e && e.parameter && typeof e.parameter.payload === 'string' ? e.parameter.payload : '';
  if (payloadParametro) {
    var parsedParametro = tentarParseJson(payloadParametro);
    if (parsedParametro) {
      return parsedParametro;
    }
  }

  var payloadParametros =
    e && e.parameters && e.parameters.payload && e.parameters.payload[0]
      ? e.parameters.payload[0]
      : '';
  if (payloadParametros) {
    var parsedParametros = tentarParseJson(payloadParametros);
    if (parsedParametros) {
      return parsedParametros;
    }
  }

  throw new Error('Payload ausente ou inválido. Verifique body JSON ou campo payload.');
}

function tentarParseJson(texto) {
  if (!texto) {
    return null;
  }

  try {
    var parsed = JSON.parse(texto);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function extrairRawPostData(e) {
  if (e && e.postData && typeof e.postData.contents === 'string') {
    return e.postData.contents;
  }

  return '';
}

function extrairIdCasoBruto(e) {
  try {
    var body = parsePayload(e);
    var payload = body && body.payload && typeof body.payload === 'object' ? body.payload : body;
    return limparTexto(payload && payload.idCaso);
  } catch (error) {
    return '';
  }
}

function obterPlanilhaLogs() {
  try {
    var planilhaId = limparTexto(
      PropertiesService.getScriptProperties().getProperty('CABINE_VERDE_SPREADSHEET_ID')
    );
    if (!planilhaId) {
      return null;
    }

    return SpreadsheetApp.openById(planilhaId);
  } catch (error) {
    return null;
  }
}

function registrarLogTecnico(planilha, entrada) {
  if (!planilha) {
    return;
  }

  var abaLogs = garantirAbaComCabecalho(planilha, 'Logs_GAS', ESTRUTURA_PLANILHA.Logs_GAS);
  abaLogs.appendRow([
    formatarDataHora(new Date()),
    limparTexto(entrada && entrada.etapa),
    entrada && entrada.ok ? 'Sim' : 'Não',
    limparTexto(entrada && entrada.mensagem),
    limparTexto(entrada && entrada.rawPostData),
    limparTexto(entrada && entrada.payloadIdCaso)
  ]);
}

function normalizarValorPlanilha(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }

  if (typeof valor === 'boolean') {
    return valor ? 'Sim' : 'Não';
  }

  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    return formatarDataHora(valor);
  }

  if (Array.isArray(valor)) {
    return valor.map(function (item) {
      return limparTexto(item);
    }).filter(Boolean).join(', ');
  }

  if (typeof valor === 'object') {
    return JSON.stringify(valor);
  }

  return limparTexto(valor);
}

function criarRespostaJson(dados, statusCode) {
  var corpo = dados && typeof dados === 'object' ? dados : { ok: false, message: 'Resposta inválida' };

  // Apps Script não permite definir status HTTP no ContentService em Web App.
  // statusCode foi mantido para facilitar evolução futura e rastreabilidade.
  corpo.httpStatus = statusCode || 200;

  return ContentService
    .createTextOutput(JSON.stringify(corpo))
    .setMimeType(ContentService.MimeType.JSON);
}

function limparTexto(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor).trim();
}

function formatarDataHora(data) {
  var timezone = Session.getScriptTimeZone() || 'America/Sao_Paulo';
  return Utilities.formatDate(data, timezone, 'yyyy-MM-dd HH:mm:ss');
}
