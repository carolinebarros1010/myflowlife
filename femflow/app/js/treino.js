// =======================================================================
// FemFlow — Treino Diário 2025 (Versão HÍBRIDA + Performance View)
// Box0 + Box1(+HIIT/Cardio) + Box2(+HIIT/Cardio) + Finalização
// =======================================================================

document.addEventListener('DOMContentLoaded', async () => {

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
  // 2. ELEMENTOS BÁSICOS DO TREINO
  // ============================================================
  const track = document.querySelector("#carouselTrack");
  const bar   = document.querySelector("#progressBar");
  const tituloDia = document.querySelector("#tituloDiaTreino");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Erro interno: Estrutura do treino ausente.");
    console.error("Elementos essenciais não encontrados.");
    return;
  }

  let current = 0;
  let boxes   = [];

  // contador do programa (1–30)
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);
  if (tituloDia) {
    tituloDia.textContent = `Dia ${diaPrograma} do Programa`;
  }

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
  // 6. FALLBACKS LOCAIS BÁSICOS
  // ============================================================
  const enfase = localStorage.getItem("femflow_enfase") || "geral";

  if (!localStorage.getItem("fase_sugerida"))
    localStorage.setItem("fase_sugerida", "folicular");
  if (!localStorage.getItem("nivel_atual"))
    localStorage.setItem("nivel_atual", "iniciante");
  if (!localStorage.getItem("dia_ciclo"))
    localStorage.setItem("dia_ciclo", "1");

  // ============================================================
  // 7. CHAMADA AO BACKEND (Apps Script via Worker)
  // ============================================================
  const SCRIPT_URL =
    FEMFLOW.SCRIPT_URL ||
    localStorage.getItem("femflow_script") ||
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

  const url = `${SCRIPT_URL}?action=treino&id=${id}&enfase=${enfase}`;

  let j = null;

  try {
    const resp = await fetch(url);
    const txt  = await resp.text();
    console.log("📡 Resposta bruta:", txt.slice(0, 300));

    try { j = JSON.parse(txt); }
    catch {
      FEMFLOW.toast("❌ Resposta inválida do servidor.");
      console.error("Resposta não-JSON:", txt);
      return;
    }

  } catch (e) {
    FEMFLOW.toast("⚠️ Falha de rede.");
    console.error(e);
    return;
  }

  // ============================================================
  // 8. VALIDAÇÃO DO RETORNO
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

  // ============================================================
  // 9. PERFORMANCE VIEW (fases hormonais)
  // ============================================================
  let perfMode = "none";
  const faseLower = (j.fase || "").toLowerCase();

  if (faseLower.includes("ovulat")) {
    perfMode = "ovulation";
    document.body.classList.add("ff-performance-ovulation");
  } else if (faseLower.includes("menstr")) {
    perfMode = "softflow";
    document.body.classList.add("ff-flow-menstrual");
  } else if (faseLower.includes("folicular")) {
    perfMode = "growthflow";
    document.body.classList.add("ff-flow-folicular");
  } else if (faseLower.includes("lutea") || faseLower.includes("lútea")) {
    perfMode = "focusedflow";
    document.body.classList.add("ff-flow-lutea");
  }

  // ============================================================
  // 10. ORGANIZAÇÃO DAS FAIXAS HIIT/CARDIO POR BOX
  // ============================================================
  const extrasByBox = new Map();
  (j.hiitCardio || []).forEach(entry => {
    const b = Number(entry.box || 0);
    if (!b || !Array.isArray(entry.extras)) return;
    extrasByBox.set(b, entry.extras);
  });

  // ============================================================
  // 11. CRIAÇÃO DO HTML DOS BOXES
  // ============================================================
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

  const render = lista => {
    boxes = lista;
    track.innerHTML = lista
      .map(b => `<div class="carousel-item">${criarBoxHTML(b)}</div>`)
      .join("");
    current = 0;
    moveTo("stay");
    bindTimers(track);
  };

  // ============================================================
  // 12. MONTAGEM DA LISTA DE BOXES (Box0 + Box1/2 + BoxFinal)
  // ============================================================
  const lista = [];

  // Box 0 (conexão) e Box Final vem do backend (Apps Script)
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
      console.warn("Firebase falhou", e);
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
              tempo: ex.tempo ?? 45
            }))
          });
        });
    }
  }

  if (boxFinal) lista.push(boxFinal);

  render(lista);

  // ============================================================
  // 13. SALVAR TREINO
  // ============================================================
  document.querySelector("#salvarTreinoBtn")?.addEventListener("click", async () => {
    FEMFLOW.abrirPSE(async (pse) => {
      await FEMFLOW.salvarTreino({
        id,
        fase: j.fase || localStorage.getItem("fase_sugerida"),
        treino: "dia",
        tipo_dia: "treino",
        pse
      });

      let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
      if (prog < 30) {
        localStorage.setItem("femflow_dia_treino", prog + 1);
        FEMFLOW.toast(`Treino salvo! Próximo: Dia ${prog + 1}`);
      } else {
        FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
      }
    });
  });

  // ============================================================
  // 14. SALVAR DESCANSO
  // ============================================================
  document.querySelector("#descansoBtn")?.addEventListener("click", async () => {
    await FEMFLOW.salvarDescanso(j.fase || localStorage.getItem("fase_sugerida"));

    let prog = Number(localStorage.getItem("femflow_dia_treino") || 1);
    if (prog < 30) {
      localStorage.setItem("femflow_dia_treino", prog + 1);
      FEMFLOW.toast(`🌿 Descanso registrado. Próximo: Dia ${prog + 1}`);
    } else {
      FEMFLOW.toast("🎉 Programa de 30 dias concluído!");
    }
  });

});
