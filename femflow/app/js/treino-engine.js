/* ============================================================
   FEMFLOW • TREINO ENGINE v1.2 — FRONT-END TOTAL (2025)
   ------------------------------------------------------------
   - Regras completas por fase × nível
   - Box0 + BoxFinal fixos
   - HIIT + Cardio 100% no Front
   - Multi-box por pastas Firebase
   - Intervalo por reps (6–8 → 90s, 8–12 → 60s, 12–18 → 45s)
   - Séries por fase × nível (menstrual, folicular, etc.)
   - Compatível com treino.js v1.3
   ============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) REGRAS PRINCIPAIS (Modelo A)
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
   2) FUNÇÃO — INTERVALO POR REPS
============================================================ */
FEMFLOW.engineTreino.calcularIntervaloPorReps = function (reps) {
  reps = Number(reps || 0);

  if (reps >= 6 && reps <= 8) return 90;
  if (reps > 8 && reps <= 12) return 60;
  if (reps > 12 && reps <= 18) return 45;

  return 60; // fallback
};

/* ============================================================
   3) FUNÇÃO — SÉRIES POR FASE × NÍVEL
============================================================ */
FEMFLOW.engineTreino.calcularSeries = function (fase, nivel) {
  fase = (fase || "").toLowerCase();
  nivel = (nivel || "").toLowerCase();

  if (fase === "menstrual")   return (nivel === "iniciante") ? 2 : 3;
  if (fase === "folicular")   return (nivel === "iniciante") ? 3 : 4;
  if (fase === "ovulatoria")  return 4;
  if (fase === "lutea")       return (nivel === "iniciante") ? 3 : 4;

  return 3; // fallback
};

/* ============================================================
   4) BOX 0 — Mobilidade fixa
============================================================ */
FEMFLOW.engineTreino.box0 = () => ({
  tipo: "box0",
  titulo: "🌿 Mobilidade Inicial",
  descricao: "Ative articulações, coluna e quadril antes do treino.",
  passos: [
    "Mobilidade de quadril — 40s",
    "Mobilidade torácica — 40s",
    "Mobilidade de ombro — 40s",
    "Respiração leve + caminhada — 60s"
  ]
});

/* ============================================================
   5) BOX FINAL — Resfriamento
============================================================ */
FEMFLOW.engineTreino.boxFinal = () => ({
  tipo: "final",
  titulo: "🧘‍♀️ Resfriamento & Respiração",
  descricao: "Desacelere corpo e mente com presença.",
  passos: [
    "Alongamento leve — 2 min",
    "Respiração Calm Flow — 1 min",
    "Retorne ao Flow Center com leveza"
  ]
});

/* ============================================================
   6) BOX ESPECIAL (HIIT e Cardio)
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
      protocolo: pick(baseHiit),
      descricao: "Alta intensidade para potência controlada.",
      tempo_total: 360
    };
  }

  return {
    tipo: "cardio",
    titulo: "💗 Cardio Leve — 10 min",
    descricao: "Movimento contínuo para circulação e recuperação.",
    tempo_total: 600
  };
};

/* ============================================================
   7) BUSCA MULTI-BOX NO FIREBASE
============================================================ */
FEMFLOW.engineTreino.buscarMultiBox = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo,
  qtdBoxes,
  exPorBox
}) {

  const pasta = `${nivel}_${enfase}`;
  const diaKey = `dia_${diaCiclo}`;

  const db = firebase.firestore();

  const snap = await db
    .collection("exercicios")
    .doc(pasta)
    .collection("fases")
    .doc(fase)
    .collection("dias")
    .doc(diaKey)
    .collection("exercicios")
    .get();

  if (snap.empty) return [];

  const todos = [];
  snap.forEach(doc => todos.push(doc.data()));

  // embaralha
  const shuffled = todos.sort(() => Math.random() - 0.5);

  let cursor = 0;
  const boxes = [];

  const seriesPadrao = FEMFLOW.engineTreino.calcularSeries(fase, nivel);

  for (let i = 0; i < qtdBoxes; i++) {
    const q = exPorBox[i];
    const bloco = shuffled.slice(cursor, cursor + q);
    cursor += q;

    bloco.forEach(ex => {
      ex.reps      = Number(ex.reps || 0);
      ex.series    = seriesPadrao;
      ex.intervalo = FEMFLOW.engineTreino.calcularIntervaloPorReps(ex.reps);
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
   8) ENGINE FINAL — montarTreino()
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {

  const regras = this.regras[nivel][fase];
  const lista = [];

  lista.push(this.box0());

  const boxesFirebase = await this.buscarMultiBox({
    nivel,
    enfase,
    fase,
    diaCiclo,
    qtdBoxes: regras.totalBoxes,
    exPorBox: regras.ex
  });

  lista.push(...boxesFirebase);

  for (let i = 0; i < regras.totalBoxes; i++) {
    if (regras.hiit[i])   lista.push(this.criarBoxEspecial("hiit", fase));
    if (regras.cardio[i]) lista.push(this.criarBoxEspecial("cardio", fase));
  }

  lista.push(this.boxFinal());

  return lista;
};

