/* =======================================================================
   FemFlow v04 — Treino Diário 2025
   ENGINE HORMONAL 3.0 (Turnover) + HIIT Inline + Carrossel 2025 + Offline
======================================================================= */

document.addEventListener('DOMContentLoaded', async () => {

  // -----------------------------------------------------------
  // 0. Chave offline
  // -----------------------------------------------------------
  const OFFLINE_KEY_TREINO = "femflow_offline_treino_v1";

  // -----------------------------------------------------------
  // 1. LOGIN E CICLO
  // -----------------------------------------------------------
  const id = localStorage.getItem('femflow_id');
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

  // -----------------------------------------------------------
  // 2. ESTADO TREINO (Core)
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 3. ELEMENTOS ESSENCIAIS
  // -----------------------------------------------------------
  const track     = document.querySelector("#carouselTrack");
  const bar       = document.querySelector("#progressBar");
  const tituloDia = document.querySelector("#tituloDiaTreino");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Estrutura interna ausente.");
    return;
  }

  let current = 0;
  let boxes   = [];

  // -----------------------------------------------------------
  // Dia do Programa (1–30)
  // -----------------------------------------------------------
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (tituloDia) tituloDia.textContent = `Dia ${diaPrograma} do Programa`;

  let metaTreino = {
    fase: null,
    diaCiclo: null,
    diaPrograma
  };

  // ============================================================
  // 4. CARROSSEL 2025
  // ============================================================
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

  // ============================================================
  // 5. TIMERS
  // ============================================================
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

    const fill  = bar.querySelector(".timer-fill");
    const label = bar.querySelector(".timer-label");

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
        navigator.vibrate?.([60, 40, 60]);
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
    bar.querySelector(".timer-fill").style.width = "100%";
    bar.querySelector(".timer-label").textContent = fmt(total);
    bar.classList.remove("running", "done");
    bar.dataset.remain = total;
  }

  function bindTimers(root) {
    root.querySelectorAll(".timer-bar").forEach(el => {
      const total = parseTempo(el.dataset.total || el.textContent);
      el.dataset.total = total;
      el.textContent = fmt(total);

      el.addEventListener("click", () => {
        if (el.classList.contains("running")) pauseTimer(el);
        else startTimer(el);
      });

      let t;
      el.addEventListener("touchstart", () => t = Date.now(), { passive: true });
      el.addEventListener("touchend", () => {
        if (Date.now() - t > 500) resetTimer(el);
      }, { passive: true });
    });
  }
  // ============================================================
  // 6. NORMALIZAÇÃO DE LINKS
  // ============================================================
  const normLink = u => {
    if (!u) return "";
    let s = String(u).trim();
    if (/^youtu\.be/.test(s)) s = "https://" + s;
    if (/^www\.youtube/.test(s)) s = "https://" + s;
    if (/^http/.test(s)) return s;
    if (/youtube|youtu\.be/.test(s)) return "https://" + s;
    return s;
  };

  // ============================================================
  // 7. PERFORMANCE VIEW (cores)
  // ============================================================
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

  // ============================================================
  // 8. HIIT INLINE — dentro do box final de exercícios
  // ============================================================
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

  // ============================================================
  // 9. CRIAÇÃO DOS BOXES (HTML final)
  // ============================================================
  const criarBoxHTML = (box) => {

    const perfHeader =
      (perfMode === "ovulation" && box.tipo === "exercicios")
        ? `<div class="perf-strip">🌕 Performance Mode • Pico de energia</div>`
        : "";

    // -----------------------------
    // TEXTO
    // -----------------------------
    if (box.tipo === "texto") {
      return `
        <div class="box texto">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>
      `;
    }

    // -----------------------------
    // EXERCÍCIOS (com HIIT inline)
    // -----------------------------
    if (box.tipo === "exercicios") {
      const extras = box.extras || [];

      return `
        <div class="box treino">

          ${perfHeader}
          <h3>${box.titulo}</h3>

          ${box.itens.map(e => `
            <div class="ex">

              <div class="ex-head">
                <b>${e.exercicio}</b>
                ${e.link ? `<a class="vid" target="_blank" href="${normLink(e.link)}">🎥</a>` : ""}
              </div>

              <div class="ex-grid">
                <label>Séries</label>
                <input inputmode="numeric" value="${e.series ?? ""}">

                <label>Reps</label>
                <input inputmode="numeric" value="${e.reps ?? ""}">

                <div class="timer-wrapper">
                  <span class="timer-text">Timer</span>
                  <div class="timer-bar" data-total="${parseTempo(e.tempo)}">
                    <div class="timer-fill"></div>
                    <span class="timer-label">${fmt(parseTempo(e.tempo))}</span>
                  </div>
                </div>

              </div>
            </div>
          `).join("")}

          ${criarBoxHIIT(extras)}

        </div>
      `;
    }

    // -----------------------------
    // RESFRIAMENTO
    // -----------------------------
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

  // ============================================================
  // 10. RENDERIZAÇÃO DOS BOXES
  // ============================================================
  const render = (lista) => {
    boxes = lista;

    track.innerHTML = lista
      .map(b => `<div class="carousel-item">${criarBoxHTML(b)}</div>`)
      .join("");

    current = 0;
    moveTo("stay");
    bindTimers(track);
  };

  // ============================================================
  // 11. ENGINE HORMONAL 3.0 — TURNOVER por nível e perfil
  // ============================================================

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

    const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);

    // ------------------------------------------------------------
    // PERFIS FISIOLÓGICOS — ciclo real
    // ------------------------------------------------------------
    const perfisFis = ["regular", "diu_cobre", "irregular"];

    if (perfisFis.includes(perfil)) {
      return {
        faseFirebase: faseReal,
        diaFirebase: diaPrograma,
        diaKey: `dia_${diaPrograma}`
      };
    }

    // ------------------------------------------------------------
    // PERFIS ENERGÉTICOS — TURNOVER
    // menopausa, menopausa_tecnica, diu_hormonal
    // ------------------------------------------------------------
    const perfisEner = ["menopausa", "menopausa_tecnica", "diu_hormonal"];
    if (!perfisEner.includes(perfil)) {
      return {
        faseFirebase: faseReal,
        diaFirebase: diaPrograma,
        diaKey: `dia_${diaPrograma}`
      };
    }

    // ------------------------------------------------------------
    // ENGINE = turnover fisiológico por nível
    // ------------------------------------------------------------
    const tabelas = {
      lutea:       [18,19,20,21,22,23,24,25,26,27,28,29,30],   // 13 dias
      folicular:   [6,7,8,9,10,11,12,13],                      // 8 dias
      ovulatoria:  [14,15,16,17]                               // 4 dias
    };

    const faseAltaPorNivel = {
      iniciante:     "lutea",
      intermediaria: "folicular",
      avancada:      "ovulatoria"
    };

    const faseDominante = faseAltaPorNivel[nivel] || "lutea";
    const tabela = tabelas[faseDominante];

    // ------------------------------------------------------------
    // MENSTRUAL REAL — dias 1 à 5 do programa
    // ------------------------------------------------------------
    if (diaPrograma <= 5) {
      return {
        faseFirebase: "menstrual",
        diaFirebase: diaPrograma,
        diaKey: `dia_${diaPrograma}`
      };
    }

    // ------------------------------------------------------------
    // TURNOVER — diaPrograma > 5
    // ------------------------------------------------------------
    const diaEnergetico = diaPrograma - 5;

    const idx = (diaEnergetico - 1) % tabela.length;  
    const diaFisiologico = tabela[idx];

    return {
      faseFirebase: faseDominante,
      diaFirebase: diaFisiologico,
      diaKey: `dia_${diaFisiologico}`
    };
  }

  // ============================================================
  // 12. EXECUTA ENGINE HORMONAL
  // ============================================================
  const hormonal = getDiaFirebase();
  console.log("⚙️ Engine Hormonal 3.0:", hormonal);

  const faseFirebase = hormonal.faseFirebase;
  const diaFirebase  = hormonal.diaFirebase;
  const diaKey       = hormonal.diaKey;

  // ============================================================
  // 13. CHAMADA AO BACKEND (Apps Script)
  // ============================================================
  const SCRIPT_URL =
    (typeof FEMFLOW !== "undefined" && FEMFLOW.SCRIPT_URL)
      ? FEMFLOW.SCRIPT_URL
      : "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

  const url =
    `${SCRIPT_URL}?action=treino` +
    `&id=${encodeURIComponent(id)}` +
    `&enfase=${encodeURIComponent(estado.enfase || "geral")}` +
    `&fase=${encodeURIComponent(faseFirebase)}` +
    `&nivel=${encodeURIComponent(estado.nivel)}` +
    `&diaFirebase=${encodeURIComponent(diaFirebase)}` +
    `&diaKey=${encodeURIComponent(diaKey)}`;

  let j = null;
  let offlineSnap = null;

  await (async () => {
    try {
      const resp = await fetch(url);
      const txt  = await resp.text();

      console.log("📡 Resposta bruta treino:", txt.slice(0, 400));

      try {
        j = JSON.parse(txt);
      } catch (e) {
        console.error("❌ Resposta não-JSON:", txt);
        offlineSnap = carregarSnapshotOffline();
      }

    } catch (e) {
      console.warn("⚠️ Falha de rede:", e);
      offlineSnap = carregarSnapshotOffline();
    }
  })();

  // ============================================================
  // 14. MODO OFFLINE
  // ============================================================
  const carregarSnapshotOffline = () => {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY_TREINO);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("⚠️ Falha ao carregar offline:", e);
      return null;
    }
  };

  const salvarSnapshotOffline = (meta, lista) => {
    try {
      const snap = {
        meta: {
          fase: meta.fase || null,
          diaCiclo: meta.diaCiclo || null,
          diaPrograma: meta.diaPrograma || null
        },
        lista
      };
      localStorage.setItem(OFFLINE_KEY_TREINO, JSON.stringify(snap));
    } catch (e) {
      console.warn("⚠️ Falha ao salvar offline:", e);
    }
  };

  if (!j) {
    if (offlineSnap && Array.isArray(offlineSnap.lista)) {
      FEMFLOW.toast("📴 Modo offline — usando treino salvo.");
      document.body.classList.add("ff-offline-mode");

      metaTreino = {
        fase: offlineSnap.meta?.fase || faseFirebase,
        diaCiclo: offlineSnap.meta?.diaCiclo || diaFirebase,
        diaPrograma: offlineSnap.meta?.diaPrograma || diaPrograma
      };

      aplicarPerformanceView(metaTreino.fase);
      render(offlineSnap.lista);
      return;
    }

    FEMFLOW.toast("Sem treino disponível. Verifique conexão.");
    render([{ tipo: "texto", titulo: "Erro", mensagem: "Não foi possível carregar treino." }]);
    return;
  }

  if (!j || j.status === "id_not_found") {
    render([{ tipo: "texto", titulo: "Sem treino", mensagem: "Faça login novamente." }]);
    return;
  }

  // ============================================================
  // 15. METADATA DO BACKEND
  // ============================================================
  if (!j.exSource) {
    j.exSource = "firebase";
    j.firebaseQuery = {
      nivel: localStorage.getItem("nivel_atual"),
      fase: faseFirebase,
      enfase: estado.enfase,
      diaKey
    };
  }

  metaTreino = {
    fase: j.fase || faseFirebase,
    diaCiclo: j.diaCiclo || diaFirebase,
    diaPrograma: j.diaPrograma || diaPrograma
  };

  aplicarPerformanceView(metaTreino.fase);

  // ============================================================
  // 16. ORGANIZAÇÃO DE HIIT POR BOX (mapeamento)
  // ============================================================
  const extrasByBox = new Map();
  (j.hiitCardio || []).forEach(entry => {
    const b = Number(entry.box || 0);
    if (!b || !Array.isArray(entry.extras)) return;
    extrasByBox.set(b, entry.extras);
  });

  // ============================================================
  // 17. MONTAGEM DA LISTA FINAL DE BOXES
  // ============================================================
  const lista = [];
  let boxIntro = null;
  let boxFinal = null;

  if (Array.isArray(j.boxes)) {
    boxIntro = j.boxes.find(b => b.tipo === "texto") || null;
    boxFinal = j.boxes.find(b => b.tipo === "resfriamento") || null;
  }

  if (boxIntro) lista.push(boxIntro);

  // ------------------------------------------------------------
  // Exercícios do Firebase organizados por box
  // ------------------------------------------------------------
  if (j.exSource === "firebase") {
    let raw = [];

    try {
      raw = await FEMFLOW.buscarExerciciosFirebase(
        j.firebaseQuery.nivel,
        faseFirebase,
        diaKey,
        j.firebaseQuery.enfase
      );
    } catch (e) {
      console.warn("Firebase falhou:", e);
    }

    if (raw.length) {
      raw = raw.filter((v, i, a) =>
        a.findIndex(t =>
          t.titulo === v.titulo &&
          t.box === v.box
        ) === i
      );

      const boxMap = new Map();
      raw.forEach(ex => {
        const boxName = ex.box || "Box 1";
        if (!boxMap.has(boxName)) boxMap.set(boxName, []);
        boxMap.get(boxName).push(ex);
      });

      [...boxMap.entries()]
        .sort((a, b) => {
          const na = Number((a[0].match(/\d+/) || [999])[0]);
          const nb = Number((b[0].match(/\d+/) || [999])[0]);
          return na - nb;
        })
        .forEach(([boxName, arr]) => {
          const idx = Number((boxName.match(/\d+/) || [0])[0]);
    const extras = extrasByBox.get(idx) || [];

lista.push({
  tipo: "exercicios",
  titulo: boxName,
  extras,  
  itens: arr.map(ex => ({
    exercicio: ex.titulo || ex.nome || "Exercício",
    link: ex.link || ex.url || "",
    series: ex.series ?? 3,
    reps: ex.reps ?? 12,
    tempo: parseTempo(ex.tempo)
  }))
});
        });
    }
  }

  if (boxFinal) lista.push(boxFinal);
  // ============================================================
  // 18. RENDERIZA E SALVA SNAPSHOT
  // ============================================================
  render(lista);
  salvarSnapshotOffline(metaTreino, lista);

  // ============================================================
  // 19. SALVAR TREINO (com PSE)
  // ============================================================
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

        let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
        if (prog < 30) {
          localStorage.setItem("femflow_dia_treino", prog + 1);
          FEMFLOW.toast(`Treino salvo! Próximo: Dia ${prog + 1}`);
          setTimeout(() => FEMFLOW.router("flowcenter"), 1200);
        } else {
          FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
        }

      } catch (e) {
        console.warn("Falha ao salvar treino (offline provável):", e);
        FEMFLOW.toast("📴 Sem conexão. Tentaremos novamente depois.");
      }

    }); // fecha abrirPSE
  });

  // ============================================================
  // 20. SALVAR DESCANSO
  // ============================================================
  document.querySelector("#descansoBtn")?.addEventListener("click", async () => {

    try {
      await FEMFLOW.salvarDescanso(metaTreino.fase || faseFirebase);

      let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
      if (prog < 30) {
        localStorage.setItem("femflow_dia_treino", prog + 1);
        FEMFLOW.toast(`🌿 Descanso registrado. Próximo: Dia ${prog + 1}`);
      } else {
        FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
      }

    } catch (e) {
      console.warn("Falha ao registrar descanso:", e);
      FEMFLOW.toast("📴 Sem conexão. O descanso será registrado depois.");
    }

  });

  // ============================================================
  // 21. RELOAD QUANDO HOUVER TROCA DE IDIOMA
  // ============================================================
  window.addEventListener("femflow:langchange", () => {
    location.reload();
  });

}); // fecha DOMContentLoaded

/* =======================================================================
   22. DEBUG OPCIONAL — pode ser removido sem impacto
   ======================================================================= */

// Permite inspecionar rapidamente o estado hormonal direto no console
window.FEMFLOW_DEBUG_TREINO = {
  getEstado() {
    return {
      faseFirebase,
      diaFirebase,
      diaKey,
      metaTreino,
      hormonal,
      nivel: estado.nivel,
      perfilHormonal: localStorage.getItem("femflow_perfilHormonal"),
      diaPrograma: Number(localStorage.getItem("femflow_dia_treino") || 1)
    };
  },

  log() {
    console.log("====== FEMFLOW DEBUG TREINO ======");
    console.log("Estado:", this.getEstado());
    console.log("==================================");
  }
};

/* =======================================================================
   FIM DO ARQUIVO — FemFlow v04 (2025)
   ENGINE HORMONAL 3.0 + CARROSSEL 2025 + HIIT INLINE + SNAPSHOT OFFLINE
======================================================================= */

