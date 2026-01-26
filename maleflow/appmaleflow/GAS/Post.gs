/* ============================================================
 * 🔥 MALEFLOW — LÓGICA DE CICLO (MASCULINO)
 * - CICLO vem do front (AB/ABC/ABCD/ABCDE)
 * - Backend só armazena/espelha e calcula diaCiclo por módulo
 * - COL_FASE = cicloTreino (compat)
 * ============================================================ */

function _normalizarCicloTreino_(raw) {
  const s = String(raw || "").toUpperCase();
  const letters = s.match(/[A-E]/g) || [];
  const out = [];
  const seen = {};
  for (let i = 0; i < letters.length && out.length < 5; i++) {
    const ch = letters[i];
    if (!seen[ch]) {
      seen[ch] = true;
      out.push(ch);
    }
  }
  // MaleFlow: mínimo AB (2)
  if (out.length < 2) return "";
  return out.join("");
}

function _diaCicloFromDiaPrograma_(diaPrograma, ciclo) {
  const c = String(ciclo || "");
  const len = c.length || 0;
  if (!len) return 1;
  const dp = Number(diaPrograma) || 1;
  return ((dp - 1) % len) + 1;
}

/* ============================================================
 * 🔥 CÁLCULO DO CICLO DE TREINO (NÃO HORMONAL)
 * - Retorna ciclo + diaCiclo (1..len)
 * ============================================================ */
function calcularCicloTreino_(params) {
  params = params || {};
  const ciclo = _normalizarCicloTreino_(params.cicloTreino || params.ciclo || params.fase) || "ABC";
  const diaPrograma = Number(params.diaPrograma) || 1;

  return {
    ciclo,
    dia: _diaCicloFromDiaPrograma_(diaPrograma, ciclo)
  };
}

/* ============================================================
 * ✅ SET CICLO (salva escolha do front)
 * - Salva COL_FASE = ciclo (AB/ABC/...)
 * - Salva COL_CICLO_DURACAO = ciclo.length (coerência)
 * - Recalcula COL_DIA_CICLO pelo diaPrograma atual
 * ============================================================ */
function setCiclo_(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const id = String(data.id || "").trim();
  if (!id) return { status: "error", msg: "missing_id" };

  const cicloRaw = data.cicloTreino || data.ciclo || data.fase || data.perfilInterno || "";
  const ciclo = _normalizarCicloTreino_(cicloRaw);
  if (!ciclo) return { status: "error", msg: "invalid_ciclo" };

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    if (String(r[COL_ID]).trim() !== id) continue;

    const linha = i + 1;

    // diaPrograma: se vier do front, salva; senão mantém/1
    const diaProgramaFinal =
      Number(data.diaPrograma) || Number(r[COL_DIA_PROGRAMA]) || 1;
    sh.getRange(linha, COL_DIA_PROGRAMA + 1).setValue(diaProgramaFinal);

    // salva ciclo
    sh.getRange(linha, COL_FASE + 1).setValue(ciclo);

    // coerência: duração derivada do ciclo
    sh.getRange(linha, COL_CICLO_DURACAO + 1).setValue(ciclo.length);

    // diaCiclo calculado
    const diaCicloFinal = _diaCicloFromDiaPrograma_(diaProgramaFinal, ciclo);
    sh.getRange(linha, COL_DIA_CICLO + 1).setValue(diaCicloFinal);

    // start do programa (se vazio)
    if (!r[COL_DATA_INICIO_PROGRAMA]) {
      sh.getRange(linha, COL_DATA_INICIO_PROGRAMA + 1).setValue(new Date());
    }

    return {
      status: "ok",
      id,
      ciclo,
      cicloDuracao: ciclo.length,
      diaPrograma: diaProgramaFinal,
      diaCiclo: diaCicloFinal
    };
  }

  return { status: "notfound", id };
}

/* ============================================================
 * 🔹 Resolver Perfil (resumo pro front)
 * - fase == ciclo (compat)
 * ============================================================ */
function _resolverPerfil(id) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return null;

  const idNorm = String(id || "").trim();
  if (!idNorm) return null;

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    if (String(r[COL_ID]).trim() === idNorm) {
      const ciclo = _normalizarCicloTreino_(r[COL_FASE]) || "ABC";
      const diaPrograma = Number(r[COL_DIA_PROGRAMA] || 1);

      return {
        id: r[COL_ID],
        nome: r[COL_NOME],
        email: r[COL_EMAIL],
        produto: r[COL_PRODUTO] || "",
        ativo: r[COL_LICENCA_ATIVA] === true,
        nivel: String(r[COL_NIVEL] || "iniciante").toLowerCase(),
        ciclo: ciclo,
        fase: ciclo.toLowerCase(), // compat
        cicloDuracao: ciclo.length,
        diaPrograma: diaPrograma,
        diaCiclo: _diaCicloFromDiaPrograma_(diaPrograma, ciclo),
        dataInicio: r[COL_DATA_INICIO] || new Date(),
        link_planilha: r[COL_LINK_PLANILHA] || "",
        enfase: _normFase(r[COL_ENFASE] || "nenhuma")
      };
    }
  }
  return null;
}

/* ============================================================
 * 🔹 Resolver Dia de Treino (para front)
 * ============================================================ */
function resolverDiaTreino(params) {
  params = params || {};
  const ciclo = _normalizarCicloTreino_(params.cicloTreino || params.ciclo || params.fase) || "ABC";
  const diaPrograma = Number(params.diaPrograma) || 1;

  return {
    fase: ciclo.toLowerCase(),     // compat
    ciclo: ciclo,
    diaTreino: _diaCicloFromDiaPrograma_(diaPrograma, ciclo),
    fonte: "programa"
  };
}

/* ============================================================
 * 🔄 Fixar "Fase" (compat) => normaliza e grava o ciclo
 * ============================================================ */
function calcularEFixarFase_(id) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return null;

  const idNorm = String(id || "").trim();
  if (!idNorm) return null;

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][COL_ID]).trim() !== idNorm) continue;

    const ciclo = _normalizarCicloTreino_(vals[i][COL_FASE]) || "";
    if (ciclo) {
      sh.getRange(i + 1, COL_FASE + 1).setValue(ciclo);
      sh.getRange(i + 1, COL_CICLO_DURACAO + 1).setValue(ciclo.length);
    }
    return ciclo || null;
  }

  return null;
}

/* ============================================================
 * 🔄 SYNC (MaleFlow)
 * - Não “inventa” ciclo: usa COL_FASE
 * - Se ciclo vazio, retorna ok com warning (front decide)
 * - Atualiza diaCiclo por módulo e mantém coerência de duração
 * ============================================================ */
function sync(id) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const idNorm = String(id || "").trim();
  if (!idNorm) return { status: "error", msg: "missing_id" };

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    if (String(r[COL_ID]).trim() !== idNorm) continue;

    const linha = i + 1;

    const ciclo = _normalizarCicloTreino_(r[COL_FASE]); // pode ser ""
    const diaPrograma = Number(r[COL_DIA_PROGRAMA] || 1);

    if (!ciclo) {
      // não força padrão aqui: front manda setciclo
      return {
        status: "ok",
        msg: "ciclo_not_set",
        ciclo: "",
        fase: "",
        diaCiclo: Number(r[COL_DIA_CICLO] || 1),
        diaPrograma
      };
    }

    const diaCiclo = _diaCicloFromDiaPrograma_(diaPrograma, ciclo);

    // coerência de colunas
    sh.getRange(linha, COL_DIA_CICLO + 1).setValue(diaCiclo);
    sh.getRange(linha, COL_CICLO_DURACAO + 1).setValue(ciclo.length);
    sh.getRange(linha, COL_FASE + 1).setValue(ciclo);

    return {
      status: "ok",
      ciclo,
      fase: ciclo,     // compat
      diaCiclo
    };
  }

  return { status: "notfound", id: idNorm };
}
