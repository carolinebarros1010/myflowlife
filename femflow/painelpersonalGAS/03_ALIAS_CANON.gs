/** ================================
 *  ALIAS + CANONIZAÇÃO SEMÂNTICA (VERSÃO FINAL)
 *  ================================ */

// ================================
// LOG DE CANONIZAÇÃO
// ================================
function logCanonResolver_(tituloOriginal, tituloCanonico, origem) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName('CANON_RESOLVER_LOG');
    if (!sh) {
      sh = ss.insertSheet('CANON_RESOLVER_LOG');
      sh.appendRow(['data', 'titulo_original', 'titulo_canonico', 'origem']);
    }

    sh.appendRow([
      new Date(),
      tituloOriginal,
      tituloCanonico || 'NAO_ENCONTRADO',
      origem
    ]);
  } catch (e) {
    Logger.log('[CANON_LOG][ERRO] ' + e.message);
  }
}

// ================================
// SALVAR ALIAS APRENDIDO (sheet local simples)
// ================================
function salvarAliasAprendido_(original, canonico) {
  if (!original || !canonico) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('EXERCISE_ALIASES');
  if (!sh) {
    sh = ss.insertSheet('EXERCISE_ALIASES');
    sh.appendRow(['alias', 'canonico']);
  }

  const aliasKey = normalizaKey_(original);
  const vals = sh.getDataRange().getValues().slice(1);
  const existe = vals.some(r => normalizaKey_(r[0]) === aliasKey);

  if (!existe) {
    sh.appendRow([original, canonico]);
  }
}

// ================================
// ALIASES HARDCODE (fallback)
// ================================
const EXERCISE_ALIASES = {
  'agachamento': [
    'agachamento livre',
    'agachamento barra',
    'agachamento tradicional'
  ],
  'levantamento terra': [
    'terra',
    'deadlift',
    'levantamento terra convencional'
  ],
  'stiff': [
    'stiff romeno',
    'romeno',
    'deadlift romeno'
  ],
  'puxada': [
    'puxada frente',
    'pulldown',
    'lat pulldown'
  ]
};

let ALIAS_LOOKUP = null;
let ALIASES_EXERCICIOS_LOOKUP = null;

// ================================
// BUILD LOOKUP (hardcode)
// ================================
function buildAliasLookup_() {
  if (ALIAS_LOOKUP) return ALIAS_LOOKUP;

  ALIAS_LOOKUP = {};

  for (const base in EXERCISE_ALIASES) {
    const baseKey = normalizaKey_(base);
    ALIAS_LOOKUP[baseKey] = base;

    (EXERCISE_ALIASES[base] || []).forEach(alt => {
      const altKey = normalizaKey_(alt);
      ALIAS_LOOKUP[altKey] = base;
    });
  }

  return ALIAS_LOOKUP;
}

// ================================
// BUILD LOOKUP (sheet ALIASES_EXERCICIOS)
// ================================
function buildAliasesExerciciosLookup_() {
  if (ALIASES_EXERCICIOS_LOOKUP) return ALIASES_EXERCICIOS_LOOKUP;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('ALIASES_EXERCICIOS');

  ALIASES_EXERCICIOS_LOOKUP = {};
  if (!sh) return ALIASES_EXERCICIOS_LOOKUP;

  const values = sh.getDataRange().getValues();
  if (!values.length) return ALIASES_EXERCICIOS_LOOKUP;

  const header = values[0].map(h => String(h || '').trim().toLowerCase());

  // ✅ tolerante a variações
  const colAny_ = (cands) => {
    const arr = Array.isArray(cands) ? cands : [cands];
    for (let i = 0; i < arr.length; i++) {
      const idx = header.indexOf(String(arr[i]).trim().toLowerCase());
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxId = colAny_(['id', 'exercise_id', 'exercicio_id']);
  const idxAlias = colAny_(['alias', 'apelido', 'titulo', 'título']);

  if (idxId < 0 || idxAlias < 0) return ALIASES_EXERCICIOS_LOOKUP;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = String(row[idxId] || '').trim();
    const alias = String(row[idxAlias] || '').trim();
    if (!id || !alias) continue;

    const key = normalizaKey_(alias);
    if (!key) continue;

    // primeira ocorrência vence (evita flapping)
    if (!ALIASES_EXERCICIOS_LOOKUP[key]) {
      ALIASES_EXERCICIOS_LOOKUP[key] = id;
    }
  }

  return ALIASES_EXERCICIOS_LOOKUP;
}

// ✅ helper: resetar cache manualmente (útil em dev)
function resetAliasesCache_() {
  ALIAS_LOOKUP = null;
  ALIASES_EXERCICIOS_LOOKUP = null;
}

// ================================
// RESOLUÇÃO DE ALIAS (hardcode)
// ================================
function resolverAlias_(titulo) {
  if (!titulo) return null;

  const key = normalizaKey_(titulo);
  const lookup = buildAliasLookup_();
  return lookup[key] || null;
}

// ================================
// RESOLUÇÃO DE ALIAS (sheet ALIASES_EXERCICIOS) => id
// ================================
function resolverAliasExerciciosId_(titulo) {
  if (!titulo) return null;
  const key = normalizaKey_(titulo);
  if (!key) return null;
  const lookup = buildAliasesExerciciosLookup_();
  return lookup[key] || null;
}

// ================================
// RESOLUÇÃO CANÔNICA DE TÍTULO
// ================================
function resolverTituloCanonico_(tituloGerado) {
  if (!tituloGerado) return null;

  // 1️⃣ tenta alias hardcode (canon por título)
  const alias = resolverAlias_(tituloGerado);
  if (alias) return alias;

  // 2️⃣ fallback: normalização leve
  return String(tituloGerado).trim();
}

// ================================
// IMPORTAÇÃO DE ALIASES DO LOG
// ================================
function importarAliasesDoCanonLog_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const log = ss.getSheetByName('CANON_RESOLVER_LOG');
  if (!log) return;

  // ✅ fix: insertSheet().appendRow() retorna Range, então fazemos em 2 passos
  let aliasesSh = ss.getSheetByName('EXERCISE_ALIASES');
  if (!aliasesSh) {
    aliasesSh = ss.insertSheet('EXERCISE_ALIASES');
    aliasesSh.appendRow(['alias', 'canonico']);
  }

  const logVals = log.getDataRange().getValues().slice(1);
  const aliasVals = aliasesSh.getDataRange().getValues().slice(1);

  const aliasSet = new Set(aliasVals.map(r => normalizaKey_(r[0])));

  let novos = 0;

  logVals.forEach(r => {
    const original = r[1];
    const canonico = r[2];
    const origem = r[3];

    if (
      original &&
      canonico &&
      canonico !== 'NAO_ENCONTRADO' &&
      origem === 'OPENAI_ID'
    ) {
      const key = normalizaKey_(original);
      if (!aliasSet.has(key)) {
        aliasesSh.appendRow([original, canonico]);
        aliasSet.add(key);
        novos++;
      }
    }
  });

  Logger.log(`[ALIAS_IMPORT] ${novos} novos aliases importados`);

  // (opcional) reseta cache pra refletir mudanças
  resetAliasesCache_();

  return { ok: true, novos };
}
