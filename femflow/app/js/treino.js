/* =======================================================================
   FemFlow v05 — Treino Diário 2025
   ENGINE HORMONAL 3.1 • TURNOVER • FIREBASE • SNAPSHOT OFFLINE
======================================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const OFFLINE_KEY_TREINO = "femflow_offline_treino_v1";

  /* -----------------------------------------------------------
   * 1. LOGIN + CICLO
   * ----------------------------------------------------------- */
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    return location.href = "index.html?ret=treino.html";
  }

  const cicloOK =
    localStorage.getItem("femflow_cycle_configured") === "yes" &&
    localStorage.getItem("femflow_startDate") &&
    localStorage.getItem("femflow_cycleLength");

  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo.");
    return location.href = "ciclo.html";
  }

  /* -----------------------------------------------------------
   * 2. ESTADO BASE
   * ----------------------------------------------------------- */
  const estado = (window.FEMFLOW && typeof FEMFLOW.getEstadoTreino === "function")
    ? FEMFLOW.getEstadoTreino()
    : {
        enfase: "geral",
        nivel: "iniciante",
        fase: "menstrual",
        diaCiclo: 1
      };

  /* -----------------------------------------------------------
   * 3. ELEMENTOS
   * ----------------------------------------------------------- */
  const track = document.querySelector("#carouselTrack");
  const bar   = document.querySelector("#progressBar");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Estrutura interna ausente.");
    return;
  }

  let boxes   = [];
  let current = 0;

  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);
  document.querySelector("#tituloDiaTreino").textContent =
    `Dia ${diaPrograma} do Programa`;

  let metaTreino = {
    fase: null,
    diaCiclo: null,
    diaPrograma
  };

     /* ============================================================
   * 4. CARROSSEL
   * ============================================================ */
  const moveTo = (dir) => {
    const total = boxes.length;

    if (dir === "next" && current < total - 1) {
      current++;
      navigator.vibrate?.([30]);
    } else if (dir === "prev" && current > 0) {
      current--;
      navigator.vibrate?.([20]);
    }

    const item = track.children[current];
    if (!item) return;

    track.scrollTo({
      left: item.offsetLeft - 16,
      behavior: "smooth"
    });

    bar.style.width = `${((current + 1) / total) * 100}%`;
  };

  let startX = 0, endX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchmove",  e => endX   = e.touches[0].clientX);
  track.addEventListener("touchend", () => {
    if (Math.abs(startX - endX) > 40)
      moveTo(startX > endX ? "next" : "prev");
  });

  /* ============================================================
   * 5. TIMERS
   * ============================================================ */
  const fmt = s => `00:${String(s).padStart(2, "0")}`;
  const intervals = new WeakMap();

  function parseTempo(raw) {
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return n > 0 ? n : 45;
  }

  function bindTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(el => {

      const total = parseTempo(el.dataset.total);
      el.dataset.total = total;

      const fill  = el.querySelector(".ff-timer-fill");
      const label = el.querySelector(".ff-timer-count");

      let remain = total;

      const start = () => {
        clearInterval(intervals.get(el));
        el.classList.add("running");

        const int = setInterval(() => {
          remain--;
          fill.style.width = `${(remain / total) * 100}%`;
          label.textContent = fmt(remain);

          if (remain <= 0) {
            clearInterval(int);
            el.classList.remove("running");
            el.classList.add("done");
          }
        }, 1000);

        intervals.set(el, int);
      };

      el.addEventListener("click", () => {
        if (el.classList.contains("running")) {
          clearInterval(intervals.get(el));
          el.classList.remove("running");
        } else {
          start();
        }
      });
    });
  }
  /* ============================================================
   * 6. ENGINE HORMONAL 3.1 — FINAL UNIFICADA (2025)
   * ============================================================ */

function calcularEngineHormonal() {

  let perfil = (localStorage.getItem("femflow_perfilHormonal") || "regular")
    .toLowerCase()
    .trim();

  const faseManual =
    localStorage.getItem("femflow_fase_manual") ||
    localStorage.getItem("femflow_fase") ||
    null;

  const cicloDuracao = Number(localStorage.getItem("femflow_cycleLength") || 28);
  const dataInicio = localStorage.getItem("femflow_startDate");

  // diaCiclo REAL salvo pela aluna (ciclo.html -> FEMFLOW.setFase)
  let diaCiclo = Number(localStorage.getItem("femflow_diaciclo") || 1);

  /* -----------------------------------------------------------
   * 6.1 PERFIS FISIOLÓGICOS
   * regular / diu_cobre / irregular
   * ----------------------------------------------------------- */
  if (["regular", "diu", "diu_cobre", "irregular"].includes(perfil)) {

    const fase = (faseManual || "folicular").toLowerCase();

    return {
      modo: "ciclo_real",
      faseFirebase: fase,
      diaFirebase: diaCiclo,
      diaKey: `dia_${diaCiclo}`
    };
  }
  /* -----------------------------------------------------------
 * 6.2 PERFIL MENOPAUSA / TÉCNICO / DIU HORMONAL — 23+5
 * iniciante      → 23 dias lutea + 5 menstrual
 * intermediaria  → 23 dias folicular + 5 menstrual
 * avancada       → 32 dias ovulatória + 5 menstrual
 *
 * REGRA EXTRA: se o ciclo (quiz 23+5) estiver em BAIXA ENERGIA,
 *              ou seja, femflow_fase_atual = "menstrual",
 *              o backend SEMPRE deve ver fase "menstrual".
 * ----------------------------------------------------------- */
if (perfil === "menopausa" || perfil === "tecnica" || perfil === "diu_hormonal") {

  const nivel = (
    localStorage.getItem("femflow_nivel") ||
    "iniciante"
  ).toLowerCase();

  const faseAtualFront = (
    localStorage.getItem("femflow_fase_atual") || ""
  ).toLowerCase().trim();

  // 🔻 6.2.1 — BAIXA ENERGIA: força FASE MENSTRUAL no backend
  if (faseAtualFront === "menstrual") {

    // usamos um ciclo curto 1–5 só para mapear em dias menstruais
    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    const diaFirebase = ((diaEner - 1) % 5) + 1;  // 1..5 sempre

    return {
      modo: "menopausa_baixa",
      faseFirebase: "menstrual",
      diaFirebase,
      diaKey: `dia_${diaFirebase}`
    };
  }

  // 🔺 6.2.2 — ENERGIA ALTA: segue a lógica 23 (fase alta)
  let total = 23;        // padrão
  let zonaInicio = 18;   // lutea (iniciante)

  if (nivel === "intermediaria") {
    total = 23;
    zonaInicio = 6;      // folicular
  }

  if (nivel === "avancada") {
    total = 32;
    zonaInicio = 14;     // ovulatória extended
  }

  // contador energético salvo no localStorage
  let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);

  // turnover infinito: ciclo artificial de fase alta
  const diaFirebase = zonaInicio + ((diaEner - 1) % total);

  const fase = faseDoNumero(diaFirebase);

  return {
    modo: "menopausa_alta",
    faseFirebase: fase,
    diaFirebase,
    diaKey: `dia_${diaFirebase}`
  };
}

  // fallback
  return {
    modo: "fallback",
    faseFirebase: "folicular",
    diaFirebase: 1,
    diaKey: "dia_1"
  };
}
   window.calcularEngineHormonal = calcularEngineHormonal;

/* ------------------------------------------------------------
   * Auxiliar: converte dia (1–30) em fase
   ------------------------------------------------------------ */
function faseDoNumero(dia) {
  if (dia >= 1 && dia <= 5) return "menstrual";
  if (dia <= 13)           return "folicular";
  if (dia <= 17)           return "ovulatoria";
  return "lutea";
}

/* ============================================================
   * 7. ENGINE ENERGÉTICA — avança quando salva treino
   ============================================================ */

function engineEnergeticaAvancar() {
  let dia = Number(localStorage.getItem("femflow_dia_energetico") || 1);
  localStorage.setItem("femflow_dia_energetico", dia + 1);
}

function engineEnergeticaRetroalimentar() {
  let dia = Number(localStorage.getItem("femflow_dia_energetico") || 1);
  if (dia > 1) localStorage.setItem("femflow_dia_energetico", dia - 1);
}

/* ============================================================
 * BLOCO 4 — RESOLVER PERFIL + QUERY FIREBASE
 * ============================================================ */

/* ------------------------------------------------------------
 * 4.1 — Identifica nível + ênfase + perfil hormonal do front
 * ------------------------------------------------------------ */

function resolverPerfilFront() {

  const nivel = (
    localStorage.getItem("femflow_nivel") ||
    "iniciante"
  ).toLowerCase().trim();

  // ex: "avancada_costas", "iniciante_gluteo", "intermediaria_geral"
  const enfase = (
    localStorage.getItem("femflow_enfase") ||
    "geral"
  ).toLowerCase().trim();

  const perfilHormonal = (
    localStorage.getItem("femflow_perfilHormonal") ||
    "regular"
  ).toLowerCase().trim();

  return {
    nivel,
    enfase,
    perfilHormonal
  };
}

/* ------------------------------------------------------------
 * 4.2 — Montar a pasta do Firebase
 * ------------------------------------------------------------
 * Se ênfase for “geral”, usa nível_geral
 * Se ênfase for "costas", "gluteo", "ombro" → nível_enfase
 * ------------------------------------------------------------ */

function montarPastaFirebase(nivel, enfase) {

  if (enfase === "geral" || enfase === "nenhuma") {
    return `${nivel}_geral`;  // ex: iniciante_geral
  }

  return `${nivel}_${enfase}`; // ex: avancada_costas
}

/* ------------------------------------------------------------
 * 4.3 — Gerar objeto de query final
 * (usado pelo FEMFLOW.buscarExerciciosFirebase)
 * ------------------------------------------------------------ */

function gerarFirebaseQuery(faseFirebase, diaFirebase) {

  const front = resolverPerfilFront();

  const pasta = montarPastaFirebase(front.nivel, front.enfase);

  const diaKey = `dia_${diaFirebase}`;

  return {
    pasta,             // ex: "avancada_costas"
    fase: faseFirebase, // ex: "folicular"
    diaKey,            // ex: "dia_11"
    nivel: front.nivel,
    enfase: front.enfase,
    perfilHormonal: front.perfilHormonal
  };
}
/* ============================================================
 * BLOCO 5 — FIREBASE → buscar exercícios → montar BOXES
 * ============================================================ */

/* ------------------------------------------------------------
 * 5.1 — Carregar exercícios do Firebase
 * (pasta, fase, diaKey → retorna lista normalizada)
 * ------------------------------------------------------------ */

async function carregarExerciciosFirebase(firebaseQuery) {

  try {
    const data = await FEMFLOW.buscarExerciciosFirebase(
      firebaseQuery.pasta,   // "avancada_costas"
      firebaseQuery.fase,    // "folicular"
      firebaseQuery.diaKey   // "dia_11"
    );

    if (!data || !Array.isArray(data)) {
      console.warn("⚠️ Firebase retornou vazio:", firebaseQuery);
      return [];
    }

    // -----------------------------------------------------------
    // NORMALIZAÇÃO DE CADA EXERCÍCIO
    // -----------------------------------------------------------
    return data.map(ex => ({
      box: ex.box || "Box 1",
      exercicio: ex.titulo || ex.nome || "Exercício",
      link: ex.link || ex.url || "",
      series: Number(ex.series ?? 3),
      reps: Number(ex.reps ?? 12),
      tempo: Number(ex.tempo ?? 45)
    }));

  } catch (err) {
    console.error("❌ Erro Firebase:", err);
    return [];
  }
}

/* ------------------------------------------------------------
 * 5.2 — Agrupar exercícios em boxes ordenados
 * ------------------------------------------------------------ */

function organizarBoxes(listaEx) {

  const boxMap = new Map();

  listaEx.forEach(ex => {
    const nome = ex.box || "Box 1";

    if (!boxMap.has(nome)) boxMap.set(nome, []);
    boxMap.get(nome).push(ex);
  });

  // Ordenação por número → Box 1, Box 2, Box 3…
  const ordenado = [...boxMap.entries()].sort((a, b) => {
    const na = Number((a[0].match(/\d+/) || [999])[0]);
    const nb = Number((b[0].match(/\d+/) || [999])[0]);
    return na - nb;
  });

  return ordenado.map(([nome, exs]) => ({
    tipo: "exercicios",
    titulo: nome,
    itens: exs
  }));
}

/* ------------------------------------------------------------
 * 5.3 — Aplicar HIIT/Cardio automático no último Box
 * ------------------------------------------------------------ */

function aplicarHIITnosBoxes(boxes, hiitCardio) {

  if (!hiitCardio || !hiitCardio.length) return boxes;

  const ultimo = boxes[boxes.length - 1];

  if (!ultimo) return boxes;

  ultimo.extras = hiitCardio;

  return boxes;
}

/* ------------------------------------------------------------
 * 5.4 — Fluxo completo FIREBASE → BOXES PRONTOS
 * ------------------------------------------------------------ */

async function gerarBoxesFinais(firebaseQuery, hiitCardio, box0, boxFinal) {

  // 1) Carrega exercícios reais do Firebase
  const exList = await carregarExerciciosFirebase(firebaseQuery);

  // 2) Organiza cada exercício no seu Box
  let lista = organizarBoxes(exList);

  // 3) Insere HIIT/Cardio automaticamente
  lista = aplicarHIITnosBoxes(lista, hiitCardio);

  // 4) Insere Box 0 no início
  if (box0) lista.unshift(box0);

  // 5) Insere Box Final no fim
  if (boxFinal) lista.push(boxFinal);

  return lista;
}
   /* ============================================================
 * BLOCO 6 — EXECUÇÃO FINAL DO TREINO
 * ============================================================ */

async function executarTreinoDia() {

  /* ---------------------------------------------
   * 1) DADOS ESSENCIAIS DO FRONT
   * --------------------------------------------- */
  const id = localStorage.getItem("femflow_id");
  const nivel  = (localStorage.getItem("femflow_nivel")  || "iniciante").toLowerCase();
  const enfase = (localStorage.getItem("femflow_enfase") || "geral").toLowerCase();

  if (!id) {
    FEMFLOW.toast("⚠️ Refaça o login.");
    return location.href = "index.html?ret=treino.html";
  }

  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);

  /* ---------------------------------------------
   * 2) MOTOR HORMONAL 3.1 → devolve:
   *    faseFirebase, diaFirebase e diaKey
   * --------------------------------------------- */
  const hormonal = calcularEngineHormonal();
  const faseFirebase = hormonal.faseFirebase;
  const diaFirebase  = hormonal.diaFirebase;
  const diaKey       = hormonal.diaKey;

  console.log("🔥 Engine Hormonal →", hormonal);

  /* ---------------------------------------------
   * 3) MONTAR QUERY do Firebase
   * pasta = nivel_enfase
   * --------------------------------------------- */
  const pastaFirebase = `${nivel}_${enfase}`;  
  const firebaseQuery = {
    pasta: pastaFirebase,
    fase: faseFirebase,
    diaKey: diaKey
  };

  console.log("📁 Firebase Query:", firebaseQuery);

  /* ---------------------------------------------
   * 4) CHAMAR BACKEND (GET → treino)
   * --------------------------------------------- */
  const url =
    `${SCRIPT_URL}?action=treino` +
    `&id=${encodeURIComponent(id)}` +
    `&fase=${encodeURIComponent(faseFirebase)}` +
    `&diaFirebase=${encodeURIComponent(diaFirebase)}` +
    `&diaKey=${encodeURIComponent(diaKey)}` +
    `&nivel=${encodeURIComponent(nivel)}` +
    `&enfase=${encodeURIComponent(enfase)}`;

  let j = null;

  try {
    const resp = await fetch(url);
    j = await resp.json();
  } catch (e) {
    console.error("❌ GET treino falhou:", e);
  }

  if (!j || j.status !== "ok") {
    FEMFLOW.toast("❌ Falha ao carregar treino.");
    return;
  }

  /* ---------------------------------------------
   * 5) Box0 e BoxFinal vindos do BACKEND
   * --------------------------------------------- */
  const box0 = j.boxes?.find(b => b.tipo === "texto")        || null;
  const boxFinal = j.boxes?.find(b => b.tipo === "resfriamento") || null;

  /* ---------------------------------------------
   * 6) HIIT/Cardio AUTOMÁTICO
   * --------------------------------------------- */
  const hiitCardio = j.hiitCardio || [];

  /* ---------------------------------------------
   * 7) CARREGAR TREINOS DO FIREBASE
   * --------------------------------------------- */
  const listaFinal = await gerarBoxesFinais(
    firebaseQuery,
    hiitCardio,
    box0,
    boxFinal
  );

  if (!listaFinal.length) {
    FEMFLOW.toast("Nenhum exercício encontrado.");
  }

  /* ---------------------------------------------
   * 8) APLICAR ESTILO DA FASE (ex: ovulatória)
   * --------------------------------------------- */
  aplicarPerformanceView(faseFirebase);

  /* ---------------------------------------------
   * 9) RENDERIZAR NO CARROSSEL
   * --------------------------------------------- */
  render(listaFinal);

  /* ---------------------------------------------
   * 10) SNAPSHOT OFFLINE AUTOMÁTICO
   * --------------------------------------------- */
  salvarSnapshotOffline({
    fase: faseFirebase,
    diaCiclo: hormonal.diaFirebase,
    diaPrograma
  }, listaFinal);

  console.log("✅ Treino final renderizado!");
}
   /* ============================================================
 * BLOCO 7 — SALVAR TREINO • DESCANSO • AVANÇO DE DIAS
 * ============================================================ */

/**
 * Avança o dia do PROGRAMA (1 a 30)
 * — sempre avança: treino ou descanso
 */
function avancarDiaPrograma() {
  let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (prog < 30) {
    localStorage.setItem("femflow_dia_treino", prog + 1);
  }
}

/**
 * Avança o dia fisiológico (diaCiclo)
 * — SOMENTE para perfis fisiológicos:
 *   regular, diu, diu_cobre, irregular
 * — NÃO avança para motor energético:
 *   menopausa, tecnica, diu_hormonal
 */
function avancarDiaCicloSeAplicavel() {
  const perfil = (localStorage.getItem("femflow_perfilHormonal") || "regular")
    .toLowerCase();

  // Perfis que NÃO mexem no ciclo real (engine energética)
  if (["menopausa", "tecnica", "diu_hormonal"].includes(perfil)) {
    return; // não altera diaCiclo
  }

  // Perfis fisiológicos
  let diaCiclo = Number(localStorage.getItem("femflow_diaCiclo") || 1);
  diaCiclo++;

  // Normaliza para não estourar
  const cicloDuracao = Number(localStorage.getItem("femflow_cycleLength") || 28);
  if (diaCiclo > cicloDuracao) diaCiclo = 1;

  localStorage.setItem("femflow_diaCiclo", diaCiclo);
}

/* ============================================================
 * SALVAR TREINO (com PSE)
 * ============================================================ */

document.querySelector("#salvarTreinoBtn")?.addEventListener("click", () => {

  FEMFLOW.abrirPSE(async (pse) => {

    try {
      await FEMFLOW.salvarTreino({
        id: localStorage.getItem("femflow_id"),
        fase: localStorage.getItem("femflow_fase_atual"),
        treino: "dia",
        tipo_dia: "treino",
        pse
      });

      // 🔥 Avanço do programa e do ciclo (se aplicável)
      avancarDiaPrograma();
      avancarDiaCicloSeAplicavel();

      FEMFLOW.toast("✔️ Treino salvo!");
      setTimeout(() => FEMFLOW.router("flowcenter"), 900);

    } catch (err) {
      console.warn("Falha ao salvar treino:", err);
      FEMFLOW.toast("📴 Sem conexão. Treino será enviado depois.");
    }
  });

});

/* ============================================================
 * DESCANSO
 * (conta como dia do PROGRAMA, mas não altera fase hormonal)
 * ============================================================ */

document.querySelector("#descansoBtn")?.addEventListener("click", async () => {

  try {
    await FEMFLOW.salvarDescanso(
      localStorage.getItem("femflow_fase_atual")
    );

    // 🔥 descanso só avança o programa
    avancarDiaPrograma();

    FEMFLOW.toast("🌿 Descanso registrado.");
    setTimeout(() => FEMFLOW.router("flowcenter"), 900);

  } catch (err) {
    console.warn("Falha descanso:", err);
    FEMFLOW.toast("📴 Sem conexão. Será salvo depois.");
  }

});

/* ============================================================
 * RELOAD QUANDO TROCA DE IDIOMA
 * ============================================================ */
window.addEventListener("femflow:langchange", () => {
  location.reload();
});
/* ============================================================
 * BLOCO 8 — DEBUG • INSPECTOR • UTILIDADES FINAIS
 * ============================================================ */

window.FEMFLOW_DEBUG_TREINO = {

  /**
   * 📌 Mostra resumo do estado hormonal + energético
   * — usado no console: FEMFLOW_DEBUG_TREINO.log()
   */
  log() {
    const perfil = localStorage.getItem("femflow_perfilHormonal");
    const faseAtual = localStorage.getItem("femflow_fase_atual");
    const diaPrograma = localStorage.getItem("femflow_dia_treino");
    const diaCiclo = localStorage.getItem("femflow_diaCiclo");
    const nivel = localStorage.getItem("femflow_nivel");
    const enfase = localStorage.getItem("femflow_enfase");
    const diaEnergetico = localStorage.getItem("femflow_dia_energetico");
    const cicloDuracao = localStorage.getItem("femflow_cycleLength");

    console.log("======= FEMFLOW DEBUG =======");
    console.table({
      PerfilHormonal: perfil,
      FaseAtual: faseAtual,
      DiaPrograma: diaPrograma,
      DiaCiclo: diaCiclo,
      DiasCicloTotal: cicloDuracao,
      Nivel: nivel,
      Enfase: enfase,
      DiaEnergetico: diaEnergetico
    });
    console.log("=============================");
  },

  /**
   * 📌 Imprime o detalhe COMPLETO do objeto Firebase Query
   * — usado no console após o treino carregar
   */
  printFirebaseQuery(query) {
    console.log("===== FIREBASE QUERY =====");
    console.table(query);
    console.log("==========================");
  },

  /**
   * 📌 Inspeciona snapshot offline do treino atual
   * — ótimo para testar modo offline real
   */
  snapshot() {
    try {
      const raw = localStorage.getItem("femflow_offline_treino_v1");
      if (!raw) return console.log("❌ Nenhum snapshot offline encontrado.");

      const snap = JSON.parse(raw);
      console.log("===== SNAPSHOT OFFLINE =====");
      console.log("META:", snap.meta);
      console.log("BOXES:", snap.lista);
      console.log("=============================");
    } catch (e) {
      console.warn("Erro ao ler snapshot offline:", e);
    }
  },

  /**
   * 🔥 Força avanço do ciclo (debug)
   * — NÃO usar no app real
   */
  stepCiclo() {
    let dia = Number(localStorage.getItem("femflow_diaCiclo") || 1);
    dia++;
    localStorage.setItem("femflow_diaCiclo", dia);
    console.log("Novo diaCiclo =", dia);
  },

  /**
   * 🔥 Força avanço da energia (menopausa / técnica)
   */
  stepEnergia() {
    let d = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    d++;
    localStorage.setItem("femflow_dia_energetico", d);
    console.log("Novo dia_energetico =", d);
  },

  /**
   * 🔥 Reset do snapshot offline
   */
  limparSnapshot() {
    localStorage.removeItem("femflow_offline_treino_v1");
    console.log("Snapshot offline removido.");
  }
};
   });   
