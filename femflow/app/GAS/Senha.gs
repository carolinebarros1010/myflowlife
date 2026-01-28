/* ============================================================
   FEMFLOW • SENHA.GS — SEGURANÇA
   - Hash de senha
   - Login/cadastro
   - Sessão/device lock
============================================================ */

function _hashSenha(raw) {
  const senha = String(raw || "").trim();
  if (!senha) return "";
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    senha,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64Encode(digest);
}

function _senhaConfereSegura_(senhaDigitada, senhaSalva) {
  const senha = String(senhaDigitada || "").trim();
  const salva = String(senhaSalva || "").trim();

  if (!senha) return { ok: false, needsUpgrade: false };

  if (!salva) return { ok: true, needsUpgrade: true };

  const hash = _hashSenha(senha);

  if (salva === hash) return { ok: true, needsUpgrade: false };
  if (salva === senha) return { ok: true, needsUpgrade: true };

  return { ok: false, needsUpgrade: false };
}

function _loginOuCadastro(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const nome            = String(data.nome || "").trim();
  const email           = String(data.email || "").toLowerCase().trim();
  const telefone        = String(data.telefone || "").trim();
  const dataNascimento  = String(data.dataNascimento || "").trim();
  const senha           = String(data.senha || "").trim();
  const anamnese        = data.anamnese || "";

  if (!nome || !email || !senha) {
    return { status: "error", msg: "Nome, e-mail e senha são obrigatórios." };
  }

  const senhaHash = _hashSenha(senha);
  const rows = sh.getDataRange().getValues();

  let pont = _calcularPontuacaoAnamnese(anamnese);
  let nivelDetectado = "iniciante";
  if (pont >= 13 && pont < 23) nivelDetectado = "intermediaria";
  if (pont >= 23) nivelDetectado = "avancada";

  /* ======================================================
   * 🔁 ATUALIZAR ALUNA EXISTENTE
   * ====================================================== */
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emailDB = String(row[2] || "").toLowerCase().trim();

    if (emailDB === email) {
      const linha = i + 1;

      let id = row[0];
      if (!id) {
        id = gerarID();
        sh.getRange(linha, 1).setValue(id);
      }

      sh.getRange(linha, 2).setValue(nome);
      sh.getRange(linha, 3).setValue(email);
      sh.getRange(linha, 4).setValue(telefone);
      sh.getRange(linha, 5).setValue(senhaHash);

      if (dataNascimento) {
        sh.getRange(linha, COL_DATA_NASCIMENTO + 1).setValue(dataNascimento);
      }

      sh.getRange(linha, 9).setValue(nivelDetectado);
      sh.getRange(linha, 16).setValue(pont);
      sh.getRange(linha, 17).setValue(anamnese);

      // Corrigir DataInicio inválida
      const dataIni = row[10];
      if (!dataIni || !(dataIni instanceof Date) || dataIni.getFullYear() < 1990) {
        sh.getRange(linha, 11).setValue(new Date());
      }

      // Garantir DiaPrograma
      if (!row[COL_DIA_PROGRAMA]) {
        sh.getRange(linha, COL_DIA_PROGRAMA + 1).setValue(1);
      }

      return {
        status: "ok",
        id,
        email,
        nivel: nivelDetectado,
        pontuacao: pont
      };
    }
  }

  /* ======================================================
   * 🆕 NOVO CADASTRO
   * ====================================================== */
  const novoID = gerarID();
  const hoje = new Date();

  sh.appendRow([
    novoID,                 // ID
    nome,                   // Nome
    email,                  // Email
    telefone,               // Telefone
    senhaHash,              // SenhaHash
    "trial_app",            // Produto
    hoje,                   // DataCompra
    false,                  // LicencaAtiva
    nivelDetectado,         // Nivel
    Number(data.cicloDuracao) || 28, // CicloDuracao
    hoje,                   // DataInicio
    "",                     // LinkPlanilha
    "nenhuma",              // Enfase
    "",                     // Fase
    "",                     // DiaCiclo
    pont,                   // Pontuacao
    anamnese,               // AnamneseJSON
    "",                     // TokenReset
    "",                     // TokenExpira
    1,                      // DiaPrograma
    "",                     // DeviceId
    "",                     // SessionToken
    "",                     // SessionExpira
    "",                     // data
    "",                     // ultima
    "",                     // FreeEnabled (AB)
    "",                     // FreeEnfases (AC)
    "",                     // FreeUntil (AD)
    "",                     // acesso_personal (AE)
    "",                     // TreinosSemana (AF)
    "",                     // AusenciaAtiva (AG)
    "",                     // AusenciaInicio (AH)
    dataNascimento          // DataNascimento (AI)
  ]);

  return {
    status: "created",
    id: novoID,
    email,
    nivel: nivelDetectado,
    pontuacao: pont
  };
}

/* ============================================================
   LOGIN (corrigido + upgrade automático)
============================================================ */
function _fazerLogin(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  const senha = String(data.senha || "").trim();
  const deviceId = String(data.deviceId || "").trim();

  if (!email) return { status: "error", msg: "email_required" };

  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emailDB = String(row[2] || "").trim().toLowerCase();
    if (emailDB !== email) continue;

    const linha = i + 1;

    // ✅ senha segura
    const conf = _senhaConfereSegura_(senha, row[4]);
    if (!conf.ok) return { status: "senha_incorreta" };

    // ✅ upgrade se estava em texto puro / vazio
    if (conf.needsUpgrade) {
      sh.getRange(linha, 5).setValue(_hashSenha(senha)); // col 5 (1-based) = row[4]
    }

    // device lock + tolerância de migração
    const deviceDB = String(row[COL_DEVICE_ID] || "").trim();
    const sessionTokenDB = String(row[COL_SESSION_TOKEN] || "").trim();
    const expDB = row[COL_SESSION_EXP];
    const now = new Date();
    const hasActiveSession =
      sessionTokenDB &&
      expDB instanceof Date &&
      expDB.getTime() > now.getTime();

    let deviceUpdated = false;

    if (deviceDB && deviceId && deviceDB !== deviceId) {
      if (hasActiveSession) return { status: "blocked" };
      sh.getRange(linha, COL_DEVICE_ID + 1).setValue(deviceId);
      deviceUpdated = true;
    }

    if (deviceId && !deviceDB) {
      sh.getRange(linha, COL_DEVICE_ID + 1).setValue(deviceId);
      deviceUpdated = true;
    }

    // session
    const sessionToken = Utilities.getUuid();
    const sessionExpira = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue(sessionToken);
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue(sessionExpira);

    return {
      status: "ok",
      id: row[0],
      email,
      deviceId: deviceId || deviceDB,
      sessionToken,
      sessionExpira,
      deviceUpdated
    };
  }

  return { status: "not_registered" };
}

function _assertSession_(id, deviceId, sessionToken) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { ok: false, msg: "Aba Alunas não encontrada." };

  const idNorm = String(id || "").trim();
  const token = String(sessionToken || "").trim();
  const device = String(deviceId || "").trim();

  if (!idNorm || !token) return { ok: false, msg: "Sessão inválida" };

  const rows = sh.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0] || "").trim() !== idNorm) continue;

    const tokenDB = String(row[COL_SESSION_TOKEN] || "").trim();
    const expDB = row[COL_SESSION_EXP];
    const deviceDB = String(row[COL_DEVICE_ID] || "").trim();

    if (!tokenDB || tokenDB !== token) return { ok: false, msg: "Sessão inválida" };
    if (!(expDB instanceof Date) || expDB.getTime() < now.getTime()) {
      return { ok: false, msg: "Sessão expirada" };
    }

    if (deviceDB && device && deviceDB !== device) {
      return { ok: false, msg: "Sessão bloqueada" };
    }

    return { ok: true };
  }

  return { ok: false, msg: "Sessão inválida" };
}

/* ============================================================
   RESET SENHA (token gravado na planilha)
