/* ============================================================
   FEMFLOW • TREINO ENGINE v3.0 — PREMIUM 2025
   ------------------------------------------------------------
   TIPOS ESPECIAIS:
   - aquecimentoPremium
   - treino
   - hiitPremium
   - cardio
   - resfriamentoPremium

   SUPORTE COMPLETO:
   - normalização fase/nivel/enfase
   - reps → intervalo automático
   - séries por fase hormonal
   - box especial com respiração integrada
   - pré-contagem (HIIT)
   - render premium (treino.js)
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
    menstrual:   { totalBoxes: 1, ex: [3],     hiit: [0],   cardio: [1] },
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
    menstrual:   { totalBoxes: 1, ex: [4],     hiit: [0],   cardio: [1] },
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
   5) TRATAMENTO DE REPS "6-8" → 6
============================================================ */
FEMFLOW.engineTreino.extrairReps = function (raw) {
  if (!raw) return 10;

  if (String(raw).includes("-")) {
    return Number(raw.split("-")[0]) || 10;
  }
  return Number(raw) || 10;
};

/* ============================================================
   6) NORMALIZAR NÍVEL
============================================================ */
FEMFLOW.engineTreino.normalizarNivel = function (nivelRaw) {
  const n = (nivelRaw || "").toLowerCase();

  if (n.startsWith("inic"))  return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan"))  return "avancada";

  return "iniciante";
};

/* ============================================================
   7) NORMALIZAR ENFASE
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
   8) AQUECIMENTO PREMIUM
============================================================ */
FEMFLOW.engineTreino.boxAquecimento = () => ({
  tipo: "aquecimentoPremium",
  titulo: "🌿 Aquecimento Premium",
  descricao: "Prepare articulações, respiração e corpo para o treino.",
  passos: [
    "Mobilidade de quadril – 40s",
    "Mobilidade torácica – 40s",
    "Mobilidade de ombro – 40s",
    "Caminhada leve – 5 min"
  ],
  protocolo: "wake"
});

/* ============================================================
   9) RESFRIAMENTO PREMIUM
============================================================ */
FEMFLOW.engineTreino.boxResfriamento = () => ({
  tipo: "resfriamentoPremium",
  titulo: "🧘 Resfriamento & Respiração",
  descricao: "Desacelere corpo e mente, finalize seu treino e integre o aprendizado.",
  protocolo: "release",
  passos: [
    "Alongamentos leves — 2 min",
    "Respiração + Retorno — 1 min"
  ]
});

/* ============================================================
   10) HIIT PREMIUM — com 3-2-1 / 5-4-3-2-1
============================================================ */
FEMFLOW.engineTreino.boxHIIT = function (fase) {
  return {
    tipo: "hiitPremium",
    titulo: `🔥 HIIT — ${fase}`,
    descricao: "Alta intensidade com controle total. Execute o estímulo forte seguido de descanso guiado.",
    tempo_total: 360 // 6 min
  };
};

/* ============================================================
   11) CARDIO LEVE
============================================================ */
FEMFLOW.engineTreino.boxCardio = function () {
  return {
    tipo: "cardio",
    titulo: "💗 Cardio Leve — 10 min",
    descricao: "Movimento contínuo para circulação e leve subida de FC.",
    tempo_total: 600
  };
};

/* ============================================================
   12) CARREGAR BOXES DO FIREBASE
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

      // 🔧 Ajuste 4 — Normalização dos nomes
      ex.nome   = ex.nome   || ex.titulo || ex.exercise || ex.label || "Exercício";
      ex.titulo = ex.titulo || ex.nome;

      // Reps → intervalo automático
      ex.reps = this.extrairReps(ex.reps);

      ex.series = seriesPadrao;

      // 🔧 Mantém intervalo original SEM alterar lógica
      ex.intervalo = this.calcularIntervaloPorReps(ex.reps);
    });

    boxes.push({
      tipo: "treino",
      box: i + 1,
      exercicios: bloco
    });
  }

  return boxes;
};


/* ============================================================
   13) ENGINE FINAL — montarTreino()
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {

  const faseNorm  = this.normalizarFase(fase);
  const nivelNorm = this.normalizarNivel(nivel);

  // 🔧 Ajuste 1: usa nivelNorm
  const regras = this.regras[nivelNorm][faseNorm];
  const lista = [];

  /* 1) AQUECIMENTO PREMIUM */
  lista.push(this.boxAquecimento());

  /* 2) FIREBASE BOXES */
  const boxesFirebase = await this.buscarMultiBox({
    nivel: nivelNorm,   // 🔧 Corrigido
    enfase,
    fase: faseNorm,
    diaCiclo,
    qtdBoxes: regras.totalBoxes,
    exPorBox: regras.ex
  });

  /* 3) INTERCALA: BOX → HIIT/CARDIO → BOX... */
  for (let i = 0; i < regras.totalBoxes; i++) {

    // 🔧 Ajuste 2: evita undefined
    if (!boxesFirebase[i]) continue;

    lista.push(boxesFirebase[i]);

    if (regras.hiit[i]) {
      lista.push(this.boxHIIT(faseNorm));
    }

    if (regras.cardio[i]) {
      lista.push(this.boxCardio());
    }
  }

  /* 4) RESFRIAMENTO PREMIUM */
  lista.push(this.boxResfriamento());

  return lista;
};
