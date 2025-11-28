/* ============================================================
   FEMFLOW • TREINO ENGINE v1.1 — FRONT-END TOTAL
   ------------------------------------------------------------
   - Regras completas por fase × nível
   - Box0 + BoxFinal fixos
   - HIIT + Cardio 100% no Front
   - Divisão multi-box por pastas Firebase
   - Totalmente compatível com treino.js v1.0
   ============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) REGRAS PRINCIPAIS (Modelo A)
============================================================ */
FEMFLOW.engineTreino.regras = {
  iniciante: {
    menstrual:   { totalBoxes: 1, ex: [4],     hiit: [0],   cardio: [1] },
    folicular:   { totalBoxes: 2, ex: [3,3],   hiit: [1,0], cardio: [0,1] },
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
   2) BOX 0 — Mobilidade fixa
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
   3) BOX FINAL — Resfriamento
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
   4) BOX ESPECIAL (HIIT e Cardio)
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
      opcoesAcademia: ["Bike", "Esteira", "Elíptico", "Remo"],
      opcoesCasa: ["Polichinelo", "High Knees", "Burpee", "Agachamento com salto"],
      tempo_total: 360
    };
  }

  return {
    tipo: "cardio",
    titulo: "💗 Cardio Leve — 10 min",
    descricao: "Movimento contínuo para circulação e recuperação.",
    opcoesAcademia: ["Esteira leve", "Bike leve", "Remo suave"],
    opcoesCasa: ["Caminhada no lugar", "Corrida estacionária leve"],
    tempo_total: 600
  };
};

/* ============================================================
   5) BUSCA MULTI-BOX NO FIREBASE
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
  snap.forEach(d => todos.push(d.data()));

  FEMFLOW.engineTreino.calcularIntervaloPorReps = function (reps) {
  reps = Number(reps || 0);

  if (reps >= 6 && reps <= 8)   return 90;
  if (reps > 8 && reps <= 12)   return 60;
  if (reps > 12 && reps <= 18)  return 45;

  // fallback se reps não vier
  return 60;
};
 

  // embaralha aleatoriamente
  const shuffled = todos.sort(() => Math.random() - 0.5);

  // divisão por box
  let cursor = 0;
  const boxes = [];

for (let i = 0; i < qtdBoxes; i++) {
  const q = exPorBox[i];
  const bloco = shuffled.slice(cursor, cursor + q);
  cursor += q;

  // ⭐ aplica intervalo baseado nos reps
  bloco.forEach(ex => {
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
   6) ENGINE FINAL — montarTreino()
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {

  const regras = this.regras[nivel][fase];

  const lista = [];

  // BOX 0
  lista.push(this.box0());

  // BOXES COM EXERCÍCIOS (Firebase)
  const boxesFirebase = await this.buscarMultiBox({
    nivel,
    enfase,
    fase,
    diaCiclo,
    qtdBoxes: regras.totalBoxes,
    exPorBox: regras.ex
  });

  lista.push(...boxesFirebase);

  // BOXES ESPECIAIS
  for (let i = 0; i < regras.totalBoxes; i++) {
    if (regras.hiit[i])   lista.push(this.criarBoxEspecial("hiit", fase));
    if (regras.cardio[i]) lista.push(this.criarBoxEspecial("cardio", fase));
  }

  // BOX FINAL
  lista.push(this.boxFinal());

  return lista;
};
