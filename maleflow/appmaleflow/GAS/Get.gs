/* ======================================================
 * 🔹 SALVAR TREINO — FINAL (MaleFlow)
 * - Avança SOMENTE diaPrograma
 * - "Fase" gravada = ciclo (compat coluna do histórico)
 * ====================================================== */
function salvarTreino_(data) {
  const id          = String(data.id || "").trim();
  const pse         = Number(data.pse || 0);
  const treino      = String(data.treino || "");
  const diaPrograma = Number(data.diaPrograma || 1);

  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();

  const auth = _assertSession_(id, deviceId, sessionToken);
  if (!auth.ok) return { status: "denied", msg: auth.msg };
  if (!id) return { status: "error", msg: "ID inválido" };

  const ss = SpreadsheetApp.getActive();
  const agora = new Date();

  /* ===== ABA TREINOS ===== */
  let shT = ss.getSheetByName("Treinos");
  if (!shT) {
    shT = ss.insertSheet("Treinos");
    shT.appendRow([
      "ID","Data","Fase","DiaPrograma","PSE",
      "Apelido","Box","Exercício","Séries","Reps","Peso"
    ]);
  }

  /* ===== ABA ALUNOS ===== */
  const shA = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  const rows = shA.getDataRange().getValues();

  let cicloAtual = "";
  let diaCicloAtual = 1;
  let diaProgramaAtual = diaPrograma;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][COL_ID]).trim() !== id) continue;

    cicloAtual = _normalizarCicloTreino_(rows[i][COL_FASE]) || "";
    diaProgramaAtual = Number(rows[i][COL_DIA_PROGRAMA] || diaPrograma);

    // diaCiclo é derivado do diaPrograma + ciclo
    diaCicloAtual = cicloAtual ? _diaCicloFromDiaPrograma_(diaProgramaAtual, cicloAtual) : Number(rows[i][COL_DIA_CICLO] || 1);

    // ✅ Avança APENAS o dia do programa
    avancarDiaPrograma_(shA, i, "treino");

    break;
  }

  shT.appendRow([
    id,
    agora,
    String(cicloAtual || "").toLowerCase(), // "fase" no histórico = ciclo
    diaProgramaAtual,
    pse,
    "",
    "",
    treino,
    "",
    "",
    ""
  ]);

  return {
    status: "ok",
    salvo: true,
    ciclo: cicloAtual,
    fase: String(cicloAtual || "").toLowerCase(), // compat
    diaCiclo: diaCicloAtual,
    diaPrograma: diaProgramaAtual + 1
  };
}

/* ======================================================
 * 🔹 SALVAR DESCANSO — FINAL (MaleFlow)
 * - Avança SOMENTE o diaPrograma
 * - "Fase" gravada = ciclo (compat)
 * ====================================================== */
function salvarDescanso_(data) {
  const id = String(data.id || "").trim();
  const obs = String(data.obs || "");

  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();

  const auth = _assertSession_(id, deviceId, sessionToken);
  if (!auth.ok) return { status: "denied", msg: auth.msg };
  if (!id) return { status: "error", msg: "ID inválido" };

  const ss = SpreadsheetApp.getActive();
  const agora = new Date();

  /* ===== ABA DIARIO ===== */
  let shD = ss.getSheetByName("Diario");
  if (!shD) {
    shD = ss.insertSheet("Diario");
    shD.appendRow([
      "ID","Data","Fase","Semana","Treino","Tipo","Descanso","Observação"
    ]);
  }

  /* ===== ABA ALUNOS ===== */
  const shA = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  const rows = shA.getDataRange().getValues();

  let cicloAtual = "";
  let diaCicloAtual = 1;
  let diaProgramaAtual = 1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][COL_ID]).trim() !== id) continue;

    cicloAtual = _normalizarCicloTreino_(rows[i][COL_FASE]) || "";
    diaProgramaAtual = Number(rows[i][COL_DIA_PROGRAMA] || 1);
    diaCicloAtual = cicloAtual ? _diaCicloFromDiaPrograma_(diaProgramaAtual, cicloAtual) : Number(rows[i][COL_DIA_CICLO] || 1);

    // ✅ descanso avança SOMENTE o programa
    avancarDiaPrograma_(shA, i, "descanso");
    break;
  }

  // Semana aqui vira apenas "semana de programa" (7 dias por semana)
  const semanaPrograma = Math.ceil(diaProgramaAtual / 7);

  shD.appendRow([
    id,
    agora,
    String(cicloAtual || "").toLowerCase(),
    semanaPrograma,
    "",
    "descanso",
    true,
    obs
  ]);

  return {
    status: "ok",
    descanso: true,
    ciclo: cicloAtual,
    fase: String(cicloAtual || "").toLowerCase(), // compat
    diaCiclo: diaCicloAtual,
    diaPrograma: diaProgramaAtual + 1
  };
}

/* ======================================================
 * 🔹 SALVAR EVOLUÇÃO — FINAL (MaleFlow)
 * - NÃO avança programa
 * - Salva evolução e atualiza UltimosPesos
 * ====================================================== */
function salvarEvolucao_(data) {
  const id = String(data.id || "").trim();
  const exercicio = String(data.exercicio || "").trim();
  const peso = data.peso;
  const reps = data.reps;
  const series = data.series;
  const pse = Number(data.pse || 0);

  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();

  const auth = _assertSession_(id, deviceId, sessionToken);
  if (!auth.ok) return { status: "denied", msg: auth.msg };

  if (!id || !exercicio) {
    return { status: "error", msg: "Dados insuficientes." };
  }

  const ss = SpreadsheetApp.getActive();
  const agora = new Date();

  /* ===== ABA ALUNOS ===== */
  const shA = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  const rows = shA.getDataRange().getValues();

  let cicloAtual = "";
  let diaProgramaAtual = 1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][COL_ID]).trim() !== id) continue;
    cicloAtual = _normalizarCicloTreino_(rows[i][COL_FASE]) || "";
    diaProgramaAtual = Number(rows[i][COL_DIA_PROGRAMA] || 1);
    break;
  }

  /* ===== ABA TREINOS ===== */
  let shT = ss.getSheetByName("Treinos");
  if (!shT) {
    shT = ss.insertSheet("Treinos");
    shT.appendRow([
      "ID","Data","Fase","DiaPrograma","PSE",
      "Apelido","Box","Exercício","Séries","Reps","Peso"
    ]);
  }

  shT.appendRow([
    id,
    agora,
    String(cicloAtual || "").toLowerCase(),
    diaProgramaAtual,
    pse,
    "",
    "",
    exercicio,
    series || "",
    reps || "",
    peso || ""
  ]);

  /* ===== ABA ULTIMOSPESOS ===== */
  let shU = ss.getSheetByName("UltimosPesos");
  if (!shU) {
    shU = ss.insertSheet("UltimosPesos");
    shU.appendRow(["ID","Exercicio","UltimoPeso"]);
  }

  const chave = exercicio.toLowerCase().trim();
  const rowsU = shU.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < rowsU.length; i++) {
    if (String(rowsU[i][0]).trim() === id && String(rowsU[i][1]).trim() === chave) {
      shU.getRange(i + 1, 3).setValue(peso);
      found = true;
      break;
    }
  }

  if (!found) {
    shU.appendRow([id, chave, peso]);
  }

  return {
    status: "ok",
    evolucao: true,
    exercicio,
    peso,
    reps,
    series,
    ciclo: cicloAtual,
    fase: String(cicloAtual || "").toLowerCase(), // compat
    diaPrograma: diaProgramaAtual
  };
}

/* ============================================================
 * 🌸 setmanualstart — desativado no MaleFlow
 * ============================================================ */
function setmanualstart(id, startDate) {
  return { status: "ignored", msg: "ciclo_hormonal_desativado" };
}

function atualizarCicloStart(id, startDate) {
  return { status: "ignored", msg: "ciclo_hormonal_desativado" };
}

function limpezaCicloManualEnergetico() {
  Logger.log("ℹ️ Ciclo hormonal desativado no MaleFlow.");
}
