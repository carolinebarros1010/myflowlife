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
  const f = String(raw || "").toLowerCase().trim();
  if (!f) return "";
  return {
    ovulatória: "ovulatoria",
    ovulatoria: "ovulatoria",
    ovulação: "ovulatoria",
    follicular: "folicular",
    folicular: "folicular",
    lútea: "lutea",
    lutea: "lutea",
    menstrual: "menstrual",
    menstruação: "menstrual",
    menstruacao: "menstrual"
  }[f] || f;
};

FEMFLOW.engineTreino.normalizarNivel = raw => {
  const n = (raw || "").toLowerCase();
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
  return "iniciante";
};

/* ============================================================
   2) SÉRIE ESPECIAL
============================================================ */
FEMFLOW.engineTreino.detectarSerieEspecial = label => {
  if (!label) return null;

  const s = label.toLowerCase().replace(/\s+/g, "");

  const regras = [
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

 const faseNorm  = FEMFLOW.engineTreino.normalizarFase(fase);
const nivelNorm = FEMFLOW.engineTreino.normalizarNivel(nivel);

if (!faseNorm || !enfase || !nivelNorm) {
  console.error("❌ Dados inválidos para consulta Firebase:", {
    nivel,
    enfase,
    fase,
    faseNorm,
    nivelNorm
  });
  return [];
}

  console.log("🧠 DIA FISIOLÓGICO RECEBIDO:", diaCiclo);
  const diaNum = Number(diaCiclo);
  if (!Number.isFinite(diaNum) || diaNum < 1) {
    console.error("❌ diaCiclo inválido. Abortando consulta Firebase:", diaCiclo);
    return [];
  }
  const diaKey    = `dia_${diaNum}`;
  const path = `/exercicios/${nivelNorm}_${enfase}/fases/${faseNorm}/dias/${diaKey}/blocos`;

  console.log("🔥 FIREBASE PATH (ÊNFASE):", {
    nivel: nivelNorm,
    enfase,
    fase: faseNorm,
    diaKey
  });
  FEMFLOW.log("🔥 [NORMAL] Firebase por diaCiclo:", diaKey);

  const snap = await firebase.firestore()
    .collection("exercicios")
    .doc(`${nivelNorm}_${enfase}`)
    .collection("fases")
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("blocos")
    .get();

  if (snap.empty) {
    FEMFLOW.error("❌ Nenhum treino encontrado no Firebase:", {
      path,
      nivel: nivelNorm,
      enfase,
      fase: faseNorm,
      diaKey
    });
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
   4) FIREBASE — BLOCO PERSONAL
   🔥 PRIORIDADE ABSOLUTA: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosPersonal = async ({
  id, enfase, fase, diaCiclo
}) => {

  const faseNorm = FEMFLOW.engineTreino.normalizarFase(fase);
   if (!faseNorm || !enfase || !id) {
  console.error("❌ Dados inválidos para consulta Firebase:", {
    id,
    enfase,
    fase,
    faseNorm
  });
  return [];
}
  console.log("🧠 DIA FISIOLÓGICO RECEBIDO:", diaCiclo);
  const diaNum = Number(diaCiclo);
  if (!Number.isFinite(diaNum) || diaNum < 1) {
    console.error("❌ diaCiclo inválido. Abortando consulta Firebase:", diaCiclo);
    return [];
  }
  const diaKey   = `dia_${diaNum}`;
  const path = `/personal_trainings/${id}/${enfase}/${faseNorm}/dias/${diaKey}/blocos`;

  console.log("🔥 FIREBASE PATH (ÊNFASE):", {
    nivel: id,
    enfase,
    fase: faseNorm,
    diaKey
  });
  FEMFLOW.log("🔥 [PERSONAL] Firebase por diaCiclo:", diaKey);

  const snap = await firebase.firestore()
    .collection("personal_trainings")
    .doc(id)
    .collection(enfase)
    .doc(faseNorm)
    .collection("dias")
    .doc(diaKey)
    .collection("blocos")
    .get();

  if (snap.empty) {
    FEMFLOW.error("❌ Nenhum treino PERSONAL encontrado no Firebase:", {
      path,
      id,
      enfase,
      fase: faseNorm,
      diaKey
    });
    return [];
  }

  const blocos = [];
  snap.forEach(d => blocos.push(d.data()));
  return blocos;
};

/* ============================================================
   5) ORGANIZAÇÃO + HIIT
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
        boxNum,
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

  const blocosRaw = personal
    ? await FEMFLOW.engineTreino.carregarBlocosPersonal({ id, enfase, fase, diaCiclo })
    : await FEMFLOW.engineTreino.carregarBlocosNormais({ nivel, enfase, fase, diaCiclo });

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
