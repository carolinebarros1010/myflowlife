/* ============================================================
   FEMFLOW • TREINO ENGINE v3.0 — Versão Premium 2025
   ------------------------------------------------------------
   ✔ Box 0 Premium (mobilidade + caminhada 5min + respiração Wake Flow)
   ✔ Box Final Premium (pse + resfriamento + respiração Restore Flow)
   ✔ HIIT com gatilhos 3-2-1 / 5-4-3-2-1
   ✔ Intervalo dinâmico por reps
   ✔ Normalização total de fase / nível / ênfase
   ✔ Regras completas fase × nível
   ✔ Multi-box Firebase com shuffle
   ✔ Intercalação premium (BOX → HIIT/CARDIO → BOX)
   ✔ Debug Firebase completo (dev mode)
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
FEMFLOW.engineTreino.normalizarNivel = function (raw) {
  const n = (raw || "").toLowerCase();
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
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
    adaptacao: "adaptacao",
    casa: "casa",
    beach: "beach",
    remo: "remo",
    natacao: "natacao",
    geral: "geral"
  };
  return mapa[e] || "geral";
};

/* ============================================================
   4) EXTRair REPS (6-8 → 6)
============================================================ */
FEMFLOW.engineTreino.extrairReps = function (raw) {
  if (!raw) return 10;
  if (String(raw).includes("-")) return Number(raw.split("-")[0]) || 10;
  return Number(raw) || 10;
};

/* ============================================================
   5) INTERVALO POR REPS
============================================================ */
FEMFLOW.engineTreino.calcularIntervaloPorReps = function (reps) {
  reps = Number(reps || 0);
  if (reps >= 6 && reps <= 8) return 90;
  if (reps > 8 && reps <= 12) return 60;
  if (reps > 12 && reps <= 18) return 45;
  return 60;
};

/* ============================================================
   6) SERIES POR FASE × NÍVEL
============================================================ */
FEMFLOW.engineTreino.calcularSeries = function (fase, nivel) {
  fase = (fase || "").toLowerCase();
  nivel = (nivel || "").toLowerCase();

  if (fase === "menstrual") return nivel === "iniciante" ? 2 : 3;
  if (fase === "follicular") return nivel === "iniciante" ? 3 : 4;
  if (fase === "ovulatoria") return 4;
  if (fase === "lutea") return nivel === "iniciante" ? 3 : 4;

  return 3;
};

/* ============================================================
   7) BOX 0 — AQUecimento Premium
============================================================ */
FEMFLOW.engineTreino.box0 = () => ({
  tipo: "box0",
  titulo: "🌿 Aquecimento Premium",
  descricao:
    "Prepare o corpo com mobilidade suave e 5 minutos de caminhada leve.",
  passos: [
    "Mobilidade de quadril — 40s",
    "Mobilidade de coluna — 40s",
    "Mobilidade de ombros — 40s",
    "Caminhada leve — 5 minutos"
  ],
  respirar: "wake" // protocolo Wake Flow
});

/* ============================================================
   8) BOX FINAL — Resfriamento Premium
============================================================ */
FEMFLOW.engineTreino.boxFinal = () => ({
  tipo: "final",
  titulo: "🧘‍♀️ Resfriamento Premium",
  descricao: "Desacelere o corpo e sinalize recuperação profunda.",
  passos: [
    "Alongamento leve — 2 min",
    "Respiração Restore Flow — 1 min",
    "Finalize salvando seu treino"
  ],
  respirar: "restore" // protocolo Restore Flow
});

/* ============================================================
   9) BOX ESPECIAL — HIIT / CARDIO
============================================================ */
FEMFLOW.engineTreino.criarBoxEspecial = function (tipo, fase) {
  const baseHiit = [
    "30\" forte / 30\" leve × 6",
    "40\" forte / 20\" leve × 6",
    "45\" forte / 15\" leve × 6",
    "60\" forte / 30\" leve × 5"
  ];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  if (tipo === "hiit") {
    return {
      tipo: "hiit",
      titulo: `🔥 HIIT — ${fase}`,
      descricao:
        "Alta intensidade controlada. Prepare-se para um bloco com estímulo forte.\nComeço automático com contagem 3–2–1.",
      protocolo: pick(baseHiit),
      tempo_total: 360,
      startCountdown: true // usado pelo treino.js
    };
  }

  return {
    tipo: "cardio",
    titulo: "💗 Cardio Leve",
    descricao: "Movimento contínuo para circulação e respiração.",
    tempo_total: 600,
    startCountdown: false
  };
};

/* ============================================================
   10) REGRAS OFICIAIS (fase × nível)
============================================================ */
FEMFLOW.engineTreino.regras = {
  iniciante: {
    menstrual: { totalBoxes: 1, ex: [4], hiit: [0], cardio: [1] },
    folicular: { totalBoxes: 2, ex: [3, 3], hiit: [1, 1], cardio: [0, 1] },
    ovulatoria: { totalBoxes: 2, ex: [3, 3], hiit: [1, 1], cardio: [0, 0] },
    lutea: { totalBoxes: 2, ex: [3, 3], hiit: [1, 0], cardio: [0, 1] }
  },

  intermediaria: {
    menstrual: { totalBoxes: 1, ex: [4], hiit: [0], cardio: [1] },
    folicular: { totalBoxes: 2, ex: [3, 3], hiit: [1, 1], cardio: [0, 0] },
    ovulatoria: { totalBoxes: 3, ex: [2, 2, 2], hiit: [1, 1, 1], cardio: [0, 0, 0] },
    lutea: { totalBoxes: 2, ex: [3, 3], hiit: [1, 0], cardio: [0, 1] }
  },

  avancada: {
    menstrual: { totalBoxes: 1, ex: [5], hiit: [0], cardio: [1] },
    folicular: { totalBoxes: 2, ex: [3, 4], hiit: [1, 1], cardio: [0, 0] },
    ovulatoria: { totalBoxes: 3, ex: [3, 3, 3], hiit: [1, 1, 1], cardio: [0, 0, 0] },
    lutea: { totalBoxes: 2, ex: [4, 4], hiit: [1, 0], cardio: [0, 1] }
  }
};

/* ============================================================
   11) FIREBASE: BUSCAR EXERCÍCIOS
============================================================ */
FEMFLOW.engineTreino.buscarMultiBox = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo,
  qtdBoxes,
  exPorBox
}) {
  const faseNorm = this.normalizarFase(fase);
  const nivelNorm = this.normalizarNivel(nivel);
  const enfaseNorm = this.normalizarEnfase(enfase);

  const pasta = `${nivelNorm}_${enfaseNorm}`;
  const diaKey = `dia_${diaCiclo}`;

  FEMFLOW.log("📦 FIREBASE: pasta", pasta, "fase", faseNorm, "dia", diaKey);

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

  if (snap.empty) return [];

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
      ex.series = seriesPadrao;
      ex.intervalo = this.calcularIntervaloPorReps(ex.reps);
    });

    boxes.push({
      tipo: "treino",
      box: i + 1,
      exercicios: bloco
    });
  }

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
   12) ENGINE FINAL — Montar treino
============================================================ */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {
  const faseNorm = this.normalizarFase(fase);

  FEMFLOW.log("🧬 ENGINE FINAL:", { nivel, fase: faseNorm, diaCiclo });

  const regras = this.regras[nivel][faseNorm];

  const lista = [];

  // BOX 0
  lista.push(this.box0());

  // EXERCÍCIOS FIREBASE
  const boxesFirebase = await this.buscarMultiBox({
    nivel,
    enfase,
    fase: faseNorm,
    diaCiclo,
    qtdBoxes: regras.totalBoxes,
    exPorBox: regras.ex
  });

  // INTERCALAÇÃO PREMIUM
  for (let i = 0; i < regras.totalBoxes; i++) {
    lista.push(boxesFirebase[i]);

    if (regras.hiit[i]) lista.push(this.criarBoxEspecial("hiit", faseNorm));
    if (regras.cardio[i]) lista.push(this.criarBoxEspecial("cardio", faseNorm));
  }

  // BOX FINAL
  lista.push(this.boxFinal());

  return lista;
};

/* ============================================================
   13) DEBUG
============================================================ */
FEMFLOW.engineTreino._debugLast = null;

FEMFLOW.engineTreino.debugFirebase = function (info) {
  FEMFLOW.engineTreino._debugLast = info;
  console.groupCollapsed(
    `%c🔥 FIREBASE DEBUG — ${info.nivel} | ${info.enfase} | ${info.faseNorm} | Dia ${info.diaCiclo}`,
    "color:#cc6a5a;font-weight:bold"
  );
  console.log(info);
  console.groupEnd();
};

FEMFLOW.engineTreino.debugFirebaseLast = () =>
  console.log(FEMFLOW.engineTreino._debugLast);
