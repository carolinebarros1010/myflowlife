/* ========================================================================
   FEMFLOW — 07_GERAR_DIA.gs
   ------------------------------------------------------------------------
   Responsável APENAS por montar o DIA de treino:
   - linhas CSV
   - boxes
   - tempos
   - HIIT
   ======================================================================== */

/**
 * Gera todas as linhas de UM dia de treino
 */
function gerarDia_(ctx) {

  const linhas = [];
  let ordem = 0;
  let ultimoTipo = null;
  let ultimoBox = null;

  // ================================
  // AQUECIMENTO
  // ================================
  linhas.push(
    linhaTempo_(
      'aquecimento',
      0,
      1,
      ctx,
      FEMFLOW.TEMPO_AQUECIMENTO
    )
  );
  ultimoTipo = 'aquecimento';
  ultimoBox = 0;
  ordem = 1;

  // ================================
  // EXERCÍCIOS (JÁ RESOLVIDOS)
  // ================================
  const exercicios = Array.isArray(ctx.exerciciosResolvidos)
    ? ctx.exerciciosResolvidos
    : [];

  const caixas = montarBoxesComSeriesEspeciais_(exercicios, ctx);

  caixas.forEach((boxExs, boxIdx) => {
    boxExs.forEach(ex => {
      const boxAtual = boxIdx + 1;
      if (ultimoTipo !== 'treino' || ultimoBox !== boxAtual) {
        ordem = 0;
      }
      const tempo = ex.tempo || '';
      linhas.push({
        tipo: 'treino',
        box: boxAtual,
        ordem: ++ordem,
        enfase: ctx.enfase,
        fase: ctx.fase,
        dia: ctx.dia,
        titulo_pt: ex.titulo_pt || '',
        titulo_en: ex.titulo_en || '',
        titulo_fr: ex.titulo_fr || '',
        link: ex.link || '',
        series: ex.series || '',
        reps: tempo ? '' : (ex.reps || ''),
        especial: ex.especial || '',
        tempo,
        intervalo: ex.intervalo || FEMFLOW.INTERVALO_TREINO,
        forte: '',
        leve: '',
        ciclos: ''
      });
      ultimoTipo = 'treino';
      ultimoBox = boxAtual;
    });
  });

  // ================================
  // HIIT (BOX 0)
  // ================================
  if (ctx.hiit && ctx.hiit.permitido) {
    linhas.push(
      linhaHiit0_(
        ctx,
        ctx.hiit.forte,
        ctx.hiit.leve,
        ctx.hiit.ciclos,
        ++ordem
      )
    );
    ultimoTipo = 'hiit';
    ultimoBox = 0;
  }

  // ================================
  // RESFRIAMENTO
  // ================================
  if (ultimoTipo !== 'resfriamento' || ultimoBox !== 0) {
    ordem = 0;
  }
  linhas.push(
    linhaTempo_(
      'resfriamento',
      0,
      ++ordem,
      ctx,
      FEMFLOW.TEMPO_RESFRIAMENTO
    )
  );
  ultimoTipo = 'resfriamento';
  ultimoBox = 0;

  return linhas;
}


/**
 * Linha genérica de tempo (aquecimento / resfriamento)
 */
function linhaTempo_(tipo, box, ordem, ctx, tempoSeg) {
  return {
    tipo,
    box,
    ordem,
    enfase: ctx.enfase,
    fase: ctx.fase,
    dia: ctx.dia,
    titulo_pt: '',
    titulo_en: '',
    titulo_fr: '',
    link: '',
    series: '',
    reps: '',
    especial: '',
    tempo: String(tempoSeg),
    intervalo: '',
    forte: '',
    leve: '',
    ciclos: ''
  };
}


/**
 * Linha de HIIT (sempre box 0)
 */
function linhaHiit0_(ctx, forte, leve, ciclos, ordem) {
  return {
    tipo: 'hiit',
    box: 0,
    ordem: ordem || 1,
    enfase: ctx.enfase,
    fase: ctx.fase,
    dia: ctx.dia,
    titulo_pt: '',
    titulo_en: '',
    titulo_fr: '',
    link: '',
    series: '',
    reps: '',
    especial: '',
    tempo: '',
    intervalo: '',
    forte: String(forte),
    leve: String(leve),
    ciclos: String(ciclos)
  };
}


/**
 * Distribui exercícios em boxes
 */
function distribuirBoxes_(arr, maxPorBox) {

  const n = arr.length;
  if (n <= maxPorBox) return [arr];

  const boxes = [];
  let i = 0;
  let rest = n;

  while (rest > 0) {
    let take = 3;

    if (rest === 4) take = 2;
    else if (rest === 5) take = 3;
    else if (rest === 6) take = 3;
    else if (rest === 7) take = 3;
    else if (rest === 8) take = 3;
    else if (rest === 9) take = 3;
    else if (rest === 10) take = 4;
    else if (rest <= maxPorBox) take = rest;

    boxes.push(arr.slice(i, i + take));
    i += take;
    rest -= take;
  }

  return boxes;
}

function montarBoxesComSeriesEspeciais_(exercicios, ctx) {
  const lista = Array.isArray(exercicios)
    ? exercicios.map(ex => Object.assign({}, ex))
    : [];

  const regras = Array.isArray(FEMFLOW_SERIES_ESPECIAIS)
    ? FEMFLOW_SERIES_ESPECIAIS
    : [];

  const ativa = Boolean(ctx?.serieEspecialAtiva);
  const faseSelecionada = String(ctx?.serieEspecialFase || '').toLowerCase();
  const faseDia = String(ctx?.fase || '').toLowerCase();
  const tipoSelecionado = String(ctx?.serieEspecialTipo || '').toLowerCase();
  const mapaDiaTipo = ctx?.serieEspecialDiaTipo || null;
  const tipoDia = mapaDiaTipo ? String(mapaDiaTipo[ctx?.dia] || '').toLowerCase() : '';

  if (ativa && tipoDia) {
    const codigoSelecionado = resolverSerieEspecialCodigo_(tipoDia, regras);
    const quantidade = quantidadeSerieEspecial_(codigoSelecionado);
    if (codigoSelecionado && quantidade > 0) {
      const especiais = lista.slice(0, quantidade);
      especiais.forEach(ex => {
        ex.especial = codigoSelecionado;
      });
      const restantes = lista.slice(quantidade);
      const caixasRestantes = distribuirBoxes_(restantes, 3);
      return [especiais, ...caixasRestantes].filter(box => box.length);
    }
  }

  if (ativa && faseSelecionada && faseSelecionada === faseDia && tipoSelecionado) {
    const codigoSelecionado = resolverSerieEspecialCodigo_(tipoSelecionado, regras);
    const quantidade = quantidadeSerieEspecial_(codigoSelecionado);
    if (codigoSelecionado && quantidade > 0) {
      const especiais = lista.slice(0, quantidade);
      especiais.forEach(ex => {
        ex.especial = codigoSelecionado;
      });
      const restantes = lista.slice(quantidade);
      const caixasRestantes = distribuirBoxes_(restantes, 3);
      return [especiais, ...caixasRestantes].filter(box => box.length);
    }
  }

  lista.forEach(ex => {
    const titulo = String(ex?.titulo_pt || '');
    const especial = resolverSerieEspecialSelecionada_(titulo, regras);
    if (especial) ex.especial = especial;
  });

  return distribuirBoxes_(lista, 3);
}

function resolverSerieEspecialSelecionada_(titulo, regras) {
  const base = String(titulo || '').trim();
  if (!base) return '';

  const match = base.match(/(?:\s+|\s*[-–—]\s*)([a-z]{1,2})$/i);
  if (!match) return '';

  const sufixo = String(match[1] || '').toLowerCase();
  return resolverSerieEspecialCodigo_(sufixo, regras);
}

function resolverSerieEspecialCodigo_(valor, regras) {
  const chave = String(valor || '').toLowerCase();
  if (!chave) return '';
  const regra = regras.find(item => {
    const sufixo = String(item?.sufixo || '').toLowerCase();
    const codigo = String(item?.codigo || '').toLowerCase();
    return chave === sufixo || chave === codigo;
  });
  return regra ? String(regra.codigo || '') : '';
}

function quantidadeSerieEspecial_(codigo) {
  const tipo = String(codigo || '').toUpperCase();
  const mapa = {
    Q: 4,
    T: 3,
    B: 2
  };
  return mapa[tipo] || 1;
}
