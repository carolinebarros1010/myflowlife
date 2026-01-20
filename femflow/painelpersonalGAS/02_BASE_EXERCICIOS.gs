/** ================================
 *  BASE DE EXERCÍCIOS — BANCO_PRO_V2
 *  ================================ */

function mapearTituloParaId_(base) {
  const map = {};
  base.list.forEach(ex => {
    if (ex.pt && ex.id) {
      map[normalizaKey_(ex.pt)] = ex.id;
    }
  });
  return map;
}



let __CACHE_BASE_PRO__ = null;

function carregarBaseExercicios_() {
  if (__CACHE_BASE_PRO__) return __CACHE_BASE_PRO__;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(FEMFLOW.BASE_SHEET_NAME);
  if (!sh) throw new Error('Base PRO não encontrada: ' + FEMFLOW.BASE_SHEET_NAME);

  const vals = sh.getDataRange().getValues();
  if (!vals.length) throw new Error('Base PRO vazia');

  const headerRaw = vals.shift();
  const header = headerRaw.map(h => String(h || '').trim().toLowerCase());

  const col = (name) => header.indexOf(String(name).trim().toLowerCase());

  const idx = {
    id: col('id'),
    titulo_pt: col('titulo_pt'),
    titulo_en: col('titulo_en'),
    titulo_fr: col('titulo_fr'),
    link: col('link'),

    nivel_minimo: col('nivel_minimo'),
    proibido_iniciante: col('proibido_iniciante'),

    sub_iniciante_id: col('sub_iniciante_id'),
    sub_iniciante_titulo_pt: col('sub_iniciante_titulo_pt'),
    sub_iniciante_link: col('sub_iniciante_link'),

grupo_muscular_principal: col('grupo muscular principal'),
grupo_muscular_secundario: col('grupo muscular secundário'),

    equipamento_categoria: col('equipamento_categoria'),
    subpadrao_movimento: col('subpadrao_movimento')

  };

  if (idx.titulo_pt < 0 || idx.link < 0) {
    throw new Error('Base PRO sem colunas mínimas: titulo_pt/link');
  }

  const byStrict = {};   // strictKey -> record
  const byFuzzy  = {};   // fuzzyKey -> record
  const byId     = {};   // id -> record
  const list     = [];   // lista completa (pra scoring)

  vals.forEach(r => {
    const pt = String(r[idx.titulo_pt] || '').trim();
    if (!pt) return;

    const rec = {
      id: (idx.id >= 0) ? String(r[idx.id] || '').trim() : '',
      pt,
      en: (idx.titulo_en >= 0) ? String(r[idx.titulo_en] || '').trim() : '',
      fr: (idx.titulo_fr >= 0) ? String(r[idx.titulo_fr] || '').trim() : '',
      link: String(r[idx.link] || '').trim(),

      nivel_minimo: (idx.nivel_minimo >= 0) ? String(r[idx.nivel_minimo] || '').trim().toLowerCase() : '',
      proibido_iniciante: (idx.proibido_iniciante >= 0) ? !!r[idx.proibido_iniciante] : false,

      sub_iniciante_id: (idx.sub_iniciante_id >= 0) ? String(r[idx.sub_iniciante_id] || '').trim() : '',
      sub_iniciante_titulo_pt: (idx.sub_iniciante_titulo_pt >= 0) ? String(r[idx.sub_iniciante_titulo_pt] || '').trim() : '',
      sub_iniciante_link: (idx.sub_iniciante_link >= 0) ? String(r[idx.sub_iniciante_link] || '').trim() : '',

      grupo_principal_raw: (idx.grupo_muscular_principal >= 0)
        ? String(r[idx.grupo_muscular_principal] || '').trim()
        : '',

      grupo_secundario_raw: (idx.grupo_muscular_secundario >= 0)
        ? String(r[idx.grupo_muscular_secundario] || '').trim()
        : '',

      equipamento_categoria: (idx.equipamento_categoria >= 0) ? String(r[idx.equipamento_categoria] || '').trim().toLowerCase() : '',
      subpadrao_movimento: (idx.subpadrao_movimento >= 0) ? String(r[idx.subpadrao_movimento] || '').trim().toLowerCase() : ''
    };

    rec.grupo_principal = normalizarGrupoMuscular_(rec.grupo_principal_raw);
rec.grupo_secundario = normalizarGrupoMuscular_(rec.grupo_secundario_raw);


    const kStrict = normalizaKeyStrict_(pt);
    const kFuzzy  = normalizaKey_(pt);

    if (kStrict && !byStrict[kStrict]) byStrict[kStrict] = rec;
    if (kFuzzy  && !byFuzzy[kFuzzy])   byFuzzy[kFuzzy] = rec;

    if (rec.id) byId[rec.id] = rec;

    list.push(rec);
  });

  __CACHE_BASE_PRO__ = { byStrict, byFuzzy, byId, list };
  return __CACHE_BASE_PRO__;
}

function normalizarGrupoMuscular_(txt) {
  if (!txt) return null;

  const t = txt.toLowerCase();

  // CORE
  if (t.includes('reto abdominal') || t.includes('oblíquo') || t.includes('core'))
    return 'core';

  // GLÚTEOS
  if (t.includes('gluteo') || t.includes('glúteo'))
    return 'gluteos';

  // QUADRÍCEPS
  if (t.includes('quadríceps'))
    return 'quadriceps';

  // POSTERIOR
  if (t.includes('isquiotib'))
    return 'posteriores';

  // DORSAL / COSTAS
  if (t.includes('costas') || t.includes('romboide'))
    return 'costas';

  // PEITO
  if (t.includes('peito'))
    return 'peito';

  // OMBROS
  if (t.includes('deltóide') || t.includes('ombro'))
    return 'ombros';

  // BRAÇOS
  if (t.includes('bíceps'))
    return 'biceps';
  if (t.includes('tríceps'))
    return 'triceps';
  if (t.includes('antebraço'))
    return 'antebraco';

  // PANTURRILHA
  if (t.includes('gastrocnêmio') || t.includes('sóleo'))
    return 'panturrilha';

  // COLUNA / LOMBAR
  if (t.includes('coluna') || t.includes('lombar'))
    return 'lombar';

  // MOBILIDADE
  if (t.includes('mobilidade'))
    return 'mobilidade';

  return 'outros';
}


function encontrarHitBase_(tituloPt, base, nivel) {
  const original = String(tituloPt || '').trim();
  if (!original) return null;

  const limpo = limparComplementosSemanticos_(original);

  // 1️⃣ STRICT → ID
  const kStrict = normalizaKeyStrict_(limpo);
  if (kStrict && base.byStrict[kStrict]) {
    const ex = base.byStrict[kStrict];
    logCanonResolver_(original, ex.id, 'STRICT_ID');
    return aplicarSubstituicaoPorNivel_(ex, nivel, base);
  }

  // 2️⃣ FUZZY → ID
  const kFuzzy = normalizaKey_(limpo);
  if (kFuzzy && base.byFuzzy[kFuzzy]) {
    const ex = base.byFuzzy[kFuzzy];
    logCanonResolver_(original, ex.id, 'FUZZY_ID');
    return aplicarSubstituicaoPorNivel_(ex, nivel, base);
  }

  // 3️⃣ TOKEN MATCH
  for (const ex of base.list) {
    const s = tokenMatch_(limpo, ex.pt);
    if (s >= 0.6) {
      logCanonResolver_(original, ex.id, 'TOKEN_ID');
      return aplicarSubstituicaoPorNivel_(ex, nivel, base);
    }
  }

  // 4️⃣ TOKEN SCORE
  let best = null, bestScore = 0;
  for (const ex of base.list) {
    const s = tokenScore_(limpo, ex.pt);
    if (s > bestScore) {
      bestScore = s;
      best = ex;
    }
  }
  if (bestScore >= 0.6) {
    logCanonResolver_(original, best.id, 'TOKEN_SCORE_ID');
    return aplicarSubstituicaoPorNivel_(best, nivel, base);
  }

  // 5️⃣ 🔥 OPENAI → ID
  const idCanonico = resolverCanonicoIdOpenAI_(limpo, base);
  if (idCanonico && base.byId[idCanonico]) {
    const ex = base.byId[idCanonico];
    return aplicarSubstituicaoPorNivel_(ex, nivel, base);
  }

  // ❌ FINAL
  logCanonResolver_(original, null, 'NAO_ENCONTRADO');
  return null;
}

function encontrarHitBaseSemLog_(tituloPt, base) {
  const original = String(tituloPt || '').trim();
  if (!original) return { hit: null, matchType: 'SEM_TITULO', score: 0 };

  const limpo = limparComplementosSemanticos_(original);

  const kStrict = normalizaKeyStrict_(limpo);
  if (kStrict && base.byStrict[kStrict]) {
    return { hit: base.byStrict[kStrict], matchType: 'STRICT_ID', score: 1 };
  }

  const kFuzzy = normalizaKey_(limpo);
  if (kFuzzy && base.byFuzzy[kFuzzy]) {
    return { hit: base.byFuzzy[kFuzzy], matchType: 'FUZZY_ID', score: 1 };
  }

  for (const ex of base.list) {
    const s = tokenMatch_(limpo, ex.pt);
    if (s >= 0.6) {
      return { hit: ex, matchType: 'TOKEN_ID', score: s };
    }
  }

  let best = null;
  let bestScore = 0;
  for (const ex of base.list) {
    const s = tokenScore_(limpo, ex.pt);
    if (s > bestScore) {
      bestScore = s;
      best = ex;
    }
  }
  if (bestScore >= 0.6) {
    return { hit: best, matchType: 'TOKEN_SCORE_ID', score: bestScore };
  }

  return { hit: null, matchType: 'NAO_ENCONTRADO', score: 0 };
}


function tokenScore_(a, b) {
  const A = new Set(normalizaKey_(a).split(' ').filter(Boolean));
  const B = new Set(normalizaKey_(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;

  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });

  const uni = A.size + B.size - inter;
  return uni ? (inter / uni) : 0;
}

function tokenMatch_(a, b) {
  const A = new Set(normalizaKey_(a).split(' '));
  const B = new Set(normalizaKey_(b).split(' '));

  let intersecao = 0;
  A.forEach(t => { if (B.has(t)) intersecao++; });

  const score = intersecao / Math.max(A.size, B.size);
  return score;
}
