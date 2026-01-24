function _loginOuCadastro(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunos não encontrada." };

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
    Number(data.cicloDuracao) || 3, // CicloDuracao
    hoje,                   // DataInicio
    "",                     // LinkPlanilha
    "nenhuma",              // Enfase
    "",                     // Fase
    "",                     // DiaCiclo
    pont,                   // Pontuacao
    anamnese,               // AnamneseJSON
    "",                     // TokenReset
    "",                     // TokenExpira
    "",                     // PerfilHormonal (desativado)
    "",                     // CicloStartDateManual
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
