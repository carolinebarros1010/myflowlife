/* ============================================================
   FEMFLOW • TREINO ENGINE v4.2 — PREMIUM 2025
   🔥 FONTE DA VERDADE: CICLO DE TREINO (AB/ABC/ABCD/ABCDE)
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) NORMALIZAÇÕES
============================================================ */
FEMFLOW.engineTreino.isExtraEnfase = enfase =>
  String(enfase || "").toLowerCase().trim().startsWith("extra_");

FEMFLOW.engineTreino.normalizarCicloTreino = raw => {
  const ciclo = String(raw || "")
    .toUpperCase()
    .replace(/[^A-E]/g, "");
  if (!ciclo) return "";
  return Array.from(new Set(ciclo.split(""))).join("").slice(0, 5);
};

FEMFLOW.engineTreino.normalizarNivel = raw => {
  const n = String(raw || "").toLowerCase().trim();
  if (!n) return null;
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
  return n; // 🔥 respeita backend
};


/* ============================================================
   2) SÉRIE ESPECIAL
============================================================ */
FEMFLOW.engineTreino.detectarSerieEspecial = label => {
  if (!label) return null;

  const s = label.toLowerCase().replace(/\s+/g, "");

  const regras = [
    { sufixo: "sm",  codigo: "SM" }, // submáxima
    { sufixo: "cc",  codigo: "CC" }, // cadência controlada
    { sufixo: "rp",  codigo: "RP" }, // rest-pause
    { sufixo: "ae",  codigo: "AE" }, // all out
    { sufixo: "d",   codigo: "D"  }, // dropset
    { sufixo: "q",   codigo: "Q"  }, // quadriset
    { sufixo: "t",   codigo: "T"  }, // triset
    { sufixo: "b",   codigo: "B"  }, // biset
    { sufixo: "c",   codigo: "C"  }, // cluster
    { sufixo: "i",   codigo: "I"  }  // isometria
  ];

  for (const r of regras) {
    if (s.endsWith(r.sufixo)) return r.codigo;
  }

  return null;
};


/* ============================================================
   3) FIREBASE — BLOCO NORMAL
   🔥 PRIORIDADE ABSOLUTA: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosNormais = async ({
  nivel, enfase, fase, diaCiclo
}) => {

 const cicloTreino = FEMFLOW.engineTreino.normalizarCicloTreino(
  fase || FEMFLOW.getCicloTreino?.()
 );
const nivelNorm = FEMFLOW.engineTreino.normalizarNivel(nivel);
const authUid = firebase?.auth?.()?.currentUser?.uid || null;
console.log("🔍 [NORMAL] Firebase auth status:", authUid ? "logado" : "sem login", {
  uid: authUid
});

if (!cicloTreino || !nivelNorm) {
  console.error("❌ Dados inválidos para consulta Firebase (ciclo ou nível):", {
    nivel,
    fase,
    cicloTreino,
    nivelNorm
  });
  return [];
}

if (!enfase) {
  FEMFLOW.warn("⚠️ Ênfase ausente — consulta Firebase abortada:", {
    nivel: nivelNorm,
    cicloTreino,
    diaCiclo
  });
  return [];
}


  console.log("🧠 DIA DO CICLO DE TREINO:", diaCiclo);
  const diaNum = Number(diaCiclo);
  if (!Number.isFinite(diaNum) || diaNum < 1) {
    console.error("❌ diaCiclo inválido. Abortando consulta Firebase:", diaCiclo);
    return [];
  }
  const diaKey    = `dia_${diaNum}`;
  const path = `/exercicios/${nivelNorm}_${enfase}/ciclos/${cicloTreino}/dias/${diaKey}/blocos`;

  console.log("🔥 FIREBASE PATH (ÊNFASE):", {
    nivel: nivelNorm,
    enfase,
    cicloTreino,
    diaKey
  });
  console.log("🔎 [NORMAL] Coleção/Doc:", {
    collection: "exercicios",
    doc: `${nivelNorm}_${enfase}`,
    cicloTreino,
    diaKey
  });
  FEMFLOW.log("🔥 [NORMAL] Firebase por diaCiclo:", diaKey);

  let snap;
  try {
    const docRef = firebase.firestore()
      .collection("exercicios")
      .doc(`${nivelNorm}_${enfase}`);
    snap = await docRef
      .collection("ciclos")
      .doc(cicloTreino)
      .collection("dias")
      .doc(diaKey)
      .collection("blocos")
      .get();

    if (snap.empty) {
      snap = await docRef
        .collection("fases")
        .doc(cicloTreino)
        .collection("dias")
        .doc(diaKey)
        .collection("blocos")
        .get();
    }
  } catch (err) {
    console.error("❌ [NORMAL] Erro ao buscar no Firebase:", err);
    return [];
  }

  if (snap.empty) {
    FEMFLOW.error("❌ Nenhum treino encontrado no Firebase:", {
      path,
      nivel: nivelNorm,
      enfase,
      cicloTreino,
      diaKey
    });
    console.log("🧪 [NORMAL] Documentos retornados:", snap.size);
    return [];
  }

  const blocos = [];
 snap.forEach(d => {
  const data = d.data();
  console.log("🔥 FIREBASE RAW:", data.box, data.tipo, data);
  blocos.push(data);
});

  return blocos;
};

/* ============================================================
   4) FIREBASE — BLOCO EXTRA (fixo)
============================================================ */
FEMFLOW.engineTreino.carregarBlocosExtras = async ({
  nivel, enfase
}) => {
  const enfaseNorm = String(enfase || "").toLowerCase().trim();
  const nivelNorm = FEMFLOW.engineTreino.normalizarNivel(nivel);
  const authUid = firebase?.auth?.()?.currentUser?.uid || null;
  console.log("🔍 [EXTRA] Firebase auth status:", authUid ? "logado" : "sem login", {
    uid: authUid
  });

  if (!enfaseNorm) {
    FEMFLOW.warn("⚠️ Ênfase extra ausente — consulta Firebase abortada.");
    return [];
  }

  const docIds = [enfaseNorm];

  for (const docId of docIds) {
    let snap;
    try {
      snap = await firebase.firestore()
        .collection("exercicios_extra")
        .doc(docId)
        .collection("blocos")
        .get();
    } catch (err) {
      console.error("❌ [EXTRA] Erro ao buscar no Firebase:", err, {
        docId
      });
      return [];
    }

    if (!snap.empty) {
      const blocos = [];
      snap.forEach(d => blocos.push(d.data()));
      return blocos;
    }
  }

  const flatSnap = await firebase.firestore()
    .collection("exercicios_extra")
    .where("enfase", "==", enfaseNorm)
    .get();

  if (!flatSnap.empty) {
    const blocos = [];
    flatSnap.forEach(d => blocos.push(d.data()));
    return blocos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  FEMFLOW.error("❌ Nenhum treino EXTRA encontrado no Firebase:", {
    enfase: enfaseNorm
  });
  console.log("🧪 [EXTRA] Documentos retornados:", flatSnap.size);
  return [];
};

/* ============================================================
   5) FIREBASE — BLOCO PERSONAL
   🔥 PRIORIDADE ABSOLUTA: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosPersonal = async ({
  id, fase, diaCiclo
}) => {

  const cicloTreino = FEMFLOW.engineTreino.normalizarCicloTreino(
    fase || FEMFLOW.getCicloTreino?.()
  );
  const authUid = firebase?.auth?.()?.currentUser?.uid || null;
  console.log("🔍 [PERSONAL] Firebase auth status:", authUid ? "logado" : "sem login", {
    uid: authUid
  });
   if (!cicloTreino || !id) {
  console.error("❌ Dados inválidos para consulta Firebase:", {
    id,
    fase,
    cicloTreino
  });
  return [];
}
  console.log("🧠 DIA DO CICLO DE TREINO:", diaCiclo);
  const diaNum = Number(diaCiclo);
  if (!Number.isFinite(diaNum) || diaNum < 1) {
    console.error("❌ diaCiclo inválido. Abortando consulta Firebase:", diaCiclo);
    return [];
  }
  const diaKey   = `dia_${diaNum}`;
  const path = `/personal_trainings/${id}/personal/${cicloTreino}/dias/${diaKey}/blocos`;

  console.log("🔥 FIREBASE PATH (PERSONAL):", {
  id,
  cicloTreino,
  diaKey
});

  FEMFLOW.log("🔥 [PERSONAL] Firebase por diaCiclo:", diaKey);

  let snap;
  try {
    snap = await firebase.firestore()
      .collection("personal_trainings")
      .doc(id)
      .collection("personal")
      .doc(cicloTreino)
      .collection("dias")
      .doc(diaKey)
      .collection("blocos")
      .get();
  } catch (err) {
    console.error("❌ [PERSONAL] Erro ao buscar no Firebase:", err);
    return [];
  }

  if (snap.empty) {
    FEMFLOW.error("❌ Nenhum treino PERSONAL encontrado no Firebase:", {
      path,
      id,
      cicloTreino,
      diaKey
    });
    console.log("🧪 [PERSONAL] Documentos retornados:", snap.size);
    return [];
  }

  const blocos = [];
  snap.forEach(d => blocos.push(d.data()));
  return blocos;
};

/* ============================================================
   6) ORGANIZAÇÃO + HIIT
============================================================ */
FEMFLOW.engineTreino.organizarBlocosSimples = brutos => {

  const boxesComTreino = new Set(
    brutos
      .filter(b => b.tipo === "treino")
      .map(b => parseInt(String(b.box || "").replace(/\D/g, "")))
      .filter(n => !isNaN(n))
  );
   
  return brutos
    .map(b => {

      const rawLabel = String(b.box || "");

      // 🔢 número do box (1, 2, 3, 4…)
      let boxNum = parseInt(rawLabel.replace(/\D/g, ""));

      // 🧬 série especial (T, D, AE, C…)
      const serieCodigo = FEMFLOW.engineTreino.detectarSerieEspecial(rawLabel);

      // Aquecimento
      if (b.tipo === "aquecimento") boxNum = -100;

      // Treino sem box explícito
      else if (b.tipo === "treino" && isNaN(boxNum)) boxNum = 1;

      // 🔥 HIIT
      else if (b.tipo === "hiit") {
        if (!boxesComTreino.has(boxNum)) {
          boxNum = 500;
        }
      }

      else if (b.tipo === "cardio_final") boxNum = 900;
      else if (b.tipo === "resfriamento") boxNum = 999;

     return {
  ...b,

  // 🔢 Box numérico para ordenação
  boxNum,

  // 🔑 Preserva chave visual (ex: "1_hiit")
  boxKey: b.boxKey || null,

  ordemNum: Number(b.ordem) || 0,

  // ✅ SÉRIE LIMPA PARA O FRONT
  serieEspecial: serieCodigo
};
    })
    .sort((a, b) => a.boxNum - b.boxNum);
};



FEMFLOW.engineTreino.intercalarHIIT = blocos => {
  const out = [];
  let buffer = [];
  let currentBox = null;

  const flush = () => {
    if (buffer.length) {
      out.push(...buffer.sort((a,b)=>a.ordemNum-b.ordemNum));
      buffer = [];
    }
  };

  for (const b of blocos) {
    // treino OU hiit pertencem ao mesmo box
    if (b.tipo === "treino" || b.tipo === "hiit") {
      if (currentBox !== null && b.boxNum !== currentBox) {
        flush();
      }
      buffer.push(b);
      currentBox = b.boxNum;
    } else {
      flush();
      out.push(b);
      currentBox = null;
    }
  }

  flush();
  return out;
};

/* ============================================================
   6) CONVERSÃO PARA FRONT — VERSÃO FINAL FEMFLOW
============================================================ */
FEMFLOW.engineTreino.converterParaFront = function (blocos) {
  const out = [];

  for (const b of blocos) {

     // 🔒 Segurança: nunca converter box técnico como treino
if (b.tipo === "treino" && Number(b.boxNum) >= 900) {
  continue;
}

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
  const boxBase = Number(b.boxNum || 500);

  out.push({
    tipo: "hiitPremium",

    // 🔥 CHAVE VISUAL (nova)
    boxKey: `${boxBase}_hiit`,

    // mantém box numérico para ordenação
    box: boxBase,

    titulo: b.titulo_pt || b.titulo || "🔥 HIIT",
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
out.forEach(o => {
  console.log("📦 FRONT ITEM:", {
    tipo: o.tipo,
    box: o.box,
    boxKey: o.boxKey,
    serieEspecial: o.serieEspecial
  });
});

  return out;
};

/* ============================================================
   7) MONTAR TREINO FINAL
============================================================ */
FEMFLOW.engineTreino.montarTreinoFinal = async ({
  id, nivel, enfase, fase, diaCiclo, personal=false
}) => {

  const isExtra = FEMFLOW.engineTreino.isExtraEnfase(enfase);

  // 🔒 Personal ignora completamente ênfase
  if (personal === true && !isExtra) {
    enfase = null;
  }

  // 🔒 Treino normal exige ênfase válida
  if (!personal && !isExtra && (!enfase || enfase === "nenhuma" || enfase === "personal")) {
    FEMFLOW.warn("⚠️ Treino normal sem ênfase válida.");
    return [];
  }


  let blocosRaw = [];
  if (isExtra) {
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosExtras({ nivel, enfase });
  } else if (personal) {
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosPersonal({ id, fase, diaCiclo });
   } else {
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosNormais({
      nivel,
      enfase,
      fase,
      diaCiclo
    });
  }

  if (!blocosRaw.length) return [];

 const ordenados = FEMFLOW.engineTreino.organizarBlocosSimples(blocosRaw);
const comHIIT   = FEMFLOW.engineTreino.intercalarHIIT(ordenados);

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

return FEMFLOW.engineTreino.converterParaFront(filtrados);

};

/* ============================================================
   8) LISTAR EXERCÍCIOS POR DIA (USO EM MODAL)
============================================================ */
FEMFLOW.engineTreino.listarExerciciosDia = async ({
  id, nivel, enfase, fase, diaCiclo, personal = false
}) => {
  const isExtra = FEMFLOW.engineTreino.isExtraEnfase(enfase);

  if (isExtra) {
    return [];
  }

  if (personal === true && !isExtra) {
    enfase = null;
  }

  if (!personal && !isExtra && (!enfase || enfase === "nenhuma" || enfase === "personal")) {
    FEMFLOW.warn("⚠️ Lista do próximo treino sem ênfase válida.");
    return [];
  }

  let blocosRaw = [];
  if (personal) {
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosPersonal({ id, fase, diaCiclo });
  } else {
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosNormais({
      nivel,
      enfase,
      fase,
      diaCiclo
    });
  }

  if (!blocosRaw.length) return [];

  const ordenados = FEMFLOW.engineTreino.organizarBlocosSimples(blocosRaw);
  const comHIIT = FEMFLOW.engineTreino.intercalarHIIT(ordenados);
  const nomes = [];
  const vistos = new Set();

  for (const bloco of comHIIT) {
    if (bloco.tipo !== "treino") continue;
    const titulo = bloco.titulo_pt || bloco.titulo || "";
    if (!titulo || vistos.has(titulo)) continue;
    nomes.push(titulo);
    vistos.add(titulo);
  }

  return nomes;
};
