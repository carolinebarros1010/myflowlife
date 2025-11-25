/* =======================================================================
   FemFlow v04 — Treino Diário 2025
   ENGINE HORMONAL 3.0 + TURNOVER + HIIT INLINE + SNAPSHOT OFFLINE
   Arquivo reconstruído — versão final (2025-11)
======================================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  /* -----------------------------------------------------------
   * 0. Chave offline
   * ----------------------------------------------------------- */
  const OFFLINE_KEY_TREINO = "femflow_offline_treino_v1";

  /* -----------------------------------------------------------
   * 1. LOGIN E CICLO
   * ----------------------------------------------------------- */
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    location.href = "index.html?ret=treino.html";
    return;
  }

  const cicloOK =
    localStorage.getItem("femflow_cycle_configured") === "yes" &&
    localStorage.getItem("femflow_startDate") &&
    localStorage.getItem("femflow_cycleLength");

  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo.");
    location.href = "ciclo.html";
    return;
  }

  /* -----------------------------------------------------------
   * 2. ESTADO TREINO (Core)
   * ----------------------------------------------------------- */
  const estado = (window.FEMFLOW && typeof FEMFLOW.getEstadoTreino === "function")
    ? FEMFLOW.getEstadoTreino()
    : {
        enfase: "geral",
        nivel: "iniciante",
        fase: "folicular",
        diaCiclo: 1,
        cicloOK: false
      };

  console.log("🔎 EstadoTreino:", estado);

  /* -----------------------------------------------------------
   * 3. ELEMENTOS ESSENCIAIS
   * ----------------------------------------------------------- */
  const track     = document.querySelector("#carouselTrack");
  const bar       = document.querySelector("#progressBar");
  const tituloDia = document.querySelector("#tituloDiaTreino");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Estrutura interna ausente.");
    return;
  }

  let current = 0;
  let boxes   = [];

  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (tituloDia) tituloDia.textContent = `Dia ${diaPrograma} do Programa`;

  let metaTreino = {
    fase: null,
    diaCiclo: null,
    diaPrograma
  };
  /* ============================================================
   * 4. CARROSSEL 2025
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

    bar.style.width = total ? `${((current + 1) / total) * 100}%` : "0%";
  };

  let startX = 0, endX = 0;

  track.addEventListener("touchstart", e => startX = e.touches[0].clientX, { passive: true });
  track.addEventListener("touchmove",  e => endX   = e.touches[0].clientX, { passive: true });

  track.addEventListener("touchend", () => {
    const diff = startX - endX;
    if (Math.abs(diff) > 40) moveTo(diff > 0 ? "next" : "prev");
  }, { passive: true });

  /* ============================================================
   * 5. TIMERS
   * ============================================================ */
  const fmt = s => `00:${String(Math.max(0, Math.floor(s))).padStart(2, "0")}`;
  const intervals = new WeakMap();

  function parseTempo(raw) {
    if (!raw) return 45;
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return !isNaN(n) && n > 0 ? Math.floor(n) : 45;
  }

  function clearTimer(el) {
    const id = intervals.get(el);
    if (id) clearInterval(id);
    intervals.delete(el);
    el.classList.remove("running");
  }

  function startTimer(bar) {
    clearTimer(bar);

    const total = parseTempo(bar.dataset.total);
    let remain = total;

    const fill  = bar.querySelector(".ff-timer-fill");
    const label = bar.querySelector(".ff-timer-count");

    fill.style.width = "100%";
    label.textContent = fmt(remain);
    bar.classList.add("running");

    const int = setInterval(() => {
      remain--;
      label.textContent = fmt(remain);
      fill.style.width = `${(remain / total) * 100}%`;

      if (remain <= 0) {
        clearInterval(int);
        fill.style.width = "0%";
        bar.classList.remove("running");
        bar.classList.add("done");
        navigator.vibrate?.([60,40,60]);
      }
    }, 1000);

    intervals.set(bar, int);
  }

  function pauseTimer(bar) {
    const id = intervals.get(bar);
    if (id) clearInterval(id);
    bar.classList.remove("running");
  }

  function resetTimer(bar) {
    clearTimer(bar);
    const total = parseTempo(bar.dataset.total);
    bar.querySelector(".ff-timer-fill").style.width = "100%";
    bar.querySelector(".ff-timer-count").textContent = fmt(total);
    bar.classList.remove("running","done");
    bar.dataset.remain = total;
  }

  function bindTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(el => {
      const total = parseTempo(el.dataset.total || el.textContent);
      el.dataset.total = total;

      let t;

      el.addEventListener("click", () => {
        if (el.classList.contains("running")) pauseTimer(el);
        else startTimer(el);
      });

      el.addEventListener("touchstart", () => t = Date.now(), { passive: true });
      el.addEventListener("touchend", () => {
        if (Date.now() - t > 500) resetTimer(el);
      }, { passive: true });
    });
  }

  /* ============================================================
   * 6. Normalização de links
   * ============================================================ */
  const normLink = u => {
    if (!u) return "";
    let s = String(u).trim();
    if (/^youtu\.be/.test(s)) s = "https://" + s;
    if (/^www\.youtube/.test(s)) s = "https://" + s;
    if (/^http/.test(s)) return s;
    if (/youtube|youtu\.be/.test(s)) return "https://" + s;
    return s;
  };

  /* ============================================================
   * 7. Performance View
   * ============================================================ */
  let perfMode = "none";

  const aplicarPerformanceView = (faseStr = "") => {
    const f = (faseStr || "").toLowerCase();

    document.body.classList.remove(
      "ff-performance-ovulation",
      "ff-flow-menstrual",
      "ff-flow-folicular",
      "ff-flow-lutea"
    );

    if (f.includes("ovulat")) {
      perfMode = "ovulation";
      document.body.classList.add("ff-performance-ovulation");
    } else if (f.includes("menstr")) {
      perfMode = "softflow";
      document.body.classList.add("ff-flow-menstrual");
    } else if (f.includes("folicul")) {
      perfMode = "growthflow";
      document.body.classList.add("ff-flow-folicular");
    } else if (f.includes("lute")) {
      perfMode = "focusedflow";
      document.body.classList.add("ff-flow-lutea");
    } else {
      perfMode = "none";
    }
  };
  /* ============================================================
   * 8. HIIT INLINE — dentro do box final de exercícios
   * ============================================================ */
  function criarBoxHIIT(extras) {
    if (!extras || !extras.length) return "";

    return `
      <div class="box-extra-wrapper">
        ${extras.map(h => `
          <div class="box-extra ${h.kind === "cardio" ? "cardio" : "hiit"}">
            <div class="box-extra-tag">
              ${h.kind === "cardio" ? "💗 Cardio Leve / Moderado" : "🔥 HIIT / Intensidade"}
            </div>

            <h4>${h.titulo}</h4>
            <p>${h.descricao}</p>

            ${h.protocolo ? `<p><b>Protocolo:</b> ${h.protocolo}</p>` : ""}
            ${h.equipamentos ? `<p><b>Equipamentos:</b> ${h.equipamentos}</p>` : ""}
            <p><b>Duração:</b> ${(h.tempo_total / 60).toFixed(0)} min</p>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* ============================================================
   * 9. CRIAÇÃO DOS BOXES (HTML final)
   * ============================================================ */
  const criarBoxHTML = (box) => {

    const perfHeader =
      (perfMode === "ovulation" && box.tipo === "exercicios")
        ? `<div class="perf-strip">🌕 Performance Mode • Pico de energia</div>`
        : "";

    /* -----------------------------
     * A) BOX DE TEXTO
     * ----------------------------- */
    if (box.tipo === "texto") {
      return `
        <div class="box texto">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>
      `;
    }

    /* -----------------------------
     * B) BOX DE EXERCÍCIOS — NOVO LAYOUT FEMFLOW
     * ----------------------------- */
    if (box.tipo === "exercicios") {
      const extras = box.extras || [];

      return `
        <div class="box treino">

          ${perfHeader}
          <h3>${box.titulo}</h3>

          ${box.itens.map(e => `
            <div class="ff-ex">

              <div class="ff-ex-head">
                <b class="ff-ex-title">${e.exercicio}</b>
                ${e.link ? `<a class="ff-ex-video" target="_blank" href="${normLink(e.link)}">🎥</a>` : ""}
              </div>

              <div class="ff-ex-row">
                <div class="ff-ex-group">
                  <label>Séries</label>
                  <input type="text" inputmode="numeric" value="${e.series ?? ""}">
                </div>

                <div class="ff-ex-group">
                  <label>Reps</label>
                  <input type="text" inputmode="numeric" value="${e.reps ?? ""}">
                </div>
              </div>

              <div class="ff-ex-timer-wrapper">
                <label class="timer-label-text">Timer</label>

                <div class="ff-timer-bar" data-total="${parseTempo(e.tempo)}">
                  <div class="ff-timer-fill"></div>
                  <span class="ff-timer-count">${fmt(parseTempo(e.tempo))}</span>
                </div>
              </div>

            </div>
          `).join("")}

          ${criarBoxHIIT(extras)}
        </div>
      `;
    }

    /* -----------------------------
     * C) BOX DE RESFRIAMENTO
     * ----------------------------- */
    if (box.tipo === "resfriamento") {
      return `
        <div class="box resfriamento">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>
      `;
    }

    return "";
  };

  /* ============================================================
   * 10. RENDERIZAÇÃO DOS BOXES  (DECLARADA ANTES DE SER USADA)
   * ============================================================ */
  function render(lista) {

    boxes = lista;

    track.innerHTML = lista
      .map(b => `<div class="carousel-item">${criarBoxHTML(b)}</div>`)
      .join("");

    current = 0;

    moveTo("stay");
    bindTimers(track);
  }
  /* ============================================================
   * 11. ENGINE HORMONAL 3.0 — Turnover + Fases
   * ============================================================ */

  function getDiaFirebase() {

    const faseReal = (
      localStorage.getItem("femflow_fase_atual") ||
      estado.fase ||
      "menstrual"
    ).toLowerCase();

    const perfil = (
      localStorage.getItem("femflow_perfilHormonal") ||
      "regular"
    ).toLowerCase();

    const nivel = (
      localStorage.getItem("nivel_atual") ||
      estado.nivel ||
      "iniciante"
    ).toLowerCase();

    const faseAlta = (
      localStorage.getItem("femflow_faseAlta") ||
      "folicular"
    ).toLowerCase();

    const diaCiclo = Number(
      localStorage.getItem("dia_ciclo") ||
      estado.diaCiclo ||
      1
    );

    /* ------------------------------------------------------------
     * 1. NORMALIZAÇÃO
     * ------------------------------------------------------------ */
    const faseMap = {
      follicular: "folicular",
      folicular: "folicular",
      ovulatory: "ovulatoria",
      ovulatoria: "ovulatoria",
      luteal: "lutea",
      lutea: "lutea",
      menstrual: "menstrual"
    };

    let faseFirebase = faseMap[faseReal] || "folicular";

    /* ============================================================
     * 2. PERFIS FISIOLÓGICOS — regular / diu cobre / irregular
     * ============================================================ */

    if (["regular", "diu", "diu_cobre", "irregular"].includes(perfil)) {
      return {
        faseFirebase,
        diaFirebase: diaCiclo,
        diaKey: `dia_${diaCiclo}`,
        turnover: false
      };
    }

    /* ============================================================
     * 3. PERFIS ENERGÉTICOS — menopausa / técnica / diu hormonal
     * ============================================================ */

    const usarTurnover = ["menopausa", "menopausa_tecnica", "diu_hormonal"].includes(perfil);

    if (!usarTurnover) {
      return {
        faseFirebase,
        diaFirebase: diaCiclo,
        diaKey: `dia_${diaCiclo}`,
        turnover: false
      };
    }

    /* ------------------------------------------------------------
     * 4. DIA ENERGÉTICO (Turnover) — avança apenas quando salva treino
     * ------------------------------------------------------------ */
    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);

    if (!diaEner || diaEner < 1) diaEner = 1;

    /* ============================================================
     * 5. Turnover por nível
     * ------------------------------------------------------------
     * Iniciante      → 23 dias lutea + 5 menstrual
     * Intermediária  → 23 dias folicular + 5 menstrual
     * Avançada       → 23 dias ovulatória + 5 menstrual
     * ============================================================ */

    const nivelFaseMap = {
      iniciante: "lutea",
      intermediaria: "folicular",
      avançada: "ovulatoria",
      avancada: "ovulatoria"
    };

    const faseAltaEnergetica = nivelFaseMap[nivel] || "lutea";

    /* ------------------------------------------------------------
     * Tabela base 23 dias
     * ------------------------------------------------------------ */
    const baseDias = {
      folicular:  [6,7,8,9,10,11,12,13],
      ovulatoria: [14,15,16,17],
      lutea:      Array.from({length: 13}, (_,i)=>18+i)  // 18 a 30
    };

    /* Repete para formar 23 */
    function rep(arr) {
      let final = [];
      while (final.length < 23) final = final.concat(arr);
      return final.slice(0, 23);
    }

    const tabela23 = {
      folicular:  rep(baseDias.folicular),
      ovulatoria: rep(baseDias.ovulatoria),
      lutea:      rep(baseDias.lutea)
    };

    const tabelaMenstrual = [1,2,3,4,5];

    /* ------------------------------------------------------------
     * Fase final baseada no turnover
     * ------------------------------------------------------------ */
    const faseFinal = (diaEner <= 23) ? faseAltaEnergetica : "menstrual";
    const faseNorm  = faseMap[faseFinal] || "folicular";

    /* ------------------------------------------------------------
     * Dia do Firebase final
     * ------------------------------------------------------------ */
    let diaFirebase;

    if (faseNorm === "menstrual") {
      diaFirebase = tabelaMenstrual[(diaEner - 24) % 5] || 1;
    } else {
      diaFirebase = tabela23[faseNorm][diaEner - 1] || 1;
    }

    return {
      faseFirebase: faseNorm,
      diaFirebase,
      diaKey: `dia_${diaFirebase}`,
      turnover: true
    };
  }


  /* ============================================================
   * 11.1 Função para AVANÇAR o turnover (salvar treino ou descanso)
   * ============================================================ */
  function avancarTurnover() {

    const perfil = (
      localStorage.getItem("femflow_perfilHormonal") ||
      "regular"
    ).toLowerCase();

    if (!["menopausa", "menopausa_tecnica", "diu_hormonal"].includes(perfil))
      return;

    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    if (!diaEner || diaEner < 1) diaEner = 1;

    diaEner++;

    if (diaEner > 28) diaEner = 1;

    localStorage.setItem("femflow_dia_energetico", diaEner);
  }

  /* ============================================================
   * 11. ENGINE HORMONAL 3.0 — Turnover + Fases
   * ============================================================ */

  function getDiaFirebase() {

    const faseReal = (
      localStorage.getItem("femflow_fase_atual") ||
      estado.fase ||
      "menstrual"
    ).toLowerCase();

    const perfil = (
      localStorage.getItem("femflow_perfilHormonal") ||
      "regular"
    ).toLowerCase();

    const nivel = (
      localStorage.getItem("nivel_atual") ||
      estado.nivel ||
      "iniciante"
    ).toLowerCase();

    const faseAlta = (
      localStorage.getItem("femflow_faseAlta") ||
      "folicular"
    ).toLowerCase();

    const diaCiclo = Number(
      localStorage.getItem("dia_ciclo") ||
      estado.diaCiclo ||
      1
    );

    /* ------------------------------------------------------------
     * 1. NORMALIZAÇÃO
     * ------------------------------------------------------------ */
    const faseMap = {
      follicular: "folicular",
      folicular: "folicular",
      ovulatory: "ovulatoria",
      ovulatoria: "ovulatoria",
      luteal: "lutea",
      lutea: "lutea",
      menstrual: "menstrual"
    };

    let faseFirebase = faseMap[faseReal] || "folicular";

    /* ============================================================
     * 2. PERFIS FISIOLÓGICOS — regular / diu cobre / irregular
     * ============================================================ */

    if (["regular", "diu", "diu_cobre", "irregular"].includes(perfil)) {
      return {
        faseFirebase,
        diaFirebase: diaCiclo,
        diaKey: `dia_${diaCiclo}`,
        turnover: false
      };
    }

    /* ============================================================
     * 3. PERFIS ENERGÉTICOS — menopausa / técnica / diu hormonal
     * ============================================================ */

    const usarTurnover = ["menopausa", "menopausa_tecnica", "diu_hormonal"].includes(perfil);

    if (!usarTurnover) {
      return {
        faseFirebase,
        diaFirebase: diaCiclo,
        diaKey: `dia_${diaCiclo}`,
        turnover: false
      };
    }

    /* ------------------------------------------------------------
     * 4. DIA ENERGÉTICO (Turnover) — avança apenas quando salva treino
     * ------------------------------------------------------------ */
    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);

    if (!diaEner || diaEner < 1) diaEner = 1;

    /* ============================================================
     * 5. Turnover por nível
     * ------------------------------------------------------------
     * Iniciante      → 23 dias lutea + 5 menstrual
     * Intermediária  → 23 dias folicular + 5 menstrual
     * Avançada       → 23 dias ovulatória + 5 menstrual
     * ============================================================ */

    const nivelFaseMap = {
      iniciante: "lutea",
      intermediaria: "folicular",
      avançada: "ovulatoria",
      avancada: "ovulatoria"
    };

    const faseAltaEnergetica = nivelFaseMap[nivel] || "lutea";

    /* ------------------------------------------------------------
     * Tabela base 23 dias
     * ------------------------------------------------------------ */
    const baseDias = {
      folicular:  [6,7,8,9,10,11,12,13],
      ovulatoria: [14,15,16,17],
      lutea:      Array.from({length: 13}, (_,i)=>18+i)  // 18 a 30
    };

    /* Repete para formar 23 */
    function rep(arr) {
      let final = [];
      while (final.length < 23) final = final.concat(arr);
      return final.slice(0, 23);
    }

    const tabela23 = {
      folicular:  rep(baseDias.folicular),
      ovulatoria: rep(baseDias.ovulatoria),
      lutea:      rep(baseDias.lutea)
    };

    const tabelaMenstrual = [1,2,3,4,5];

    /* ------------------------------------------------------------
     * Fase final baseada no turnover
     * ------------------------------------------------------------ */
    const faseFinal = (diaEner <= 23) ? faseAltaEnergetica : "menstrual";
    const faseNorm  = faseMap[faseFinal] || "folicular";

    /* ------------------------------------------------------------
     * Dia do Firebase final
     * ------------------------------------------------------------ */
    let diaFirebase;

    if (faseNorm === "menstrual") {
      diaFirebase = tabelaMenstrual[(diaEner - 24) % 5] || 1;
    } else {
      diaFirebase = tabela23[faseNorm][diaEner - 1] || 1;
    }

    return {
      faseFirebase: faseNorm,
      diaFirebase,
      diaKey: `dia_${diaFirebase}`,
      turnover: true
    };
  }


  /* ============================================================
   * 11.1 Função para AVANÇAR o turnover (salvar treino ou descanso)
   * ============================================================ */
  function avancarTurnover() {

    const perfil = (
      localStorage.getItem("femflow_perfilHormonal") ||
      "regular"
    ).toLowerCase();

    if (!["menopausa", "menopausa_tecnica", "diu_hormonal"].includes(perfil))
      return;

    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    if (!diaEner || diaEner < 1) diaEner = 1;

    diaEner++;

    if (diaEner > 28) diaEner = 1;

    localStorage.setItem("femflow_dia_energetico", diaEner);
  }
  /* ============================================================
   * 19. SALVAR TREINO (com PSE)
   * ============================================================ */

  document.querySelector("#salvarTreinoBtn")?.addEventListener("click", async () => {

    FEMFLOW.abrirPSE(async (pse) => {

      try {
        await FEMFLOW.salvarTreino({
          id,
          fase: metaTreino.fase || faseFirebase,
          treino: "dia",
          tipo_dia: "treino",
          pse
        });

        /* ---------------------------
         * AVANÇA DIA DO PROGRAMA
         * --------------------------- */
        let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
        if (prog < 30) {
          localStorage.setItem("femflow_dia_treino", prog + 1);
        }

        /* ---------------------------
         * AVANÇA TURNOVER ENERGÉTICO
         * --------------------------- */
        if (hormonal.turnover === true) {
          avancarTurnover();
        }

        FEMFLOW.toast(`Treino salvo! Próximo: Dia ${prog + 1}`);

        setTimeout(() => FEMFLOW.router("flowcenter"), 1200);

      } catch (e) {
        console.warn("Falha ao salvar treino:", e);
        FEMFLOW.toast("📴 Sem conexão. Treino será salvo depois.");
      }

    }); // fim abrirPSE
  });


  /* ============================================================
   * 20. SALVAR DESCANSO
   * ============================================================ */

  document.querySelector("#descansoBtn")?.addEventListener("click", async () => {

    try {
      await FEMFLOW.salvarDescanso(metaTreino.fase || faseFirebase);

      /* ---------------------------
       * AVANÇA DIA DO PROGRAMA
       * --------------------------- */
      let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
      if (prog < 30) {
        localStorage.setItem("femflow_dia_treino", prog + 1);
      }

      /* ---------------------------
       * AVANÇA TURNOVER ENERGÉTICO
       * --------------------------- */
      if (hormonal.turnover === true) {
        avancarTurnover();
      }

      FEMFLOW.toast(`🌿 Descanso registrado. Próximo: Dia ${prog + 1}`);

    } catch (e) {
      console.warn("Erro ao registrar descanso:", e);
      FEMFLOW.toast("📴 Sem conexão. O descanso será salvo mais tarde.");
    }

  });


  /* ============================================================
   * 21. RELOAD AUTOMÁTICO AO TROCAR IDIOMA
   * ============================================================ */
  window.addEventListener("femflow:langchange", () => {
    location.reload();
  });

}); // FECHA DOMContentLoaded




/* =======================================================================
   22. DEBUG AVANÇADO — Inspeção em tempo real (opcional)
   ======================================================================= */

window.FEMFLOW_DEBUG_TREINO = {

  getEstado() {
    try {
      return {
        faseFirebase,
        diaFirebase,
        diaKey,
        turnover: hormonal.turnover,
        metaTreino,
        hormonal,
        nivel: localStorage.getItem("nivel_atual"),
        perfilHormonal: localStorage.getItem("femflow_perfilHormonal"),
        faseAtual: localStorage.getItem("femflow_fase_atual"),
        diaEnergetico: localStorage.getItem("femflow_dia_energetico"),
        diaPrograma: Number(localStorage.getItem("femflow_dia_treino") || 1)
      };
    } catch (e) {
      return { erro: true, msg: e };
    }
  },

  log() {
    console.log("====== FEMFLOW DEBUG TREINO ======");
    console.log(this.getEstado());
    console.log("==================================");
  },

  /* Forçar dia energético (testes apenas) */
  setDiaEner(d) {
    localStorage.setItem("femflow_dia_energetico", d);
    console.log("Dia energético ajustado:", d);
  }
};


/* =======================================================================
   FIM DO ARQUIVO — FemFlow v04 (2025)
   ENGINE HORMONAL 3.0 • TURNOVER • HIIT INLINE • CARROSSEL 2025
   ======================================================================= */
