/* ============================================================
   FEMFLOW • TREINO ENGINE v3.3 — PREMIUM 2025
   ------------------------------------------------------------
   - HIIT Rotativo Inteligente (NÃO inicia sozinho)
   - Sugestões HIIT em cards com ícones
   - Estrutura compatível com treino.js v3.3
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
   3) NORMALIZAR ENFASE
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
   4) REGRAS OFICIAIS (fase × nível)
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
   5) EXTRATORES E INTERVALOS
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
  descricao: "Prepare articulações, postura e respiração para o treino.",
  passos: [
    { nome: "Mobilidade de Quadril (40s)", desc: "Circule o quadril mantendo a coluna neutra." },
    { nome: "Mobilidade Torácica (40s)", desc: "Gire o tronco com respiração leve." },
    { nome: "Mobilidade de Ombro (40s)", desc: "Eleve e circule ombros suavemente." },
    { nome: "Caminhada Leve – 5 min", desc: "Postura ereta, respiração nasal." }
  ],
  protocolo: "wake"
});

/* ============================================================
   8) RESFRIAMENTO PREMIUM
============================================================ */
FEMFLOW.engineTreino.boxResfriamento = () => ({
  tipo: "resfriamentoPremium",
  titulo: "🧘 Resfriamento & Respiração",
  descricao: "Desacelere corpo e mente, integrando o treino.",
  protocolo: "release",
  passos: [
    { nome: "Alongamentos Leves — 2 min", desc: "Respiração tranquila sem dor." },
    { nome: "Respiração + Retorno — 1 min", desc: "Restaure a calma com foco no ar." }
  ]
});

/* ============================================================
   9) HIIT ROTATIVO INTELIGENTE — NÃO INICIA AUTOMATICAMENTE
============================================================ */

FEMFLOW.engineTreino._hiitUltimo = null;

FEMFLOW.engineTreino._protocolosHIIT = [
  { estimulo: 60, descanso: 30, nome: "60/30" },
  { estimulo: 40, descanso: 20, nome: "40/20" },
  { estimulo: 30, descanso: 30, nome: "30/30" }
];

FEMFLOW.engineTreino._cardsHIIT = {
  academia: [
    { icon: "🏃‍♀️", nome: "Esteira" },
    { icon: "🚴‍♀️", nome: "Bike" },
    { icon: "🚣‍♀️", nome: "Remo" },
    { icon: "🪜", nome: "Escada" },
    { icon: "🔥", nome: "Air Bike" }
  ],
  casa: [
    { icon: "🤸‍♀️", nome: "Burpees" },
    { icon: "⭐", nome: "Polichinelo" },
    { icon: "🏃", nome: "Corrida no lugar" },
    { icon: "🦵", nome: "Joelho alto" },
    { icon: "⬆️⬇️", nome: "Saltitos" }
  ]
};

FEMFLOW.engineTreino.boxHIIT = function (fase, enfase) {

  const prot = this._protocolosHIIT
    .filter(p => p.nome !== this._hiitUltimo)
    [Math.floor(Math.random() * 2)];

  this._hiitUltimo = prot.nome;

  const ciclo = prot.estimulo + prot.descanso;
  const ciclosTotais = Math.round(360 / ciclo);

  const cardsAcademia = this._cardsHIIT.academia
    .map(c => ({ icon: c.icon, nome: c.nome }));

  const cardsCasa = this._cardsHIIT.casa
    .map(c => ({ icon: c.icon, nome: c.nome }));

  return {
    tipo: "hiitPremium",
    titulo: `🔥 HIIT — ${prot.nome}`,
    descricao: `Ciclo: ${prot.estimulo}s forte + ${prot.descanso}s leve.`,
    estimulo: prot.estimulo,
    descanso: prot.descanso,
    ciclos: ciclosTotais,
    cardsAcademia,
    cardsCasa
  };
};

/* ============================================================
   10) CARDIO
============================================================ */
FEMFLOW.engineTreino.boxCardio = function () {
  return {
    tipo: "cardio",
    titulo: "💗 Cardio Leve — 10 min",
    descricao: "Movimento contínuo, suave e respirado.",
    tempo_total: 600
  };
};

/* ============================================================
   11) FIREBASE — buscar exercícios
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
      ex.nome   = ex.nome || ex.titulo || ex.exercise || "Exercício";
      ex.titulo = ex.titulo || ex.nome;

      ex.reps = this.extrairReps(ex.reps);
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
   12) MONTAR TREINO FINAL
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {
  const faseNorm  = this.normalizarFase(fase);
  const nivelNorm = this.normalizarNivel(nivel);
  const enfaseNorm = this.normalizarEnfase(enfase);

  const regras = this.regras[nivelNorm][faseNorm];
  const lista = [];

  /* 1 — AQUECIMENTO */
  lista.push(this.boxAquecimento());

  /* 2 — BOXES DE TREINO */
  const boxesFirebase = await this.buscarMultiBox({
    nivel: nivelNorm,
    enfase: enfaseNorm,
    fase: faseNorm,
    diaCiclo,
    qtdBoxes: regras.totalBoxes,
    exPorBox: regras.ex
  });

  /* 3 — INTERCALAR TREINO + HIIT + CARDIO */
  for (let i = 0; i < regras.totalBoxes; i++) {

    if (!boxesFirebase[i]) continue;

    lista.push(boxesFirebase[i]);

    if (regras.hiit[i]) {
      lista.push(this.boxHIIT(faseNorm, enfaseNorm));
    }

    if (regras.cardio[i]) {
      lista.push(this.boxCardio());
    }
  }

  /* 4 — RESFRIAMENTO */
  lista.push(this.boxResfriamento());

  return lista;
};
