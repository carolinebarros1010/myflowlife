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

/* ============================================================
   FEMFLOW ENGINE — COMPLETO 2025
   Regras de BOXES por nível + fase (front only)
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

FEMFLOW.ENGINE = {

  /* ============================================================
     1) REGRAS DE BOXES por nível e fase
  ============================================================ */
  regras: {
    iniciante: {
      menstrual:   { boxes: 1, ex: 4, hiit: 0, cardio: 1 },
      folicular:   { boxes: 2, ex: 3, hiit: 1, cardio: 1 },
      ovulatoria:  { boxes: 2, ex: 3, hiit: 2, cardio: 0 },
      lutea:       { boxes: 2, ex: 3, hiit: 1, cardio: 1 }
    },

    intermediaria: {
      menstrual:   { boxes: 1, ex: 4, hiit: 0, cardio: 1 },
      folicular:   { boxes: 2, ex: 3, hiit: 2, cardio: 0 },
      ovulatoria:  { boxes: 3, ex: 2, hiit: 3, cardio: 0 },
      lutea:       { boxes: 2, ex: 3, hiit: 1, cardio: 1 }
    },

    avancada: {
      menstrual:   { boxes: 1, ex: 5, hiit: 0, cardio: 1 },
      folicular:   { boxes: 2, ex: [3,4], hiit: 2, cardio: 0 },
                    // box1: 3 ex • box2: 4 ex
      ovulatoria:  { boxes: 3, ex: 3, hiit: 3, cardio: 0 },
      lutea:       { boxes: 2, ex: 4, hiit: 1, cardio: 1 }
    }
  },

  /* ============================================================
     2) BOX 0 – MOBILIDADE FIXA
  ============================================================ */
  gerarBox0() {
    return {
      tipo: "box0",
      titulo: "🌿 Mobilidade Inicial",
      descricao: "Aqueça articulações e prepare o corpo para o treino.",
      passos: [
        "Mobilidade de quadril — 40s",
        "Mobilidade torácica — 40s",
        "Mobilidade de ombro — 40s",
        "Caminhada leve / respiração — 60s"
      ]
    };
  },

  /* ============================================================
     3) BOX FINAL — RESFRIAMENTO
  ============================================================ */
  gerarBoxFinal() {
    return {
      tipo: "final",
      titulo: "🧘‍♀️ Resfriamento & Respiração",
      descricao: "Desacelere o corpo e recupere a respiração.",
      passos: [
        "Alongamento leve — 2 min",
        "Respiração Calm Flow — 1 min",
        "Retorne ao Flow Center com presença"
      ]
    };
  },

  /* ============================================================
     4) BOX ESPECIAL – HIIT ou CARDIO
  ============================================================ */
  gerarBoxEspecial(tipo, fase) {

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
        titulo: `🔥 HIIT — ${fase}`,
        protocolo: pick(baseHiit),
        descricao: "Alta intensidade para ativar potência e coordenação.",
        opcoesAcademia: ["Bike", "Esteira", "Elíptico", "Remo"],
        opcoesCasa: ["Polichinelo", "High knees", "Burpee", "Agachamento com salto"],
        tempo_total: 360
      };
    }

    return {
      tipo: "cardio",
      titulo: "💗 Cardio Regenerativo — 10 min",
      descricao: "Movimento suave para circulação e bem-estar.",
      opcoesAcademia: ["Bike leve", "Esteira leve", "Remo leve"],
      opcoesCasa: ["Caminhada no lugar", "Corrida leve estacionária"],
      tempo_total: 600
    };
  },

  /* ============================================================
     5) BUSCAR EXERCÍCIOS DO FIREBASE
  ============================================================ */
  async buscarExercicios(nivel, enfase, fase, dia, qtd) {

    const pasta = `${nivel}_${enfase}`;
    const faseFolder = fase;
    const diaKey = `dia_${dia}`;

    const lista = await FEMFLOW._buscarExerciciosTreino({
      pasta,
      fase: faseFolder,
      diaKey,
      limite: qtd
    });

    return (Array.isArray(lista) ? lista.slice(0, qtd) : []);
  },

  /* ============================================================
     6) GERAR TREINO COMPLETO
  ============================================================ */
  async gerarTreino(nivel, enfase, fase, dia) {

    nivel = nivel.toLowerCase();
    const regrasNivel = this.regras[nivel][fase];

    const totalBoxes = regrasNivel.boxes;
    const exPorBox  = regrasNivel.ex;
    const totalHiit = regrasNivel.hiit;
    const totalCardio = regrasNivel.cardio;

    const listaFinal = [];

    // BOX 0
    listaFinal.push(this.gerarBox0());

    // LOOP DE BOXES PRINCIPAIS
    for (let i = 1; i <= totalBoxes; i++) {

      const qtd = Array.isArray(exPorBox) ? exPorBox[i - 1] : exPorBox;

      const exercicios = await this.buscarExercicios(
        nivel,
        enfase,
        fase,
        dia,
        qtd
      );

      listaFinal.push({
        tipo: "treino",
        box: i,
        exercicios
      });

      // HIIT
      if (i <= totalHiit) {
        listaFinal.push(this.gerarBoxEspecial("hiit", fase));
      }

      // CARDIO
      if (i <= totalCardio) {
        listaFinal.push(this.gerarBoxEspecial("cardio", fase));
      }
    }

    // BOX FINAL
    listaFinal.push(this.gerarBoxFinal());

    return listaFinal;
  }
};

