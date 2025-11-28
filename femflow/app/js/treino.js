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
  // Função para calcular o ciclo hormonal, agora baseada no backend
  async function calcularEngineHormonal() {
    const id = localStorage.getItem("femflow_id");

    const response = await fetch(`${SCRIPT_URL}?action=status&id=${id}`);
    const data = await response.json();

    if (data.status !== "ok") {
      FEMFLOW.toast("⚠️ Não foi possível recuperar o ciclo da aluna.");
      return null;
    }

    const fase = data.fase;
    const diaCiclo = data.diaCiclo;

    return {
      faseFirebase: fase,
      diaFirebase: diaCiclo,
      diaKey: `dia_${diaCiclo}`
    };
  }

  /* ============================================================
   * 7. ENGINE ENERGÉTICA
   * ============================================================ */
  function engineEnergeticaAvancar() {
    let dia = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    localStorage.setItem("femflow_dia_energetico", dia + 1);
  }

  function engineEnergeticaRetroalimentar() {
    let dia = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    if (dia > 1) localStorage.setItem("femflow_dia_energetico", dia - 1);
  }

  /* ============================================================
   * 8. EXECUÇÃO DO TREINO
   * ============================================================ */
  async function executarTreinoDia() {

    const id = localStorage.getItem("femflow_id");

    if (!id) {
      FEMFLOW.toast("⚠️ Refaça o login.");
      return location.href = "index.html?ret=treino.html";
    }

    const cicloData = await calcularEngineHormonal();

    if (!cicloData) {
      FEMFLOW.toast("⚠️ Não foi possível calcular o ciclo.");
      return;
    }

    const { faseFirebase, diaFirebase, diaKey } = cicloData;

    const firebaseQuery = {
      fase: faseFirebase,
      diaKey: diaKey
    };

    const url =
      `${SCRIPT_URL}?action=treino` +
      `&id=${encodeURIComponent(id)}` +
      `&fase=${encodeURIComponent(faseFirebase)}` +
      `&diaFirebase=${encodeURIComponent(diaFirebase)}` +
      `&diaKey=${encodeURIComponent(diaKey)}` +
      `&nivel=${encodeURIComponent(localStorage.getItem("femflow_nivel") || "")}` +
      `&enfase=${encodeURIComponent(localStorage.getItem("femflow_enfase") || "")}` +
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
      diaCiclo: cicloData.diaFirebase,
      diaPrograma
    }, listaFinal);

    console.log("✅ Treino final renderizado!");
  }
  
  /* Função que inicia o treino do dia */
  executarTreinoDia();

});
