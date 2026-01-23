/* ========================================================================
   FEMFLOW — 09_HTTP_ENDPOINT.gs
   ------------------------------------------------------------------------
   Responsabilidade ÚNICA:
   - Interface HTTP (GET / POST)
   - Montagem de pedido externo
   - Retorno JSON
   ------------------------------------------------------------------------
   ⚠️ NÃO contém lógica de treino
   ⚠️ NÃO contém planner
   ⚠️ NÃO contém resolver
   ======================================================================== */


/* ================================
 *  GET ENDPOINT
 * ================================ */
function doGet(e) {
  try {
    const p = e?.parameter || {};
    const action = String(p.action || '').toLowerCase();

    // Ping / status
    if (!action) {
      return respostaGet_({
        status: 'online',
        acoes: ['gerarbase', 'distribuir30', 'serieespecial', 'gerar30', 'linkar', 'importar', 'full']
      });
    }

    const pedidoTexto = montarPedidoFromGet_(p);
    let result;

    switch (action) {

      case 'gerar30':
        result = gerarFemFlow30Dias(pedidoTexto);
        return respostaGet_({ action, result });

      case 'gerarbase':
        result = gerarBaseOvulatoriaSomente_(pedidoTexto);
        return respostaGet_({ action, result });

      case 'distribuir30':
        result = distribuirBaseOvulatoriaSomente_(pedidoTexto);
        return respostaGet_({ action, result });

      case 'serieespecial':
        result = aplicarSerieEspecialBaseOvulatoria_(p);
        return respostaGet_({ action, result });

      case 'linkar':
        if (!p.destino) throw new Error('destino obrigatório');
        result = relinkarAba_(p.destino, p.nivel);
        return respostaGet_({ action, result });

      case 'importar':
        if (!p.destino) throw new Error('destino obrigatório');
        result = importarTreinosFEMFLOW_aba(p.destino);
        return respostaGet_({ action, result });

      case 'full':
        gerarFemFlow30Dias(pedidoTexto);
        relinkarAba_(p.destino, p.nivel);
        importarTreinosFEMFLOW_aba(p.destino);
        return respostaGet_({
          action,
          result: 'Pipeline completo executado: ' + p.destino
        });

      default:
        throw new Error('action inválida');
    }

  } catch (err) {
    return respostaErroGet_(err);
  }
}


/* ================================
 *  POST ENDPOINT
 * ================================ */
function doPost(e) {
  try {
    const body = parsePostBody_(e);
    const action = String(body.action || e?.parameter?.action || '').toLowerCase();
    let result;

    switch (action) {

      case 'gerar30':
        result = gerarFemFlow30Dias(body.pedidoTexto);
        return jsonOK_({ step: 'gerar30', result });

      case 'gerarbase':
        result = gerarBaseOvulatoriaSomente_(body.pedidoTexto);
        return jsonOK_({ step: 'gerarbase', result });

      case 'distribuir30':
        result = distribuirBaseOvulatoriaSomente_(body.pedidoTexto);
        return jsonOK_({ step: 'distribuir30', result });

      case 'serieespecial':
        result = aplicarSerieEspecialBaseOvulatoria_(body);
        return jsonOK_({ step: 'serieespecial', result });

      case 'linkar':
        if (!body.destino) throw new Error('destino obrigatório');
        result = relinkarAba_(body.destino, body.nivel);
        return jsonOK_({ step: 'linkar', result });

      case 'importar':
        if (!body.destino) throw new Error('destino obrigatório');
        result = importarTreinosFEMFLOW_aba(body.destino);
        return jsonOK_({ step: 'importar', result });

      case 'login':
        result = autenticarPersonal_(body);
        return jsonOK_({ step: 'login', user: result });

      case 'signup':
        result = cadastrarPersonal_(body);
        return jsonOK_({ step: 'signup', user: result });

      case 'full':
        gerarFemFlow30Dias(body.pedidoTexto);
        relinkarAba_(body.destino, body.nivel);
        importarTreinosFEMFLOW_aba(body.destino);
        return jsonOK_({
          step: 'full',
          result: 'Pipeline completo executado'
        });

      default:
        throw new Error('action inválida');
    }

  } catch (err) {
    return jsonERR_(err);
  }
}

function parsePostBody_(e) {
  const raw = e?.postData?.contents;
  if (!raw) return e?.parameter ? { ...e.parameter } : {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    return parseQueryString_(raw, e?.parameter);
  }
}

function parseQueryString_(raw, fallback) {
  const output = {};
  String(raw || '')
    .split('&')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [key, value] = part.split('=');
      if (!key) return;
      const decodedKey = decodeURIComponent(key);
      const decodedValue = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
      output[decodedKey] = decodedValue;
    });
  return Object.keys(output).length ? output : (fallback ? { ...fallback } : {});
}


/* ================================
 *  HELPERS HTTP
 * ================================ */

/**
 * Monta texto de pedido a partir de parâmetros GET
 */
function montarPedidoFromGet_(p) {
  const linhas = [];

  linhas.push('Gerar 30 dias FemFlow');

  if (p.nivel) linhas.push(`nivel: ${p.nivel}`);
  if (p.enfase) linhas.push(`enfase: ${p.enfase}`);
  if (p.fase) linhas.push(`fase inicial: ${p.fase}`);
  if (p.padraoCiclo) linhas.push(`padrao_ciclo: ${p.padraoCiclo}`);
  if (p.destino) linhas.push(`destino: ${p.destino}`);
  if (p.id_aluna) linhas.push(`id_aluna: ${p.id_aluna}`);

  linhas.push('formato: CSV');

  return linhas.join('\n');
}


/**
 * Resposta GET OK
 */
function respostaGet_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...obj }, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Resposta GET com erro
 */
function respostaErroGet_(err) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      erro: String(err)
    }, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Resposta POST OK
 */
function jsonOK_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...obj }))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * Resposta POST erro
 */
function jsonERR_(err) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      error: String(err)
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
