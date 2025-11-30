/* ================================================================
   FemFlow — treino.js FRONT-END TOTAL v2.0 (Arquitetura A)
   ---------------------------------------------------------------
   • Fase hormonal REAL → backend
   • Dia do programa → local (1–30)
   • Sem Engine Hormonal local
   • Usa core.js + treino-engine + Firestore
   • Snapshot Offline
   • PSE 100% LocalStorage
================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v2.0 (Arquitetura A) iniciado!");

    // calcula dia do programa automaticamente
  const diaProg = FEMFLOW.calcularDiaPrograma();

  document.getElementById("tituloDiaTreino").textContent =
    `Dia ${diaProg}`;

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
   * 2. CICLO PRECISA ESTAR CONFIGURADO
   * ----------------------------------------------------------- */
  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo primeiro.");
    return location.href = "ciclo.html";
  }

  /* -----------------------------------------------------------
   * 3. ELEMENTOS HTML
   * ----------------------------------------------------------- */
  const track      = document.querySelector("#carouselTrack");
  const bar        = document.querySelector("#progressBar");
  const titulo     = document.querySelector("#tituloDiaTreino");
  const btnRest    = document.querySelector("#descansoBtn");
  const btnSalvar  = document.querySelector("#salvarTreinoBtn");

  if (!track || !bar) {
    FEMFLOW.log("❌ Estrutura do treino.html não encontrada.");
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
   * 5. CARROSSEL — Swipe
   * ============================================================ */
  function moveTo(dir) {
    const total = boxes.length;

    if (dir === "next" && current < total - 1) current++;
    else if (dir === "prev" && current > 0) current--;

    const item = track.children[current];
    if (!item) return;

    track.scrollTo({ left: item.offsetLeft - 16, behavior: "smooth" });

    bar.style.width = `${((current + 1) / total) * 100}%`;
  }

  let startX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) moveTo(delta < 0 ? "next" : "prev");
  });

  /* ============================================================
   * 6. TIMER
   * ============================================================ */
  const intervals = new WeakMap();
  const fmt = s => `00:${String(s).padStart(2, "0")}`;
  const parseTempo = raw => Number(String(raw).replace(/[^\d]/g, "")) || 45;

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
        } else {
          start();
        }
      };
    });
  }

  /* ============================================================
   * 7. RENDER BOXES
   * ============================================================ */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista || [];

    boxes.forEach(box => {
      const div = document.createElement("div");
      div.className = "carousel-item";

      if (box.tipo === "box0" || box.tipo === "final") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>
          <ul class="ff-passos">
            ${box.passos.map(p => `<li>${p}</li>`).join("")}
          </ul>
        `;
      }

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
   * 8. SALVAR TREINO
   * ============================================================ */
  if (btnSalvar) {
   btnSalvar.onclick = () => {
  FEMFLOW.abrirPSE(async (valorPSE) => {

    const fase = localStorage.getItem("femflow_fase");
    const diaFirebase = localStorage.getItem("femflow_diaCiclo");

    const r = await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarTreino",
        id: localStorage.getItem("femflow_id"),
        pse: valorPSE,
        fase,
        diaFirebase,
        treino: "Força",
        obs: ""
      })
    });

    const j = await r.json();

    // Atualiza fase e diaCiclo locais
    if (j.novaFase)
      localStorage.setItem("femflow_fase", j.novaFase);

    if (j.novoDiaCiclo)
      localStorage.setItem("femflow_diaCiclo", j.novoDiaCiclo);

    // Dia do programa continua sendo FRONT ONLY
    FEMFLOW.calcularDiaPrograma();

    FEMFLOW.toast("Treino salvo!");
    FEMFLOW.router("flowcenter");
  });
};

  }

  /* ============================================================
   * 9. DESCANSO
   * ============================================================ */
  if (btnRest) {
    btnRest.onclick = async () => {
      const hist = JSON.parse(localStorage.getItem("femflow_hist") || "[]");
      hist.push({ data: Date.now(), pse: 0, descanso: true });
      localStorage.setItem("femflow_hist", JSON.stringify(hist));

      FEMFLOW.toast("Descanso registrado 🌿");
      await FEMFLOW.salvarDescanso();
      setTimeout(() => FEMFLOW.router("flowcenter"), 800);
    };
  }

  /* ============================================================
   * 10. SNAPSHOT OFFLINE
   * ============================================================ */
  const salvarSnapshot = (meta, lista) => {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify({
      meta, lista, salvoEm: Date.now()
    }));
  };

  const carregarSnapshot = () => {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
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
   * 11. SINCRONIZAR CICLO COM BACKEND
   * ============================================================ */

// 1) sincroniza e aguarda o retorno REAL do backend
const perfil = await FEMFLOW.carregarCicloBackend();

// 2) usa SEMPRE o valor retornado
const fase = perfil?.fase || localStorage.getItem("femflow_fase");
const enfase = perfil?.enfase || localStorage.getItem("femflow_enfase");
const diaCiclo = Number(perfil?.diaCiclo || localStorage.getItem("femflow_diaCiclo"));


  /* ============================================================
   * 12. MONTAR TREINO FINAL (Fase REAL)
   * ============================================================ */
  FEMFLOW.log("🧬 TREINO → fase:", fase, "diaCiclo:", diaCiclo);

  const listaMontada = await FEMFLOW.engineTreino.montarTreino({
    nivel:   localStorage.getItem("femflow_nivel"),
    enfase:  localStorage.getItem("femflow_enfase"),
    fase:    fase,
    diaCiclo: diaCiclo
  });

  salvarSnapshot({ fase, diaCiclo }, listaMontada);

  renderBoxes(listaMontada);

});

/* ============================================================
   Salva o último debug para você consultar depois no console
============================================================ */
FEMFLOW.engineTreino._debugLast = null;

FEMFLOW.engineTreino.debugFirebase = function(info) {
  FEMFLOW.engineTreino._debugLast = info;

  console.groupCollapsed(
    `%c🔥 FIREBASE DEBUG — ${info.nivel} | ${info.enfase} | ${info.faseNorm} | Dia ${info.diaCiclo}`,
    "color:#cc6a5a;font-weight:bold"
  );

  console.log("📁 Pasta:", info.pasta);
  console.log("📄 DiaKey:", info.diaKey);
  console.log("📊 snap.size:", info.snap.size);
  console.log("📌 TODOS:", info.todos);
  console.log("📦 BOXES:", info.boxes);

  console.groupEnd();
};

// acesso rápido:
FEMFLOW.engineTreino.debugFirebaseLast = () => {
  console.log("📌 Último DEBUG:", FEMFLOW.engineTreino._debugLast);
};
