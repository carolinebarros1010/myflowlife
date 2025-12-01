/* ============================================================
   FEMFLOW • TREINO ENGINE v4.1 — PREMIUM 2025
   ------------------------------------------------------------
   BLOCO A — Núcleo do Engine
   - Normalização fase / nível / ênfase
   - Detectar séries especiais
   - Preparação da ordenação
   - Lógica HIIT entre boxes (Modo B)
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
   4) Detectar Série Especial (2E / 3T / 3S / 4E / 2AE etc)
============================================================ */
FEMFLOW.engineTreino.detectarSerieEspecial = function (boxLabel) {
  if (!boxLabel) return null;
  const s = boxLabel.toString().toLowerCase();

  if (s.endsWith("ae")) return "AE"; // 2AE
  if (s.endsWith("e")) return "E";   // 2E
  if (s.endsWith("t")) return "T";   // 3T
  if (s.endsWith("s")) return "S";   // 3S

  return null;
};

/* ============================================================
   5) Organizar blocos (ordem REAL)
============================================================ */
FEMFLOW.engineTreino.organizarBlocosSimples = function (blocosRaw) {

  return blocosRaw
    .map(b => {

      b.boxRaw = String(b.box || "");

      // extrair número → 2E vira 2
      b.boxNum =
        parseInt(b.boxRaw.replace(/\D/g, "")) ||
        (b.tipo === "hiit" ? 0 : 1);

      b.serieEspecial = this.detectarSerieEspecial(b.boxRaw);

      b.ordemNum = parseInt(b.ordem) || 0;

      return b;
    })
    .sort((a, b) => {
      if (a.boxNum !== b.boxNum) return a.boxNum - b.boxNum;
      return a.ordemNum - b.ordemNum;
    });
};

/* ============================================================
   6) Intercalar HIIT entre boxes (Modo B)
============================================================ */
FEMFLOW.engineTreino.intercalarHIIT = function (ordenados) {

  const final = [];

  let ultimoBox = 0;
  ordenados.forEach(b => {
    if (b.tipo === "treino") ultimoBox = Math.max(ultimoBox, b.boxNum);
  });

  ordenados.forEach(b => {

    // Copia sempre o item no fluxo
    final.push(b);

    if (b.tipo !== "treino") return;

    // Procurar HIIT cujo box = box atual
    const hiitsMesmoBox = ordenados.filter(h =>
      h.tipo === "hiit" &&
      parseInt(h.boxRaw.replace(/\D/g, "")) === b.boxNum
    );

    hiitsMesmoBox.forEach(h => final.push(h));

    // HIIT box=0 será inserido após o último box REAL
    if (b.boxNum === ultimoBox) {
      const hiitZero = ordenados.filter(h =>
        h.tipo === "hiit" &&
        (parseInt(h.boxRaw.replace(/\D/g, "")) || 0) === 0
      );
      hiitZero.forEach(h => final.push(h));
    }
  });

  return final;
};

/* ============================================================
   Firebase: carregar blocos NORMAL (exercicios/)
============================================================ */
FEMFLOW.engineTreino.carregarBlocosNormais = async function({
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
   Firebase: carregar blocos PERSONAL (personal_trainings/)
============================================================ */
FEMFLOW.engineTreino.carregarBlocosPersonal = async function({
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
   BLOCO B — ORGANIZAÇÃO + HIIT INTERCALADO
============================================================ */

/* ============================================================
   1) Organizar Blocos SIMPLES (box + ordem)
============================================================ */
FEMFLOW.engineTreino.organizarBlocosSimples = function (brutos) {

  FEMFLOW.log("📑 organizarBlocosSimples() → recebidos:", brutos);

  return brutos
    .map(b => {
      const boxLabel = String(b.box || "").trim();

      // número do box (default = 0)
     let boxNum = parseInt(boxLabel.replace(/\D/g, ""));

// PRIORIDADES FIXAS:
if (b.tipo === "aquecimento") boxNum = -100;       // sempre no início
else if (b.tipo === "treino" && isNaN(boxNum)) boxNum = 1; // treino sem box → box 1
else if (b.tipo === "hiit" && isNaN(boxNum)) boxNum = 0;   // hiit genérico
else if (b.tipo === "cardio_final") boxNum = 900;  // antes do resfriamento
else if (b.tipo === "resfriamento") boxNum = 999;  // sempre no final


      // detectar série especial: 2E, 3S, 3T, 2Ae...
      const serieEspecial = FEMFLOW.engineTreino.detectarSerieEspecial(boxLabel);

      return {
        ...b,
        boxNum,
        serieEspecial,
        ordemNum: parseInt(b.ordem || 0) || 0,
      };
    })
    .sort((a, b) => {
      if (a.boxNum !== b.boxNum) return a.boxNum - b.boxNum;
      return a.ordemNum - b.ordemNum;
    });
};

/* ============================================================
   2) Intercalar HIIT entre boxes (Modo B)
============================================================ */
/*
Regras:
- HIIT com boxNum = 0 → enviado para o final (não intercalar)
- HIIT com boxNum = N → vem após o bloco N
- Dentro de cada box, treinos vêm primeiro e HIIT depois
*/
FEMFLOW.engineTreino.intercalarHIIT = function (blocos) {

  FEMFLOW.log("🔥 intercalarHIIT() — Entrada:", blocos);

  const resultado = [];
  let ultimoBox = null;
  let bufferTreino = [];

  function soltarBuffer() {
    if (bufferTreino.length) {
      resultado.push(...bufferTreino);
      bufferTreino = [];
    }
  }

  for (const b of blocos) {

    /* --------------------------------------------------------
       1) AQUECIMENTO → sempre no início (boxNum = 0)
    -------------------------------------------------------- */
    if (b.tipo === "aquecimento") {
      resultado.push({ ...b, boxNum: 0 });
      continue;
    }

    /* --------------------------------------------------------
       2) RESFRIAMENTO → empurrar para o final
    -------------------------------------------------------- */
    if (b.tipo === "resfriamento") {
      resultado.push({ ...b, boxNum: 9998 });
      continue;
    }

    /* --------------------------------------------------------
       3) CARDIO FINAL → sempre no final
    -------------------------------------------------------- */
    if (b.tipo === "cardio_final") {
      resultado.push({ ...b, boxNum: 9999 });
      continue;
    }

    /* --------------------------------------------------------
       4) HIIT DO BOX (boxNum ≥ 1)
    -------------------------------------------------------- */
    if (b.tipo === "hiit" && b.boxNum >= 1) {

      // solta exercícios do box antes do HIIT dele
      soltarBuffer();

      resultado.push(b);
      continue;
    }

    /* --------------------------------------------------------
       5) HIIT GENÉRICO (boxNum = 0) → vai para o final
    -------------------------------------------------------- */
   if (b.tipo === "hiit" && b.boxNum === 0) {
  resultado.push({ ...b, boxNum: 500 }); // antes de cardio/resfriamento
  continue;
}

    /* --------------------------------------------------------
       6) BOX NORMAL — juntando exercícios
    -------------------------------------------------------- */
    if (b.tipo === "treino") {

      // mudança de box → solta o buffer
      if (ultimoBox !== null && ultimoBox !== b.boxNum) {
        soltarBuffer();
      }

      // acumular exercício dentro do box
      bufferTreino.push(b);
      ultimoBox = b.boxNum;
      continue;
    }
  }

  // soltar últimos exercícios do último box
  soltarBuffer();

  /* --------------------------------------------------------
     7) Ordenar resultado pelos boxNum finais
  -------------------------------------------------------- */
  const organizado = resultado.sort((a, b) => a.boxNum - b.boxNum);

  FEMFLOW.log("🎯 intercalarHIIT — Resultado final:", organizado);

  return organizado;
};
/* ============================================================
   BLOCO C — Conversor + MONTAR TREINO FINAL
============================================================ */

/* ============================================================
   7) Conversão → estrutura final do front
============================================================ */
FEMFLOW.engineTreino.converterParaFront = function (blocos) {

  FEMFLOW.log("🧩 ConverterParaFront → RECEBIDO:", blocos);

  const saida = [];

  for (const b of blocos) {

    /* ===============================================
       🔥 AQUECIMENTO PREMIUM
    =============================================== */
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

    /* ===============================================
       🔥 TREINO PRINCIPAL
    =============================================== */
    if (b.tipo === "treino") {

      saida.push({
        tipo: "treino",
        box: b.boxNum,
        serieEspecial: b.serieEspecial || null,

        titulo: b.titulo || "",
        link: b.link || "",

        series: b.series || "",
        reps: b.reps || "",

        intervalo: Number(b.intervalo) || 0
      });

      continue;
    }

    /* ===============================================
       🔥 HIIT PREMIUM
    =============================================== */
    if (b.tipo === "hiit") {

      saida.push({
        tipo: "hiitPremium",
        box: b.boxNum,   // para intercalar no bloco correto
        titulo: b.titulo || "🔥 HIIT",

       forte: Number(b.forte) || 0,
      leve: Number(b.leve) || 0,
      ciclos: Number(b.ciclos) || 1

      });

      continue;
    }

    /* ===============================================
       🔥 CARDIO FINAL (v4)
    =============================================== */
    if (b.tipo === "cardio_final") {
      saida.push({
        tipo: "cardio_final",
        box: b.boxNum || 999, 
        titulo: b.titulo || "💗 Cardio Final",
        duracao: Number(b.tempo) || 600,
        intensidade: "leve",
        descricao: "Cardio leve contínuo"
      });
      continue;
    }

    /* ===============================================
       🔥 RESFRIAMENTO PREMIUM
    =============================================== */
    if (b.tipo === "resfriamento") {
      saida.push({
        tipo: "resfriamentoPremium",
        box: b.boxNum || 999,
        titulo: "🧘 Resfriamento Premium",
        passos: [
          { nome: "Alongamentos Leves — 2 min" },
          { nome: "Respiração — 1 min" }
        ]
      });
      continue;
    }

    FEMFLOW.warn("⚠️ Tipo desconhecido:", b);
  }

  FEMFLOW.log("📦 Conversão finalizada →", saida);
  return saida;
};

/* ============================================================
   8) MONTAR TREINO FINAL (NORMAL ou PERSONAL)
============================================================ */
FEMFLOW.engineTreino.montarTreinoFinal = async function ({
  id,
  nivel,
  enfase,
  fase,
  diaCiclo,
  personal = false
}) {

  FEMFLOW.log("🚀 montarTreinoFinal()", { id, nivel, enfase, fase, diaCiclo, personal });

  /* ----------------------------------------------------------
     1) Carregar blocos brutos do Firebase
  ---------------------------------------------------------- */
  let blocosRaw = [];

  if (personal) {
    blocosRaw = await this.carregarBlocosPersonal({ id, enfase, fase, diaCiclo });
  } else {
    blocosRaw = await this.carregarBlocosNormais({ nivel, enfase, fase, diaCiclo });
  }

  if (!blocosRaw || !blocosRaw.length) {
    FEMFLOW.error("❌ Nenhum bloco encontrado.");
    return [];
  }

  FEMFLOW.log("📥 blocosRaw:", blocosRaw);

  /* ----------------------------------------------------------
     2) Organizar blocos (box + ordem)
  ---------------------------------------------------------- */
  const ordenados = this.organizarBlocosSimples(blocosRaw);

  FEMFLOW.log("📑 Ordenados:", ordenados);

  /* ----------------------------------------------------------
     3) Intercalar HIIT (Modo B)
  ---------------------------------------------------------- */
  const comHIIT = this.intercalarHIIT(ordenados);

  FEMFLOW.log("🔥 Com HIIT Intercalado:", comHIIT);

  /* ----------------------------------------------------------
     4) Converter → estrutura final do front
  ---------------------------------------------------------- */
  const final = this.converterParaFront(comHIIT);

  FEMFLOW.log("🎉 TREINO FINAL MONTADO:", final);

  return final;
};

