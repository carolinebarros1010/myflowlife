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

FEMFLOW.engineTreino.organizarBlocosSimples = function (brutos) {
  return brutos
    .map(b => {
      const raw = String(b.box || "").trim();
      let boxNum = parseInt(raw.replace(/\D/g, ""));

      // 🔥 PRIORIDADES FEMFLOW
      if (b.tipo === "aquecimento") boxNum = -100;
      else if (b.tipo === "treino" && isNaN(boxNum)) boxNum = 1;
      else if (b.tipo === "hiit" && isNaN(boxNum)) boxNum = 500;
      else if (b.tipo === "cardio_final") boxNum = 900;
      else if (b.tipo === "resfriamento") boxNum = 999;

      return {
        ...b,
        boxNum,
        ordemNum: parseInt(b.ordem || 0) || 0,
        serieEspecial: FEMFLOW.engineTreino.detectarSerieEspecial(raw)
      };
    })
    .sort((a, b) => {
      if (a.boxNum !== b.boxNum) return a.boxNum - b.boxNum;
      return a.ordemNum - b.ordemNum;
    });
};
FEMFLOW.engineTreino.intercalarHIIT = function (ordenados) {
  const resultado = [];
  let bufferTreino = [];
  let ultimoBox = null;

  function flushBuffer() {
    if (bufferTreino.length) {
      resultado.push(...bufferTreino);
      bufferTreino = [];
    }
  }

  for (const b of ordenados) {

    // Aquecimento → sempre no início
    if (b.tipo === "aquecimento") {
      resultado.push(b);
      continue;
    }

    // Resfriamento → sempre no final
    if (b.tipo === "resfriamento") {
      resultado.push({ ...b, boxNum: 9999 });
      continue;
    }

    // Cardio final → antes do resfriamento
    if (b.tipo === "cardio_final") {
      resultado.push({ ...b, boxNum: 9000 });
      continue;
    }

    // HIIT do próprio box → entra logo após o bloco
    if (b.tipo === "hiit" && b.boxNum >= 1) {
      flushBuffer();
      resultado.push(b);
      continue;
    }

    // HIIT genérico → vai para o final (antes do cardio)
    if (b.tipo === "hiit" && b.boxNum === 500) {
      resultado.push({ ...b, boxNum: 8000 });
      continue;
    }

    // Treino normal → acumula por box
    if (b.tipo === "treino") {
      if (ultimoBox !== null && ultimoBox !== b.boxNum) {
        flushBuffer();
      }
      bufferTreino.push(b);
      ultimoBox = b.boxNum;
    }
  }

  flushBuffer();

  return resultado.sort((a, b) => a.boxNum - b.boxNum);
};



/* ============================================================
   Firebase: carregar blocos NORMAL (exercicios/)
   ✅ Prioridade: diaPrograma (treino) → fallback: diaCiclo (segurança)
============================================================ */
FEMFLOW.engineTreino.carregarBlocosNormais = async function({
  nivel,
  enfase,
  fase,
  diaPrograma,
  diaCiclo
}) {
  const faseNorm  = this.normalizarFase(fase);
  const nivelNorm = this.normalizarNivel(nivel);
  const enfNorm   = this.normalizarEnfase(enfase);

  const dProg = Number(diaPrograma || 0);
  const dCicl = Number(diaCiclo || 0);

  const keyProg = dProg ? `dia_${dProg}` : null;
  const keyCicl = dCicl ? `dia_${dCicl}` : null;

  FEMFLOW.log("📦 [NORMAL] carregar blocos →", { nivelNorm, enfNorm, faseNorm, keyProg, keyCicl });

  const db = firebase.firestore();

  async function getByDiaKey(diaKey){
    const col = db
      .collection("exercicios")
      .doc(`${nivelNorm}_${enfNorm}`)
      .collection("fases")
      .doc(faseNorm)
      .collection("dias")
      .doc(diaKey)
      .collection("blocos");

    const snap = await col.get();
    if (snap.empty) return null;

    const blocos = [];
    snap.forEach(doc => blocos.push(doc.data()));
    return blocos;
  }

  // 1) tenta pelo diaPrograma
  if (keyProg) {
    const blocosProg = await getByDiaKey(keyProg);
    if (blocosProg && blocosProg.length) {
      FEMFLOW.log("✅ [NORMAL] achou por diaPrograma:", keyProg, blocosProg.length);
      return blocosProg;
    }
    FEMFLOW.warn("⚠️ [NORMAL] não achou por diaPrograma, tentando fallback diaCiclo...");
  }

  // 2) fallback diaCiclo
  if (keyCicl) {
    const blocosCicl = await getByDiaKey(keyCicl);
    if (blocosCicl && blocosCicl.length) {
      FEMFLOW.log("✅ [NORMAL] achou por diaCiclo:", keyCicl, blocosCicl.length);
      return blocosCicl;
    }
  }

  FEMFLOW.warn("⚠️ Nenhum BLOCO encontrado (NORMAL) nem por diaPrograma nem por diaCiclo");
  return [];
};


/* ============================================================
   Firebase: carregar blocos PERSONAL (personal_trainings/)
   ✅ Prioridade: diaPrograma → fallback: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosPersonal = async function({
  id,
  enfase,
  fase,
  diaPrograma,
  diaCiclo
}) {
  const faseNorm = this.normalizarFase(fase);
  const enfNorm  = this.normalizarEnfase(enfase);

  const dProg = Number(diaPrograma || 0);
  const dCicl = Number(diaCiclo || 0);

  const keyProg = dProg ? `dia_${dProg}` : null;
  const keyCicl = dCicl ? `dia_${dCicl}` : null;

  FEMFLOW.log("🎨 [PERSONAL] carregar blocos →", { id, enfNorm, faseNorm, keyProg, keyCicl });

  const db = firebase.firestore();

  async function getByDiaKey(diaKey){
    const snap = await db
      .collection("personal_trainings")
      .doc(id)
      .collection(enfNorm)
      .doc(faseNorm)
      .collection("dias")
      .doc(diaKey)
      .collection("blocos")
      .get();

    if (snap.empty) return null;

    const blocos = [];
    snap.forEach(doc => blocos.push(doc.data()));
    return blocos;
  }

  // 1) diaPrograma
  if (keyProg) {
    const blocosProg = await getByDiaKey(keyProg);
    if (blocosProg && blocosProg.length) {
      FEMFLOW.log("✅ [PERSONAL] achou por diaPrograma:", keyProg, blocosProg.length);
      return blocosProg;
    }
    FEMFLOW.warn("⚠️ [PERSONAL] não achou por diaPrograma, tentando fallback diaCiclo...");
  }

  // 2) fallback diaCiclo
  if (keyCicl) {
    const blocosCicl = await getByDiaKey(keyCicl);
    if (blocosCicl && blocosCicl.length) {
      FEMFLOW.log("✅ [PERSONAL] achou por diaCiclo:", keyCicl, blocosCicl.length);
      return blocosCicl;
    }
  }

  FEMFLOW.warn("⚠️ Nenhum BLOCO encontrado (PERSONAL) nem por diaPrograma nem por diaCiclo");
  return [];
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
else if (b.tipo === "hiit" && isNaN(boxNum)) boxNum = 850;  // hiit genérico
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
// Idioma atual do app
FEMFLOW.getLang = function () {
  return FEMFLOW.lang || localStorage.getItem("femflow_lang") || "pt";
};

// Função universal para obter texto multilíngue
FEMFLOW.getTituloMultilingue = function (bloco) {
  const lang = FEMFLOW.getLang(); // pt, en, fr...

  // 1) tenta título no idioma atual
  const t1 = bloco[`titulo_${lang}`];
  if (t1 && String(t1).trim() !== "") return t1;

  // 2) fallback → português
  const t2 = bloco.titulo_pt;
  if (t2 && String(t2).trim() !== "") return t2;

  // 3) fallback → título original (antigo)
  const t3 = bloco.titulo;
  if (t3 && String(t3).trim() !== "") return t3;

  // 4) fallback final
  return "Exercício";
};

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

    titulo: FEMFLOW.getTituloMultilingue(b),
    link: b.link || "",

    series: b.series || "",
    reps: b.reps || "",

    intervalo:
      b.intervalo === "" || b.intervalo === undefined || b.intervalo === null
        ? 0
        : Number(b.intervalo)
  });

  continue;
}

/* ===============================================
   🔥 HIIT PREMIUM
=============================================== */
if (b.tipo === "hiit") {

  // garantir que HIIT sempre fique fora do bloco de exercícios
  const boxHiit = (b.boxNum >= 1) ? b.boxNum + 100 : 850;

  saida.push({
    tipo: "hiitPremium",
    box: boxHiit,
    titulo: b.titulo || "🔥 HIIT Premium",
    forte: Number(b.forte) || 30,
    leve: Number(b.leve) || 30,
    ciclos: Number(b.ciclos) || 6
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
  diaPrograma,
  diaCiclo,
  personal = false
}) { 
   
  FEMFLOW.log("🚀 montarTreinoFinal()", { id, nivel, enfase, fase, diaCiclo, personal });

  /* ----------------------------------------------------------
     1) Carregar blocos brutos do Firebase
  ---------------------------------------------------------- */
  let blocosRaw = [];

  if (personal) {
  blocosRaw = await this.carregarBlocosPersonal({ id, enfase, fase, diaPrograma, diaCiclo });
} else {
  blocosRaw = await this.carregarBlocosNormais({ nivel, enfase, fase, diaPrograma, diaCiclo });
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

