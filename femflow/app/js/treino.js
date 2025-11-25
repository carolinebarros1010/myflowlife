// =======================================================================
// FemFlow v04 — Treino Diário 2025 (Versão HÍBRIDA PREMIUM + Performance View)
// Configuração: VERSÃO A (HIIT INLINE) + Arquitetura 2 (cada Box = 1 slide)
// Máx. 3 exercícios por Box + HIIT/Cardio inline + Resfriamento separado
// =======================================================================

document.addEventListener("DOMContentLoaded", async () => {

  // -----------------------------------------------------------
  // 🔐 0. Constantes de armazenamento offline
  // -----------------------------------------------------------
  const OFFLINE_KEY_TREINO = "femflow_offline_treino_v1";

  // -----------------------------------------------------------
  // 🔐 1. Checagem inicial: login + ciclo
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 2. ESTADO GLOBAL DO TREINO (Core)
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 3. ELEMENTOS DO TREINO
  // -----------------------------------------------------------
  const track = document.querySelector("#carouselTrack");
  const bar = document.querySelector("#progressBar");
  const tituloDia = document.querySelector("#tituloDiaTreino");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Erro interno ao carregar o treino.");
    return;
  }

  let current = 0;
  let boxes = [];

  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (tituloDia) tituloDia.textContent = `Dia ${diaPrograma} do Programa`;

  let metaTreino = { fase: null, diaCiclo: null, diaPrograma };

  // -----------------------------------------------------------
  // 4. CARROSSEL — scroll suave e estável
  // -----------------------------------------------------------

  const moveTo = (dir) => {
    const total = boxes.length;

    if (dir === "next" && current < total - 1) current++;
    else if (dir === "prev" && current > 0) current--;

    const item = track.children[current];
    if (!item) return;

    const pad = parseInt(getComputedStyle(track).paddingLeft) || 0;

    track.scrollTo({
      left: item.offsetLeft - pad,
      behavior: "smooth",
    });

    bar.style.width = total ? `${((current + 1) / total) * 100}%` : "0%";
  };

  let startX = 0,
    endX = 0;

  track.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );

  track.addEventListener(
    "touchmove",
    (e) => {
      endX = e.touches[0].clientX;
    },
    { passive: true }
  );

  track.addEventListener(
    "touchend",
    () => {
      const diff = startX - endX;
      if (Math.abs(diff) > 40) moveTo(diff > 0 ? "next" : "prev");
    },
    { passive: true }
  );

  // -----------------------------------------------------------
  // 5. TIMERS
  // -----------------------------------------------------------

  const fmt = (s) =>
    `00:${String(Math.max(0, Math.floor(s))).padStart(2, "0")}`;

  const intervals = new WeakMap();

  function bindTimers(root) {
    root.querySelectorAll(".timer-bar").forEach((el) => {
      const total = parseTempo(el.dataset.total || "45");
      el.dataset.total = total;

      const fill = el.querySelector(".timer-fill");
      const label = el.querySelector(".timer-label");

      label.textContent = fmt(total);
      fill.style.width = "100%";

      el.addEventListener("click", () => {
        if (el.classList.contains("running")) pauseTimer(el);
        else startTimer(el);
      });

      let t = 0;
      el.addEventListener("touchstart", () => (t = Date.now()), {
        passive: true,
      });

      el.addEventListener(
        "touchend",
        () => {
          if (Date.now() - t > 500) resetTimer(el);
        },
        { passive: true }
      );
    });
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

      const pct = (remain / total) * 100;
      fill.style.width = pct + "%";

      if (remain <= 0) {
        clearInterval(int);
        bar.classList.remove("running");
        bar.classList.add("done");
        fill.style.width = "0%";
      }
    }, 1000);

    intervals.set(bar, int);
  }

  function pauseTimer(bar) {
    clearTimer(bar);
  }

  function resetTimer(bar) {
    clearTimer(bar);

    const total = parseTempo(bar.dataset.total);
    bar.querySelector(".timer-fill").style.width = "100%";
    bar.querySelector(".timer-label").textContent = fmt(total);

    bar.classList.remove("running", "done");
  }

  function clearTimer(bar) {
    const id = intervals.get(bar);
    if (id) clearInterval(id);
    intervals.delete(bar);
    bar.classList.remove("running");
  }

  function parseTempo(raw) {
    if (!raw) return 45;
    if (typeof raw === "number") return raw;
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return n > 0 ? n : 45;
  }

  // -----------------------------------------------------------
  // 6. NORMALIZAÇÃO DE LINKS
  // -----------------------------------------------------------

  const normLink = (u) => {
    if (!u) return "";
    u = String(u).trim();
    if (/^youtu\.be/.test(u)) u = "https://" + u;
    if (/^www\.youtube/.test(u)) u = "https://" + u;
    if (/^http/.test(u)) return u;
    if (/youtube|youtu\.be/.test(u)) return "https://" + u;
    return u;
  };

  // -----------------------------------------------------------
  // 7. PERFORMANCE VIEW
  // -----------------------------------------------------------

  let perfMode = "none";

  const aplicarPerformanceView = (fase = "") => {
    fase = fase.toLowerCase();

    document.body.classList.remove(
      "ff-performance-ovulation",
      "ff-flow-menstrual",
      "ff-flow-folicular",
      "ff-flow-lutea"
    );

    if (fase.includes("ovulat")) {
      perfMode = "ovulation";
      document.body.classList.add("ff-performance-ovulation");
    } else if (fase.includes("menstr")) {
      perfMode = "softflow";
      document.body.classList.add("ff-flow-menstrual");
    } else if (fase.includes("folic")) {
      perfMode = "growthflow";
      document.body.classList.add("ff-flow-folicular");
    } else if (fase.includes("lute")) {
      perfMode = "focusedflow";
      document.body.classList.add("ff-flow-lutea");
    }
  };

  // -----------------------------------------------------------
  // 8. Criador de HIIT (inline)
  // -----------------------------------------------------------

  function criarBoxHIIT(extras) {
    if (!extras || !extras.length) return "";

    return `
      <div class="box-extra-wrapper">
        ${extras
          .map(
            (h) => `
          <div class="box-extra ${h.kind === "cardio" ? "cardio" : "hiit"}">
            <div class="box-extra-tag">${
              h.kind === "cardio"
                ? "💗 Cardio Leve / Moderado"
                : "🔥 HIIT / Intensidade"
            }</div>
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
            <p><b>Duração:</b> ${Math.round(
              (h.tempo_total || 60) / 60
            )} min</p>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // -----------------------------------------------------------
  // 9. Criador principal de Box
  // -----------------------------------------------------------

  function criarBoxHTML(box) {
    const perfHeader =
      perfMode === "ovulation" && box.tipo === "exercicios"
        ? `<div class="perf-strip">🌕 Performance Mode • Pico de energia</div>`
        : "";

    // --- TEXTO ---
    if (box.tipo === "texto") {
      return `
        <div class="box texto">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>
      `;
    }

    // --- EXERCÍCIOS ---
    if (box.tipo === "exercicios") {
      const extras = box.extras || [];

      return `
        <div class="box treino">
          ${perfHeader}
          <h3>${box.titulo}</h3>

          ${box.itens
            .map(
              (e) => `
            <div class="ex">

              <div class="ex-head">
                <b>${e.exercicio}</b>
                ${
                  e.link
                    ? `<a class="vid" target="_blank" href="${normLink(
                        e.link
                      )}">🎥</a>`
                    : ""
                }
              </div>

              <div class="ex-grid">
                <label>Séries</label>
                <input inputmode="numeric" value="${e.series ?? ""}">

                <label>Reps</label>
                <input inputmode="numeric" value="${e.reps ?? ""}">

                <div class="timer-wrapper">
                  <span class="timer-text">Timer</span>
                  <div class="timer-bar" data-total="${parseTempo(
                    e.tempo
                  )}">
                    <div class="timer-fill"></div>
                    <span class="timer-label">${fmt(parseTempo(
                      e.tempo
                    ))}</span>
                  </div>
                </div>
              </div>

            </div>
          `
            )
            .join("")}

          ${criarBoxHIIT(extras)}

        </div>
      `;
    }

    // --- RESFRIAMENTO ---
    if (box.tipo === "resfriamento") {
      return `
        <div class="box resfriamento">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>
      `;
    }

    return "";
  }

  // -----------------------------------------------------------
  // 10. RENDER
  // -----------------------------------------------------------

  function render(lista) {
    boxes = lista;

    track.innerHTML = lista
      .map((b) => `<div class="carousel-item">${criarBoxHTML(b)}</div>`)
      .join("");

    current = 0;

    moveTo("stay");
    bindTimers(track);
  }

  // -----------------------------------------------------------
  // 11. SNAPSHOT OFFLINE
  // -----------------------------------------------------------

  function carregarSnapshotOffline() {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY_TREINO);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function salvarSnapshotOffline(meta, lista) {
    const snap = {
      meta: {
        fase: meta.fase,
        diaCiclo: meta.diaCiclo,
        diaPrograma: meta.diaPrograma,
      },
      lista,
    };
    try {
      localStorage.setItem(OFFLINE_KEY_TREINO, JSON.stringify(snap));
    } catch {}
  }

  // -----------------------------------------------------------
  // 12. ENGINE HORMONAL (reduzido aqui para foco no treino)
  // -----------------------------------------------------------

  function getDiaFirebase() {
    const faseReal =
      localStorage.getItem("femflow_fase_atual") ||
      estado.fase ||
      "menstrual";

    return {
      faseFirebase: faseReal.toLowerCase(),
      diaFirebase: Number(estado.diaCiclo || 1),
      diaKey: `dia_${estado.diaCiclo || 1}`,
    };
  }

  const hormonal = getDiaFirebase();
  const faseFirebase = hormonal.faseFirebase;
  const diaFirebase = hormonal.diaFirebase;
  const diaKey = hormonal.diaKey;

  // -----------------------------------------------------------
  // 13. CHAMADA AO BACKEND
  // -----------------------------------------------------------

  const SCRIPT_URL =
    FEMFLOW.SCRIPT_URL ||
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

  const url =
    `${SCRIPT_URL}?action=treino&id=${encodeURIComponent(id)}` +
    `&enfase=${encodeURIComponent(estado.enfase)}` +
    `&fase=${encodeURIComponent(faseFirebase)}` +
    `&nivel=${encodeURIComponent(estado.nivel)}` +
    `&diaFirebase=${encodeURIComponent(diaFirebase)}` +
    `&diaKey=${encodeURIComponent(diaKey)}`;

  let j = null;
  let offlineSnap = null;

  try {
    const resp = await fetch(url);
    const txt = await resp.text();

    try {
      j = JSON.parse(txt);
    } catch {
      offlineSnap = carregarSnapshotOffline();
    }
  } catch {
    offlineSnap = carregarSnapshotOffline();
  }

  // -----------------------------------------------------------
  // 14. MODO OFFLINE
  // -----------------------------------------------------------

  if (!j) {
    if (offlineSnap && offlineSnap.lista) {
      metaTreino = offlineSnap.meta;
      aplicarPerformanceView(metaTreino.fase);
      render(offlineSnap.lista);
      return;
    }
    render([
      {
        tipo: "texto",
        titulo: "Sem treino",
        mensagem: "Conecte-se à internet.",
      },
    ]);
    return;
  }

  // -----------------------------------------------------------
  // 15. VALIDAÇÃO DO RETORNO
  // -----------------------------------------------------------

  if (j.status === "id_not_found") {
    render([
      { tipo: "texto", titulo: "Erro", mensagem: "Faça login novamente." },
    ]);
    return;
  }

  metaTreino = {
    fase: j.fase || faseFirebase,
    diaCiclo: j.diaCiclo || diaFirebase,
    diaPrograma,
  };

  aplicarPerformanceView(metaTreino.fase);

  // -----------------------------------------------------------
  // 16. ORGANIZAÇÃO DA FAIXA DE HIIT/CARDIO POR BOX
  // -----------------------------------------------------------

  const extrasByBox = new Map();

  (j.hiitCardio || []).forEach((entry) => {
    const boxNum = Number(entry.box || 0);
    if (boxNum && Array.isArray(entry.extras)) {
      extrasByBox.set(boxNum, entry.extras);
    }
  });

  // -----------------------------------------------------------
  // 17. MONTAGEM DA LISTA final
  // -----------------------------------------------------------

  const lista = [];

  let boxIntro = null;
  let boxFinal = null;

  if (Array.isArray(j.boxes)) {
    boxIntro = j.boxes.find((b) => b.tipo === "texto") || null;
    boxFinal = j.boxes.find((b) => b.tipo === "resfriamento") || null;
  }

  if (boxIntro) lista.push(boxIntro);

  if (j.exSource === "firebase") {
    let raw = [];

    try {
      raw = await FEMFLOW.buscarExerciciosFirebase(
        j.firebaseQuery.nivel,
        faseFirebase,
        diaKey,
        j.firebaseQuery.enfase
      );
    } catch (e) {}

    if (raw.length) {
      raw = raw.filter(
        (v, i, a) =>
          a.findIndex((t) => t.titulo === v.titulo && t.box === v.box) === i
      );

      const boxMap = new Map();
      raw.forEach((ex) => {
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
            extras: extras,
            itens: arr.slice(0, 3).map((ex) => ({
              exercicio: ex.titulo,
              link: ex.link,
              series: ex.series,
              reps: ex.reps,
              tempo: parseTempo(ex.tempo),
            })),
          });
        });
    }
  }

  if (boxFinal) lista.push(boxFinal);

  // -----------------------------------------------------------
  // 18. RENDERIZAR E SALVAR SNAPSHOT
  // -----------------------------------------------------------

  render(lista);
  salvarSnapshotOffline(metaTreino, lista);

  // -----------------------------------------------------------
  // 19. SALVAR TREINO
  // -----------------------------------------------------------

  document
    .querySelector("#salvarTreinoBtn")
    ?.addEventListener("click", async () => {
      FEMFLOW.abrirPSE(async (pse) => {
        await FEMFLOW.salvarTreino({
          id,
          fase: metaTreino.fase,
          treino: "dia",
          tipo_dia: "treino",
          pse,
        });

        let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
        if (prog < 30) {
          localStorage.setItem("femflow_dia_treino", prog + 1);
          FEMFLOW.toast(`Treino salvo! Próximo: Dia ${prog + 1}`);
          setTimeout(() => FEMFLOW.router("flowcenter"), 1200);
        } else FEMFLOW.toast("Programa concluído!");
      });
    });

  // -----------------------------------------------------------
  // 20. SALVAR DESCANSO
  // -----------------------------------------------------------

  document.querySelector("#descansoBtn")?.addEventListener("click", async () => {
    await FEMFLOW.salvarDescanso(metaTreino.fase);

    let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
    if (prog < 30) {
      localStorage.setItem("femflow_dia_treino", prog + 1);
      FEMFLOW.toast(`🌿 Descanso registrado. Próximo: Dia ${prog + 1}`);
    } else FEMFLOW.toast("🎉 Programa concluído!");
  });

  // -----------------------------------------------------------
  // 21. RELOAD AO MUDAR IDIOMA
  // -----------------------------------------------------------

  window.addEventListener("femflow:langchange", () => location.reload());
});

