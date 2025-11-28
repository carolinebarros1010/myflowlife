/* =======================================================================
   FemFlow v06 — Treino Diário 2025
   ENGINE CENTRALIZADA NO BACKEND + CORE V3
   FIREBASE • TURNOVER • SNAPSHOT OFFLINE • PSE • DESCANSO
======================================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v06 carregado!");

  const OFFLINE_KEY = "femflow_offline_treino_v1";

  /* -----------------------------------------------------------
   * 1. LOGIN + PERFIL
   * ----------------------------------------------------------- */
  const id = localStorage.getItem("femflow_id");

  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    return location.href = "index.html?ret=treino.html";
  }

  /* -----------------------------------------------------------
   * 2. CHECK CICLO CONFIGURADO
   * ----------------------------------------------------------- */
  const cicloOK =
    localStorage.getItem("femflow_cycle_configured") === "yes";

  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo.");
    return location.href = "ciclo.html";
  }

  /* -----------------------------------------------------------
   * 3. ELEMENTOS DO TREINO.HTML
   * ----------------------------------------------------------- */
  const track  = document.querySelector("#carouselTrack");
  const bar    = document.querySelector("#progressBar");
  const titulo = document.querySelector("#tituloDiaTreino");
  const btnRest = document.querySelector("#btnDescansar");

  if (!track || !bar) {
    FEMFLOW.error("❌ Estrutura interna ausente no DOM.");
    return;
  }

  /* -----------------------------------------------------------
   * 4. ESTADO BASE
   * ----------------------------------------------------------- */
  let boxes = [];
  let current = 0;
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);

  if (titulo) titulo.textContent = `Dia ${diaPrograma} do Programa`;

  /* ============================================================
   * 5. CARROSSEL (SWIPE + PROGRESS)
   * ============================================================ */
  function moveTo(dir) {

    const total = boxes.length;

    if (dir === "next" && current < total - 1) {
      current++;
      navigator.vibrate?.([25]);
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
  }

  let startX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) moveTo(delta < 0 ? "next" : "prev");
  });

  /* ============================================================
   * 6. TIMERS (HIIT / INTERVALOS)
   * ============================================================ */
  const intervals = new WeakMap();
  const fmt = s => `00:${String(s).padStart(2, "0")}`;

  function parseTempo(raw) {
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return n > 0 ? n : 45;
  }

  function bindTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(el => {

      const total = parseTempo(el.dataset.total);
      const fill  = el.querySelector(".ff-timer-fill");
      const label = el.querySelector(".ff-timer-count");

      el.dataset.total = total;
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
   * 7. RENDERIZAR BOXES DO TREINO
   * ============================================================ */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista;

    lista.forEach(box => {
      const div = document.createElement("div");
      div.className = "carousel-item";

      div.innerHTML = `
        <h3 class="ff-ex-titulo">${box.titulo || ""}</h3>
        <p class="ff-ex-sub">${box.subtitulo || ""}</p>

        ${box.video ? `
          <div class="ff-video">
            <iframe src="${box.video}" frameborder="0"
              allowfullscreen></iframe>
          </div>` : ""}

        ${box.timer ? `
          <div class="ff-timer-bar"
               data-total="${box.timer}">
            <div class="ff-timer-fill"></div>
            <span class="ff-timer-count">00:${String(parseTempo(box.timer)).padStart(2, "0")}</span>
          </div>` : ""}

        ${box.series ? `
          <div class="ff-series">
            ${box.series.map(s => `
              <div class="ff-serie-item">
                <span>${s}</span>
              </div>
            `).join("")}
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
    const snap = {
      meta,
      lista,
      salvoEm: Date.now()
    };
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(snap));
  }

  function carregarSnapshot() {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /* ============================================================
   * 9. USAR SNAPSHOT SE ESTIVER SEM INTERNET
   * ============================================================ */
  if (!navigator.onLine) {
    FEMFLOW.warn("📵 Offline: carregando snapshot...");
    const snap = carregarSnapshot();
    if (snap?.lista) {
      renderBoxes(snap.lista);
      FEMFLOW.toast("Modo offline ⚡", false, true);
      return;
    }
  }

  /* ============================================================
   * 10. BOTÃO DESCANSAR
   * ============================================================ */
  if (btnRest) {
    btnRest.addEventListener("click", async () => {
      if (!confirm("Deseja registrar descanso hoje?")) return;

      const fase = localStorage.getItem("femflow_fase") || "folicular";

      await FEMFLOW.salvarDescanso(fase);
      FEMFLOW.toast("Descanso registrado 🌿");
      
      setTimeout(() => {
        location.href = "flowcenter.html";
      }, 900);
    });
  }
  /* ============================================================
   * 11. EXECUTAR TREINO DO DIA — GET BACKEND
   * ============================================================ */
  async function executarTreinoDia() {

    const id = localStorage.getItem("femflow_id");
    if (!id) {
      FEMFLOW.error("❌ Sem ID. Faça login novamente.");
      FEMFLOW.toast("Erro: sem ID.", true);
      return;
    }

    FEMFLOW.log("🚀 executando treino do dia…");

    /* ------------------------------------------------------------
     * 1) BUSCAR ENGINE PRONTA DO BACKEND (sem cálculo no front)
     * ------------------------------------------------------------ */
    const fase = localStorage.getItem("femflow_fase") || "";
    const diaCiclo = localStorage.getItem("femflow_diaCiclo") || "";
    const nivel = localStorage.getItem("femflow_nivel") || "";
    const enfase = localStorage.getItem("femflow_enfase") || "";

    FEMFLOW.log("📡 Engine hormonal carregada do backend:", {
      fase,
      diaCiclo,
      nivel,
      enfase
    });

    /* ------------------------------------------------------------
     * 2) MONTAR URL GET FINAL (backend GAS 2025)
     * ------------------------------------------------------------ */
    const url =
      `${FEMFLOW.SCRIPT_URL}?` +
      `action=treino` +
      `&id=${encodeURIComponent(id)}` +
      `&fase=${encodeURIComponent(fase)}` +
      `&diaCiclo=${encodeURIComponent(diaCiclo)}` +
      `&nivel=${encodeURIComponent(nivel)}` +
      `&enfase=${encodeURIComponent(enfase)}`;

    FEMFLOW.log("🔗 URL GET →", url);

    let raw = null;
    let json = null;

    try {
      const r = await fetch(url);
      raw = await r.text();

      FEMFLOW.log("📦 RAW BACKEND:", raw);

      try {
        json = JSON.parse(raw);
      } catch (err) {
        FEMFLOW.error("❌ JSON inválido:", err);
        FEMFLOW.toast("Erro no servidor.", true);
        return;
      }

    } catch (err) {
      FEMFLOW.error("❌ Falha ao buscar backend:", err);
      FEMFLOW.toast("Conexão falhou.", true);
      return;
    }

    /* ------------------------------------------------------------
     * 3) VALIDAR RESPOSTA
     * ------------------------------------------------------------ */
    if (!json || json.status !== "ok") {
      FEMFLOW.error("❌ Backend retornou erro:", json);
      FEMFLOW.toast("Erro ao montar treino.", true);
      return;
    }

    FEMFLOW.log("🧩 BACKEND OK:", json);

    /* ------------------------------------------------------------
     * 4) SALVAR ENGINE NO LOCALSTORAGE
     * ------------------------------------------------------------ */
    if (json.fase) localStorage.setItem("femflow_fase", json.fase);
    if (json.diaCiclo) localStorage.setItem("femflow_diaCiclo", json.diaCiclo);

    /* ------------------------------------------------------------
     * 5) BUSCAR EXERCÍCIOS NO FIREBASE
     * ------------------------------------------------------------ */
    const pasta = `${nivel}_${enfase}`;
    const faseFirebase = json.fase || "folicular";
    const diaKey = json.diaKey || ("dia_" + json.diaCiclo);

    FEMFLOW.log("🔥 Firebase Query:", { pasta, faseFirebase, diaKey });

    const listaFirebase = await FEMFLOW.buscarExerciciosFirebase(
      pasta,
      faseFirebase,
      diaKey
    );

    if (!listaFirebase) {
      FEMFLOW.warn("⚠ Firebase vazio — usando somente boxes locais");
    }

    /* ------------------------------------------------------------
     * 6) MONTAR BOXES FINAIS
     * ------------------------------------------------------------ */
    const listaFinal = [];

    // → Boxes principais do backend (força)
    if (Array.isArray(json.boxes)) {
      json.boxes.forEach(b => listaFinal.push(b));
    }

    // → Exercícios do Firebase
    if (Array.isArray(listaFirebase)) {
      listaFirebase.forEach(ex => listaFinal.push(ex));
    }

    // → HIIT/Cardio calculado no backend
    if (Array.isArray(json.hiitCardio)) {
      json.hiitCardio.forEach(h => listaFinal.push(h));
    }

    FEMFLOW.log("📦 LISTA FINAL MONTADA:", listaFinal);

    /* ------------------------------------------------------------
     * 7) SNAPSHOT OFFLINE
     * ------------------------------------------------------------ */
    salvarSnapshot(
      {
        fase: json.fase,
        diaCiclo: json.diaCiclo,
        diaKey,
        pasta
      },
      listaFinal
    );

    /* ------------------------------------------------------------
     * 8) RENDERIZAR TREINO DO DIA
     * ------------------------------------------------------------ */
    renderBoxes(listaFinal);
  }

  /* ============================================================
   * 12. INICIAR TREINO AO CARREGAR A PÁGINA
   * ============================================================ */
  executarTreinoDia();

}); // ← FIM DOMContentLoaded

