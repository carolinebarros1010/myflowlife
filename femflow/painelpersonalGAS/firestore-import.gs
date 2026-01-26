/**
 * ============================================================
 *   IMPORTADOR OFICIAL FIRESTORE → FEMFLOW/MALEFLOW (VERSÃO FINAL)
 * ============================================================
 * ✅ Sem credenciais hardcoded (usa Script Properties)
 * ✅ Suporta importação TOTAL ou dirigida por aba
 * ✅ Auto-detecta schema:
 *    - FemFlow: fase + dia
 *    - MaleFlow: ciclo + diatreino
 * ✅ Suporta target/app:
 *    - femflow  (default)
 *    - maleflow
 * ✅ Limite: máx 10 linhas tipo "treino" por dia (por fase+dia ou ciclo+diatreino)
 * ✅ Ordem 1..N dentro de cada box (vem da planilha; importador só respeita)
 *
 * 🔐 Script Properties recomendadas:
 * (1) Project IDs
 * - FIREBASE_PROJECT_ID_FEMFLOW = femflow-ebec2
 * - FIREBASE_PROJECT_ID_MALEFLOW = male-flow
 *
 * (2) Service Account (opção A: por target — recomendado)
 * - FEMFLOW_FIREBASE_CLIENT_EMAIL
 * - FEMFLOW_FIREBASE_PRIVATE_KEY
 * - MALEFLOW_FIREBASE_CLIENT_EMAIL
 * - MALEFLOW_FIREBASE_PRIVATE_KEY
 *
 * (3) Service Account (opção B: fallback legado — opcional)
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 *
 * Obs: *_PRIVATE_KEY deve estar com \n (escape) no Script Properties.
 * ============================================================
 */

/* ============================================================
   TARGET / PROJECT ID
============================================================ */
function getFirebaseProjectId_(target) {
  const t = String(target || "femflow").toLowerCase().trim();
  const props = PropertiesService.getScriptProperties();

  const fem = props.getProperty("FIREBASE_PROJECT_ID_FEMFLOW") || "femflow-ebec2";
  const male = props.getProperty("FIREBASE_PROJECT_ID_MALEFLOW") || "male-flow";

  if (t === "maleflow" || t === "male-flow" || t === "male") return male;
  return fem;
}

/* ============================================================
   SERVICE ACCOUNT (Script Properties)
   - tenta por target primeiro (recomendado)
   - fallback: FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
============================================================ */
function getFirebaseServiceAccount_(target) {
  const t = String(target || "femflow").toLowerCase().trim();
  const props = PropertiesService.getScriptProperties();

  // recomendado: por target
  const emailProp =
    (t === "maleflow" || t === "male-flow" || t === "male")
      ? "MALEFLOW_FIREBASE_CLIENT_EMAIL"
      : "FEMFLOW_FIREBASE_CLIENT_EMAIL";

  const keyProp =
    (t === "maleflow" || t === "male-flow" || t === "male")
      ? "MALEFLOW_FIREBASE_PRIVATE_KEY"
      : "FEMFLOW_FIREBASE_PRIVATE_KEY";

  let email = props.getProperty(emailProp);
  let key = props.getProperty(keyProp);

  // fallback legado
  if (!email || !key) {
    email = email || props.getProperty("FIREBASE_CLIENT_EMAIL");
    key = key || props.getProperty("FIREBASE_PRIVATE_KEY");
  }

  if (!email || !key) {
    throw new Error(
      "Credenciais Firebase não configuradas em Script Properties. " +
        "Use (recomendado): FEMFLOW_FIREBASE_* e MALEFLOW_FIREBASE_* " +
        "ou (fallback): FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    client_email: String(email).trim(),
    private_key: String(key).replace(/\\n/g, "\n"),
  };
}

/* ============================================================
   TOKEN FIREBASE (OAuth2 JWT Bearer)
============================================================ */
function getFirebaseAccessToken(target) {
  const sa = getFirebaseServiceAccount_(target);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (o) => Utilities.base64EncodeWebSafe(JSON.stringify(o));
  const jwt = `${encode(header)}.${encode(claim)}`;
  const sig = Utilities.computeRsaSha256Signature(jwt, sa.private_key);
  const jwtSigned = `${jwt}.${Utilities.base64EncodeWebSafe(sig)}`;

  const resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtSigned,
    },
    muteHttpExceptions: true,
  });

  const code = resp.getResponseCode();
  const txt = resp.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error("Erro ao obter token Firebase [" + code + "]: " + txt);
  }

  const data = JSON.parse(txt);
  if (!data.access_token) throw new Error("Erro ao obter token Firebase: " + txt);
  return data.access_token;
}

/* ============================================================
   IMPORTAÇÃO DIRIGIDA POR ABA
============================================================ */
function importarTreinosFEMFLOW_aba(nomeAba, opts = {}) {
  if (!nomeAba) throw new Error("Nome da aba é obrigatório para importação dirigida");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) throw new Error("Aba não encontrada para importação: " + nomeAba);

  return importarTreinosFEMFLOW({
    abasPermitidas: [nomeAba],
    target: opts.target || "femflow",
  });
}

/* =======================================================================
   IMPORTAÇÃO TOTAL — NORMAL + PERSONAL
   opts:
     - abasPermitidas: ["Iniciante", "personal_FF-1234", ...] (opcional)
     - target: "femflow" | "maleflow" (default femflow)
======================================================================= */
function importarTreinosFEMFLOW(opts = {}) {
  const abasPermitidas = Array.isArray(opts.abasPermitidas) ? opts.abasPermitidas : null;
  const target = String(opts.target || "femflow").toLowerCase().trim();

  const token = getFirebaseAccessToken(target);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abas = ss.getSheets();

  const project = getFirebaseProjectId_(target);
  const baseURL = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
  const importId = Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");

  Logger.log("🚀 Iniciando importação " + target.toUpperCase() + "...");
  Logger.log("🔥 projectId: " + project);
  Logger.log("🧾 importId: " + importId);
  if (abasPermitidas) Logger.log("🎯 Importação dirigida (abasPermitidas): " + JSON.stringify(abasPermitidas));

  let totalOk = 0;
  let totalErr = 0;
  let totalPatches = 0;

  abas.forEach((sh) => {
    const nomeAba = sh.getName().trim();

    // ✅ filtro real
    if (abasPermitidas && !abasPermitidas.includes(nomeAba)) return;

    // ------------------------------------------------------------
    // 1) DETECTAR ABA PERSONAL
    // ------------------------------------------------------------
    let isPersonal = false;
    let personalId = "";
    let isExtra = false;

    if (nomeAba.toLowerCase().startsWith("personal_")) {
      isPersonal = true;
      personalId = nomeAba.replace(/personal_/i, "").trim();
      Logger.log("🎨 Aba PERSONAL detectada → ID = " + personalId);
    }
    // ------------------------------------------------------------
    // 2) DETECTAR ABA NORMAL
    // ------------------------------------------------------------
    else if (nomeAba !== "Iniciante" && nomeAba !== "Intermediaria" && nomeAba !== "Avancada" && nomeAba !== "Extra") {
      Logger.log("⏭ Ignorando aba não reconhecida: " + nomeAba);
      return;
    } else if (nomeAba === "Extra") {
      isExtra = true;
    }

    Logger.log("📄 Processando aba: " + nomeAba);

    const stats = importarAbaParaFirestore_(
      sh,
      token,
      baseURL,
      nomeAba,
      isPersonal,
      personalId,
      isExtra,
      importId,
      target
    );

    totalOk += stats.ok;
    totalErr += stats.err;
    totalPatches += stats.patches;
  });

  const resumo = {
    ok: true,
    message: "🎉 Importação concluída!",
    target,
    projectId: project,
    total_patches: totalPatches,
    total_ok: totalOk,
    total_err: totalErr,
  };

  Logger.log(JSON.stringify(resumo));
  return resumo;
}

/* ============================================================
   IMPORTA UMA ABA (core)
============================================================ */
function importarAbaParaFirestore_(sh, token, baseURL, nomeAba, isPersonal, personalId, isExtra, importId, target) {
  const valsAll = sh.getDataRange().getValues();
  if (!valsAll || valsAll.length < 2) {
    Logger.log("⚠️ Aba vazia/sem dados: " + nomeAba);
    return { ok: 0, err: 0, patches: 0 };
  }

  const header = valsAll[0].map((h) => String(h || "").trim());
  const vals = valsAll.slice(1);

  const col = (name) => header.indexOf(name);

  const idx = {
    id: col("id"), // opcional
    tipo: col("tipo"),
    box: col("box"),
    ordem: col("ordem"),
    enfase: col("enfase"),

    // FemFlow
    fase: col("fase"),
    dia: col("dia"),

    // MaleFlow
    ciclo: col("ciclo"),
    diatreino: col("diatreino"),

    titulo_pt: col("titulo_pt"),
    titulo_en: col("titulo_en"),
    titulo_fr: col("titulo_fr"),

    link: col("link"),

    series: col("series"),
    reps: col("reps"),
    especial: col("especial"),
    tempo: col("tempo"),
    intervalo: col("intervalo"),

    forte: col("forte"),
    leve: col("leve"),
    ciclos: col("ciclos"),
  };

  const usaCicloDiaTreino = idx.ciclo !== -1 && idx.diatreino !== -1;

  // validações mínimas
  const obrigatoriasBase = ["tipo", "enfase", "titulo_pt", "box", "ordem"];
  const obrigatorias = isExtra
    ? obrigatoriasBase
    : usaCicloDiaTreino
    ? obrigatoriasBase.concat(["ciclo", "diatreino", "link"])
    : obrigatoriasBase.concat(["dia", "fase", "link"]);

  const faltando = obrigatorias.filter((k) => idx[k] === -1);
  if (faltando.length) {
    throw new Error(`Aba "${nomeAba}" sem colunas obrigatórias: ${faltando.join(", ")}`);
  }

  // limite por dia (somente tipo "treino")
  const MAX_TREINO_POR_DIA = 10;
  const treinoCountPorDia = {}; // key -> count

  let okCount = 0;
  let errCount = 0;
  let patches = 0;

  vals.forEach((r, i) => {
    if (!r[idx.tipo]) return;

    const tipo = String(r[idx.tipo] || "").toLowerCase().trim();
    const enfase = removerAcentos(String(r[idx.enfase] || "geral")).toLowerCase();

    // box/ordem: respeita 1..N dentro de cada box (vem da planilha)
    const box = String(r[idx.box] || "").trim() || `bloco_${i}`;
    const ordem = Number(r[idx.ordem] || 0);

    let fase = "";
    let diaKey = "";
    let ciclo = "";
    let diatreino = "";
    let dayCounterKey = "";

    if (usaCicloDiaTreino) {
      ciclo = String(r[idx.ciclo] || "").trim().toUpperCase(); // ABC/ABCD/ABCDE
      diatreino = String(r[idx.diatreino] || "").trim().toUpperCase(); // A/B/C/D/E
      if (!ciclo || !diatreino) return;

      dayCounterKey = `ciclo:${ciclo}|dia:${diatreino}`;
    } else {
      fase = r[idx.fase] ? normalizarFase(r[idx.fase]) : "";
      diaKey = r[idx.dia] ? `dia_${r[idx.dia]}` : "";
      if (!fase || !diaKey) return;

      dayCounterKey = `fase:${fase}|dia:${diaKey}`;
    }

    // ⛔ limite de treino por dia
    if (tipo === "treino") {
      const c = treinoCountPorDia[dayCounterKey] || 0;
      if (c >= MAX_TREINO_POR_DIA) return;
      treinoCountPorDia[dayCounterKey] = c + 1;
    }

    // ------------------------------------------------------------
    // DEFINIR URL FINAL (NORMAL x PERSONAL x EXTRA) + (FemFlow x MaleFlow)
    // Observação: usamos docId único por linha:
    //   - FemFlow: mantém padrão legado blocos/bloco_{i}
    //   - MaleFlow: blocos/bloco_{box*100}_{ordem} (ex: bloco_100_01) para não colidir
    // ------------------------------------------------------------
    const nivel = nomeAba.toLowerCase(); // iniciante/intermediaria/avancada

    const docIdFem = `bloco_${i}`;
    const boxMatch = String(box).match(/\d+/);
    const boxNumero = boxMatch ? Number(boxMatch[0]) : 0;
    const boxBase = boxNumero ? String(boxNumero * 100) : String(box || "0").trim();
    const docIdMale = `bloco_${boxBase}_${String(ordem).padStart(2, "0")}`;
    const docId = usaCicloDiaTreino ? docIdMale : docIdFem;

    let url = "";

    if (isPersonal) {
      if (usaCicloDiaTreino) {
        url =
          `${baseURL}/personal_trainings/${personalId}/${enfase}` +
          `/ciclo/${ciclo}` +
          `/diatreino/diatreino_${diatreino}` +
          `/blocos/${docId}`;
      } else {
        url = `${baseURL}/personal_trainings/${personalId}/${enfase}/${fase}/dias/${diaKey}/blocos/${docId}`;
      }
    } else if (isExtra) {
      url = `${baseURL}/exercicios_extra/${enfase}/blocos/${docId}`;
    } else {
      if (usaCicloDiaTreino) {
        // ✅ MALEFLOW
        url =
          `${baseURL}/exercicios/${nivel}_${enfase}` +
          `/ciclo/${ciclo}` +
          `/diatreino/diatreino_${diatreino}` +
          `/blocos/${docId}`;
      } else {
        // ✅ FEMFLOW (LEGADO)
        url = `${baseURL}/exercicios/${nivel}_${enfase}/fases/${fase}/dias/${diaKey}/blocos/${docId}`;
      }
    }

    // ------------------------------------------------------------
    // CONSTRUIR PAYLOAD
    // ------------------------------------------------------------
    const payload = {
      fields: {
        tipo: { stringValue: tipo },
        box: { stringValue: box },
        ordem: { integerValue: ordem },

        enfase: { stringValue: enfase },

        titulo_pt: { stringValue: String(r[idx.titulo_pt] || "") },
        titulo_en: { stringValue: String(r[idx.titulo_en] || "") },
        titulo_fr: { stringValue: String(r[idx.titulo_fr] || "") },

        link: { stringValue: String(r[idx.link] || "") },

        series: { stringValue: String(r[idx.series] || "") },
        reps: { stringValue: String(r[idx.reps] || "") },
        especial: { stringValue: String(idx.especial !== -1 ? (r[idx.especial] || "") : "") },

        tempo: { stringValue: String(r[idx.tempo] || "") },
        intervalo: { stringValue: String(r[idx.intervalo] || "") },

        forte: { stringValue: String(r[idx.forte] || "") },
        leve: { stringValue: String(r[idx.leve] || "") },
        ciclos: { stringValue: String(r[idx.ciclos] || "") },

        // metadados úteis
        updatedAt: { timestampValue: new Date().toISOString() },
        importTarget: { stringValue: String(target || "femflow") },
      },
    };

    // FemFlow fields
    if (!usaCicloDiaTreino) {
      payload.fields.fase = { stringValue: fase };
      payload.fields.dia = { integerValue: Number(r[idx.dia] || 0) };
    } else {
      // MaleFlow fields
      payload.fields.ciclo = { stringValue: ciclo };
      payload.fields.diatreino = { stringValue: diatreino };
    }

    // === HISTÓRICO DE BLOCOS PERSONAL (mantém, adaptando ao schema)
    if (isPersonal) {
      const getResp = firestoreGET_(url, token);
      const getCode = getResp.getResponseCode();
      if (getCode === 200) {
        const doc = JSON.parse(getResp.getContentText());

        let historyUrl = "";
        if (usaCicloDiaTreino) {
          historyUrl =
            `${baseURL}/personal_trainings/${personalId}/${enfase}` +
            `/ciclo/${ciclo}` +
            `/diatreino/diatreino_${diatreino}` +
            `/history/${importId}/blocos/${docId}`;
        } else {
          historyUrl =
            `${baseURL}/personal_trainings/${personalId}/${enfase}/${fase}` +
            `/dias/${diaKey}/history/${importId}/blocos/${docId}`;
        }

        const historyPayload = {
          fields: Object.assign({}, doc.fields || {}, {
            archivedAt: { timestampValue: new Date().toISOString() },
            archivedBy: { stringValue: "importador_apps_script" },
            importId: { stringValue: importId },
          }),
        };
        firestorePATCH_(historyUrl, token, historyPayload);
      } else if (getCode !== 404) {
        Logger.log(
          `⚠️ GET histórico falhou [${getCode}] → ${nomeAba} | linha ${i} | ${getResp.getContentText()}`
        );
      }
    }

    // ------------------------------------------------------------
    // ENVIAR PARA FIRESTORE
    // ------------------------------------------------------------
    const resp = firestorePATCH_(url, token, payload);
    patches++;

    const code = resp.getResponseCode();
    if (code === 200) {
      okCount++;
      Logger.log(`✅ OK → ${nomeAba} | linha ${i}`);
    } else {
      errCount++;
      Logger.log(`❌ ERRO [${code}] → ${nomeAba} | linha ${i} | ${resp.getContentText()}`);
    }
  });

  return { ok: okCount, err: errCount, patches: patches };
}

/* ============================================================
   FUNÇÕES AUXILIARES
============================================================ */
function firestoreGET_(url, token) {
  return UrlFetchApp.fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    muteHttpExceptions: true,
  });
}

function firestorePATCH_(url, token, payloadObj) {
  return UrlFetchApp.fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    contentType: "application/json",
    payload: JSON.stringify(payloadObj),
    muteHttpExceptions: true,
  });
}

function removerAcentos(t) {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function normalizarFase(f) {
  if (!f) return "follicular";

  f = String(f).toLowerCase().trim();
  const mapa = {
    ovulatory: "ovulatoria",
    ovulatoria: "ovulatoria",
    "ovulatório": "ovulatoria",

    follicular: "follicular",
    folicular: "follicular",

    luteal: "lutea",
    lutea: "lutea",

    menstrual: "menstrual",
    menstruacao: "menstrual",
  };

  return mapa[f] || "follicular";
}

/* ============================================================
   TESTES RÁPIDOS (rodar manualmente)
============================================================ */
function TEST_importar_tudo_femflow() {
  const r = importarTreinosFEMFLOW({ target: "femflow" });
  Logger.log(JSON.stringify(r, null, 2));
}

function TEST_importar_tudo_maleflow() {
  const r = importarTreinosFEMFLOW({ target: "maleflow" });
  Logger.log(JSON.stringify(r, null, 2));
}

function TEST_importar_iniciante_maleflow() {
  const r = importarTreinosFEMFLOW_aba("Iniciante", { target: "maleflow" });
  Logger.log(JSON.stringify(r, null, 2));
}

function TEST_token_maleflow() {
  const token = getFirebaseAccessToken("maleflow");
  Logger.log(token);
}
