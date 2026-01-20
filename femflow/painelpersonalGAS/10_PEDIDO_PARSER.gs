/* ========================================================================
   FEMFLOW — 10_PEDIDO_PARSER.gs
   ------------------------------------------------------------------------
   Responsabilidade ÚNICA:
   - Parser e validação de pedido textual
   ------------------------------------------------------------------------
   ⚠️ Não renomear funções.
   ======================================================================== */

function parsePedido_(pedidoTexto) {
  if (pedidoTexto && typeof pedidoTexto === 'object') {
    return {
      nivel: normalizar_(pedidoTexto.nivel),
      enfase: normalizar_(pedidoTexto.enfase),
      faseInicial: normalizarFase_(pedidoTexto.fase || pedidoTexto.faseInicial),
      destino: pedidoTexto.destino ? String(pedidoTexto.destino).trim() : null,
      idAluna: pedidoTexto.id_aluna ? String(pedidoTexto.id_aluna).trim() : null,
      formato: pedidoTexto.formato || null,
      observacao: pedidoTexto.observacao || null,
      padraoCiclo: normalizarPadraoCiclo_(pedidoTexto.padraoCiclo),
      serieEspecialAtiva: normalizarSerieEspecialAtiva_(pedidoTexto.serieEspecialAtiva),
      serieEspecialFase: normalizarFase_(pedidoTexto.serieEspecialFase),
      serieEspecialTipo: normalizarSerieEspecialTipo_(pedidoTexto.serieEspecialTipo),
      serieEspecialDiaTipo: normalizarSerieEspecialDiaTipo_(pedidoTexto.serieEspecialDiaTipo)
    };
  }

  const texto = String(pedidoTexto || '');
  const linhas = texto.split(/\r?\n/);
  const pedido = {
    nivel: null,
    enfase: null,
    faseInicial: null,
    destino: null,
    idAluna: null,
    formato: null,
    observacao: null,
    padraoCiclo: null,
    serieEspecialAtiva: null,
    serieEspecialFase: null,
    serieEspecialTipo: null,
    serieEspecialDiaTipo: null
  };

  linhas.forEach(linha => {
    const trimmed = String(linha || '').trim();
    if (!trimmed || trimmed.indexOf(':') === -1) return;

    const partes = trimmed.split(':');
    const chaveRaw = partes.shift();
    const valor = partes.join(':').trim();

    if (!chaveRaw) return;

    const chave = normalizaKey_(chaveRaw);

    if (chave === 'nivel') {
      pedido.nivel = normalizar_(valor);
      return;
    }

    if (chave === 'enfase') {
      pedido.enfase = normalizar_(valor);
      return;
    }

    if (chave === 'fase' || chave === 'fase_inicial' || chave === 'fase_inicial_selecionada') {
      pedido.faseInicial = normalizarFase_(valor) || normalizar_(valor);
      return;
    }

    if (chave === 'destino') {
      pedido.destino = valor || null;
      return;
    }

    if (chave === 'id_aluna' || chave === 'idaluna') {
      pedido.idAluna = valor || null;
      return;
    }

    if (chave === 'formato') {
      pedido.formato = valor || null;
      return;
    }

    if (chave === 'observacao') {
      pedido.observacao = valor || null;
      return;
    }

    if (chave === 'padrao_ciclo' || chave === 'padrao') {
      pedido.padraoCiclo = normalizarPadraoCiclo_(valor);
      return;
    }

    if (chave === 'serie_especial' || chave === 'serie_especial_ativa') {
      pedido.serieEspecialAtiva = normalizarSerieEspecialAtiva_(valor);
      return;
    }

    if (chave === 'serie_especial_fase') {
      pedido.serieEspecialFase = normalizarFase_(valor) || normalizar_(valor);
      return;
    }

    if (chave === 'serie_especial_tipo') {
      pedido.serieEspecialTipo = normalizarSerieEspecialTipo_(valor);
      return;
    }

    if (chave === 'serie_especial_dia_tipo' || chave === 'serie_especial_dias') {
      pedido.serieEspecialDiaTipo = normalizarSerieEspecialDiaTipo_(valor);
    }
  });

  return pedido;
}

function validarPedido_(p) {
  const pedido = p || {};

  if (pedido.idAluna && !pedido.destino) {
    pedido.destino = `personal_${pedido.idAluna}`;
  }

  if (pedido.faseInicial) {
    pedido.faseInicial = normalizarFase_(pedido.faseInicial) || pedido.faseInicial;
  }

  if (pedido.nivel) {
    pedido.nivel = normalizar_(pedido.nivel);
  }

  if (pedido.enfase) {
    pedido.enfase = normalizar_(pedido.enfase);
  }

  if (pedido.padraoCiclo) {
    pedido.padraoCiclo = normalizarPadraoCiclo_(pedido.padraoCiclo);
  }

  if (pedido.serieEspecialAtiva === undefined || pedido.serieEspecialAtiva === null) {
    pedido.serieEspecialAtiva = false;
  }

  if (pedido.serieEspecialFase) {
    pedido.serieEspecialFase = normalizarFase_(pedido.serieEspecialFase) || pedido.serieEspecialFase;
  }

  if (pedido.serieEspecialTipo) {
    pedido.serieEspecialTipo = normalizarSerieEspecialTipo_(pedido.serieEspecialTipo);
  }

  if (pedido.serieEspecialDiaTipo) {
    pedido.serieEspecialDiaTipo = normalizarSerieEspecialDiaTipo_(pedido.serieEspecialDiaTipo);
  }

  const erros = [];

  if (!pedido.nivel) erros.push('nivel obrigatório');
  if (!pedido.enfase) erros.push('enfase obrigatória');
  if (!pedido.faseInicial) erros.push('fase inicial obrigatória');
  if (!pedido.destino) erros.push('destino obrigatório');

  const niveisValidos = ['iniciante', 'intermediaria', 'avancada'];
  if (pedido.nivel && !niveisValidos.includes(pedido.nivel)) {
    erros.push('nivel inválido');
  }

  const fasesValidas = ['menstrual', 'folicular', 'ovulatoria', 'lutea'];
  if (pedido.faseInicial && !fasesValidas.includes(pedido.faseInicial)) {
    erros.push('fase inicial inválida');
  }

  const padroesValidos = ['3', '4', '5', 'abc', 'abcd', 'abcde'];
  if (pedido.padraoCiclo && !padroesValidos.includes(pedido.padraoCiclo)) {
    erros.push('padrão de ciclo inválido');
  }

  if (pedido.serieEspecialAtiva) {
    if (pedido.serieEspecialDiaTipo && Object.keys(pedido.serieEspecialDiaTipo).length) {
      return pedido;
    }
    if (!pedido.serieEspecialFase || !fasesValidas.includes(pedido.serieEspecialFase)) {
      erros.push('fase de série especial inválida');
    }
    if (!pedido.serieEspecialTipo) {
      erros.push('tipo de série especial obrigatório');
    }
  }

  if (erros.length) {
    throw new Error('Pedido inválido: ' + erros.join('; '));
  }

  return pedido;
}

function normalizarSerieEspecialAtiva_(valor) {
  if (valor === true) return true;
  const txt = String(valor || '').trim().toLowerCase();
  return ['1', 'sim', 'true', 'on', 'yes'].includes(txt);
}

function normalizarSerieEspecialTipo_(valor) {
  const txt = String(valor || '').trim();
  if (!txt) return null;
  return txt.toLowerCase();
}

function normalizarSerieEspecialDiaTipo_(valor) {
  if (!valor) return null;
  const texto = String(valor || '');
  const partes = texto.split(',');
  const mapa = {};

  partes.forEach(item => {
    const raw = String(item || '').trim();
    if (!raw) return;
    const match = raw.match(/^(\d{1,2})\s*[:\-]?\s*([a-z]{1,2})$/i);
    if (!match) return;
    const dia = Number(match[1]);
    if (!dia || dia < 1 || dia > 30) return;
    const tipo = String(match[2] || '').toLowerCase();
    if (!tipo) return;
    mapa[dia] = tipo;
  });

  return Object.keys(mapa).length ? mapa : null;
}

function normalizarPadraoCiclo_(valor) {
  const txt = String(valor || '').trim().toLowerCase();
  if (!txt) return null;
  if (txt === '3' || txt === '4' || txt === '5') return txt;
  if (txt === 'abc' || txt === 'abcd' || txt === 'abcde') return txt;
  return null;
}
