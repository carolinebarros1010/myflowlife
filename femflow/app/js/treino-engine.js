/* ============================================================
   FEMFLOW • TREINO ENGINE v4.1 — PREMIUM 2025
   ------------------------------------------------------------
   BLOCO A — Núcleo do Engine
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
  if (s.endsWith("ae")) return "AE";
  if (s.endsWith("e")) return "E";
  if (s.endsWith("t")) return "T";
  if (s.endsWith("s")) return "S";
  return null;
};

/* ============================================================
   BLOCO B — ORGANIZAÇÃO + HIIT INTERCALADO
============================================================ */
FEMFLOW.engineTreino.organizarBlocosSimples = function (brutos) {
  return brutos
    .map(b => {
      const label = String(b.box || "").trim();
      let boxNum = parseInt(label.replace(/\D/g, ""));

      if (b.tipo === "aquecimento") boxNum = -100;
      else if (b.tipo === "treino" && isNaN(boxNum)) boxNum = 1;
      else if (b.tipo === "hiit" && isNaN(boxNum)) boxNum = 850;
      else if (b.tipo === "cardio_final") boxNum = 900;
      else if (b.tipo === "resfriamento") boxNum = 999;

      return {
        ...b,
        boxNum,
        ordemNum: parseInt(b.ordem || 0) || 0,
        serieEspecial: FEMFLOW.engineTreino.detectarSerieEspecial(label)
      };
    })
    .sort((a, b) => {
      if (a.boxNum !== b.boxNum) return a.boxNum - b.boxNum;
      return a.ordemNum - b.ordemNum;
    });
};

FEMFLOW.engineTreino.intercalarHIIT = function (blocos) {
  const resultado = [];
  let buffer = [];
  let ultimoBox = null;

  function flush() {
    if (buffer.length) {
      resultado.push(...buffer);
      buffer = [];
    }
  }

  for (const b of blocos) {

    if (b.tipo === "aquecimento") {
      resultado.push({ ...b, boxNum: 0 });
      continue;
    }

    if (b.tipo === "resfriamento") {
      resultado.push({ ...b, boxNum: 9998 });
      continue;
    }

    if (b.tipo === "cardio_final") {
      resultado.push({ ...b, boxNum: 9999 });
      continue;
    }

    if (b.tipo === "hiit" && b.boxNum >= 1) {
      flush();
      resultado.push(b);
      continue;
    }

    if (b.tipo === "hiit" && b.boxNum === 0) {
      resultado.push({ ...b, boxNum: 500 });
      continue;
    }

    if (b.tipo === "treino") {
      if (ultimoBox !== null && ultimoBox !== b.boxNum) flush();
      buffer.push(b);
      ultimoBox = b.boxNum;
    }
  }

  flush();
  return resultado.sort((a, b) => a.boxNum - b.boxNum);
};

/* ============================================================
   BLOCO C — CONVERSÃO PARA FRONT
============================================================ */
FEMFLOW.getLang = () =>
  FEMFLOW.lang || localStorage.getItem("femflow_lang") || "pt";

FEMFLOW.getTituloMultilingue = function (b) {
  const lang = FEMFLOW.getLang();
  return b[`titulo_${lang}`] || b.titulo_pt || b.titulo || "Exercício";
};

FEMFLOW.engineTreino.converterParaFront = function (blocos) {
  const saida = [];

  for (const b of blocos) {

    if (b.tipo === "aquecimento") {
      saida.push({
        tipo: "aquecimentoPremium",
        box: 0,
        titulo: "🌿 Aquecimento Premium",
        passos: [
          { nome: "Mobilidade de Quadril (40s)" },
          { nome: "Mobilidade Torácica (40s)" },
          { nome: "Mobilidade de Ombro (40s)" },
          { nome: "Caminhada Leve – 5 min" }
        ]
      });
      continue;
    }

    if (b.tipo === "treino") {
      saida.push({
        tipo: "treino",
        box: b.boxNum,
        serieEspecial: b.serieEspecial || null,
        titulo: FEMFLOW.getTituloMultilingue(b),
        link: b.link || "",
        series: b.series || "",
        reps: b.reps || "",
        intervalo: Number(b.intervalo) || 0
      });
      continue;
    }

    if (b.tipo === "hiit") {
      saida.push({
        tipo: "hiitPremium",
        box: b.boxNum, // 🔥 AJUSTE FINAL — NÃO REORDENA
        titulo: b.titulo || "🔥 HIIT Premium",
        forte: Number(b.forte) || 30,
        leve: Number(b.leve) || 30,
        ciclos: Number(b.ciclos) || 6
      });
      continue;
    }

    if (b.tipo === "cardio_final") {
      saida.push({
        tipo: "cardio_final",
        box: b.boxNum,
        titulo: b.titulo || "💗 Cardio Final",
        duracao: Number(b.tempo) || 600
      });
      continue;
    }

    if (b.tipo === "resfriamento") {
      saida.push({
        tipo: "resfriamentoPremium",
        box: b.boxNum,
        titulo: "🧘 Resfriamento Premium",
        passos: [
          { nome: "Alongamentos Leves — 2 min" },
          { nome: "Respiração — 1 min" }
        ]
      });
    }
  }

  return saida;
};

/* ============================================================
   8) MONTAR TREINO FINAL
============================================================ */
FEMFLOW.engineTreino.montarTreinoFinal = async function ({
  id, nivel, enfase, fase, diaPrograma, diaCiclo, personal = false
}) {

  let blocosRaw = personal
    ? await this.carregarBlocosPersonal({ id, enfase, fase, diaPrograma, diaCiclo })
    : await this.carregarBlocosNormais({ nivel, enfase, fase, diaPrograma, diaCiclo });

  if (!blocosRaw?.length) return [];

  const ordenados = this.organizarBlocosSimples(blocosRaw);
  const comHIIT   = this.intercalarHIIT(ordenados);
  return this.converterParaFront(comHIIT);
};

