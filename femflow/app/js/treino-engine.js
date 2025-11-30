/* ============================================================
   FEMFLOW • TREINO ENGINE v1.3 — ARQUITETURA A (2025)
   ------------------------------------------------------------
   - Compatível com fase real via backend
   - Normalização automática da fase (ovulatory → ovulatoria)
   - Regras completas por fase × nível
   - Box0 + BoxFinal fixos
   - HIIT + Cardio dinâmicos
   - Multi-box via Firestore
   - Intervalo por reps (6–8→90s, 8–12→60s, 12–18→45s)
   - Debug Firebase completo (somente com femflow_dev=on)
   ============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) NORMALIZAR FASE VINDO DO BACKEND
============================================================ */
FEMFLOW.engineTreino.normalizarFase = function (faseRaw) {
  if (!faseRaw) return "follicular";

  const f = faseRaw.toLowerCase().trim();

  const mapa = {
    "ovulatory": "ovulatoria",
    "ovulatório": "ovulatoria",
    "ovulatoria": "ovulatoria",
    "ovulação": "ovulatoria",
    
    "follicular": "follicular",
    "folicular": "follicular",

    "luteal": "lutea",
    "lutea": "lutea",

    "menstrual": "menstrual",
    "menstruacao": "menstrual"
  };

  return mapa[f] || "follicular";
};


/* ============================================================
   2) REGRAS OFICIAIS (fase × nível)
============================================================ */
FEMFLOW.engineTreino.regras = {
  iniciante: {
    menstrual:   { totalBoxes: 1, ex: [4],     hiit: [0],   cardio: [1] },
    folicular:   { totalBoxes: 2, ex: [3,3],   hiit: [1,1], cardio: [0,1] },
    ovulatoria:  { totalBoxes: 2, ex: [3,3],   hiit: [1,1], cardio: [0,0] },
    lutea:       { totalBoxes: 2, ex: [3,3],   hiit: [1,0], cardio: [0,1] }
  },

  intermediaria: {
    menstrual:   { totalBoxes: 1, ex: [4],     hiit: [0],   cardio: [1] },
    folicular:   { totalBoxes: 2, ex: [3,3],   hiit: [1,1], cardio: [0,0] },
    ovulatoria:  { totalBoxes: 3, ex: [2,2,2], hiit: [1,1,1], cardio: [0,0,0] },
    lutea:       { totalBoxes: 2, ex: [3,3],   hiit: [1,0], cardio: [0,1] }
  },

  avancada: {
    menstrual:   { totalBoxes: 1, ex: [5],     hiit: [0],   cardio: [1] },
    folicular:   { totalBoxes: 2, ex: [3,4],   hiit: [1,1], cardio: [0,0] },
    ovulatoria:  { totalBoxes: 3, ex: [3,3,3], hiit: [1,1,1], cardio: [0,0,0] },
    lutea:       { totalBoxes: 2, ex: [4,4],   hiit: [1,0], cardio: [0,1] }
  }
};

/* ============================================================
   3) INTERVALO POR REPS
============================================================ */
FEMFLOW.engineTreino.calcularIntervaloPorReps = function (reps) {
  reps = Number(reps || 0);

  if (reps >= 6 && reps <= 8)  return 90;
  if (reps > 8 && reps <= 12) return 60;
  if (reps > 12 && reps <= 18) return 45;

  return 60;
};

/* ============================================================
   4) SERIES POR FASE × NÍVEL
============================================================ */
FEMFLOW.engineTreino.calcularSeries = function (fase, nivel) {
  fase  = (fase || "").toLowerCase();
  nivel = (nivel || "").toLowerCase();

  if (fase === "menstrual")   return nivel === "iniciante" ? 2 : 3;
  if (fase === "follicular")  return nivel === "iniciante" ? 3 : 4;
  if (fase === "ovulatoria")  return 4;
  if (fase === "lutea")       return nivel === "iniciante" ? 3 : 4;

  return 3;
};

/* ============================================================
   5) BOX 0 — MOBILIDADE
============================================================ */
FEMFLOW.engineTreino.box0 = () => ({
  tipo: "box0",
  titulo: "🌿 Mobilidade Inicial",
  descricao: "Prepare articulações e respiração.",
  passos: [
    "Mobilidade de quadril — 40s",
    "Mobilidade torácica — 40s",
    "Mobilidade de ombro — 40s",
    "Caminhada leve — 60s"
  ]
});

/* ============================================================
   6) BOX FINAL — RESFRIAMENTO
============================================================ */
FEMFLOW.engineTreino.boxFinal = () => ({
  tipo: "final",
  titulo: "🧘‍♀️ Resfriamento & Respiração",
  descricao: "Desacelere corpo e mente.",
  passos: [
    "Alongamento leve — 2 min",
    "Respiração Calm Flow — 1 min",
    "Retorne ao Flow Center"
  ]
});

/* ============================================================
   7) BOX ESPECIAL (HIIT / CARDIO)
============================================================ */
FEMFLOW.engineTreino.criarBoxEspecial = function (tipo, fase) {

  const baseHiit = [
    "30s forte / 30s descanso × 6",
    "40s forte / 20s descanso × 6",
    "45s forte / 15s descanso × 6",
    "60s forte / 30s × 5"
  ];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  if (tipo === "hiit") {
    return {
      tipo: "hiit",
      titulo: `🔥 HIIT — ${fase}`,
      descricao: "Alta intensidade controlada.",
      protocolo: pick(baseHiit),
      tempo_total: 360
    };
  }

  return {
    tipo: "cardio",
    titulo: "💗 Cardio Leve — 10 min",
    descricao: "Movimento contínuo para circulação.",
    tempo_total: 600
  };
};

/* ============================================================
   8) NORMALIZAR NÍVEL
============================================================ */
FEMFLOW.engineTreino.normalizarNivel = function (nivelRaw) {
  const n = (nivelRaw || "").toLowerCase();

  if (n.startsWith("inic"))  return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan"))  return "avancada";

  return "iniciante";
};

/* ============================================================
   9) NORMALIZAR ENFASE
============================================================ */
FEMFLOW.engineTreino.normalizarEnfase = function (raw) {

  const e = (raw || "").toLowerCase().trim();

  const mapa = {
    gluteo: "gluteo",
    quadriceps: "quadriceps",
    posteriores: "posteriores",
    costas: "costas",
    braco: "braco",
    corrida: "corrida",
    beach: "beach",
    adaptacao: "adaptacao",
    casa: "casa",
    geral: "geral",
    remo: "remo",
    natacao: "natacao"
  };

  return mapa[e] || "geral";
};
/* ============================================================
   9.1) AJUSTAR NUMBER SERIES (6-8) PARA 6
============================================================ */

FEMFLOW.engineTreino.extrairReps = function (raw) {
  if (!raw) return 10; // fallback

  // Se vier "6-8" -> retorna 6
  if (String(raw).includes("-")) {
    return Number(raw.split("-")[0]) || 10;
  }

  return Number(raw) || 10;
};

/* ============================================================
   10) FIREBASE: BUSCAR MULTI-BOX (com DEBUG completo)
============================================================ */
FEMFLOW.engineTreino.buscarMultiBox = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo,
  qtdBoxes,
  exPorBox
}) {

  const faseNorm   = this.normalizarFase(fase);
  const nivelNorm  = this.normalizarNivel(nivel);
  const enfaseNorm = this.normalizarEnfase(enfase);

  const pasta  = `${nivelNorm}_${enfaseNorm}`;
  const diaKey = `dia_${diaCiclo}`;

  FEMFLOW.log("📦 BUSCAR BOXES:", pasta, faseNorm, diaKey);

  const db = firebase.firestore();

  const snap = await db
    .collection("exercicios")
    .doc(pasta)
    .collection("fases")
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("exercicios")
    .get();

  if (snap.empty) {
    FEMFLOW.log("⚠️ Firestore vazio");
    return [];
  }

  const todos = [];
  snap.forEach(doc => todos.push(doc.data()));

  const shuffled = todos.sort(() => Math.random() - 0.5);

  let cursor = 0;
  const boxes = [];

  const seriesPadrao = this.calcularSeries(faseNorm, nivelNorm);

  for (let i = 0; i < qtdBoxes; i++) {
    const qtEx = exPorBox[i];

    const bloco = shuffled.slice(cursor, cursor + qtEx);
    cursor += qtEx;

    bloco.forEach(ex => {
      ex.reps = this.extrairReps(ex.reps);
      ex.series    = seriesPadrao;
      ex.intervalo = this.calcularIntervaloPorReps(ex.reps);
    });

    boxes.push({
      tipo: "treino",
      box: i + 1,
      exercicios: bloco
    });
  }

  // DEBUG — SOMENTE SE femflow_dev = 'on'
  if (FEMFLOW.dev()) {
    FEMFLOW.engineTreino.debugFirebase({
      nivel,
      enfase,
      faseNorm,
      diaCiclo,
      pasta,
      diaKey,
      todos,
      boxes,
      snapSize: snap.size
    });
  }

  return boxes;
};

/* ============================================================
   11) ENGINE FINAL — montarTreino()
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {

  const faseNorm = this.normalizarFase(fase);

  FEMFLOW.log("🧬 ENGINE → nivel:", nivel, "fase:", faseNorm, "dia:", diaCiclo);

  const regras = this.regras[nivel][faseNorm];
  const lista = [];

  // BOX 0
  lista.push(this.box0());

  // BUSCA OS BOXES DO FIREBASE
  const boxesFirebase = await this.buscarMultiBox({
    nivel,
    enfase,
    fase: faseNorm,
    diaCiclo,
    qtdBoxes: regras.totalBoxes,
    exPorBox: regras.ex
  });

  // INTERCALA: BOX → HIIT/CARDIO → BOX → HIIT/CARDIO...
  for (let i = 0; i < regras.totalBoxes; i++) {

    lista.push(boxesFirebase[i]);

    if (regras.hiit[i]) {
      lista.push(this.criarBoxEspecial("hiit", faseNorm));
    }

    if (regras.cardio[i]) {
      lista.push(this.criarBoxEspecial("cardio", faseNorm));
    }
  }

  // FINAL
  lista.push(this.boxFinal());

  return lista;
};


/* ============================================================
   12) 🔍 DEBUG FIREBASE — EXTREMAMENTE DETALHADO
============================================================ */
FEMFLOW.engineTreino.debugFirebase = function (info) {

  console.groupCollapsed(
    `%c🔥 FIREBASE DEBUG — ${info.nivel} | ${info.enfase} | ${info.faseNorm} | Dia ${info.diaCiclo}`,
    "color:#cc6a5a;font-weight:bold;"
  );

  console.log("📁 Pasta usada:", info.pasta);
  console.log("📄 Documento dia:", info.diaKey);
  console.log("📊 Total de docs:", info.snapSize);

  console.log("📌 Exercícios brutos (todos):");
  console.table(info.todos);

  console.log("📦 BOXES montados:");
  info.boxes.forEach((b, i) => {
    console.log(`--- BOX ${i + 1} ---`);
    console.table(b.exercicios);
  });

  console.groupEnd();
};

