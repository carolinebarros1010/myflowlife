/* ================================================================
   FemFlow — treino.js FRONT-END TOTAL v1.0
   Estrutura-base → sem backend, sem GAS, tudo local + Firebase
   ================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js FRONT-END v1.0 iniciado!");

  const OFFLINE_KEY = "femflow_offline_treino_v1";

  /* -----------------------------------------------------------
   * 1. LOGIN OBRIGATÓRIO
   * ----------------------------------------------------------- */
  const id = localStorage.getItem("femflow_id");

  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    return location.href = "index.html?ret=treino.html";
  }

  /* -----------------------------------------------------------
   * 2. SINCRONIZAR CICLO DO BACKEND
   * (garante fase, dia, perfilHormonal, faseAlta, etc.)
   * ----------------------------------------------------------- */
  await FEMFLOW.carregarCicloBackend();

  /* -----------------------------------------------------------
   * 3. CICLO OBRIGATÓRIO
   * ----------------------------------------------------------- */
  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";

  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo primeiro.");
    return location.href = "ciclo.html";
  }

  /* -----------------------------------------------------------
   * 4. ELEMENTOS HTML DO TREINO
   * ----------------------------------------------------------- */
  const track  = document.querySelector("#carouselTrack");
  const bar    = document.querySelector("#progressBar");
  const titulo = document.querySelector("#tituloDiaTreino");
  const btnRest = document.querySelector("#btnDescansar");

  if (!track || !bar) {
    FEMFLOW.error("❌ Erro: Estrutura interna do treino.html não encontrada.");
    return;
  }

  /* -----------------------------------------------------------
   * 4. ESTADO LOCAL
   * ----------------------------------------------------------- */
  let boxes = [];
  let current = 0;
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);

  if (titulo) titulo.textContent = `Dia ${diaPrograma} do Programa`;

  /* ============================================================
   * 5. CARROSSEL — Swipe + Progresso
   * ============================================================ */
  function moveTo(dir) {
    const total = boxes.length;
    if (dir === "next" && current < total - 1) {
      current++;
      navigator.vibrate?.([20]);
    }
    else if (dir === "prev" && current > 0) {
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
  }

  let startX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) moveTo(delta < 0 ? "next" : "prev");
  });

  /* ============================================================
   * 6. TIMERS (HIIT / CARDIO)
   * ============================================================ */
  const intervals = new WeakMap();
  const fmt = s => `00:${String(s).padStart(2,"0")}`;

  function parseTempo(raw) {
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return n > 0 ? n : 45;
  }

  function bindTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(el => {
      const total = parseTempo(el.dataset.total);
      const fill = el.querySelector(".ff-timer-fill");
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
   * 7. RENDERIZAR BOXES
   * ============================================================ */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista || [];

    boxes.forEach(box => {
      const div = document.createElement("div");
      div.className = "carousel-item";

      div.innerHTML = `
        <h3 class="ff-ex-titulo">${box.titulo || ""}</h3>
        <p class="ff-ex-sub">${box.subtitulo || box.descricao || ""}</p>

        ${box.video ? `
        <div class="ff-video">
          <iframe src="${box.video}" frameborder="0" allowfullscreen></iframe>
        </div>` : ""}

        ${box.tempo_total ? `
        <div class="ff-timer-bar" data-total="${box.tempo_total}">
          <div class="ff-timer-fill"></div>
          <span class="ff-timer-count">00:${String(box.tempo_total).padStart(2,"0")}</span>
        </div>` : ""}

        ${Array.isArray(box.series) ? `
        <div class="ff-series">
          ${box.series.map(s => `<div class="ff-serie-item"><span>${s}</span></div>`).join("")}
        </div>` : ""}
      `;

      track.appendChild(div);
    });

    bindTimers(track);
    moveTo("reset");
  }

  /* ============================================================
   * 8. SNAPSHOT OFFLINE
   * ============================================================ */
  function salvarSnapshot(meta, lista) {
    const snap = { meta, lista, salvoEm: Date.now() };
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(snap));
  }

  function carregarSnapshot() {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /* ============================================================
   * 9. MODO OFFLINE
   * ============================================================ */
  if (!navigator.onLine) {
    const snap = carregarSnapshot();
    if (snap?.lista) {
      renderBoxes(snap.lista);
      FEMFLOW.toast("Modo offline ⚡");
      return;
    }
  }

  /* ============================================================
   * 10. BOTÃO DESCANSAR
   * ============================================================ */
  if (btnRest) {
    btnRest.onclick = async () => {
      if (!confirm("Deseja registrar descanso hoje?")) return;

      const fase = localStorage.getItem("femflow_fase");
      await FEMFLOW.salvarDescanso(fase);

      FEMFLOW.toast("Descanso registrado 🌿");
      setTimeout(() => location.href = "flowcenter.html", 800);
    };
  }

  /* ============================================================
   * 11. CHAMAR ENGINE NOVA DO FRONT-END (BLOCO 2)
   * ============================================================ */
  FEMFLOW.log("⚙️ Aguardando Engine Hormonal FRONT-END (Bloco 2)…");

     /* ============================================================
   * 12. EXECUTAR TREINO (usando engine do front-end)
   * ============================================================ */
  (async () => {

    // 1) Engine hormonal (fase, pasta, dia, nivel, enfase…)
    const E = FEMFLOW.engine.get();
    FEMFLOW.log("🧬 ENGINE FINAL:", E);

    // 2) Carrega exercícios do Firebase (mínimo 12)
    const listaFirebase = await FEMFLOW.buscarExerciciosTreino(E, 12);

    // 3) Chama a engine de treino (treino-engine.js)
    const listaMontada = await FEMFLOW.engineTreino.montarTreino({
      ...E,
      firebaseList: listaFirebase
    });

    // 4) Snapshot offline
    salvarSnapshot({ engine: E }, listaMontada);

    // 5) Renderizar
    renderBoxes(listaMontada);

  })();


});

