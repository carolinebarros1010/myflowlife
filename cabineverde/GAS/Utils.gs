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

function garantirAbaComCabecalho(planilha, nomeAba, cabecalho) {
  var sheet = planilha.getSheetByName(nomeAba);
  if (!sheet) {
    sheet = planilha.insertSheet(nomeAba);
  }

  var linha1 = sheet.getRange(1, 1, 1, cabecalho.length).getValues()[0];
  var precisaCabecalho = !linha1.some(function (c) { return limparTexto(c); });
  if (precisaCabecalho) {
    sheet.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
  }

  return sheet;
}

function garantirColunasDaEstrutura(sheet, colunasEsperadas) {
  var ultimaColuna = Math.max(sheet.getLastColumn(), 1);
  var cabecalhoAtual = sheet.getRange(1, 1, 1, ultimaColuna).getValues()[0].map(limparTexto);
  var colunasFaltantes = (colunasEsperadas || []).filter(function (coluna) {
    return cabecalhoAtual.indexOf(coluna) === -1;
  });

  if (colunasFaltantes.length) {
    sheet.getRange(1, ultimaColuna + 1, 1, colunasFaltantes.length).setValues([colunasFaltantes]);
    cabecalhoAtual = cabecalhoAtual.concat(colunasFaltantes);
  }

  return cabecalhoAtual.filter(Boolean);
}


function normalizarCamposFisicos_(dados) {
  var base = dados && typeof dados === 'object' ? dados : {};
  var permitidoPele = ['BRANCA', 'PARDA', 'PRETA', 'AMARELA', 'INDIGENA', 'NAO INFORMADO'];
  var permitidoCabelo = ['PRETO', 'CASTANHO', 'LOIRO', 'RUIVO', 'GRISALHO', 'NAO INFORMADO'];
  var permitidoOlhos = ['CASTANHO', 'PRETO', 'AZUL', 'VERDE', 'MEL', 'NAO INFORMADO'];

  function limparUpperSemAcento(valor) {
    var txt = limparTexto(valor)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return txt;
  }

  function normalizarLista(valor, permitidos) {
    var txt = limparUpperSemAcento(valor);
    return permitidos.indexOf(txt) !== -1 ? txt : 'NAO INFORMADO';
  }

  function normalizarNumero(valor, min, max) {
    var numero = Number(valor);
    if (!isFinite(numero)) return 0;
    var inteiro = Math.round(numero);
    if (inteiro < min || inteiro > max) return 0;
    return inteiro;
  }

  base.corPele = normalizarLista(base.corPele, permitidoPele);
  base.corCabelo = normalizarLista(base.corCabelo, permitidoCabelo);
  base.corOlhos = normalizarLista(base.corOlhos, permitidoOlhos);
  base.alturaAproximada = normalizarNumero(base.alturaAproximada, 30, 250);
  base.pesoAproximado = normalizarNumero(base.pesoAproximado, 1, 400);
  return base;
}
