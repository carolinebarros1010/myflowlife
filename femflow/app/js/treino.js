/* =======================================================================
   FemFlow v05 — Treino Diário 2025 (FINAL ESTÁVEL)
   ENGINE HORMONAL 3.0 • TURNOVER • HIIT INLINE • OFFLINE 2.0 • FIREBASE
   ======================================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  /* -----------------------------------------------------------
   * 0. CONSTANTES
   * ----------------------------------------------------------- */
  const OFFLINE_KEY_TREINO = "femflow_offline_treino_v1";

  /* -----------------------------------------------------------
   * 1. VERIFICAÇÃO DE LOGIN + CICLO
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
   * 2. ESTADO DO TREINO (vindo do Core)
   * ----------------------------------------------------------- */
  const estado =
    window.FEMFLOW && typeof FEMFLOW.getEstadoTreino === "function"
      ? FEMFLOW.getEstadoTreino()
      : {
          enfase: "geral",
          nivel: "iniciante",
          fase: "folicular",
          diaCiclo: 1,
          cicloOK: false,
        };

  console.log("🔍 EstadoTreino:", estado);

  /* -----------------------------------------------------------
   * 3. ELEMENTOS DA INTERFACE
   * ----------------------------------------------------------- */
  const track = document.querySelector("#carouselTrack");
  const bar = document.querySelector("#progressBar");
  const tituloDia = document.querySelector("#tituloDiaTreino");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Estrutura interna ausente.");
    return;
  }

  let current = 0;
  let boxes = [];

  /* -----------------------------------------------------------
   * 4. DIA PROGRAMA (1–30)
   * ----------------------------------------------------------- */
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (tituloDia) tituloDia.textContent = `Dia ${diaPrograma} do Programa`;

  let metaTreino = {
    fase: null,
    diaCiclo: null,
    diaPrograma,
  };

  /* -----------------------------------------------------------
   * 5. CARROSSEL 2025 (versão estável)
   * ----------------------------------------------------------- */
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
      behavior: "smooth",
    });

    bar.style.width = total ? `${((current + 1) / total) * 100}%` : "0%";
  };

  let startX = 0,
    endX = 0;
  track.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), {
    passive: true,
  });
  track.addEventListener("touchmove", (e) => (endX = e.touches[0].clientX), {
    passive: true,
  });

  track.addEventListener(
    "touchend",
    () => {
      const diff = startX - endX;
      if (Math.abs(diff) > 40) moveTo(diff > 0 ? "next" : "prev");
    },
    { passive: true }
  );

  /* -----------------------------------------------------------
   * 6. TIMERS (versão estável)
   * ----------------------------------------------------------- */
  const fmt = (s) =>
    `00:${String(Math.max(0, Math.floor(s))).padStart(2, "0")}`;
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

    const fill = bar.querySelector(".timer-fill");
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
    root.querySelectorAll(".timer-bar").forEach((el) => {
      const total = parseTempo(el.dataset.total || el.textContent);
      el.dataset.total = total;
      el.textContent = fmt(total);

      el.addEventListener("click", () =>
        el.classList.contains("running") ? pauseTimer(el) : startTimer(el)
      );

      let t;
      el.addEventListener(
        "touchstart",
        () => (t = Date.now()),
        { passive: true }
      );
      el.addEventListener(
        "touchend",
        () => {
          if (Date.now() - t > 500) resetTimer(el);
        },
        { passive: true }
      );
    });
  }

  /* -----------------------------------------------------------
   * 7. NORMALIZAÇÃO DE LINKS DE VÍDEO
   * ----------------------------------------------------------- */
  const normLink = (u) => {
    if (!u) return "";
    let s = String(u).trim();

    // Converte automaticamente formatos problemáticos
    if (s.startsWith("youtu.be")) s = "https://" + s;
    if (s.startsWith("www.youtube")) s = "https://" + s;
    if (!s.startsWith("http") && (s.includes("youtube") || s.includes("youtu.be")))
      s = "https://" + s;

    return s;
  };

  /* -----------------------------------------------------------
   * 8. PERFORMANCE VIEW (cores por fase hormonal)
   * ----------------------------------------------------------- */
  let perfMode = "none";

  const aplicarPerformanceView = (faseStr = "") => {
    const f = (faseStr || "").toLowerCase();

    // remove classes antigas
    document.body.classList.remove(
      "ff-performance-ovulation",
      "ff-flow-menstrual",
      "ff-flow-folicular",
      "ff-flow-lutea"
    );

    // aplica nova cor
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

  /* -----------------------------------------------------------
   * 9. HIIT Inline — inserido após o último exercício do Box
   * ----------------------------------------------------------- */
  function criarBoxHIIT(extras) {
    if (!extras || !extras.length) return "";

    return `
      <div class="box-extra-wrapper">
        ${extras
          .map(
            (h) => `
          <div class="box-extra ${h.kind === "cardio" ? "cardio" : "hiit"}">

            <div class="box-extra-tag">
              ${
                h.kind === "cardio"
                  ? "💗 Cardio Leve / Moderado"
                  : "🔥 HIIT / Intensidade"
              }
            </div>

            <h4>${h.titulo}</h4>
            <p>${h.descricao}</p>

            ${
              h.protocolo
                ? `<p><b>Protocolo:</b> ${h.protocolo}</p>`
                : ""
            }
            ${
              h.equipamentos
                ? `<p><b>Equipamentos:</b> ${h.equipamentos}</p>`
                : ""
            }

            <p><b>Duração:</b> ${(h.tempo_total / 60).toFixed(0)} min</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  /* -----------------------------------------------------------
   * 10. CRIAÇÃO DOS BOXES DE TREINO (HTML Final)
   * ----------------------------------------------------------- */
  const criarBoxHTML = (box) => {
    // Banner ovulatório
    const perfHeader =
      perfMode === "ovulation" && box.tipo === "exercicios"
        ? `<div class="perf-strip">🌕 Performance Mode • Pico de energia</div>`
        : "";

    /* ----------------------------
     * TEXTO INFORMATIVO
     * ---------------------------- */
    if (box.tipo === "texto") {
      return `
        <div class="box texto">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>`;
    }

    /* ----------------------------
     * EXERCÍCIOS (com HIIT Inline)
     * ---------------------------- */
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


          <!-- HIIT adicionado no final -->
          ${criarBoxHIIT(extras)}

        </div>`;
    }

    /* ----------------------------
     * RESFRIAMENTO
     * ---------------------------- */
    if (box.tipo === "resfriamento") {
      return `
        <div class="box resfriamento">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>`;
    }

    return "";
  };

     /* ============================================================
   * 11. ENGINE HORMONAL 3.0 — TURNOVER + FISIO + ENERGÉTICO
   * ============================================================ */

  function getDiaFirebase() {

    /* ------------------------------------------
     * 1. Carregar dados salvos
     * ------------------------------------------ */
    const faseReal = (
      localStorage.getItem("femflow_fase_atual") ||
      estado.fase ||
      "menstrual"
    ).toLowerCase();

    const perfil = (
      localStorage.getItem("femflow_perfilHormonal") ||
      "regular"
    ).toLowerCase();

    const faseAltaManual = (
      localStorage.getItem("femflow_faseAlta") ||
      "folicular"
    ).toLowerCase();

    const nivel = (
      estado.nivel ||
      localStorage.getItem("nivel_atual") ||
      "iniciante"
    ).toLowerCase();

    // dia real informado pela aluna
    const diaCiclo = Number(
      localStorage.getItem("dia_ciclo") ||
      estado.diaCiclo ||
      1
    );

    // turnover energético
    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);

    /* ------------------------------------------
     * 2. Normalização de nomes de fase
     * ------------------------------------------ */
    const faseMap = {
      follicular: "folicular",
      folicular: "folicular",
      ovulatory: "ovulatoria",
      ovulatoria: "ovulatoria",
      luteal: "lutea",
      lutea: "lutea",
      menstrual: "menstrual"
    };

    const faseFirebaseFromReal = faseMap[faseReal] || "folicular";

    /* ============================================================
     * 3. PERFIL FISIOLÓGICO
     *    (regular, diu cobre, irregular)
     * ============================================================ */
    if (["regular", "diu", "diu_cobre", "irregular"].includes(perfil)) {

      return {
        faseFirebase: faseFirebaseFromReal,
        diaFirebase: diaCiclo,     // sempre o dia real
        diaKey: `dia_${diaCiclo}`,
        turnover: false
      };
    }

    /* ============================================================
     * 4. PERFIL ENERGÉTICO — Menopausa / Diu Hormonal / Técnica
     * ============================================================ */

    /* ----------------------------------------------
     * 4.1 DEFINIÇÃO DA FASE ALTA POR NÍVEL DA ALUNA
     * ---------------------------------------------- */
    let faseAlta;

    if (perfil === "menopausa" || perfil === "menopausa_tecnica") {
      if (nivel === "iniciante") {
        faseAlta = "lutea";       // iniciantes → baixa energia estável
      } else if (nivel === "intermediaria") {
        faseAlta = "folicular";   // intermediárias → fase de crescimento
      } else {
        faseAlta = "ovulatoria";  // avançadas → pico de potência
      }
    } else if (perfil === "diu_hormonal") {
      // DIU hormonal comporta-se igual à menopausa técnica
      faseAlta = faseAltaManual || "folicular";
    } else {
      // fallback seguro
      faseAlta = faseAltaManual || "folicular";
    }

    faseAlta = faseAlta.toLowerCase();
    const faseAltaNorm = faseMap[faseAlta] || "folicular";

    /* ----------------------------------------------
     * 4.2 TABELAS BASE 23+5 COM TURNOVER
     * ---------------------------------------------- */

    const diasFolicular = [6,7,8,9,10,11,12,13];
    const diasOvulatoria = [14,15,16,17];
    const diasLutea = Array.from({length: 13}, (_,i)=>18+i);  // 18–30
    const diasMenstrual = [1,2,3,4,5];

    // repete a sequência até formar 23 dias
    function rep(arr) {
      const out = [];
      while (out.length < 23) out.push(...arr);
      return out.slice(0, 23);
    }

    const tabela23 = {
      folicular:  rep(diasFolicular),
      ovulatoria: rep(diasOvulatoria),
      lutea:      rep(diasLutea)
    };

    /* ----------------------------------------------
     * 4.3 APLICAÇÃO DO TURNOVER
     * ---------------------------------------------- */

    // turnover sempre entre 1–28
    if (diaEner < 1 || diaEner > 28) diaEner = 1;

    let faseFinal = diaEner <= 23 ? faseAltaNorm : "menstrual";

    let diaFirebase;

    if (faseFinal === "menstrual") {
      const idx = (diaEner - 24) % 5;
      diaFirebase = diasMenstrual[idx] || 1;
    } else {
      diaFirebase = tabela23[faseFinal][diaEner - 1] || 1;
    }

    /* ----------------------------------------------
     * 4.4 SALVA PROGRESSO DO TURNOVER
     * ---------------------------------------------- */

    // turnover só avança quando salvamos ou descansamos
    // aqui apenas definimos, não avançamos
    const faseFirebase = faseFinal;

    return {
      faseFirebase,
      diaFirebase,
      diaKey: `dia_${diaFirebase}`,
      turnover: true
    };
  }
  /* ============================================================
   * 12. EXECUTA ENGINE HORMONAL
   * ============================================================ */

  const hormonal = getDiaFirebase();
  console.log("⚙️ Engine Hormonal 3.0:", hormonal);

  const faseFirebase = hormonal.faseFirebase;
  const diaFirebase = hormonal.diaFirebase;
  const diaKey = hormonal.diaKey;

  /* ============================================================
   * 13. CHAMADA AO BACKEND (Apps Script via Cloudflare Worker)
   * Fetch Seguro — Protegido contra HTML / Erros / Timeout
   * ============================================================ */

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

  /* -------------------------------------------------------
   * Funções de snapshot OFFLINE (antes do uso)
   * ------------------------------------------------------- */
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
          diaPrograma: meta.diaPrograma || null,
          diaEnergetico: localStorage.getItem("femflow_dia_energetico") || null,
          perfil: localStorage.getItem("femflow_perfilHormonal") || null,
        },
        lista
      };
      localStorage.setItem(OFFLINE_KEY_TREINO, JSON.stringify(snap));
    } catch (e) {
      console.warn("⚠️ Falha ao salvar offline:", e);
    }
  };

  /* -------------------------------------------------------
   * Fetch seguro com proteção HTML + fallback offline
   * ------------------------------------------------------- */
  await (async () => {
    try {
      const resp = await fetch(url);
      const txt = await resp.text();

      // 1) Proteção contra Cloudflare/HTML
      if (txt.trim().startsWith("<")) {
        console.error("❌ HTML recebido:", txt.slice(0, 200));
        throw new Error("HTML_RESPONSE");
      }

      // 2) Tentar converter para JSON
      try {
        j = JSON.parse(txt);
      } catch (e) {
        console.error("❌ JSON inválido:", txt);
        throw new Error("INVALID_JSON");
      }

    } catch (e) {
      console.warn("⚠️ Falha no fetch:", e);
      offlineSnap = carregarSnapshotOffline();
    }
  })();

  /* ============================================================
   * 14. VALIDAÇÃO ROBUSTA DO OBJETO j
   * ============================================================ */

  const jInvalido =
    !j ||
    typeof j !== "object" ||
    Array.isArray(j) ||
    (!j.status && !j.boxes);

  if (jInvalido) {

    if (offlineSnap && Array.isArray(offlineSnap.lista)) {
      FEMFLOW.toast("📴 Modo offline — usando treino salvo.");
      document.body.classList.add("ff-offline-mode");

      metaTreino = {
        fase: offlineSnap.meta?.fase || faseFirebase,
        diaCiclo: offlineSnap.meta?.diaCiclo || diaFirebase,
        diaPrograma: offlineSnap.meta?.diaPrograma || diaPrograma,
      };

      aplicarPerformanceView(metaTreino.fase);
      render(offlineSnap.lista);

      return;
    }

    FEMFLOW.toast("⚠️ Erro ao carregar treino — tente novamente.");
    render([
      {
        tipo: "texto",
        titulo: "Erro",
        mensagem: "Não foi possível carregar o treino. Verifique conexão."
      }
    ]);
    return;
  }

  /* ============================================================
   * 15. METADADOS DO BACKEND
   * ============================================================ */

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

  /* ============================================================
   * 16. ORGANIZAÇÃO DE HIIT / CARDIO POR BOX
   * ============================================================ */
  const extrasByBox = new Map();
  (j.hiitCardio || []).forEach(entry => {
    const b = Number(entry.box || 0);
    if (!b || !Array.isArray(entry.extras)) return;
    extrasByBox.set(b, entry.extras);
  });

  /* ============================================================
   * 17. MONTAGEM DA LISTA FINAL DE BOXES
   * ============================================================ */
  const lista = [];

  let boxIntro = null;
  let boxFinal = null;

  if (Array.isArray(j.boxes)) {
    boxIntro = j.boxes.find(b => b.tipo === "texto") || null;
    boxFinal = j.boxes.find(b => b.tipo === "resfriamento") || null;
  }

  if (boxIntro) lista.push(boxIntro);

  /* ------------------------------------------------------------
   * EXERCÍCIOS DO FIREBASE ORGANIZADOS POR BOX
   * ------------------------------------------------------------ */
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
      // remove duplicatas
      raw = raw.filter((v, i, a) =>
        a.findIndex(t =>
          t.titulo === v.titulo &&
          t.box === v.box
        ) === i
      );

      // organiza por box
      const boxMap = new Map();
      raw.forEach(ex => {
        const boxName = ex.box || "Box 1";
        if (!boxMap.has(boxName)) boxMap.set(boxName, []);
        boxMap.get(boxName).push(ex);
      });

      // ordena Box 1 → Box 2 → Box 3
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

  /* ============================================================
   * 18. RENDERIZAÇÃO FINAL + SNAPSHOT OFFLINE
   * ============================================================ */
  render(lista);
  salvarSnapshotOffline(metaTreino, lista);

  /* ============================================================
   * 19. AVANÇO DO TURNOVER ENERGÉTICO
   *     (apenas quando treino é salvo ou descanso é salvo)
   * ============================================================ */

  function avancarTurnover() {
    const perfil = (localStorage.getItem("femflow_perfilHormonal") || "regular").toLowerCase();

    // Somente perfis energéticos usam turnover
    if (!["menopausa", "menopausa_tecnica", "diu_hormonal"].includes(perfil)) {
      return;
    }

    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    if (diaEner < 1 || diaEner > 28) diaEner = 1;

    diaEner++;

    if (diaEner > 28) diaEner = 1; // reset ciclo técnico

    localStorage.setItem("femflow_dia_energetico", diaEner);
  }

  /* ============================================================
   * 20. SALVAR TREINO (com PSE)
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

        // Avança turnover
        avancarTurnover();

        // Avança dia do PROGRAMA
        let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
        if (prog < 30) {
          localStorage.setItem("femflow_dia_treino", prog + 1);
          FEMFLOW.toast(`Treino salvo! Próximo: Dia ${prog + 1}`);
          setTimeout(() => FEMFLOW.router("flowcenter"), 1200);
        } else {
          FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
        }

      } catch (e) {
        console.warn("Erro ao salvar treino:", e);
        FEMFLOW.toast("📴 Sem conexão. O treino será enviado depois.");
      }
    });
  });

  /* ============================================================
   * 21. SALVAR DESCANSO
   * ============================================================ */
  document.querySelector("#descansoBtn")?.addEventListener("click", async () => {

    try {
      await FEMFLOW.salvarDescanso(metaTreino.fase || faseFirebase);

      // Avança turnover
      avancarTurnover();

      // Avança dia do PROGRAMA
      let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
      if (prog < 30) {
        localStorage.setItem("femflow_dia_treino", prog + 1);
        FEMFLOW.toast(`🌿 Descanso registrado. Próximo: Dia ${prog + 1}`);
      } else {
        FEMFLOW.toast("🎉 Programa concluído!");
      }

    } catch (e) {
      console.warn("Erro ao registrar descanso:", e);
      FEMFLOW.toast("📴 Sem conexão. O descanso será enviado depois.");
    }
  });

  /* ============================================================
   * 21. RELOAD AUTOMÁTICO QUANDO TROCAR IDIOMA
   * ============================================================ */
  window.addEventListener("femflow:langchange", () => {
    location.reload();
  });

}); // <-- FECHA DOMContentLoaded



/* =======================================================================
   22. DEBUG OPCIONAL — Ferramenta avançada de inspeção
   ======================================================================= */

window.FEMFLOW_DEBUG_TREINO = {

  getEstado() {
    try {
      return {
        faseFirebase,
        diaFirebase,
        diaKey,
        metaTreino,
        hormonal,
        nivel: localStorage.getItem("nivel_atual"),
        perfilHormonal: localStorage.getItem("femflow_perfilHormonal"),
        faseAtual: localStorage.getItem("femflow_fase_atual"),
        diaEnergetico: localStorage.getItem("femflow_dia_energetico"),
        diaPrograma: Number(localStorage.getItem("femflow_dia_treino") || 1)
      };
    } catch (e) {
      console.warn("Erro ao ler DEBUG:", e);
      return { erro: true };
    }
  },

  log() {
    console.log("====== FEMFLOW DEBUG TREINO ======");
    console.log(this.getEstado());
    console.log("==================================");
  },

  // Utilitário para testes
  setDiaEner(d) {
    localStorage.setItem("femflow_dia_energetico", d);
    console.log("Novo dia energético:", d);
  }
};


/* =======================================================================
   FIM DO ARQUIVO — FemFlow v04 (2025)
   ENGINE HORMONAL 3.0 • TURNOVER • HIIT INLINE • CARROSSEL 2025
   ============================================================= */

