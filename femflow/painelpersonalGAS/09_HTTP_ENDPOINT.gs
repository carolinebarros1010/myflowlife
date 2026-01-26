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
    const p = (e && e.parameter) ? e.parameter : {};
    const action = String(p.action || '').toLowerCase().trim();

    // ✅ novo: target/app (default femflow)
    const target = String(p.app || p.target || 'femflow').toLowerCase().trim();

    // Ping / status
    if (!action) {
      return respostaGet_({
        status: 'online',
        acoes: ['gerarbase', 'distribuir30', 'serieespecial', 'gerar30', 'linkar', 'importar', 'full'],
        target_default: 'femflow',
        target_received: target
      });
    }

    const pedidoTexto = montarPedidoFromGet_(p);
    let result;

    switch (action) {

      case 'gerar30':
        result = gerarFemFlow30Dias(pedidoTexto);
        return respostaGet_({ action, target, result });

      case 'gerarbase':
        result = gerarBaseOvulatoriaSomente_(pedidoTexto);
        return respostaGet_({ action, target, result });

      case 'distribuir30':
        result = distribuirBaseOvulatoriaSomente_(pedidoTexto);
        return respostaGet_({ action, target, result });

      case 'serieespecial':
        result = aplicarSerieEspecialBaseOvulatoria_(p);
        return respostaGet_({ action, target, result });

      case 'linkar':
        if (!p.destino) throw new Error('destino obrigatório');
        result = relinkarAba_(p.destino, p.nivel);
        return respostaGet_({ action, target, result });

      case 'importar':
        if (!p.destino) throw new Error('destino obrigatório');
        result = importarTreinosFEMFLOW_aba(p.destino, { target }); // ✅ aqui
        return respostaGet_({ action, target, result });

      case 'full':
        if (!p.destino) throw new Error('destino obrigatório para pipeline full');
        gerarFemFlow30Dias(pedidoTexto);
        relinkarAba_(p.destino, p.nivel);
        importarTreinosFEMFLOW_aba(p.destino, { target }); // ✅ aqui
        return respostaGet_({
          action,
          target,
          result: 'Pipeline completo executado: ' + p.destino
        });

      default:
        throw new Error('action inválida: ' + action);
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
    const merged = mergePostParams_(e);

    // resolve action de forma robusta (body vence query)
    const action = String(
      merged.action ||
      merged.acao ||
      (e && e.parameter && e.parameter.action) ||
      ''
    ).toLowerCase().trim();

    // ✅ novo: target/app (default femflow) — body vence query
    const target = String(
      merged.app ||
      merged.target ||
      (e && e.parameter && (e.parameter.app || e.parameter.target)) ||
      'femflow'
    ).toLowerCase().trim();

    // DEBUG controlado (se action vier vazio, devolve diagnóstico em vez de "action inválida")
    if (!action) {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: false,
          error: 'action ausente no POST (body/query).',
          target_received: target,
          debug: {
            parameter: e && e.parameter ? e.parameter : null,
            raw: e && e.postData ? e.postData.contents : null,
            mergedKeys: Object.keys(merged || {})
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let result;

    switch (action) {
      case 'gerar30':
        result = gerarFemFlow30Dias(merged.pedidoTexto);
        return jsonOK_({ step: 'gerar30', target, result });

      case 'gerarbase':
        result = gerarBaseOvulatoriaSomente_(merged.pedidoTexto);
        return jsonOK_({ step: 'gerarbase', target, result });

      case 'distribuir30':
        result = distribuirBaseOvulatoriaSomente_(merged.pedidoTexto);
        return jsonOK_({ step: 'distribuir30', target, result });

      case 'serieespecial':
        result = aplicarSerieEspecialBaseOvulatoria_(merged);
        return jsonOK_({ step: 'serieespecial', target, result });

      case 'linkar':
        if (!merged.destino) throw new Error('destino obrigatório');
        result = relinkarAba_(merged.destino, merged.nivel);
        return jsonOK_({ step: 'linkar', target, result });

      case 'importar':
        if (!merged.destino) throw new Error('destino obrigatório');
        result = importarTreinosFEMFLOW_aba(merged.destino, { target }); // ✅ aqui
        return jsonOK_({ step: 'importar', target, result });

      case 'login':
        result = autenticarPersonal_(merged);
        return jsonOK_({ step: 'login', target, user: result });

      case 'signup':
        result = cadastrarPersonal_(merged);
        return jsonOK_({ step: 'signup', target, user: result });

      case 'full':
        if (!merged.destino) throw new Error('destino obrigatório para pipeline full');
        gerarFemFlow30Dias(merged.pedidoTexto);
        relinkarAba_(merged.destino, merged.nivel);
        importarTreinosFEMFLOW_aba(merged.destino, { target }); // ✅ aqui
        return jsonOK_({ step: 'full', target, result: 'Pipeline completo executado' });

      default:
        throw new Error('action inválida: ' + action);
    }

  } catch (err) {
    return jsonERR_(err);
  }
}



/* ================================
 *  PARSE / MERGE POST
 * ================================ */
function mergePostParams_(e) {
  const query = (e && e.parameter) ? { ...e.parameter } : {};
  const body = parsePostBodyOnly_(e);

  // body vence query (e mantém action mesmo que venha nos dois)
  return { ...query, ...body };
}

function parsePostBodyOnly_(e) {
  const raw = (e && e.postData && e.postData.contents != null)
    ? String(e.postData.contents).trim()
    : '';

  if (!raw) return {};

  // 1) JSON (principal)
  try {
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch (err) {
    // segue
  }

  // 2) Querystring no body (fallback)
  // Ex: action=signup&email=...&senha=...
  if (raw.includes('=') && raw.includes('&')) {
    return parseQueryString_(raw);
  }

  // 3) Se veio algo inesperado, devolve vazio (doPost vai acusar action ausente)
  return {};
}

function parseQueryString_(raw) {
  const output = {};
  String(raw || '')
    .split('&')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf('=');
      const key = idx >= 0 ? part.slice(0, idx) : part;
      const value = idx >= 0 ? part.slice(idx + 1) : '';
      if (!key) return;
      const decodedKey = decodeURIComponent(key);
      const decodedValue = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
      output[decodedKey] = decodedValue;
    });
  return output;
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

  if (p.nivel) linhas.push('nivel: ' + p.nivel);
  if (p.enfase) linhas.push('enfase: ' + p.enfase);
  if (p.fase) linhas.push('fase inicial: ' + p.fase);
  if (p.padraoCiclo) linhas.push('padrao_ciclo: ' + p.padraoCiclo);
  if (p.destino) linhas.push('destino: ' + p.destino);
  if (p.id_aluna) linhas.push('id_aluna: ' + p.id_aluna);

  // ✅ opcional: refletir target no pedido (não atrapalha)
  if (p.app || p.target) linhas.push('target: ' + String(p.app || p.target));

  linhas.push('formato: CSV');

  return linhas.join('\n');
}

function errToObj_(err) {
  const isObj = err && typeof err === 'object';
  return {
    message: isObj ? (err.message || String(err)) : String(err),
    name: isObj ? (err.name || 'Error') : 'Error',
    stack: isObj ? (err.stack || '') : ''
  };
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
  const e = errToObj_(err);
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      erro: e.message,
      error: e.message,
      message: e.message,
      name: e.name,
      stack: e.stack
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
  const msg = (err && err.message) ? err.message : String(err);
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      error: msg,
      erro: msg,
      message: msg,
      name: err && err.name ? err.name : 'Error',
      stack: err && err.stack ? err.stack : ''
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
      (e && e.parameter && e.parameter.action) ||
      ''
    ).toLowerCase().trim();

    // ✅ novo: target/app (default femflow) — body vence query
    const target = String(
      merged.app ||
      merged.target ||
      (e && e.parameter && (e.parameter.app || e.parameter.target)) ||
      'femflow'
    ).toLowerCase().trim();

    // DEBUG controlado (se action vier vazio, devolve diagnóstico em vez de "action inválida")
    if (!action) {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: false,
          error: 'action ausente no POST (body/query).',
          target_received: target,
          debug: {
            parameter: e && e.parameter ? e.parameter : null,
            raw: e && e.postData ? e.postData.contents : null,
            mergedKeys: Object.keys(merged || {})
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let result;

    switch (action) {
      case 'gerar30':
        result = gerarFemFlow30Dias(merged.pedidoTexto);
        return jsonOK_({ step: 'gerar30', target, result });

      case 'gerarbase':
        result = gerarBaseOvulatoriaSomente_(merged.pedidoTexto);
        return jsonOK_({ step: 'gerarbase', target, result });

      case 'distribuir30':
        result = distribuirBaseOvulatoriaSomente_(merged.pedidoTexto);
        return jsonOK_({ step: 'distribuir30', target, result });

      case 'serieespecial':
        result = aplicarSerieEspecialBaseOvulatoria_(merged);
        return jsonOK_({ step: 'serieespecial', target, result });

      case 'linkar':
        if (!merged.destino) throw new Error('destino obrigatório');
        result = relinkarAba_(merged.destino, merged.nivel);
        return jsonOK_({ step: 'linkar', target, result });

      case 'importar':
        if (!merged.destino) throw new Error('destino obrigatório');
        result = importarTreinosFEMFLOW_aba(merged.destino, { target }); // ✅ aqui
        return jsonOK_({ step: 'importar', target, result });

      case 'login':
        result = autenticarPersonal_(merged);
        return jsonOK_({ step: 'login', target, user: result });

      case 'signup':
        result = cadastrarPersonal_(merged);
        return jsonOK_({ step: 'signup', target, user: result });

      case 'full':
        if (!merged.destino) throw new Error('destino obrigatório para pipeline full');
        gerarFemFlow30Dias(merged.pedidoTexto);
        relinkarAba_(merged.destino, merged.nivel);
        importarTreinosFEMFLOW_aba(merged.destino, { target }); // ✅ aqui
        return jsonOK_({ step: 'full', target, result: 'Pipeline completo executado' });

      default:
        throw new Error('action inválida: ' + action);
    }

  } catch (err) {
    return jsonERR_(err);
  }
}



/* ================================
 *  PARSE / MERGE POST
 * ================================ */
function mergePostParams_(e) {
  const query = (e && e.parameter) ? { ...e.parameter } : {};
  const body = parsePostBodyOnly_(e);

  // body vence query (e mantém action mesmo que venha nos dois)
  return { ...query, ...body };
}

function parsePostBodyOnly_(e) {
  const raw = (e && e.postData && e.postData.contents != null)
    ? String(e.postData.contents).trim()
    : '';

  if (!raw) return {};

  // 1) JSON (principal)
  try {
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch (err) {
    // segue
  }

  // 2) Querystring no body (fallback)
  // Ex: action=signup&email=...&senha=...
  if (raw.includes('=') && raw.includes('&')) {
    return parseQueryString_(raw);
  }

  // 3) Se veio algo inesperado, devolve vazio (doPost vai acusar action ausente)
  return {};
}

function parseQueryString_(raw) {
  const output = {};
  String(raw || '')
    .split('&')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf('=');
      const key = idx >= 0 ? part.slice(0, idx) : part;
      const value = idx >= 0 ? part.slice(idx + 1) : '';
      if (!key) return;
      const decodedKey = decodeURIComponent(key);
      const decodedValue = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
      output[decodedKey] = decodedValue;
    });
  return output;
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

  if (p.nivel) linhas.push('nivel: ' + p.nivel);
  if (p.enfase) linhas.push('enfase: ' + p.enfase);
  if (p.fase) linhas.push('fase inicial: ' + p.fase);
  if (p.padraoCiclo) linhas.push('padrao_ciclo: ' + p.padraoCiclo);
  if (p.destino) linhas.push('destino: ' + p.destino);
  if (p.id_aluna) linhas.push('id_aluna: ' + p.id_aluna);

  // ✅ opcional: refletir target no pedido (não atrapalha)
  if (p.app || p.target) linhas.push('target: ' + String(p.app || p.target));

  linhas.push('formato: CSV');

  return linhas.join('\n');
}

function errToObj_(err) {
  const isObj = err && typeof err === 'object';
  return {
    message: isObj ? (err.message || String(err)) : String(err),
    name: isObj ? (err.name || 'Error') : 'Error',
    stack: isObj ? (err.stack || '') : ''
  };
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
  const e = errToObj_(err);
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      erro: e.message,
      error: e.message,
      message: e.message,
      name: e.name,
      stack: e.stack
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
  const msg = (err && err.message) ? err.message : String(err);
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      error: msg,
      erro: msg,
      message: msg,
      name: err && err.name ? err.name : 'Error',
      stack: err && err.stack ? err.stack : ''
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
