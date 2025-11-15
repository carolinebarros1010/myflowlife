// =======================================================================
// FemFlow — Treino Diário 2025 (Versão HÍBRIDA PREMIUM + Performance View)
// Box0 + Box1(+HIIT/Cardio) + Box2(+HIIT/Cardio) + Box3 (se existir) + Finalização
// - Híbrido: Apps Script (treino-dia) + Firebase exercícios
// - Pronto para PWA/TWA e modo offline (snapshot do último treino)
// =======================================================================

document.addEventListener('DOMContentLoaded', async () => {

  // -----------------------------------------------------------
  // 🔐 0. Constantes de armazenamento offline
  // -----------------------------------------------------------
  const OFFLINE_KEY_TREINO = "femflow_offline_treino_v1";

  // ============================================================
  // 1. VERIFICAÇÕES DE LOGIN E CICLO
  // ============================================================
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

    // ============================================================
  // 2. ESTADO GLOBAL DO TREINO (vindo do Core)
  // ============================================================
  const estado = (window.FEMFLOW && typeof FEMFLOW.getEstadoTreino === "function")
    ? FEMFLOW.getEstadoTreino()
    : {
        enfase: "geral",
        nivel: "iniciante",
        fase: "folicular",
        faseSugerida: "folicular",
        diaCiclo: 1,
        cicloOK: false
      };

  console.log("🔎 EstadoTreino:", estado);

  // ============================================================
  // 2. ELEMENTOS BÁSICOS DO TREINO
  // ============================================================
  const track     = document.querySelector("#carouselTrack");
  const bar       = document.querySelector("#progressBar");
  const tituloDia = document.querySelector("#tituloDiaTreino");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Erro interno: Estrutura do treino ausente.");
    console.error("Elementos essenciais não encontrados (track/progressBar).");
    return;
  }

  let current = 0;
  let boxes   = [];

  // contador do programa (1–30)
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (tituloDia) {
    tituloDia.textContent = `Dia ${diaPrograma} do Programa`;
  }

  // meta do treino (para salvar/descanso, inclusive offline)
  let metaTreino = {
    fase: null,
    diaCiclo: null,
    diaPrograma
  };

  // ============================================================
  // 3. NAVEGAÇÃO DO CARROSSEL + SWIPE
  // ============================================================
  const moveTo = (dir) => {
    if (dir === "next" && current < boxes.length - 1) {
      current++;
      navigator.vibrate?.([30]);
    } else if (dir === "prev" && current > 0) {
      current--;
      navigator.vibrate?.([20]);
    }
    // "stay" não altera índice, só atualiza barra
    track.style.transform = `translateX(-${current * 100}%)`;
    bar.style.width = boxes.length
      ? `${((current + 1) / boxes.length) * 100}%`
      : "0%";
  };

  let startX = 0, endX = 0;

  track.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener("touchmove", e => {
    endX = e.touches[0].clientX;
  }, { passive: true });

  track.addEventListener("touchend", () => {
    const diff = startX - endX;
    if (Math.abs(diff) > 40) moveTo(diff > 0 ? "next" : "prev");
  });

  // ============================================================
  // 4. TIMERS DE EXERCÍCIO
  // ============================================================
  const fmt = s => `00:${String(Math.max(0, Math.floor(s))).padStart(2, "0")}`;
  const intervals = new WeakMap();

  const clearTimer = el => {
    const id = intervals.get(el);
    if (id) clearInterval(id);
    intervals.delete(el);
    el.classList.remove("running");
  };

  const startTimer = el => {
    clearTimer(el);
    let remain = Number(el.dataset.remain || el.dataset.total || 45);
    el.dataset.remain = remain;

    el.classList.add("running");
    el.textContent = fmt(remain);

    const int = setInterval(() => {
      remain--;
      el.dataset.remain = remain;
      el.textContent = fmt(remain);

      if (remain <= 0) {
        clearInterval(int);
        intervals.delete(el);
        el.classList.remove("running");
        el.classList.add("done");
        navigator.vibrate?.([60, 40, 60]);
      }
    }, 1000);

    intervals.set(el, int);
  };

  const pauseTimer = el => {
    const id = intervals.get(el);
    if (id) clearInterval(id);
    intervals.delete(el);
    el.classList.remove("running");
  };

  const resetTimer = el => {
    clearTimer(el);
    el.dataset.remain = el.dataset.total;
    el.textContent = fmt(Number(el.dataset.total || 45));
    el.classList.remove("running", "done");
  };

  const bindTimers = root => {
    root.querySelectorAll(".subtimer").forEach(el => {
      if (!el.dataset.total) {
        const raw = el.textContent.replace(/\D/g, "");
        el.dataset.total = raw || "45";
      }

      el.textContent = fmt(Number(el.dataset.total));

      // clique: start/pause
      el.addEventListener("click", () => {
        if (el.classList.contains("running")) {
          pauseTimer(el);
        } else {
          startTimer(el);
        }
      });

      // toque longo: reset
      let t;
      el.addEventListener("touchstart", () => t = Date.now(), { passive: true });
      el.addEventListener("touchend", () => {
        if (Date.now() - t > 500) resetTimer(el);
      });
    });
  };

  // ============================================================
  // 5. NORMALIZAÇÃO DE LINKS
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
  // 6. PERFORMANCE VIEW + HTML DOS BOXES + RENDER
  // ============================================================
  let perfMode = "none";

  const aplicarPerformanceView = (faseStr = "") => {
    const f = (faseStr || "").toLowerCase();

    // limpa classes antigas
    document.body.classList.remove(
      "ff-performance-ovulation",
      "ff-flow-menstrual",
      "ff-flow-folicular",
      "ff-flow-lutea",
      "ff-flow-lútea"
    );

    if (f.includes("ovulat")) {
      perfMode = "ovulation";
      document.body.classList.add("ff-performance-ovulation");
    } else if (f.includes("menstr")) {
      perfMode = "softflow";
      document.body.classList.add("ff-flow-menstrual");
    } else if (f.includes("folicular")) {
      perfMode = "growthflow";
      document.body.classList.add("ff-flow-folicular");
    } else if (f.includes("lutea") || f.includes("lútea")) {
      perfMode = "focusedflow";
      document.body.classList.add("ff-flow-lutea");
    } else {
      perfMode = "none";
    }
  };

  const criarBoxHTML = (box) => {

    // Banner de Performance (apenas em box de treino, modo ovulatório)
    const perfHeader = (perfMode === "ovulation" && box.tipo === "exercicios") ? `
      <div class="perf-banner">
        🌕 <b>Performance Mode</b> — Pico de energia do seu ciclo
        <p>Fase ovulatória: coordenação, força e potência a favor do seu treino.</p>
      </div>
    ` : "";

    if (box.tipo === "texto")
      return `
        <div class="box texto">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>
      `;

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
                <label>Séries</label><input inputmode="numeric" value="${e.series ?? ""}">
                <label>Reps</label><input inputmode="numeric" value="${e.reps ?? ""}">
                <label>Timer</label>
                <div class="subtimer" data-total="${e.tempo ?? 45}">${fmt(e.tempo ?? 45)}</div>
              </div>
            </div>
          `).join("")}

          ${extras.length ? `
            <div class="box-extra-wrapper">
              ${extras.map(h => `
                <div class="box-extra ${h.kind === "cardio" ? "cardio" : "hiit"}">
                  <div class="box-extra-tag">
                    ${h.kind === "cardio" ? "💗 Cardio Leve / Moderado" : "🔥 HIIT Fase do Ciclo"}
                  </div>
                  <h4>${h.titulo}</h4>
                  <p>${h.descricao}</p>
                  ${h.protocolo ? `<p><b>Protocolo sugerido:</b> ${h.protocolo}</p>` : ""}
                  ${h.equipamentos ? `<p><b>Onde você pode fazer:</b> ${h.equipamentos}</p>` : ""}
                  <p><b>Duração aproximada:</b> ${(h.tempo_total / 60).toFixed(0)} min</p>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </div>
      `;
    }

    if (box.tipo === "resfriamento")
      return `
        <div class="box resfriamento">
          <h3>${box.titulo}</h3>
          <p>${box.mensagem}</p>
        </div>
      `;

    return "";
  };

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
  // 7. HELPERS OFFLINE (snapshot do último treino)
  // ============================================================
  const carregarSnapshotOffline = () => {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY_TREINO);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("⚠️ Falha ao carregar snapshot offline:", e);
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
      console.warn("⚠️ Falha ao salvar snapshot offline:", e);
    }
  };

// ============================================================
// 8. FALLBACKS LOCAIS BÁSICOS (apenas para garantir persistência)
// ============================================================

// Garante que o que veio do Core também esteja salvo em localStorage
if (estado.faseSugerida && !localStorage.getItem("fase_sugerida")) {
  localStorage.setItem("fase_sugerida", estado.faseSugerida);
}
if (estado.nivel && !localStorage.getItem("nivel_atual")) {
  localStorage.setItem("nivel_atual", estado.nivel);
}
if (estado.diaCiclo && !localStorage.getItem("dia_ciclo")) {
  localStorage.setItem("dia_ciclo", String(estado.diaCiclo));
}

// Enfase agora vem SEMPRE do Core
const enfase = estado.enfase || "geral";


  // ============================================================
  // 9. CHAMADA AO BACKEND (Apps Script via Worker) + OFFLINE
  // ============================================================
 const SCRIPT_URL =
  FEMFLOW.SCRIPT_URL ||
  localStorage.getItem("femflow_script") ||
  "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

// usamos o estado completo aqui
const url = `${SCRIPT_URL
  }?action=treino` +
  `&id=${encodeURIComponent(id)}` +
  `&enfase=${encodeURIComponent(estado.enfase || "geral")}` +
  `&fase=${encodeURIComponent(estado.faseSugerida || estado.fase || "folicular")}` +
  `&diaCiclo=${encodeURIComponent(estado.diaCiclo || 1)}`;


  let j = null;
  let offlineSnap = null;

  try {
    const resp = await fetch(url);
    const txt  = await resp.text();
    console.log("📡 Resposta bruta treino:", txt.slice(0, 300));

    try {
      j = JSON.parse(txt);
    } catch (e) {
      console.error("❌ Resposta não-JSON:", txt);
      // tenta offline
      offlineSnap = carregarSnapshotOffline();
    }

  } catch (e) {
    console.warn("⚠️ Falha de rede no treino:", e);
    offlineSnap = carregarSnapshotOffline();
  }

  // ------------------------------------------------------------
  // 9.1. MODO OFFLINE: usa último snapshot salvo
  // ------------------------------------------------------------
  if (!j) {
    if (offlineSnap && Array.isArray(offlineSnap.lista)) {
      FEMFLOW.toast("📴 Modo offline — exibindo último treino salvo.");
      document.body.classList.add("ff-offline-mode");

      metaTreino = {
        fase: offlineSnap.meta?.fase || localStorage.getItem("fase_sugerida") || "folicular",
        diaCiclo: offlineSnap.meta?.diaCiclo || Number(localStorage.getItem("dia_ciclo") || 1),
        diaPrograma: offlineSnap.meta?.diaPrograma || diaPrograma
      };

      aplicarPerformanceView(metaTreino.fase);
      render(offlineSnap.lista);
      return;
    }

    FEMFLOW.toast("⚠️ Sem conexão e nenhum treino salvo. Conecte-se à internet.");
    render([{
      tipo: "texto",
      titulo: "Sem treino disponível",
      mensagem: "Não foi possível carregar o treino de hoje. Verifique sua conexão e tente novamente."
    }]);
    return;
  }

  // ============================================================
  // 10. VALIDAÇÃO DO RETORNO ONLINE
  // ============================================================
  if (!j || j.status === "id_not_found") {
    render([{ tipo: "texto", titulo: "Sem treino", mensagem: "Faça login novamente." }]);
    return;
  }

  // fallback de metadata Firebase se não vier exSource
  if (!j.exSource) {
    j.exSource = "firebase";
    j.firebaseQuery = j.firebaseQuery || {
      nivel: localStorage.getItem("nivel_atual"),
      fase:  localStorage.getItem("fase_sugerida"),
      enfase,
      diaKey: `dia_${localStorage.getItem("dia_ciclo")}`
    };
  }

  // Atualiza metaTreino com dados reais do backend
  metaTreino = {
    fase: j.fase || localStorage.getItem("fase_sugerida"),
    diaCiclo: j.diaCiclo || Number(localStorage.getItem("dia_ciclo") || 1),
    diaPrograma: j.diaPrograma || diaPrograma
  };

  aplicarPerformanceView(metaTreino.fase);

  // ============================================================
  // 11. ORGANIZAÇÃO DAS FAIXAS HIIT/CARDIO POR BOX
  // ============================================================
  const extrasByBox = new Map();
  (j.hiitCardio || []).forEach(entry => {
    const b = Number(entry.box || 0);
    if (!b || !Array.isArray(entry.extras)) return;
    extrasByBox.set(b, entry.extras);
  });

  // ============================================================
  // 12. MONTAGEM DA LISTA DE BOXES (Box0 + Box1/2/3 + BoxFinal)
  // ============================================================
  const lista = [];

  // Box 0 (conexão) e Box Final vêm do backend (Apps Script)
  let boxIntro = null;
  let boxFinal = null;

  if (Array.isArray(j.boxes)) {
    boxIntro = j.boxes.find(b => b.tipo === "texto") || null;
    boxFinal = j.boxes.find(b => b.tipo === "resfriamento") || null;
  }

  if (boxIntro) lista.push(boxIntro);

  // --- Firebase: exercícios por box ---
  if (j.exSource === "firebase") {
    let raw = [];

    try {
      raw = await FEMFLOW.buscarExerciciosFirebase(
        j.firebaseQuery.nivel,
        j.firebaseQuery.fase,
        j.firebaseQuery.diaKey,
        j.firebaseQuery.enfase
      );
    } catch (e) {
      console.warn("Firebase falhou ao carregar exercícios:", e);
    }

    if (raw.length) {
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
          const idx = Number((boxName.match(/\d+/) || [0])[0]); // 1,2,3...
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
              tempo: ex.tempo ?? 45
            }))
          });
        });
    }
  }

  if (boxFinal) lista.push(boxFinal);

  // ============================================================
  // 13. RENDERIZA E SALVA SNAPSHOT OFFLINE
  // ============================================================
  render(lista);
  salvarSnapshotOffline(metaTreino, lista);

  // ============================================================
  // 14. SALVAR TREINO
  // ============================================================
  document.querySelector("#salvarTreinoBtn")?.addEventListener("click", async () => {
    FEMFLOW.abrirPSE(async (pse) => {
      try {
        await FEMFLOW.salvarTreino({
          id,
          fase: metaTreino.fase || localStorage.getItem("fase_sugerida"),
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
        console.warn("Falha ao salvar treino (provável offline):", e);
        FEMFLOW.toast("📴 Sem conexão para salvar agora. Treino realizado ficará registrado localmente.");
      }
    });
  });

  // ============================================================
  // 15. SALVAR DESCANSO
  // ============================================================
  document.querySelector("#descansoBtn")?.addEventListener("click", async () => {
    try {
      await FEMFLOW.salvarDescanso(metaTreino.fase || localStorage.getItem("fase_sugerida"));

      let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
      if (prog < 30) {
        localStorage.setItem("femflow_dia_treino", prog + 1);
        FEMFLOW.toast(`🌿 Descanso registrado. Próximo: Dia ${prog + 1}`);
      } else {
        FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
      }
    } catch (e) {
      console.warn("Falha ao registrar descanso (provável offline):", e);
      FEMFLOW.toast("📴 Sem conexão para registrar descanso agora. Você pode repetir esse dia depois.");
    }
  });
  window.addEventListener("femflow:langchange", () => {
   location.reload();
});
});
