/* ============================================================
   FEMFLOW • TREINO ENGINE v3.1 — PREMIUM 2025 (COMPLETO)
   NADA REMOVIDO • SOMENTE AJUSTES QUE NÃO QUEBRAM O FLUXO
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ---- 1. NORMALIZAR FASE ---- */
FEMFLOW.engineTreino.normalizarFase = function (faseRaw) {
  if (!faseRaw) return "follicular";
  const f = faseRaw.toLowerCase().trim();

  const mapa = {
    "ovulatory": "ovulatoria",
    "ovulatório": "ovulatoria",
    "ovulacao": "ovulatoria",
    "ovulatoria": "ovulatoria",

    "follicular": "follicular",
    "folicular":  "follicular",

    "luteal": "lutea",
    "lutea":  "lutea",

    "menstrual": "menstrual"
  };

  return mapa[f] || "follicular";
};


/* ---- 2. REGRAS ---- */
FEMFLOW.engineTreino.regras = {
  iniciante: {
    menstrual:   { totalBoxes: 1, ex:[3], hiit:[0], cardio:[1] },
    folicular:   { totalBoxes: 2, ex:[3,3], hiit:[1,1], cardio:[0,1] },
    ovulatoria:  { totalBoxes: 2, ex:[3,3], hiit:[1,1], cardio:[0,0] },
    lutea:       { totalBoxes: 2, ex:[3,3], hiit:[1,0], cardio:[0,1] }
  },

  intermediaria: {
    menstrual:   { totalBoxes: 1, ex:[4], hiit:[0], cardio:[1] },
    folicular:   { totalBoxes: 2, ex:[3,3], hiit:[1,1], cardio:[0,0] },
    ovulatoria:  { totalBoxes: 3, ex:[2,2,2], hiit:[1,1,1], cardio:[0,0,0] },
    lutea:       { totalBoxes: 2, ex:[3,3], hiit:[1,0], cardio:[0,1] }
  },

  avancada: {
    menstrual:   { totalBoxes: 1, ex:[4], hiit:[0], cardio:[1] },
    folicular:   { totalBoxes: 2, ex:[3,4], hiit:[1,1], cardio:[0,0] },
    ovulatoria:  { totalBoxes: 3, ex:[3,3,3], hiit:[1,1,1], cardio:[0,0,0] },
    lutea:       { totalBoxes: 2, ex:[4,4], hiit:[1,0], cardio:[0,1] }
  }
};


/* ---- 3. INTERVALO POR REPS ---- */
FEMFLOW.engineTreino.calcularIntervaloPorReps = reps => {
  reps = Number(reps);
  if (reps >= 6 && reps <= 8) return 90;
  if (reps > 8 && reps <= 12) return 60;
  if (reps > 12 && reps <= 18) return 45;
  return 60;
};


/* ---- 4. SÉRIES ---- */
FEMFLOW.engineTreino.calcularSeries = function (fase, nivel) {
  fase  = fase.toLowerCase();
  nivel = nivel.toLowerCase();

  if (fase === "menstrual")   return nivel === "iniciante" ? 2 : 3;
  if (fase === "follicular")  return nivel === "iniciante" ? 3 : 4;
  if (fase === "ovulatoria")  return 4;
  if (fase === "lutea")       return nivel === "iniciante" ? 3 : 4;

  return 3;
};


/* ---- 5. EXTRAI REPS ---- */
FEMFLOW.engineTreino.extrairReps = raw => {
  if (!raw) return 10;
  if (String(raw).includes("-")) {
    return Number(raw.split("-")[0]);
  }
  return Number(raw);
};


/* ---- 6. NÍVEL ---- */
FEMFLOW.engineTreino.normalizarNivel = nivelRaw => {
  nivelRaw = nivelRaw.toLowerCase();
  if (nivelRaw.startsWith("inic")) return "iniciante";
  if (nivelRaw.startsWith("inter"))return "intermediaria";
  if (nivelRaw.startsWith("avan")) return "avancada";
  return "iniciante";
};


/* ---- 7. ENFASE ---- */
FEMFLOW.engineTreino.normalizarEnfase = raw => {
  raw = (raw||"").toLowerCase();
  const mapa = {
    gluteo:"gluteo",
    quadriceps:"quadriceps",
    posteriores:"posteriores",
    costas:"costas",
    braco:"braco",
    corrida:"corrida",
    beach:"beach",
    adaptacao:"adaptacao",
    casa:"casa",
    geral:"geral",
    remo:"remo",
    natacao:"natacao"
  };

  return mapa[raw] || "geral";
};


/* ---- 8. AQUECIMENTO ---- */
FEMFLOW.engineTreino.boxAquecimento = ()=>({
  tipo:"aquecimentoPremium",
  titulo:"🌿 Aquecimento Premium",
  descricao:"Prepare articulações, respiração e corpo para o treino.",
  passos:[
    "Mobilidade quadril – 40s",
    "Mobilidade torácica – 40s",
    "Mobilidade ombro – 40s",
    "Caminhada leve – 5min"
  ],
  protocolo:"wake"
});


/* ---- 9. RESFRIAMENTO ---- */
FEMFLOW.engineTreino.boxResfriamento = ()=>({
  tipo:"resfriamentoPremium",
  titulo:"🧘 Resfriamento & Respiração",
  descricao:"Desacelere corpo e mente, finalize o treino.",
  passos:["Alongamento leve – 2 min","Respiração + retorno – 1 min"],
  protocolo:"release"
});


/* ---- 10. HIIT BUBBLE ---- */
FEMFLOW.engineTreino.boxHIIT = fase => ({
  tipo:"hiitBubble",
  titulo:`🔥 HIIT — ${fase}`,
  tempoForca:60,
  tempoDesc:30,
  ciclos:3
});


/* ---- 11. CARDIO ---- */
FEMFLOW.engineTreino.boxCardio = ()=>({
  tipo:"cardio",
  titulo:"💗 Cardio Leve — 10 min",
  tempo_total:600
});


/* ---- 12. BUSCAR EXERCÍCIOS FIREBASE ---- */
FEMFLOW.engineTreino.buscarMultiBox = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo,
  qtdBoxes,
  exPorBox
}) {
  const faseNorm   = this.normalizarFase(fase);
  const nivelNorm  = this.normalizarNivel(nivel);
  const enfaseNorm = this.normalizarEnfase(enfase);

  const pasta  = `${nivelNorm}_${enfaseNorm}`;
  const diaKey = `dia_${diaCiclo}`;

  FEMFLOW.log("📦 Firestore pasta:",pasta,"| fase:",faseNorm,"| dia:",diaKey);

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

  if (snap.empty) {
    FEMFLOW.log("⚠️ Firestore vazio");
    return [];
  }

  const todos=[];
  snap.forEach(doc => todos.push(doc.data()));

  const shuffled = todos.sort(()=>Math.random()-0.5);

  let cursor=0;
  const boxes=[];
  const seriesPadrao = this.calcularSeries(faseNorm,nivelNorm);

  for(let i=0;i<qtdBoxes;i++){
    const qtEx = exPorBox[i];
    const bloco = shuffled.slice(cursor,cursor+qtEx);
    cursor+=qtEx;

    bloco.forEach(ex=>{
      ex.nome   = ex.nome || ex.titulo || "Exercício";
      ex.titulo = ex.nome;

      ex.reps = this.extrairReps(ex.reps);
      ex.series = seriesPadrao;
      ex.intervalo = this.calcularIntervaloPorReps(ex.reps);
    });

    boxes.push({
      tipo:"treino",
      box: i+1,
      exercicios:bloco
    });
  }

  return boxes;
};


/* ---- 13. ENGINE FINAL ---- */
FEMFLOW.engineTreino.montarTreino = async function ({
  nivel,
  enfase,
  fase,
  diaCiclo
}) {

  const faseNorm  = this.normalizarFase(fase);
  const nivelNorm = this.normalizarNivel(nivel);

  const regras = this.regras[nivelNorm][faseNorm];
  const lista = [];

  /* 1) AQUECIMENTO */
  lista.push(this.boxAquecimento());

  /* 2) BOXES DO FIREBASE */
  const boxesFirebase = await this.buscarMultiBox({
    nivel:nivelNorm,
    enfase,
    fase:faseNorm,
    diaCiclo,
    qtdBoxes:regras.totalBoxes,
    exPorBox:regras.ex
  });

  /* 3) INTERCALAR TREINO / HIIT / CARDIO */
  for(let i=0;i<regras.totalBoxes;i++){
    if(!boxesFirebase[i]) continue;

    lista.push(boxesFirebase[i]);

    if(regras.hiit[i])   lista.push(this.boxHIIT(faseNorm));
    if(regras.cardio[i]) lista.push(this.boxCardio());
  }

  /* 4) RESFRIAMENTO */
  lista.push(this.boxResfriamento());

  return lista;
};
