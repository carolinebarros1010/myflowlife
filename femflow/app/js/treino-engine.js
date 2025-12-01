/* ============================================================
   FEMFLOW • TREINO ENGINE v3.7 — PREMIUM 2025
   ------------------------------------------------------------
   - Compatível com treino.js v3.7 FINAL
   - Suporte: treino PERSONAL + cardio_final
   - Não altera estrutura v3.6 existente
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) NORMALIZAR FASE
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
   2) NORMALIZAR NÍVEL
============================================================ */
FEMFLOW.engineTreino.normalizarNivel = function (nivelRaw) {
  const n = (nivelRaw || "").toLowerCase();
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan"))  return "avancada";
  return "iniciante";
};

/* ============================================================
   3) NORMALIZAR ÊNFASE
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
    natacao: "natacao",
    personal: "personal" // 🔥 ADICIONADO
  };

  return mapa[e] || "geral";
};

/* ============================================================
   4) REGRAS OFICIAIS — treino comum
============================================================ */
FEMFLOW.engineTreino.regras = {
  iniciante: {
    menstrual:   { totalBoxes: 1, ex: [3],     hiit: [0],   cardio: [1] },
    follicular:  { totalBoxes: 2, ex: [3,3],   hiit: [1,1], cardio: [0,1] },
    ovulatoria:  { totalBoxes: 2, ex: [3,3],   hiit: [1,1], cardio: [0,0] },
    lutea:       { totalBoxes: 2, ex: [3,3],   hiit: [1,0], cardio: [0,1] }
  },

  intermediaria: {
    menstrual:   { totalBoxes: 1, ex: [4],     hiit: [0],   cardio: [1] },
    follicular:  { totalBoxes: 2, ex: [3,3],   hiit: [1,1], cardio: [0,0] },
    ovulatoria:  { totalBoxes: 3, ex: [2,2,2], hiit: [1,1,1], cardio: [0,0,0] },
    lutea:       { totalBoxes: 2, ex: [3,3],   hiit: [1,0], cardio: [0,1] }
  },

  avancada: {
    menstrual:   { totalBoxes: 1, ex: [4],     hiit: [0],   cardio: [1] },
    follicular:  { totalBoxes: 2, ex: [3,4],   hiit: [1,1], cardio: [0,0] },
    ovulatoria:  { totalBoxes: 3, ex: [3,3,3], hiit: [1,1,1], cardio: [0,0,0] },
    lutea:       { totalBoxes: 2, ex: [4,4],   hiit: [1,0], cardio: [0,1] }
  }
};

/* ============================================================
   5) EXTRATORES
============================================================ */
FEMFLOW.engineTreino.extrairReps = function (raw) {
  if (!raw) return 10;
  if (String(raw).includes("-")) return Number(raw.split("-")[0]);
  return Number(raw) || 10;
};

FEMFLOW.engineTreino.calcularIntervaloPorReps = function (reps) {
  reps = Number(reps || 0);
  if (reps >= 6 && reps <= 8)  return 90;
  if (reps > 8 && reps <= 12) return 60;
  if (reps > 12 && reps <= 18) return 45;
  return 60;
};

/* ============================================================
   6) SÉRIES POR FASE
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
   7) AQUECIMENTO PREMIUM
============================================================ */
FEMFLOW.engineTreino.boxAquecimento = () => ({
  tipo: "aquecimentoPremium",
  titulo: "🌿 Aquecimento Premium",
  descricao: "Prepare articulações, postura e respiração.",
  passos: [
    { nome: "Mobilidade de Quadril (40s)" },
    { nome: "Mobilidade Torácica (40s)" },
    { nome: "Mobilidade de Ombro (40s)" },
    { nome: "Caminhada Leve – 5 min" }
  ]
});

/* ============================================================
   8) RESFRIAMENTO PREMIUM
============================================================ */
FEMFLOW.engineTreino.boxResfriamento = () => ({
  tipo: "resfriamentoPremium",
  titulo: "🧘 Resfriamento Premium",
  descricao: "Desacelere corpo e mente.",
  passos: [
    { nome: "Alongamentos Leves — 2 min" },
    { nome: "Respiração — 1 min" }
  ]
});

/* ============================================================
   9) HIIT — Modelo B
============================================================ */
FEMFLOW.engineTreino._hiitUltimo = null;

FEMFLOW.engineTreino._protocolosHIIT = [
  { forte: 60, leve: 30, nome: "60/30" },
  { forte: 40, leve: 20, nome: "40/20" },
  { forte: 30, leve: 30, nome: "30/30" }
];

FEMFLOW.engineTreino.boxHIIT = function () {

  const protocolo = this._protocolosHIIT
    .filter(p => p.nome !== this._hiitUltimo)
    [Math.floor(Math.random() * 2)];

  this._hiitUltimo = protocolo.nome;

  return {
    tipo: "hiitPremium",
    titulo: `🔥 HIIT — ${protocolo.nome}`,
    descricao: `Ciclo: ${protocolo.forte}s forte + ${protocolo.leve}s leve.`,
    estimulo: protocolo.forte,
    descanso: protocolo.leve,
    ciclos: 6
  };
};

/* ============================================================
   10) CARDIO LEVE
============================================================ */
FEMFLOW.engineTreino.boxCardio = function () {
  return {
    tipo: "cardio",
    titulo: "💗 Cardio Leve — 10 min",
    descricao: "Movimento suave, cadenciado e respirado.",
    tempo_total: 600
  };
};

/* ============================================================
   11) FIREBASE — exercícios normais
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

  FEMFLOW.log("📦 Firestore padrão →", pasta, faseNorm, diaKey);

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
    FEMFLOW.error("⚠️ Firestore vazio (exercicios)");
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
      ex.nome   = ex.nome || ex.titulo || "Exercício";
      ex.titulo = ex.titulo || ex.nome;
      ex.reps   = this.extrairReps(ex.reps);
      ex.series = seriesPadrao;
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
   🔥 12) FIREBASE — TREINO PERSONAL
============================================================ */
FEMFLOW.engineTreino.carregarTreinoPersonal = async function ({
  id,
  enfase,
  fase,
  diaCiclo
}) {
  const faseNorm = this.normalizarFase(fase);
  const enfNorm  = this.normalizarEnfase(enfase);
  const diaKey   = `dia_${diaCiclo}`;

  FEMFLOW.log("🎨 Firestore PERSONAL →", id, enfNorm, faseNorm, diaKey);

  const db = firebase.firestore();

  const snap = await db
    .collection("personal_trainings")
    .doc(id)
    .collection(enfNorm)
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("exercicios")
    .get();

  if (snap.empty) {
    FEMFLOW.warn("⚠️ Treino personal vazio");
    return [];
  }

  const lista = [];
  snap.forEach(doc => lista.push(doc.data()));

  return lista;
};


/* ============================================================
   13) MONTAR TREINO FINAL (não-personal)
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {
  const faseNorm    = this.normalizarFase(fase);
  const nivelNorm   = this.normalizarNivel(nivel);
  const enfaseNorm  = this.normalizarEnfase(enfase);

  const regras = this.regras[nivelNorm][faseNorm];
  const lista = [];

  lista.push(this.boxAquecimento());

  const boxesFirebase = await this.buscarMultiBox({
    nivel: nivelNorm,
    enfase: enfaseNorm,
    fase: faseNorm,
    diaCiclo,
    qtdBoxes: regras.totalBoxes,
    exPorBox: regras.ex
  });

  for (let i = 0; i < regras.totalBoxes; i++) {
    if (boxesFirebase[i]) lista.push(boxesFirebase[i]);
    if (regras.hiit[i])   lista.push(this.boxHIIT());
    if (regras.cardio[i]) lista.push(this.boxCardio());
  }

  lista.push(this.boxResfriamento());

  return lista;
};
