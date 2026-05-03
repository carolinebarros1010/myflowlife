/**
 * Utilitários compartilhados do Apps Script.
 */


function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

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

  if (!corpo.build && typeof CABINE_VERDE_BUILD !== 'undefined') {
    corpo.build = CABINE_VERDE_BUILD;
  }

  // Apps Script não permite definir status HTTP no ContentService em Web App.
  // statusCode foi mantido para facilitar evolução futura e rastreabilidade.
  corpo.httpStatus = statusCode || corpo.httpStatus || 200;

  return jsonResponse_(corpo);
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



function obterSchemaCabineVerde_() {
  return obterSchemaCabineVerdeUnificado_();
}

function obterSpreadsheetCabineVerde_() {
  if (typeof CABINE_VERDE_SPREADSHEET_ID !== 'undefined' && CABINE_VERDE_SPREADSHEET_ID) {
    return SpreadsheetApp.openById(CABINE_VERDE_SPREADSHEET_ID);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('Nenhuma planilha ativa encontrada e CABINE_VERDE_SPREADSHEET_ID não definido.');
  }
  return ss;
}

function normalizarCabecalho_(valor) {
  return String(valor || '').trim().toLowerCase();
}

function registrarLogEstrutura_(evento, mensagem, nomeAba, coluna) {
  try {
    var ss = obterSpreadsheetCabineVerde_();
    var abaLogs = ss.getSheetByName('LOGS');

    if (!abaLogs) {
      abaLogs = ss.insertSheet('LOGS');
      var schema = obterSchemaCabineVerde_();
      abaLogs.getRange(1, 1, 1, schema.LOGS.length).setValues([schema.LOGS]);
    }

    abaLogs.appendRow([
      new Date(),
      evento,
      'ESTRUTURA_PLANILHA',
      mensagem,
      '',
      '',
      '',
      '',
      '',
      coluna ? 'Aba: ' + nomeAba + ' | Coluna: ' + coluna : 'Aba: ' + nomeAba,
      'garantirEstruturaCabineVerde_'
    ]);
  } catch (erro) {
    Logger.log('Falha ao registrar log de estrutura: ' + erro.message);
  }
}

function garantirAbaComCabecalhos_(ss, nomeAba, colunasObrigatorias) {
  if (!ss || typeof ss.getSheetByName !== 'function') {
    throw new Error('Spreadsheet inválido ou não informado para aba: ' + nomeAba);
  }
  if (!nomeAba) {
    throw new Error('Nome da aba não informado.');
  }
  if (!Array.isArray(colunasObrigatorias)) {
    Logger.log("ERRO_COLUNAS_INVALIDAS_DEBUG: " + JSON.stringify({
      nomeAba: nomeAba,
      tipoColunas: typeof colunasObrigatorias,
      isArray: Array.isArray(colunasObrigatorias),
      length: Array.isArray(colunasObrigatorias) ? colunasObrigatorias.length : null,
      stack: new Error().stack
    }));
    throw new Error('Colunas obrigatórias inválidas para aba: ' + nomeAba);
  }

  var aba = ss.getSheetByName(nomeAba);
  if (!aba) {
    aba = ss.insertSheet(nomeAba);
    aba.getRange(1, 1, 1, colunasObrigatorias.length).setValues([colunasObrigatorias]);
    registrarLogEstrutura_('ABA_CRIADA', 'Aba criada automaticamente', nomeAba, '');
    return aba;
  }

  var ultimaColuna = aba.getLastColumn();
  if (ultimaColuna === 0) {
    aba.getRange(1, 1, 1, colunasObrigatorias.length).setValues([colunasObrigatorias]);
    registrarLogEstrutura_('CABECALHO_CRIADO', 'Cabeçalho criado em aba vazia', nomeAba, '');
    return aba;
  }

  var cabecalhoAtual = aba.getRange(1, 1, 1, ultimaColuna).getValues()[0];
  var normalizados = cabecalhoAtual.map(normalizarCabecalho_);
  colunasObrigatorias.forEach(function (coluna) {
    var colunaNormalizada = normalizarCabecalho_(coluna);
    if (normalizados.indexOf(colunaNormalizada) === -1) {
      var novaColuna = aba.getLastColumn() + 1;
      aba.getRange(1, novaColuna).setValue(coluna);
      normalizados.push(colunaNormalizada);
      registrarLogEstrutura_('COLUNA_ADICIONADA', 'Coluna obrigatória adicionada', nomeAba, coluna);
    }
  });
  return aba;
}

function garantirEstruturaCabineVerde_() {
  var schema = obterSchemaCabineVerde_();
  var ss = obterSpreadsheetCabineVerde_();
  Logger.log('DEBUG_FLUXO_SALVARCASO: garantirEstruturaCabineVerde_ schema=' + JSON.stringify({
    abas: Object.keys(schema || {}),
    casosArray: Array.isArray(schema && schema.CASOS),
    casosLength: Array.isArray(schema && schema.CASOS) ? schema.CASOS.length : null
  }));
  Object.keys(schema).forEach(function (nomeAba) {
    garantirAbaComCabecalhos_(ss, nomeAba, schema[nomeAba]);
  });
  return {
    ok: true,
    mensagem: 'Estrutura da Cabine Verde verificada/criada com sucesso.',
    abas: Object.keys(schema)
  };
}

function garantirAbaComCabecalho(ss, nomeAba, colunasObrigatorias) {
  Logger.log('DEBUG_FLUXO_SALVARCASO: garantirAbaComCabecalho ' + JSON.stringify({
    nomeAba: nomeAba,
    isArray: Array.isArray(colunasObrigatorias),
    length: Array.isArray(colunasObrigatorias) ? colunasObrigatorias.length : null
  }));
  return garantirAbaComCabecalhos_(ss, nomeAba, colunasObrigatorias);
}

function garantirColunasDaEstrutura(aba, colunasObrigatorias) {
  if (!aba || typeof aba.getParent !== 'function') {
    throw new Error('Sheet inválido em garantirColunasDaEstrutura.');
  }

  var ss = aba.getParent();
  var nomeAba = aba.getName();
  garantirAbaComCabecalhos_(ss, nomeAba, colunasObrigatorias);

  var ultimaColuna = Math.max(aba.getLastColumn(), 1);
  return aba.getRange(1, 1, 1, ultimaColuna).getValues()[0].map(limparTexto).filter(Boolean);
}

function testarGarantirEstruturaCabineVerde() {
  var resultado = garantirEstruturaCabineVerde_();
  Logger.log(JSON.stringify(resultado));
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

function auditarEstruturaCabineVerde_() {
  garantirEstruturaCabineVerde_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var relatorio = { abas: [], colunasFaltantes: {}, logsEstrutura: [] };
  Object.keys(obterSchemaCabineVerde_()).forEach(function (nomeAba) {
    var aba = ss.getSheetByName(nomeAba);
    var cab = aba ? aba.getRange(1, 1, 1, Math.max(aba.getLastColumn(), 1)).getValues()[0].map(limparTexto) : [];
    var faltantes = obterSchemaCabineVerde_()[nomeAba].filter(function (col) {
      return cab.map(normalizarCabecalho_).indexOf(normalizarCabecalho_(col)) === -1;
    });
    relatorio.abas.push(nomeAba);
    relatorio.colunasFaltantes[nomeAba] = faltantes;
  });
  var abaLogs = ss.getSheetByName('LOGS');
  if (abaLogs && abaLogs.getLastRow() > 1) {
    relatorio.logsEstrutura = abaLogs.getRange(Math.max(2, abaLogs.getLastRow() - 20), 1, Math.min(20, abaLogs.getLastRow() - 1), abaLogs.getLastColumn()).getValues();
  }
  return relatorio;
}
