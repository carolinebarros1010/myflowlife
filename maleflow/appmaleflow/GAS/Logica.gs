/* ============================================================
 * 🔥 MALEFLOW — CÁLCULO DO CICLO DE TREINO (NÃO HORMONAL)
 * ============================================================ */
function calcularCicloTreino_(params) {
  params = params || {};
  const {
    cicloDuracao,
    diaPrograma,
    cicloTreino
  } = params;

  const length = Number(cicloDuracao) > 0 ? Number(cicloDuracao) : 3;
  const diaBase = Number(diaPrograma) || 1;
  const diaIndex = ((diaBase - 1) % length) + 1;

  return {
    fase: String(cicloTreino || "").toLowerCase(),
    dia: diaIndex
  };
}

/* ======================================================
 * 🌸 SET CICLO — OPÇÃO A (STARTDATE RETROATIVO)
 * ------------------------------------------------------
 * Objetivo:
 * - Recebe diaCicloInicial (1..28)
 * - Calcula DataInicio real de forma retroativa
 * - Atualiza IMEDIATAMENTE:
 *   • DataInicio
 *   • Fase (N)
 *   • DiaCiclo (O)
 *
 * Decisões:
 * ✅ PerfilHormonal sempre "regular"
 * ✅ ManualStart SEMPRE limpo
 * ✅ VALIDAR passa a ser corretivo, não primário
 * ====================================================== */
function setCiclo_(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const id = String(data.id || "").trim();
  if (!id) return { status: "error", msg: "missing_id" };

  const values = sh.getDataRange().getValues();

  const _clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const cicloTreinoRaw =
    data.cicloTreino || data.ciclo || data.fase || data.perfilInterno || "";
  const cicloTreino = String(cicloTreinoRaw || "").toUpperCase().trim();

  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (String(r[0]).trim() !== id) continue;

    const linha = i + 1;

    const cicloDuracao = _clamp(
      Number(data.cicloDuracao) || Number(r[9]) || (cicloTreino ? cicloTreino.length : 3),
      2,
      5
    );
    sh.getRange(linha, 10).setValue(cicloDuracao);

    sh.getRange(linha, 14).setValue(cicloTreino || r[13] || "");

    const diaProgramaFinal = Number(data.diaPrograma) || 1;
    sh.getRange(linha, 22).setValue(diaProgramaFinal);

    const diaCicloFinal = ((diaProgramaFinal - 1) % cicloDuracao) + 1;
    sh.getRange(linha, 15).setValue(diaCicloFinal);

    if (!r[COL_DATA_INICIO_PROGRAMA]) {
      sh.getRange(linha, COL_DATA_INICIO_PROGRAMA + 1).setValue(new Date());
    }

    return {
      status: "ok",
      id,
      cicloDuracao,
      fase: cicloTreino || r[13] || "",
      diaCiclo: diaCicloFinal,
      diaPrograma: diaProgramaFinal
    };
  }

  return { status: "notfound" };
}


/* ======================================================
 * 🔹 Motor de Treino HÍBRIDO (resumo — usado pelo front)
 * ====================================================== */
function _resolverPerfil(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return null;

  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    if (String(r[0]).trim() === String(id).trim()) {
      return {
        id: r[0],
        nome: r[1],
        email: r[2],
        produto: r[5] || "",
        ativo: !!r[7],
        nivel: String(r[8] || "iniciante").toLowerCase(),
        cicloDuracao: Number(r[9] || 3),
        dataInicio: r[10] || new Date(),
        link_planilha: r[11] || "",
        enfase: _norm(r[12] || "nenhuma"),
        fase: _norm(r[13] || ""),
        diaCiclo: Number(r[14] || 1)
      };
    }
  }
  return null;
}
function resolverDiaTreino(params) {
  params = params || {};
  const { diaPrograma, cicloDuracao, cicloTreino } = params;
  const length = Number(cicloDuracao) > 0 ? Number(cicloDuracao) : 3;
  const diaTreino = ((Number(diaPrograma) || 1) - 1) % length + 1;

  return {
    fase: String(cicloTreino || "").toLowerCase(),
    diaTreino,
    fonte: "programa"
  };
}

/* ======================================================
 * 🔄 FASE ATUAL — FONTE ÚNICA
 * Coluna N (Fase) = índice 13
 * ====================================================== */
function calcularEFixarFase_(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return null;

  const idNorm = String(id || "").trim();
  if (!idNorm) return null;

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() !== idNorm) continue;

    const cicloTreino = String(vals[i][13] || "").toUpperCase();
    if (cicloTreino) {
      sh.getRange(i + 1, 14).setValue(cicloTreino);
    }

    return cicloTreino || null;
  }

  return null;
}

/**
 * 🔄 SYNC — Atualiza DiaCiclo/Fase com base em DataInicio
 * - Respeita ManualStart (col 21)
 * - Usa cálculo oficial de fase
 * - Retorna estado atualizado para o front
 */
function sync(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const idNorm = String(id || "").trim();
  if (!idNorm) return { status: "error", msg: "missing_id" };

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() !== idNorm) continue;

    const linha = i + 1;
    const cicloDuracao = Number(vals[i][9] || 3);
    const diaPrograma = Number(vals[i][COL_DIA_PROGRAMA] || 1);
    const cicloTreino = String(vals[i][13] || "").toUpperCase();

    const ciclo = calcularCicloTreino_({
      cicloDuracao,
      diaPrograma,
      cicloTreino
    });

    sh.getRange(linha, 15).setValue(ciclo.dia);
    if (cicloTreino) {
      sh.getRange(linha, 14).setValue(cicloTreino);
    }

    return {
      status: "ok",
      diaCiclo: ciclo.dia,
      fase: cicloTreino
    };
  }

  return { status: "notfound", id: idNorm };
}
