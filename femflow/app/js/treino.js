/* ================================================================
   FemFlow — treino.js FRONT-END TOTAL v1.3
   ---------------------------------------------------------------
   • Sem backend, sem GAS
   • Usa femflow-core + treino-engine + Firestore
   • Snapshot Offline
   • PSE 100% LocalStorage
================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js FRONT-END v1.3 iniciado!");

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
   * 2. GARANTIR QUE O CICLO JÁ FOI CONFIGURADO
   * ----------------------------------------------------------- */
  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";

  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo primeiro.");
    return location.href = "ciclo.html";
  }

  /* -----------------------------------------------------------
   * 3. ELEMENTOS HTML
   * ----------------------------------------------------------- */
  const track   = document.querySelector("#carouselTrack");
  const bar     = document.querySelector("#progressBar");
  const titulo  = document.querySelector("#tituloDiaTreino");
  const btnRest = document.querySelector("#descansoBtn");
  const btnSalvar = document.querySelector("#salvarTreinoBtn");

  if (!track || !bar) {
    FEMFLOW.error("❌ Estrutura do treino.html não encontrada.");
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
      current++; navigator.vibrate?.([20]);
    } 
    else if (dir === "prev" && current > 0) {
      current--; navigator.vibrate?.([20]);
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
   * 6. TIMER (HIIT / CARDIO)
   * ============================================================ */
  const intervals = new WeakMap();
  const fmt = s => `00:${String(s).padStart(2,"0")}`;

  const parseTempo = raw => {
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return n > 0 ? n : 45;
  };

  function bindTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(el => {
      const total = parseTempo(el.dataset.total);
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

      el.onclick = () => {
        if (el.classList.contains("running")) {
          clearInterval(intervals.get(el));
          el.classList.remove("running");
        } else start();
      };
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

      /* BOX 0 / FINAL */
      if (box.tipo === "box0" || box.tipo === "final") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>
          <ul class="ff-passos">
            ${box.passos.map(p => `<li>${p}</li>`).join("")}
          </ul>
        `;
      }

      /* EXERCÍCIOS */
else if (box.tipo === "treino") {
  div.innerHTML = `
    <h3 class="ff-ex-titulo">Box ${box.box}</h3>
    <div class="ff-series">
      ${box.exercicios
        .map(ex => `
          <div class="ff-serie-item">
            <span class="ff-ex-nome">${ex.nome}</span>

            <div class="ff-ex-info">
              <span class="ff-ex-series">Séries: <b>${ex.series}</b></span>
              <span class="ff-ex-reps">Reps: <b>${ex.reps}</b></span>
              <span class="ff-ex-int">Intervalo: <b>${ex.intervalo}s</b></span>
            </div>

            <div class="ff-timer-bar" data-total="${ex.intervalo}">
              <div class="ff-timer-fill"></div>
              <span class="ff-timer-count">${fmt(ex.intervalo)}</span>
            </div>
          </div>
        `)
        .join("")}
    </div>
  `;
}

      /* HIIT / CARDIO */
      else if (box.tipo === "hiit" || box.tipo === "cardio") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>
          <div class="ff-timer-bar" data-total="${box.tempo_total}">
            <div class="ff-timer-fill"></div>
            <span class="ff-timer-count">${fmt(box.tempo_total)}</span>
          </div>
        `;
      }

      track.appendChild(div);
    });

    bindTimers(track);
    moveTo("reset");
  }

  /* ============================================================
   * 8. BOTÃO SALVAR TREINO → abre PSE
   * ============================================================ */
  if (btnSalvar) {
    btnSalvar.onclick = () => {
      FEMFLOW.abrirPSE(v => {

        const hist = JSON.parse(localStorage.getItem("femflow_hist") || "[]");

        hist.push({
          data: Date.now(),
          pse: Number(v)
        });

        localStorage.setItem("femflow_hist", JSON.stringify(hist));

        FEMFLOW.toast("Treino salvo! 💾🌸");

        // avança o dia do programa
        localStorage.setItem("femflow_dia_treino", String(diaPrograma + 1));

        setTimeout(() => FEMFLOW.router("flowcenter"), 600);
      });
    };
  }

  /* ============================================================
   * 9. BOTÃO DESCANSO
   * ============================================================ */
  if (btnRest) {
    btnRest.onclick = () => {
      const hist = JSON.parse(localStorage.getItem("femflow_hist") || "[]");

      hist.push({
        data: Date.now(),
        pse: 0,              // PSE 0 = descanso
        descanso: true
      });

      localStorage.setItem("femflow_hist", JSON.stringify(hist));

      FEMFLOW.toast("Descanso registrado 🌿");
      setTimeout(() => location.href = "flowcenter.html", 800);
    };
  }

  /* ============================================================
   * 10. SNAPSHOT OFFLINE
   * ============================================================ */
  const salvarSnapshot = (meta, lista) =>
    localStorage.setItem(OFFLINE_KEY, JSON.stringify({
      meta, lista, salvoEm: Date.now()
    }));

  const carregarSnapshot = () => {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  if (!navigator.onLine) {
    const snap = carregarSnapshot();
    if (snap?.lista) {
      renderBoxes(snap.lista);
      FEMFLOW.toast("Modo offline ⚡");
      return;
    }
  }

  /* ============================================================
   * 11. ENGINE HORMONAL FINAL
   * ============================================================ */
  const E = FEMFLOW.calcularEngineHormonal();
  FEMFLOW.log("🧬 ENGINE", E);

  /* ============================================================
   * 12. MONTAR TREINO FINAL
   * ============================================================ */
  const listaMontada = await FEMFLOW.engineTreino.montarTreino({
    nivel: localStorage.getItem("femflow_nivel"),
    enfase: localStorage.getItem("femflow_enfase"),
    fase: E.faseFirebase,
    diaCiclo: E.diaFirebase
  });

  salvarSnapshot({ engine: E }, listaMontada);

  renderBoxes(listaMontada);

});

