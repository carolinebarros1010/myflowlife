/* ============================================================
   MALEFLOW • SENHA.GS — VERSÃO FINAL (Alunos)
   - Login/cadastro + segurança
   - Sessão (token/expiração)
   - Reset/troca de senha
   - Device lock
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

/**
 * Confere senha de forma segura + compatibilidade legado:
 * - NÃO aceita senha vazia
 * - aceita hash (novo)
 * - aceita texto puro (legado) e sinaliza upgrade
 */
function _senhaConfereSegura_(senhaDigitada, senhaSalva) {
  const senha = String(senhaDigitada || "").trim();
  const salva = String(senhaSalva || "").trim();

  if (!senha) return { ok: false, needsUpgrade: false }; // ✅ nunca aceita vazia

  // Se não tinha senha salva (registro quebrado/antigo), permite apenas se digitou algo
  // e pede upgrade para hash.
  if (!salva) return { ok: true, needsUpgrade: true };

  const hash = _hashSenha(senha);

  if (salva === hash) return { ok: true, needsUpgrade: false }; // padrão
  if (salva === senha) return { ok: true, needsUpgrade: true }; // legado texto

  return { ok: false, needsUpgrade: false };
}

/* ============================================================
   LOGIN OU CADASTRO (mantém sua lógica)
============================================================ */
function _loginOuCadastro(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

  const nome           = String(data.nome || "").trim();
  const email          = String(data.email || "").toLowerCase().trim();
  const telefone       = String(data.telefone || "").trim();
  const dataNascimento = String(data.dataNascimento || "").trim();
  const senha          = String(data.senha || "").trim();
  const anamnese       = data.anamnese || "";

  if (!nome || !email || !senha) {
    return { status: "error", msg: "Nome, e-mail e senha são obrigatórios." };
  }

  const senhaHash = _hashSenha(senha);
  const rows = sh.getDataRange().getValues();

  let pont = _calcularPontuacaoAnamnese(anamnese);
  let nivelDetectado = "iniciante";
  if (pont >= 13 && pont < 23) nivelDetectado = "intermediaria";
  if (pont >= 23) nivelDetectado = "avancada";

  /* 🔁 ATUALIZAR ALUNO EXISTENTE */
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

      if (dataNascimento && typeof COL_DATA_NASCIMENTO === "number") {
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
      if (typeof COL_DIA_PROGRAMA === "number" && !row[COL_DIA_PROGRAMA]) {
        sh.getRange(linha, COL_DIA_PROGRAMA + 1).setValue(1);
      }

      return { status: "ok", id, email, nivel: nivelDetectado, pontuacao: pont };
    }
  }

  /* 🆕 NOVO CADASTRO */
  const novoID = gerarID();
  const hoje = new Date();

  sh.appendRow([
    novoID,                 // 0 ID
    nome,                   // 1 Nome
    email,                  // 2 Email
    telefone,               // 3 Telefone
    senhaHash,              // 4 SenhaHash
    "trial_app",            // 5 Produto
    hoje,                   // 6 DataCompra
    false,                  // 7 LicencaAtiva
    nivelDetectado,         // 8 Nivel
    Number(data.cicloDuracao) || 3, // 9 CicloDuracao
    hoje,                   // 10 DataInicio
    "",                     // 11 LinkPlanilha
    "nenhuma",              // 12 Enfase
    "",                     // 13 Fase
    "",                     // 14 DiaCiclo
    pont,                   // 15 Pontuacao
    anamnese,               // 16 AnamneseJSON
    "",                     // 17 TokenReset
    "",                     // 18 TokenExpira
    "",                     // 19 PerfilHormonal
    "",                     // 20 CicloStartDateManual
    1,                      // 21 DiaPrograma
    "",                     // 22 DeviceId
    "",                     // 23 SessionToken
    "",                     // 24 SessionExpira
    "",                     // 25 data
    "",                     // 26 ultima
    "",                     // 27 FreeEnabled (AB)
    "",                     // 28 FreeEnfases (AC)
    "",                     // 29 FreeUntil (AD)
    "",                     // 30 acesso_personal (AE)
    "",                     // 31 TreinosSemana (AF)
    "",                     // 32 AusenciaAtiva (AG)
    "",                     // 33 AusenciaInicio (AH)
    dataNascimento          // 34 DataNascimento (AI)
  ]);

  return { status: "created", id: novoID, email, nivel: nivelDetectado, pontuacao: pont };
}

/* ============================================================
   LOGIN (corrigido + upgrade automático)
============================================================ */
function _fazerLogin(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

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

    // device lock
    const deviceDB = String(row[COL_DEVICE_ID] || "").trim();
    let deviceUpdated = false;

    if (deviceDB && deviceId && deviceDB !== deviceId) return { status: "blocked" };

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

/* ============================================================
   SESSÃO
============================================================ */
function _validarSessao(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  const sessionToken = String(data.sessionToken || "").trim();
  const deviceId = String(data.deviceId || "").trim();

  if (!email || !sessionToken) return { status: "invalid" };

  const now = new Date();
  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2] || "").trim().toLowerCase() !== email) continue;

    const tokenDB = String(row[COL_SESSION_TOKEN] || "").trim();
    const expDB = row[COL_SESSION_EXP];
    const deviceDB = String(row[COL_DEVICE_ID] || "").trim();

    if (!tokenDB || tokenDB !== sessionToken) return { status: "invalid" };
    if (!(expDB instanceof Date) || expDB.getTime() < now.getTime()) return { status: "expired" };

    if (deviceDB && deviceId && deviceDB !== deviceId) return { status: "blocked" };

    return { status: "ok", id: row[0], email, sessionExpira: expDB, deviceId: deviceId || deviceDB };
  }

  return { status: "invalid" };
}

function _logout(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  const sessionToken = String(data.sessionToken || "").trim();
  if (!email || !sessionToken) return { status: "invalid" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2] || "").trim().toLowerCase() !== email) continue;

    if (String(row[COL_SESSION_TOKEN] || "").trim() !== sessionToken) return { status: "invalid" };

    const linha = i + 1;
    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue("");
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue("");
    return { status: "ok" };
  }
  return { status: "invalid" };
}

/* ============================================================
   RESET SENHA (token gravado na planilha)
============================================================ */
function _solicitarResetSenha(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  if (!email) return { status: "error", msg: "email_required" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2] || "").trim().toLowerCase() !== email) continue;

    const linha = i + 1;
    const token = Utilities.getUuid().replace(/-/g, "");
    const expira = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    sh.getRange(linha, COL_TOKEN_RESET + 1).setValue(token);
    sh.getRange(linha, COL_TOKEN_EXPIRA + 1).setValue(expira);

    return { status: "ok", email, token, expira };
  }
  return { status: "not_registered" };
}

function _confirmarResetSenha(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  const token = String(data.token || "").trim();
  const novaSenha = String(data.novaSenha || "").trim();

  if (!email || !token || !novaSenha) return { status: "error", msg: "missing_fields" };

  const rows = sh.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2] || "").trim().toLowerCase() !== email) continue;

    const tokenDB = String(row[COL_TOKEN_RESET] || "").trim();
    const expDB = row[COL_TOKEN_EXPIRA];

    if (!tokenDB || tokenDB !== token) return { status: "invalid_token" };
    if (!(expDB instanceof Date) || expDB.getTime() < now.getTime()) return { status: "expired_token" };

    const linha = i + 1;

    sh.getRange(linha, 5).setValue(_hashSenha(novaSenha)); // senhaHash

    // limpa reset
    sh.getRange(linha, COL_TOKEN_RESET + 1).setValue("");
    sh.getRange(linha, COL_TOKEN_EXPIRA + 1).setValue("");

    // invalida sessão
    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue("");
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue("");

    return { status: "ok" };
  }

  return { status: "not_registered" };
}

/* ============================================================
   TROCAR SENHA (logado)
============================================================ */
function _trocarSenha(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  const sessionToken = String(data.sessionToken || "").trim();
  const senhaAtual = String(data.senhaAtual || "").trim();
  const novaSenha = String(data.novaSenha || "").trim();

  if (!email || !sessionToken || !senhaAtual || !novaSenha) {
    return { status: "error", msg: "missing_fields" };
  }

  const rows = sh.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2] || "").trim().toLowerCase() !== email) continue;

    const tokenDB = String(row[COL_SESSION_TOKEN] || "").trim();
    const expDB = row[COL_SESSION_EXP];

    if (tokenDB !== sessionToken) return { status: "invalid_session" };
    if (!(expDB instanceof Date) || expDB.getTime() < now.getTime()) return { status: "expired_session" };

    const conf = _senhaConfereSegura_(senhaAtual, row[4]);
    if (!conf.ok) return { status: "senha_incorreta" };

    const linha = i + 1;
    sh.getRange(linha, 5).setValue(_hashSenha(novaSenha));

    // invalida sessão (boa prática)
    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue("");
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue("");

    return { status: "ok" };
  }

  return { status: "not_registered" };
}

/* ============================================================
   SUPORTE: LIMPAR DEVICE (proteja no doPost com secret/admin)
============================================================ */
function _limparDevice(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  if (!email) return { status: "error", msg: "email_required" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2] || "").trim().toLowerCase() !== email) continue;

    const linha = i + 1;
    sh.getRange(linha, COL_DEVICE_ID + 1).setValue("");
    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue("");
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue("");

    return { status: "ok" };
  }

  return { status: "not_registered" };
}
