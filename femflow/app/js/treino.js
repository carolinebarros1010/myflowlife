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
  async function calcularEngineHormonal() {
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
    let diaCiclo = Number(localStorage.getItem("dia_ciclo") || 1);

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
     * 6.2 PERFIL MENOPAUSA TÉCNICA — 23+5
     * iniciante      → 23 dias lutea + 5 menstrual
     * intermediaria  → 23 dias folicular + 5 menstrual
     * avancada       → 32 dias ovulatória + 5 menstrual
     * ----------------------------------------------------------- */
    if (perfil === "menopausa" || perfil === "tecnica" || perfil === "diu_hormonal") {

      const nivel = (
        localStorage.getItem("femflow_nivel") ||
        "iniciante"
      ).toLowerCase();

      // Se a fase for menstrual, mantemos como menstrual independentemente da fase alta
      const faseAtualFront = (
        localStorage.getItem("femflow_fase_atual") || ""
      ).toLowerCase().trim();

      if (faseAtualFront === "menstrual") {
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
   ============================================================ */

  /* ------------------------------------------------------------
   * 4.1 — Identifica nível + ênfase + perfil hormonal do front
   ------------------------------------------------------------ */

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
   ------------------------------------------------------------
   * Se ênfase for “geral”, usa nível_geral
   * Se ênfase for "costas", "gluteo", "ombro" → nível_enfase
   ------------------------------------------------------------ */

  function montarPastaFirebase(nivel, enfase) {

    if (enfase === "geral" || enfase === "nenhuma") {
      return `${nivel}_geral`;  // ex: iniciante_geral
    }

    return `${nivel}_${enfase}`; // ex: avancada_costas
  }

  /* ------------------------------------------------------------
   * 4.3 — Gerar objeto de query final
   * (usado pelo FEMFLOW.buscarExerciciosFirebase)
   ------------------------------------------------------------ */

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
   * 5.1 — Carregar exercícios do Firebase
   * (pasta, fase, diaKey → retorna lista normalizada)
   ============================================================ */

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
   ------------------------------------------------------------ */

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
   ------------------------------------------------------------ */

  function aplicarHIITnosBoxes(boxes, hiitCardio) {

    if (!hiitCardio || !hiitCardio.length) return boxes;

    const ultimo = boxes[boxes.length - 1];

    if (!ultimo) return boxes;

    ultimo.extras = hiitCardio;

    return boxes;
  }

  /* ------------------------------------------------------------
   * 5.4 — Fluxo completo FIREBASE → BOXES PRONTOS
   ------------------------------------------------------------ */

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
   * EXECUÇÃO FINAL DO TREINO
   ============================================================ */

  async function executarTreinoDia() {

    const id = localStorage.getItem("femflow_id");
    const nivel = (localStorage.getItem("femflow_nivel") || "iniciante").toLowerCase();
    const enfase = (localStorage.getItem("femflow_enfase") || "geral").toLowerCase();

    if (!id) {
      FEMFLOW.toast("⚠️ Refaça o login.");
      return location.href = "index.html?ret=treino.html";
    }

    const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);

    const hormonal = calcularEngineHormonal();
    const faseFirebase = hormonal.faseFirebase;
    const diaFirebase = hormonal.diaFirebase;
    const diaKey = hormonal.diaKey;

    // Construção da consulta Firebase
    const pastaFirebase = `${nivel}_${enfase}`;
    const firebaseQuery = {
      pasta: pastaFirebase,
      fase: faseFirebase,
      diaKey: diaKey
    };

    const url =
      `${SCRIPT_URL}?action=treino` +
      `&id=${encodeURIComponent(id)}` +
      `&fase=${encodeURIComponent(faseFirebase)}` +
      `&diaFirebase=${encodeURIComponent(diaFirebase)}` +
      `&diaKey=${encodeURIComponent(diaKey)}` +
      `&nivel=${encodeURIComponent(nivel)}` +
      `&enfase=${encodeURIComponent(enfase)}` +
      `&diaCiclo=${encodeURIComponent(localStorage.getItem("femflow_diaCiclo"))}`;

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

    console.log("🔥 DiaCiclo recebido do backend:", j.diaCiclo);

    // Atualizando o valor de DiaCiclo no frontend (se necessário)
    localStorage.setItem("femflow_diaCiclo", j.diaCiclo);

    const box0 = j.boxes?.find(b => b.tipo === "texto") || null;
    const boxFinal = j.boxes?.find(b => b.tipo === "resfriamento") || null;

    const hiitCardio = j.hiitCardio || [];

    const listaFinal = await gerarBoxesFinais(firebaseQuery, hiitCardio, box0, boxFinal);

    if (!listaFinal.length) {
      FEMFLOW.toast("Nenhum exercício encontrado.");
    }

    aplicarPerformanceView(faseFirebase);
    render(listaFinal);

    salvarSnapshotOffline({
      fase: faseFirebase,
      diaCiclo: hormonal.diaFirebase,
      diaPrograma
    }, listaFinal);

    console.log("✅ Treino final renderizado!");
  }
});
