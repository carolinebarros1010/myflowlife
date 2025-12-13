/* ============================================================
   FEMFLOW • TREINO ENGINE v4.2 — PREMIUM 2025
   🔥 FONTE DA VERDADE: DIA DO CICLO HORMONAL
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) NORMALIZAÇÕES
============================================================ */
FEMFLOW.engineTreino.normalizarFase = raw => {
  if (!raw) return "follicular";
  const f = raw.toLowerCase().trim();
  return {
    ovulatory: "ovulatoria",
    ovulatório: "ovulatoria",
    ovulatoria: "ovulatoria",
    ovulação: "ovulatoria",
    follicular: "follicular",
    folicular: "follicular",
    luteal: "lutea",
    lutea: "lutea",
    menstrual: "menstrual",
    menstruacao: "menstrual"
  }[f] || "follicular";
};

FEMFLOW.engineTreino.normalizarNivel = raw => {
  const n = (raw || "").toLowerCase();
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
  return "iniciante";
};

FEMFLOW.engineTreino.normalizarEnfase = raw => {
  const e = (raw || "").toLowerCase().trim();
  return {
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
  }[e] || "geral";
};

/* ============================================================
   2) SÉRIE ESPECIAL
============================================================ */
FEMFLOW.engineTreino.detectarSerieEspecial = label => {
  if (!label) return null;
  const s = label.toLowerCase();
  if (s.endsWith("ae")) return "AE";
  if (s.endsWith("e"))  return "E";
  if (s.endsWith("t"))  return "T";
  if (s.endsWith("s"))  return "S";
  return null;
};

/* ============================================================
   3) FIREBASE — BLOCO NORMAL
   🔥 PRIORIDADE ABSOLUTA: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosNormais = async ({
  nivel, enfase, fase, diaCiclo
}) => {

  const faseNorm  = FEMFLOW.engineTreino.normalizarFase(fase);
  const nivelNorm = FEMFLOW.engineTreino.normalizarNivel(nivel);
  const enfNorm   = FEMFLOW.engineTreino.normalizarEnfase(enfase);
  const diaKey    = `dia_${Number(diaCiclo)}`;

  FEMFLOW.log("🔥 [NORMAL] Firebase por diaCiclo:", diaKey);

  const snap = await firebase.firestore()
    .collection("exercicios")
    .doc(`${nivelNorm}_${enfNorm}`)
    .collection("fases")
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("blocos")
    .get();

  if (snap.empty) {
    FEMFLOW.warn("⚠️ Nenhum treino encontrado:", diaKey);
    return [];
  }

  const blocos = [];
  snap.forEach(d => blocos.push(d.data()));
  return blocos;
};

/* ============================================================
   4) FIREBASE — BLOCO PERSONAL
   🔥 PRIORIDADE ABSOLUTA: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosPersonal = async ({
  id, enfase, fase, diaCiclo
}) => {

  const faseNorm = FEMFLOW.engineTreino.normalizarFase(fase);
  const enfNorm  = FEMFLOW.engineTreino.normalizarEnfase(enfase);
  const diaKey   = `dia_${Number(diaCiclo)}`;

  FEMFLOW.log("🔥 [PERSONAL] Firebase por diaCiclo:", diaKey);

  const snap = await firebase.firestore()
    .collection("personal_trainings")
    .doc(id)
    .collection(enfNorm)
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("blocos")
    .get();

  if (snap.empty) return [];

  const blocos = [];
  snap.forEach(d => blocos.push(d.data()));
  return blocos;
};

/* ============================================================
   5) ORGANIZAÇÃO + HIIT
============================================================ */
FEMFLOW.engineTreino.organizarBlocosSimples = brutos =>
  brutos.map(b => {
    const label = String(b.box || "");
    let boxNum = parseInt(label.replace(/\D/g, ""));
    if (b.tipo === "aquecimento") boxNum = -100;
    else if (b.tipo === "treino" && isNaN(boxNum)) boxNum = 1;
    else if (b.tipo === "hiit" && isNaN(boxNum)) boxNum = 500;
    else if (b.tipo === "cardio_final") boxNum = 900;
    else if (b.tipo === "resfriamento") boxNum = 999;

    return {
      ...b,
      boxNum,
      ordemNum: Number(b.ordem) || 0,
      serieEspecial: FEMFLOW.engineTreino.detectarSerieEspecial(label)
    };
  }).sort((a,b)=>a.boxNum-b.boxNum || a.ordemNum-b.ordemNum);

FEMFLOW.engineTreino.intercalarHIIT = blocos => {
  const out = [];
  let buf = [], last = null;

  const flush = () => { out.push(...buf); buf=[]; };

  for (const b of blocos) {
    if (b.tipo === "treino") {
      if (last !== null && last !== b.boxNum) flush();
      buf.push(b); last = b.boxNum;
    } else {
      flush(); out.push(b);
    }
  }
  flush();
  return out.sort((a,b)=>a.boxNum-b.boxNum);
};

/* ============================================================
   6) CONVERSÃO PARA FRONT — VERSÃO FINAL FEMFLOW
============================================================ */
FEMFLOW.engineTreino.converterParaFront = function (blocos) {
  const out = [];

  for (const b of blocos) {

    /* =========================
       AQUECIMENTO
    ========================= */
    if (b.tipo === "aquecimento") {
      out.push({
        tipo: "aquecimentoPremium",
        box: 0,
        titulo: "🌿 Aquecimento",
        passos: b.passos || []
      });
      continue;
    }

    /* =========================
       TREINO (EXERCÍCIO)
    ========================= */
    if (b.tipo === "treino") {
      out.push({
        tipo: "treino",
        box: Number(b.boxNum || b.box || 1),
        serieEspecial: b.serieEspecial || null,
        titulo: b.titulo_pt || b.titulo || "Exercício",
        link: b.link || "",
        series: b.series || "",
        reps: b.reps || "",
        intervalo: Number(b.intervalo) || 60
      });
      continue;
    }

    /* =========================
       HIIT
    ========================= */
    if (b.tipo === "hiit") {
      out.push({
        tipo: "hiitPremium",
        box: Number(b.boxNum || 500),
        titulo: b.titulo || "🔥 HIIT",
        forte: Number(b.forte) || 40,
        leve: Number(b.leve) || 20,
        ciclos: Number(b.ciclos) || 6
      });
      continue;
    }

    /* =========================
       CARDIO FINAL
    ========================= */
    if (b.tipo === "cardio_final") {
      out.push({
        tipo: "cardio_final",
        box: Number(b.boxNum || 900),
        titulo: b.titulo || "💗 Cardio Final",
        duracao: Number(b.tempo) || 600
      });
      continue;
    }

    /* =========================
       RESFRIAMENTO
    ========================= */
    if (b.tipo === "resfriamento") {
      out.push({
        tipo: "resfriamentoPremium",
        box: Number(b.boxNum || 999),
        titulo: "🧘 Resfriamento",
        passos: b.passos || []
      });
      continue;
    }
  }

  return out;
};

/* ============================================================
   7) MONTAR TREINO FINAL
============================================================ */
FEMFLOW.engineTreino.montarTreinoFinal = async ({
  id, nivel, enfase, fase, diaCiclo, personal=false
}) => {

  const blocosRaw = personal
    ? await FEMFLOW.engineTreino.carregarBlocosPersonal({ id, enfase, fase, diaCiclo })
    : await FEMFLOW.engineTreino.carregarBlocosNormais({ nivel, enfase, fase, diaCiclo });

  if (!blocosRaw.length) return [];

  const ordenados = this.organizarBlocosSimples(blocosRaw);
const comHIIT   = this.intercalarHIIT(ordenados);

/* 🔒 GARANTIR AQUECIMENTO E RESFRIAMENTO ÚNICOS */
let aquecimentoInserido = false;
let resfriamentoInserido = false;

const filtrados = comHIIT.filter(b => {
  if (b.tipo === "aquecimento") {
    if (aquecimentoInserido) return false;
    aquecimentoInserido = true;
    return true;
  }

  if (b.tipo === "resfriamento") {
    if (resfriamentoInserido) return false;
    resfriamentoInserido = true;
    return true;
  }

  return true;
});

return this.converterParaFront(filtrados);

};

