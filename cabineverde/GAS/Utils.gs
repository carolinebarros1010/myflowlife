/**
 * Utilitários compartilhados do Apps Script.
 */

function parseJsonSeguro(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Body JSON inválido na requisição.');
  }
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
