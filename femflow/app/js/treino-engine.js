/* ============================================================
   FEMFLOW • TREINO ENGINE v4.0 — PREMIUM 2025
   ------------------------------------------------------------
   - Modelo FINAL: blocos (tipo, box, ordem, etc.)
   - Firebase 100% dinâmico
   - Séries Especiais: 2E / 2Ae / 3T / 3S / 4E...
   - HIIT vindo do Firestore
   - Cardio final vindo do Firestore
   - Debug EXTREMO ON
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) Normalização de fase
============================================================ */
FEMFLOW.engineTreino.normalizarFase = function (raw) {
  if (!raw) return "follicular";

  const f = raw.toLowerCase().trim();
  const mapa = {
    ovulatory: "ovulatoria",
    "ovulatório": "ovulatoria",
    ovulatoria: "ovulatoria",
    ovulação: "ovulatoria",
    follicular: "follicular",
    folicular: "follicular",
    luteal: "lutea",
    lutea: "lutea",
    menstrual: "menstrual",
    menstruacao: "menstrual"
  };
  return mapa[f] || "follicular";
};

/* ============================================================
   2) Normalização de nível
============================================================ */
FEMFLOW.engineTreino.normalizarNivel = function (raw) {
  const n = (raw || "").toLowerCase();
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
  return "iniciante";
};

/* ============================================================
   3) Normalização de ênfase
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
    personal: "personal"
  };
  return mapa[e] || "geral";
};

/* ============================================================
   4) Detectar Série Especial
============================================================ */
FEMFLOW.engineTreino.detectarSerieEspecial = function (boxLabel) {
  if (!boxLabel) return null;
  const s = boxLabel.toString().toLowerCase();

  if (/e$/.test(s)) return "E";     // ex: 2E, 3E
  if (/ae$/.test(s)) return "AE";   // ex: 2Ae
  if (/t$/.test(s)) return "T";     // ex: 3T
  if (/s$/.test(s)) return "S";     // ex: 3S
  if (/[a-z]$/i.test(s)) {
    return s.slice(-1).toUpperCase();
  }
  return null;
};

/* ============================================================
   5) Firebase: carregar blocos NORMAL
============================================================ */
FEMFLOW.engineTreino.carregarBlocosNormais = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {
  const faseNorm = this.normalizarFase(fase);
  const nivelNorm = this.normalizarNivel(nivel);
  const enfNorm = this.normalizarEnfase(enfase);
  const diaKey = `dia_${diaCiclo}`;

  FEMFLOW.log("📦 [NORMAL] carregando blocos →", nivelNorm, enfNorm, faseNorm, diaKey);

  const db = firebase.firestore();

  const col = db
    .collection("exercicios")
    .doc(`${nivelNorm}_${enfNorm}`)
    .collection("fases")
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("blocos");

  const snap = await col.get();

  if (snap.empty) {
    FEMFLOW.warn("⚠️ Nenhum BLOCO encontrado (NORMAL)");
    return [];
  }

  const blocos = [];
  snap.forEach(doc => blocos.push(doc.data()));

  FEMFLOW.log("🔍 Blocos recebidos:", blocos.length);
  return blocos;
};

/* ============================================================
   6) Firebase: carregar blocos PERSONAL
============================================================ */
FEMFLOW.engineTreino.carregarBlocosPersonal = async function ({
  id,
  enfase,
  fase,
  diaCiclo
}) {
  const faseNorm = this.normalizarFase(fase);
  const enfNorm = this.normalizarEnfase(enfase);
  const diaKey = `dia_${diaCiclo}`;

  FEMFLOW.log("🎨 [PERSONAL] carregando blocos →", id, enfNorm, faseNorm, diaKey);

  const db = firebase.firestore();

  const snap = await db
    .collection("personal_trainings")
    .doc(id)
    .collection(enfNorm)
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("blocos")
    .get();

  if (snap.empty) {
    FEMFLOW.warn("⚠️ Nenhum BLOCO encontrado (PERSONAL)");
    return [];
  }

  const blocos = [];
  snap.forEach(doc => blocos.push(doc.data()));

  FEMFLOW.log("🔍 Blocos PERSONAL:", blocos.length);
  return blocos;
};

/* ============================================================
   7) Agrupar blocos → ordenar por box → ordem
============================================================ */
FEMFLOW.engineTreino.organizarBlocos = function (blocos) {
  FEMFLOW.log("📑 Organizando blocos…");

  return blocos
    .map(b => {
      b.boxNum = parseInt((b.box || "1").replace(/\D/g, "")) || 1;
      b.serieEspecial = this.detectarSerieEspecial(b.box);
      return b;
    })
    .sort((a, b) => {
      if (a.boxNum !== b.boxNum) return a.boxNum - b.boxNum;
      return (parseInt(a.ordem) || 0) - (parseInt(b.ordem) || 0);
    });
};

/* ============================================================
   8) Converter blocos → estrutura final do front
============================================================ */
FEMFLOW.engineTreino.converterParaFront = function (blocos) {
  FEMFLOW.log("🧩 Convertendo blocos (v4)…");

  const mapa = {}; // agrupador por boxNum

  for (const b of blocos) {

    /* ------- AGRUPAR TREINO ------- */
    if (b.tipo === "treino") {

      if (!mapa[b.boxNum]) {
        mapa[b.boxNum] = {
          tipo: "treino",
          box: b.boxNum,
          serieEspecial: b.serieEspecial,
          exercicios: []
        };
      }

      mapa[b.boxNum].exercicios.push({
        ordem: Number(b.ordem) || 0,
        titulo: b.titulo || "",
        link: b.link || "",
        youtube: b.youtube || "",
        series: b.series || "",
        reps: b.reps || "",
        intervalo: b.serieEspecial ? 0 : (b.intervalo || 60)
      });
    }

    /* ------- HIIT, CARDIO, AQUECIMENTO, RESFRIAMENTO (igual antes) ------- */
    if (b.tipo === "hiit") {
      mapa[`hiit_${b.boxNum}`] = {
        tipo: "hiitPremium",
        titulo: b.titulo || "🔥 HIIT",
        forte: Number(b.forte) || 30,
        leve: Number(b.leve) || 30,
        ciclos: Number(b.ciclos) || 6
      };
    }

    if (b.tipo === "cardio_final") {
      mapa[`cardio_${b.boxNum}`] = {
        tipo: "cardio_final",
        titulo: b.titulo || "Cardio Final",
        descricao: b.descricao || "",
        duracao: Number(b.tempo) || 10,
        intensidade: b.intensidade || "leve"
      };
    }

    if (b.tipo === "aquecimento") {
      mapa[`aq_${b.boxNum}`] = {
        tipo: "aquecimentoPremium",
        passos: [
          { nome: "Mobilidade Geral — 2 min" },
          { nome: "Ativação Leve — 1 min" }
        ]
      };
    }

    if (b.tipo === "resfriamento") {
      mapa[`rf_${b.boxNum}`] = {
        tipo: "resfriamentoPremium",
        passos: [
          { nome: "Alongamento Leve — 2 min" },
          { nome: "Respiração — 1 min" }
        ]
      };
    }
  }

  /* ---- 🔥 ORDENAR EXERCÍCIOS DENTRO DE CADA BOX POR "ordem" ---- */
  Object.values(mapa).forEach(box => {
    if (box.exercicios) {
      box.exercicios.sort((a, b) => a.ordem - b.ordem);
    }
  });

  /* ---- 🔥 Ordenar boxes pelo número ---- */
  const final = Object.values(mapa).sort((a, b) => {
    const A = a.box || 999;
    const B = b.box || 999;
    return A - B;
  });

  FEMFLOW.log("📦 Lista final por BOX:", final);
  return final;
};

/* ============================================================
   9) MONTAR TREINO FINAL (NORMAL ou PERSONAL)
============================================================ */
FEMFLOW.engineTreino.montarTreinoFinal = async function ({
  id,
  nivel,
  enfase,
  fase,
  diaCiclo,
  personal = false
}) {
  FEMFLOW.log("🚀 Iniciando montagem do treino…");
  FEMFLOW.log({ id, nivel, enfase, fase, diaCiclo, personal });

  let blocos = [];

  if (personal) {
    blocos = await this.carregarBlocosPersonal({ id, enfase, fase, diaCiclo });
  } else {
    blocos = await this.carregarBlocosNormais({ nivel, enfase, fase, diaCiclo });
  }

  if (!blocos.length) {
    FEMFLOW.error("❌ Nenhum bloco encontrado!");
    return [];
  }

  const organizados = this.organizarBlocos(blocos);
  const final = this.converterParaFront(organizados);

  FEMFLOW.log("🎉 TREINO MONTADO!", final);
  return final;
};

