/** ================================
 *  NORMALIZAÇÃO / PARSER SEMÂNTICO
 *  ================================ */

function normalizar_(v) {
  if (v === undefined || v === null) return null;

  return String(v)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizarFase_(fase) {
  if (!fase) return null;

  const f = normalizar_(fase);

  const MAP = {
    menstrual: 'menstrual',
    menstruacao: 'menstrual',

    folicular: 'folicular',
    follicular: 'folicular',

    ovulatoria: 'ovulatoria',
    ovulacao: 'ovulatoria',

    lutea: 'lutea',
    luteal: 'lutea'
  };

  return MAP[f] || null;
}

function normalizarEnfaseParaGrupo_(enfaseRaw) {
  if (!enfaseRaw) return null;

  const e = normalizar_(enfaseRaw);

  const MAP = {
    gluteo: 'gluteos',
    gluteos: 'gluteos',

    quadriceps: 'quadriceps',
    quadricipites: 'quadriceps',

    posteriores: 'isquiotibiais',
    isquiotibiais: 'isquiotibiais',

    costas: 'costas',
    dorsal: 'costas',

    peito: 'peito',
    peitoral: 'peito',

    superiores: 'superiores',

    ombro: 'deltoides',
    ombros: 'deltoides',

    core: 'core',
    abdominal: 'core'
  };

  return MAP[e] || e;
}

function resolverEnfasePorEsporte_(enfaseRaw) {
  if (!enfaseRaw) return null;

  const e = normalizar_(enfaseRaw);

  const MAPA = {
    corrida_longa: {
      principal: ['gluteos', 'posteriores'],
      secundario: ['core', 'panturrilhas']
    },
    corrida_curta: {
      principal: ['quadriceps', 'gluteos'],
      secundario: ['posteriores', 'panturrilhas']
    },
    remo: {
      principal: ['costas', 'gluteos'],
      secundario: ['biceps', 'core']
    },
    natacao: {
      principal: ['costas', 'ombros'],
      secundario: ['core', 'triceps']
    },
    beach_tennis: {
      principal: ['ombros', 'core'],
      secundario: ['gluteos', 'quadriceps']
    },
    tenis: {
      principal: ['ombros', 'core'],
      secundario: ['gluteos', 'quadriceps']
    },
    ciclismo: {
      principal: ['quadriceps', 'gluteos'],
      secundario: ['posteriores', 'core']
    },
    jiu_jitsu: {
      principal: ['costas', 'core'],
      secundario: ['biceps', 'gluteos']
    },
    muay_thai: {
      principal: ['core', 'quadriceps'],
      secundario: ['gluteos', 'ombros']
    },
    danca: {
      principal: ['gluteos', 'core'],
      secundario: ['quadriceps', 'panturrilhas']
    },
    surf: {
      principal: ['core', 'ombros'],
      secundario: ['gluteos', 'costas']
    }
  };

  return MAPA[e] || null;
}

function normalizaKey_(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizaKeyStrict_(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function limparComplementosSemanticos_(txt) {
  return String(txt || '')
    .replace(/\b(na|no|com|para|de|do|da)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

