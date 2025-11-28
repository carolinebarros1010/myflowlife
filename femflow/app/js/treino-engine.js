/* ============================================================
   FEMFLOW • TREINO ENGINE v1.0 (Modelo A — FrontEngine Total)
   Todas as regras de Box, HIIT e Cardio estão 100% aqui.
   ============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

/* ============================================================
   ENTRADA PRINCIPAL — Gera o Treino Completo
============================================================ */
FEMFLOW.gerarTreinoFront = async function (params = {}) {

  const fase = params.fase;        // menstrual / follicular / ovulatory / lutea
  const nivel = params.nivel;      // iniciante / intermediaria / avancada
  const enfase = params.enfase;    // gluteo, costas, corrida, beach...
  const diaCiclo = params.diaCiclo;

  // 🔍 Debug de entrada
  console.log("🎯 GERAR TREINO — INPUT:", { fase, nivel, enfase, diaCiclo });

  // -------------------------------
  // 1) BOX 0 (fixo)
  // -------------------------------
  const box0 = FEMFLOW.montarBox0();

  // -------------------------------
  // 2) REGRAS DE BOXES (modelo A)
  // -------------------------------
  const regras = FEMFLOW.regrasFrontEngine(fase, nivel);

  // -------------------------------
  // 3) BUSCAR EXERCÍCIOS DO FIREBASE
  // -------------------------------
  const exList = await FEMFLOW.buscarMultiBoxFirebase({
    nivel,
    enfase,
    fase,
    qtdBoxes: regras.totalBoxes,
    qtdExPorBox: regras.exPorBox
  });

  // -------------------------------
  // 4) Montar os boxes
  // -------------------------------
  const boxesExercicios = FEMFLOW.montarBoxesExercicios(exList);

  // -------------------------------
  // 5) HIIT + CARDIO (modelo A)
  // -------------------------------
  const intensidades = FEMFLOW.regrasHIITeCardio(fase, nivel, regras.totalBoxes);

  // -------------------------------
  // 6) BOX FINAL
  // -------------------------------
  const boxFinal = FEMFLOW.montarBoxFinal();

  // -------------------------------
  // 7) MONTAGEM FINAL
  // -------------------------------
  const listaFinal = [
    box0,
    ...boxesExercicios,
    ...intensidades,
    boxFinal
  ];

  console.log("📦 TREINO FINAL:", listaFinal);

  return {
    status: "ok",
    fase,
    nivel,
    enfase,
    diaCiclo,
    regras,
    lista: listaFinal
  };
};

/* ============================================================
   2) REGRAS PRINCIPAIS DE BOXES
============================================================ */
FEMFLOW.regrasFrontEngine = function (fase, nivel) {

  fase = fase.toLowerCase();
  nivel = nivel.toLowerCase();

  const R = {
    iniciante: {
      menstrual:   { totalBoxes: 1, exPorBox: [4], hiit: [0], cardio: [1] },
      follicular:  { totalBoxes: 2, exPorBox: [3,3], hiit: [1,0], cardio: [0,1] },
      ovulatory:   { totalBoxes: 2, exPorBox: [3,3], hiit: [1,1], cardio: [0,0] },
      lutea:       { totalBoxes: 2, exPorBox: [3,3], hiit: [1,0], cardio: [0,1] }
    },

    intermediaria: {
      menstrual:   { totalBoxes: 1, exPorBox: [4], hiit: [0], cardio: [1] },
      follicular:  { totalBoxes: 2, exPorBox: [3,3], hiit: [1,1], cardio: [0,0] },
      ovulatory:   { totalBoxes: 3, exPorBox: [2,2,2], hiit: [1,1,1], cardio: [0,0,0] },
      lutea:       { totalBoxes: 2, exPorBox: [3,3], hiit: [1,0], cardio: [0,1] }
    },

    avancada: {
      menstrual:   { totalBoxes: 1, exPorBox: [5], hiit: [0], cardio: [1] },
      follicular:  { totalBoxes: 2, exPorBox: [3,4], hiit: [1,1], cardio: [0,0] },
      ovulatory:   { totalBoxes: 3, exPorBox: [3,3,3], hiit: [1,1,1], cardio: [0,0,0] },
      lutea:       { totalBoxes: 2, exPorBox: [4,4], hiit: [1,0], cardio: [0,1] }
    }
  };

  return R[nivel][fase];
};

/* ============================================================
   3) BUSCADOR MULTI-BOX FIREBASE — 100% compatível
============================================================ */

/**
 * Lê exercícios do Firebase automaticamente:
 *
 * /exercicios/{nivel}_{enfase}/fases/{fase}/dias/dia_N/exercicios/
 *
 * Divide tudo em boxes conforme qtdExPorBox.
 */
FEMFLOW.buscarMultiBoxFirebase = async function (cfg) {

  const nivel = cfg.nivel.toLowerCase();
  const enfase = cfg.enfase.toLowerCase();
  const fase = cfg.fase.toLowerCase();        // menstrual, follicular, ovulatoria, lutea
  const qtdBoxes = cfg.qtdBoxes;
  const exPorBox = cfg.qtdExPorBox;           // array: [3,3] etc.

  const pasta = `${nivel}_${enfase}`; // EX: iniciante_costas

  // pega o dia (1–28) já normalizado pelo engine
  const dia = cfg.dia || cfg.diaCiclo || 1;
  const diaKey = `dia_${dia}`;

  console.log("📁 FIREBASE MULTI-BOX →", { pasta, fase, diaKey, qtdBoxes, exPorBox });

  try {
    const snap = await firebase.firestore()
      .collection("exercicios")
      .doc(pasta)
      .collection("fases")
      .doc(fase)
      .collection("dias")
      .doc(diaKey)
      .collection("exercicios")
      .get();

    if (snap.empty) {
      console.warn("⚠️ Nenhum exercício no Firebase:", pasta, fase, diaKey);
      return [];
    }

    const todos = [];
    snap.forEach(doc => {
      const data = doc.data();
      todos.push({
        ...data,
        id: doc.id,
        fase,
        nivel,
        enfase,
        boxForced: data.box || null
      });
    });

    console.log("📦 EXERCÍCIOS LIDOS:", todos.length, todos);

    // embaralhar para não repetir sempre a mesma ordem
    const shuffled = todos.sort(() => Math.random() - 0.5);

    // dividir nos boxes corretos conforme regras
    const boxes = [];
    let cursor = 0;

    for (let i = 0; i < qtdBoxes; i++) {
      const q = exPorBox[i];       // qtd de exercícios nesse box
      const bloco = shuffled.slice(cursor, cursor + q);

      boxes.push({
        box: `box${i + 1}`,
        exercicios: bloco
      });

      cursor += q;
    }

    return boxes;

  } catch (err) {
    console.error("❌ ERRO FIREBASE MULTI-BOX:", err);
    return [];
  }
};

/* ============================================================
   4) CRIAR BOX ESPECIAL (HIIT ou CARDIO)
============================================================ */
FEMFLOW.criarBoxEspecial = function (tipo, fase, nivel) {

  const baseHiit = [
    "30s forte / 30s descanso × 6",
    "40s forte / 20s descanso × 6",
    "45s forte / 15s descanso × 6",
    "60s forte / 30s descanso × 5"
  ];

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  if (tipo === "hiit") {

    return {
      tipo: "hiit",
      titulo: `🔥 HIIT — ${fase.charAt(0).toUpperCase() + fase.slice(1)}`,
      protocolo: pick(baseHiit),
      descricao:
        "Use potência controlada. Foco em coordenação, ritmo e capacidade cardiovascular.",
      opcoesAcademia: ["Bike", "Esteira", "Elíptico", "Remo"],
      opcoesCasa: [
        "Polichinelo",
        "Agachamento com salto",
        "Mountain climber",
        "Salto lateral"
      ],
      tempo_total: 360
    };
  }

  if (tipo === "cardio") {
    return {
      tipo: "cardio",
      titulo: "💗 Cardio Leve — 10 minutos",
      descricao:
        "Movimento contínuo para circulação, estabilidade emocional e recuperação ativa.",
      opcoesAcademia: ["Esteira leve", "Bike leve", "Remo suave"],
      opcoesCasa: [
        "Caminhada no lugar",
        "Corrida estacionária leve",
        "Polichinelo leve"
      ],
      tempo_total: 600
    };
  }

  return null;
};


