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
    if (Math.abs(startX - endX) > 40) moveTo(startX > endX ? "next" : "prev");
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
        } else start();
      });
    });
  }

   /* ============================================================
   6. ENGINE HORMONAL 3.1 — FINAL E UNIFICADA
   ============================================================ */

function calcularEngineHormonal() {

  let perfil = localStorage.getItem("femflow_perfilHormonal") || "regular";
  perfil = perfil.toLowerCase().trim();

  const faseManual = localStorage.getItem("femflow_fase_manual") || null;
  const cicloDuracao = Number(localStorage.getItem("femflow_cycleLength") || 28);
  const dataInicio = localStorage.getItem("femflow_startDate");

  // voltar o diaCiclo REAL salvo no login/planilha
  let diaCiclo = Number(localStorage.getItem("femflow_diaCiclo") || 1);

  // -----------------------------------------------------------
  // 6.1 Modo REGULAR / DIU / DIU COBRE / IRREGULAR
  // -----------------------------------------------------------
  if (["regular", "diu", "diu_cobre", "irregular"].includes(perfil)) {

    // ✨ Fase vem do ciclo.html → é a fase REAL
    const fase = (faseManual || localStorage.getItem("femflow_fase") || "folicular")
      .toLowerCase();

    const diaFirebase = diaCiclo;
    const diaKey = `dia_${diaFirebase}`;

    return {
      modo: "ciclo_real",
      faseFirebase: fase,
      diaFirebase,
      diaKey
    };
  }

  // -----------------------------------------------------------
  // 6.2 MODO MENOPAUSA TÉCNICA (23+5 / 32+5 / etc)
  // -----------------------------------------------------------
  if (perfil === "menopausa") {

    const nivel = (localStorage.getItem("femflow_nivel") || "iniciante")
      .toLowerCase();

    let total = 23;   // inicia 23+5 para iniciante
    let zonaInicio = 18; // lutea simulada

    if (nivel === "intermediaria") {
      total = 23;  // folicular simulada
      zonaInicio = 6;
    }

    if (nivel === "avancada") {
      total = 32; // ovulatória simulada
      zonaInicio = 14;
    }

    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);

    // turnover infinito (1 → total, 2 → total+1 …)
    const diaFirebase = ((diaEner - 1) % total) + zonaInicio;
    const fase = faseDoNumero(diaFirebase);

    const diaKey = `dia_${diaFirebase}`;

    return {
      modo: "menopausa",
      faseFirebase: fase,
      diaFirebase,
      diaKey
    };
  }

  // fallback — nunca deve ocorrer
  return {
    modo: "fallback",
    faseFirebase: "folicular",
    diaFirebase: 1,
    diaKey: "dia_1"
  };
}

/* ------------------------------------------------------------
   6.3 Função auxiliar para mapear diaCiclo → fase
------------------------------------------------------------ */
function faseDoNumero(dia) {
  if (dia >= 1 && dia <= 5)  return "menstrual";
  if (dia <= 13)             return "folicular";
  if (dia <= 17)             return "ovulatoria";
  return "lutea";
}

/* ============================================================
   7. ENGINE ENERGÉTICA (turnover de força)
   ============================================================ */

function engineEnergeticaAvancar() {
  let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);
  diaEner++;
  localStorage.setItem("femflow_dia_energetico", diaEner);
}

function engineEnergeticaRetroalimentar() {
  let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);
  if (diaEner > 1) diaEner--;
  localStorage.setItem("femflow_dia_energetico", diaEner);
}
   /* ============================================================
   BLOCO 3 — RESOLVER PERFIL + QUERY FIREBASE (OFICIAL)
   ============================================================ */

function resolverPerfilFront() {

  const nivel = (
    localStorage.getItem("femflow_nivel") ||
    "iniciante"
  ).toLowerCase().trim();

  // EXEMPLO REAL → "avancada_costas", "iniciante_gluteo", etc.
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

/* ============================================================
   3.2 — Construir o caminho real do Firebase
   (NIVEL + ENFASE → monta a pasta)
   ============================================================ */

function montarPastaFirebase(nivel, enfase) {

  // ------------------------------
  // CASOS ESPECIAIS → "geral"
  // ------------------------------
  if (enfase === "geral" || enfase === "nenhuma") {
    return `${nivel}_geral`;   // ex: iniciante_geral
  }

  // ------------------------------
  // CASO NORMAL: iniciante_costas, avancada_gluteo, etc
  // ------------------------------
  return `${nivel}_${enfase}`;
}

/* ============================================================
   3.3 — Gerar objeto de query final
   (usado por FEMFLOW.buscarExerciciosFirebase)
   ============================================================ */

function gerarFirebaseQuery(faseFirebase, diaFirebase) {

  const front = resolverPerfilFront();

  const pasta = montarPastaFirebase(front.nivel, front.enfase);

  const diaKey = `dia_${diaFirebase}`;

  return {
    pasta,         // ex: "avancada_costas"
    fase: faseFirebase, // ex: "folicular"
    diaKey,        // ex: "dia_11"
    nivel: front.nivel,
    enfase: front.enfase,
    perfilHormonal: front.perfilHormonal
  };
}
   /* ============================================================
   BLOCO 4 — FIREBASE → buscar exercícios + normalização
   ============================================================ */

async function carregarExerciciosFirebase(firebaseQuery) {

  // Exemplo de firebaseQuery:
  // {
  //   pasta: "avancada_costas",
  //   fase: "folicular",
  //   diaKey: "dia_11"
  // }

  try {
    const data = await FEMFLOW.buscarExerciciosFirebase(
      firebaseQuery.pasta,
      firebaseQuery.fase,
      firebaseQuery.diaKey
    );

    // Se Firebase retornou vazio:
    if (!data || !Array.isArray(data)) {
      console.warn("⚠️ Firebase retornou vazio:", firebaseQuery);
      return [];
    }

    // -----------------------------------------------------------
    // NORMALIZAÇÃO FINAL DO EXERCÍCIO
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

/* ============================================================
   4.2 — Distribuir exercícios por Box
   ============================================================ */
function organizarBoxes(listaEx) {

  const boxMap = new Map();

  listaEx.forEach(ex => {
    const nome = ex.box || "Box 1";
    if (!boxMap.has(nome)) boxMap.set(nome, []);
    boxMap.get(nome).push(ex);
  });

  // Ordena por número → Box 1, Box 2, Box 3
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

/* ============================================================
   4.3 — Aplicar HIIT/Cardio no último box
   ============================================================ */
function aplicarHIITnosBoxes(boxes, hiitCardio) {

  if (!hiitCardio || !hiitCardio.length) return boxes;

  const ultimo = boxes[boxes.length - 1];

  if (!ultimo) return boxes;

  ultimo.extras = hiitCardio;

  return boxes;
}

/* ============================================================
   4.4 — Fluxo completo FIREBASE → BOXES
   ============================================================ */
async function gerarBoxesFinais(firebaseQuery, hiitCardio, box0, boxFinal) {

  // 1) Carrega exercícios do Firebase
  const exList = await carregarExerciciosFirebase(firebaseQuery);

  // 2) Organiza em boxes
  let lista = organizarBoxes(exList);

  // 3) Adiciona HIIT/Cardio
  lista = aplicarHIITnosBoxes(lista, hiitCardio);

  // 4) Insere box0 no início
  if (box0) lista.unshift(box0);

  // 5) Insere boxFinal ao final
  if (boxFinal) lista.push(boxFinal);

  return lista;
}
/* ============================================================
   BLOCO 5 — EXECUÇÃO FINAL DO TREINO
   ============================================================ */

async function executarTreinoDia() {

  // 1) Dados essenciais
  const id = localStorage.getItem("femflow_id");
  const nivel = (localStorage.getItem("nivel_atual") || "iniciante").toLowerCase();
  const enfase = (localStorage.getItem("femflow_enfase") || "geral").toLowerCase();
  const faseLocal = localStorage.getItem("femflow_fase_atual") || "menstrual";

  const diaCiclo = Number(localStorage.getItem("dia_ciclo") || 1);
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);

  // 2) Aplica Motor Hormonal 23+5 / turnover
  const hormonal = getDiaFirebase();
  const faseFirebase = hormonal.faseFirebase;
  const diaFirebase  = hormonal.diaFirebase;
  const diaKey       = hormonal.diaKey;

  console.log("🔥 Engine FINAL →", hormonal);

  // 3) Monta consulta Firebase: pasta = nivel_enfase
  const pastaFirebase = `${nivel}_${enfase}`;   // ex: avancada_costas

  const firebaseQuery = {
    pasta: pastaFirebase,
    fase: faseFirebase,
    diaKey: diaKey
  };

  console.log("📁 Firebase Query:", firebaseQuery);

  // 4) Chama backend (treino)
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

  // 5) Box 0 e Box Final recebidos do backend
  const box0     = j.boxes?.find(b => b.tipo === "texto")        || null;
  const boxFinal = j.boxes?.find(b => b.tipo === "resfriamento") || null;

  // 6) HIIT/Cardio automático
  const hiitCardio = j.hiitCardio || [];

  // 7) Busca exercícios reais no Firebase e monta boxes
  const listaFinal = await gerarBoxesFinais(
    firebaseQuery,
    hiitCardio,
    box0,
    boxFinal
  );

  if (!listaFinal.length) {
    FEMFLOW.toast("Nenhum exercício encontrado.");
  }

  // 8) Aplica tema de fase (ovulatória, lutea, etc)
  aplicarPerformanceView(faseFirebase);

  // 9) RENDERIZA CARROSSEL
  render(listaFinal);

  // 10) Snapshot offline
  salvarSnapshotOffline({
    fase: faseFirebase,
    diaCiclo,
    diaPrograma
  }, listaFinal);

  console.log("✅ Treino final renderizado!");
}
/* ============================================================
   BLOCO 6 — SALVAR TREINO • DESCANSO • AVANÇO DE DIAS
   ============================================================ */

function avancarDiaPrograma() {
  let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (prog < 30) {
    localStorage.setItem("femflow_dia_treino", prog + 1);
  }
}

/**
 * Perfis fisiológicos → diaCiclo avança 1 por treino
 * Perfis energéticos (23+5, menopausa, técnica) → diaCiclo NÃO avança
 */
function avancarDiaCicloSeAplicavel() {
  const perfil = (localStorage.getItem("femflow_perfilHormonal") || "regular").toLowerCase();

  // perfis energéticos — NÃO alteram diaCiclo
  if (["menopausa", "tecnica", "diu_hormonal"].includes(perfil)) {
    return;
  }

  // perfis fisiológicos — avançam diaCiclo
  let diaCiclo = Number(localStorage.getItem("dia_ciclo") || 1);
  diaCiclo++;
  if (diaCiclo > 30) diaCiclo = 1;
  localStorage.setItem("dia_ciclo", diaCiclo);
}

/* ============================================================
   SALVAR TREINO (com PSE)
   ============================================================ */

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

      // Avança dias
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
   DESCANSO (não altera diaCiclo)
   ============================================================ */

document.querySelector("#descansoBtn")?.addEventListener("click", async () => {

  try {
    await FEMFLOW.salvarDescanso(
      localStorage.getItem("femflow_fase_atual")
    );

    avancarDiaPrograma(); // descanso conta como um dia normal

    FEMFLOW.toast("🌿 Descanso registrado.");
    setTimeout(() => FEMFLOW.router("flowcenter"), 900);

  } catch (err) {
    console.warn("Falha descanso:", err);
    FEMFLOW.toast("📴 Sem conexão. Será salvo depois.");
  }

});

/* ============================================================
   RELOAD QUANDO TROCA DE IDIOMA
   ============================================================ */
window.addEventListener("femflow:langchange", () => {
  location.reload();
});

/* ============================================================
   DEBUG OPCIONAL — (mantém sem interferir)
   ============================================================ */
window.FEMFLOW_DEBUG_TREINO = {
  log() {
    console.log("====== DEBUG ======");
    console.log({
      diaPrograma: localStorage.getItem("femflow_dia_treino"),
      diaCiclo: localStorage.getItem("dia_ciclo"),
      perfil: localStorage.getItem("femflow_perfilHormonal"),
      fase: localStorage.getItem("femflow_fase_atual")
    });
    console.log("====================");
  }
};



