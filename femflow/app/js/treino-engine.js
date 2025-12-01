/* ============================================================
   FEMFLOW • TREINO ENGINE v3.6 — VERSÃO FINAL 2025
   ------------------------------------------------------------
   ⬤ TOTAL COMPATÍVEL COM TREINO.HTML + CSS + TREINO.JS ATUAL
   ⬤ HIIT ROTATIVO INTELIGENTE (60/30 → 40/20 → 30/30 → repetir)
   ⬤ Respiração integrada (modal iOS)
   ⬤ Boxes premium e compactos
   ⬤ Engine hormonal 100% preservada
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
  if (n.startsWith("avan")) return "avancada";
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
   4) REGRAS — BOXES × FASE × NÍVEL
============================================================ */
FEMFLOW.engineTreino.regras = {
  iniciante: {
    menstrual:   { totalBoxes: 1, ex: [3], hiit: [0],   cardio: [1] },
    follicular:  { totalBoxes: 2, ex: [3,3], hiit: [1,1], cardio: [0,1] },
    ovulatoria:  { totalBoxes: 2, ex: [3,3], hiit: [1,1], cardio: [0,0] },
    lutea:       { totalBoxes: 2, ex: [3,3], hiit: [1,0], cardio: [0,1] }
  },
  intermediaria: {
    menstrual:   { totalBoxes: 1, ex: [4], hiit: [0],   cardio: [1] },
    follicular:  { totalBoxes: 2, ex: [3,3], hiit: [1,1], cardio: [0,0] },
    ovulatoria:  { totalBoxes: 3, ex: [2,2,2], hiit: [1,1,1], cardio: [0,0,0] },
    lutea:       { totalBoxes: 2, ex: [3,3], hiit: [1,0], cardio: [0,1] }
  },
  avancada: {
    menstrual:   { totalBoxes: 1, ex: [4], hiit: [0],   cardio: [1] },
    follicular:  { totalBoxes: 2, ex: [3,4], hiit: [1,1], cardio: [0,0] },
    ovulatoria:  { totalBoxes: 3, ex: [3,3,3], hiit: [1,1,1], cardio: [0,0,0] },
    lutea:       { totalBoxes: 2, ex: [4,4], hiit: [1,0], cardio: [0,1] }
  }
};

/* ============================================================
   5) EXTRATOR DE REPS
============================================================ */
FEMFLOW.engineTreino.extrairReps = raw => {
  if (!raw) return 10;
  if (String(raw).includes("-")) return Number(raw.split("-")[0]);
  return Number(raw) || 10;
};

/* ============================================================
   6) INTERVALO POR REPS
============================================================ */
FEMFLOW.engineTreino.calcularIntervaloPorReps = reps => {
  reps = Number(reps);
  if (reps >= 6 && reps <= 8) return 90;
  if (reps > 8 && reps <= 12) return 60;
  if (reps > 12 && reps <= 18) return 45;
  return 60;
};

/* ============================================================
   7) SÉRIES POR FASE × NÍVEL
============================================================ */
FEMFLOW.engineTreino.calcularSeries = function (fase, nivel) {
  fase = fase.toLowerCase();
  nivel = nivel.toLowerCase();

  if (fase === "menstrual") return nivel === "iniciante" ? 2 : 3;
  if (fase === "follicular") return nivel === "iniciante" ? 3 : 4;
  if (fase === "ovulatoria") return 4;
  if (fase === "lutea") return nivel === "iniciante" ? 3 : 4;

  return 3;
};

/* ============================================================
   8) AQUECIMENTO PREMIUM
============================================================ */
FEMFLOW.engineTreino.boxAquecimento = () => ({
  tipo: "aquecimentoPremium",
  titulo: "🌿 Aquecimento Premium",
  descricao: "Prepare articulações, postura e respiração para o treino.",
  passos: [
    { nome: "Mobilidade de Quadril (40s)", desc: "Movimento circular suave mantendo alinhamento." },
    { nome: "Mobilidade Torácica (40s)", desc: "Rotação leve com respiração controlada." },
    { nome: "Mobilidade de Ombro (40s)", desc: "Circundução leve para destravar cintura escapular." },
    { nome: "Caminhada leve – 5 min", desc: "Postura ativa, respiração nasal." }
  ],
  protocolo: "wake"
});

/* ============================================================
   9) RESFRIAMENTO PREMIUM
============================================================ */
FEMFLOW.engineTreino.boxResfriamento = () => ({
  tipo: "resfriamentoPremium",
  titulo: "🧘 Resfriamento & Respiração",
  descricao: "Finalização suave para reduzir FC, organizar respiração e restaurar o tônus.",
  protocolo: "release",
  passos: [
    { nome: "Alongamentos leves (2 min)", desc: "Amplitude confortável, sem dor." },
    { nome: "Respiração de integração (1 min)", desc: "Solte o corpo e desacelere." }
  ]
});

/* ============================================================
   🔥 10) HIIT ROTATIVO INTELIGENTE
   60/30 → 40/20 → 30/30 → repetir
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

  const prot = this._protocolosHIIT.filter(p => p.nome !== this._hiitUltimo)
                                   [Math.floor(Math.random() * 2)];

  this._hiitUltimo = prot.nome;

  const ciclo = prot.estimulo + prot.descanso;
  const ciclosTotais = Math.round(360 / ciclo);

  return {
    tipo: "hiitPremium",
    titulo: `🔥 HIIT — ${prot.nome}`,
    descricao: `Estímulo forte ${prot.estimulo}s + descanso ${prot.descanso}s.`,
    forte: prot.estimulo,
    leve: prot.descanso,
    ciclos: ciclosTotais,
    cardsAcademia: this._cardsHIIT.academia,
    cardsCasa: this._cardsHIIT.casa
  };
};

/* ============================================================
   11) CARDIO
============================================================ */
FEMFLOW.engineTreino.boxCardio = () => ({
  tipo: "cardio",
  titulo: "💗 Cardio Leve — 10 min",
  descricao: "Movimento contínuo e suave, respiração nasal.",
  tempo_total: 600
});

/* ============================================================
   12) FIREBASE — BUSCAR EXERCÍCIOS
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
    FEMFLOW.warn("⚠️ Firestore vazio");
    return [];
  }

  const todos = [];
  snap.forEach(doc => todos.push(doc.data()));
  const shuffled = todos.sort(() => Math.random() - 0.5);

  let cursor = 0;
  const lista = [];
  const seriesPadrao = this.calcularSeries(faseNorm, nivelNorm);

  for (let i = 0; i < qtdBoxes; i++) {
    const qtEx = exPorBox[i];
    const bloco = shuffled.slice(cursor, cursor + qtEx);
    cursor += qtEx;

    bloco.forEach(ex => {
      ex.nome   = ex.nome || ex.titulo || ex.exercise || "Exercício";
      ex.titulo = ex.titulo || ex.nome;
      ex.reps   = this.extrairReps(ex.reps);
      ex.series = seriesPadrao;
      ex.intervalo = this.calcularIntervaloPorReps(ex.reps);
    });

    lista.push({
      tipo: "treino",
      box: i + 1,
      exercicios: bloco
    });
  }

  return lista;
};

/* ============================================================
   13) ENGINE FINAL — MONTAR TREINO
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {
  const faseNorm   = this.normalizarFase(fase);
  const nivelNorm  = this.normalizarNivel(nivel);
  const enfaseNorm = this.normalizarEnfase(enfase);

  const regras = this.regras[nivelNorm][faseNorm];
  const lista = [];

  /* 1 — AQUECIMENTO */
  lista.push(this.boxAquecimento());

  /* 2 — TREINO (FIREBASE) */
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

