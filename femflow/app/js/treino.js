// =======================================================================
// FemFlow — Treino Diário 2025 (Versão HÍBRIDA DEFINITIVA)
// Box0 + Box1(+HIIT/Cardio) + Box2(+HIIT/Cardio) + Finalização
// =======================================================================

document.addEventListener('DOMContentLoaded', async () => {

  // =====================================================================
  // 1. VERIFICAÇÃO DE LOGIN
  // =====================================================================
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    location.href = "index.html?ret=treino.html";
    return;
  }

  // =====================================================================
  // 2. ELEMENTOS DA TELA
  // =====================================================================
  const track = document.querySelector("#carouselTrack");
  const bar   = document.querySelector("#progressBar");

  if (!track || !bar) {
    FEMFLOW.toast("❌ Erro interno: estrutura ausente.");
    return;
  }

  let current = 0;
  let boxes = [];

  // =====================================================================
  // 3. SWIPE / NAVEGAÇÃO
  // =====================================================================
  const moveTo = (dir) => {
    if (dir === "next" && current < boxes.length - 1) current++;
    else if (dir === "prev" && current > 0) current--;

    track.style.transform = `translateX(-${current * 100}%)`;
    bar.style.width = `${((current + 1) / boxes.length) * 100}%`;
    navigator.vibrate?.([25]);
  };

  let startX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchend", e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) moveTo(diff > 0 ? "next" : "prev");
  });

  // =====================================================================
  // 4. TIMER DOS EXERCÍCIOS
  // =====================================================================
  const fmt = s => `00:${String(Math.max(0, Math.floor(s))).padStart(2, "0")}`;
  const timers = new WeakMap();

  const iniciarTimer = (el) => {
    let t = Number(el.dataset.total || 45);
    el.classList.add("running");
    el.textContent = fmt(t);

    const interval = setInterval(() => {
      t--;
      el.textContent = fmt(t);
      if (t <= 0) {
        clearInterval(interval);
        el.classList.remove("running");
        el.classList.add("done");
      }
    }, 1000);

    timers.set(el, interval);
  };

  const bindTimers = root => {
    root.querySelectorAll(".subtimer").forEach(el => {
      el.textContent = fmt(el.dataset.total || 45);

      el.addEventListener("click", () => {
        if (el.classList.contains("running")) {
          clearInterval(timers.get(el));
          el.classList.remove("running");
        } else {
          iniciarTimer(el);
        }
      });
    });
  };

  // =====================================================================
  // 5. CHAMADA AO BACKEND
  // =====================================================================
  const SCRIPT_URL =
    FEMFLOW.SCRIPT_URL ||
    localStorage.getItem("femflow_script") ||
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

  const resp = await fetch(`${SCRIPT_URL}?action=treino&id=${id}`);
  const txt  = await resp.text();
  console.log("📡 Resposta:", txt.slice(0,150));

  let j;
  try { j = JSON.parse(txt); } catch { FEMFLOW.toast("Erro no servidor."); return; }

  if (!j || j.status === "id_not_found") {
    render([{ tipo:"texto", titulo:"Erro", mensagem:"ID não encontrado." }]);
    return;
  }

  // ==============================================================  
  // 6. CRIAÇÃO DO TREINO COMPLETO
  // ==============================================================  
  const lista = [];

  // ------------------------------------
  // BOX 0 (Conexão)
  // ------------------------------------
  const box0 = j.boxes?.find(b => b.tipo === "texto");
  if (box0) lista.push(box0);

  // ------------------------------------
  // Firebase: busca exercícios por box 
  // ------------------------------------
  let raw = [];
  try {
    raw = await FEMFLOW.buscarExerciciosFirebase(
      j.firebaseQuery.nivel,
      j.firebaseQuery.fase,
      j.firebaseQuery.diaKey,
      j.firebaseQuery.enfase
    );
  } catch (e) {
    console.warn("Firebase erro:", e);
  }

  // Organiza por box
  const boxMap = new Map();
  raw.forEach(ex => {
    const box = ex.box || "Box 1";
    if (!boxMap.has(box)) boxMap.set(box, []);
    boxMap.get(box).push(ex);
  });

  // ==============================================================
  // RENDER DOS BOXES DE TREINO — AGORA COM HIIT EMBUTIDO
  // ==============================================================

  for (let i = 1; i <= j.regras.boxes; i++) {

    const nomeBox = `Box ${i}`;
    const exercicios = boxMap.get(nomeBox) || [];

    // HIIT / Cardio do box (AGORA EMBUTIDO)
    const extra = j.hiitCardio?.find(x => x.box === i);
    let extrasHTML = "";

    if (extra && extra.extras.length) {
      extra.extras.forEach(h => {
        extrasHTML += `
          <div class="box-extra ${h.kind}">
            <h4>${h.titulo}</h4>
            <p>${h.descricao}</p>
            ${h.protocolo ? `<p><b>Protocolo:</b> ${h.protocolo}</p>` : ""}
            <p><b>Duração:</b> ${(h.tempo_total/60).toFixed(0)} min</p>
          </div>
        `;
      });
    }

    lista.push({
      tipo: "exercicios",
      titulo: nomeBox,
      itens: exercicios.map(e => ({
        exercicio: e.titulo,
        link: e.link,
        series: e.series,
        reps: e.reps,
        tempo: e.tempo
      })),
      extrasHTML // embutido
    });
  }

  // ------------------------------------
  // BOX FINAL (Alongamento/Respiração)
  // ------------------------------------
  const boxFinal = j.boxes?.find(b => b.tipo === "resfriamento");
  if (boxFinal) lista.push(boxFinal);

  // =====================================================================
  // 7. GERAR HTML
  // =====================================================================
  const normLink = u => !u ? "" : (u.startsWith("http") ? u : "https://" + u);

  const criarBoxHTML = (box) => {

    if (box.tipo === "texto")
      return `<div class="box texto"><h3>${box.titulo}</h3><p>${box.mensagem}</p></div>`;

    if (box.tipo === "exercicios")
      return `
      <div class="box treino">
        <h3>${box.titulo}</h3>

        ${box.itens.map(e => `
          <div class="ex">
            <div class="ex-head">
              <b>${e.exercicio}</b>
              ${e.link ? `<a class="vid" href="${normLink(e.link)}" target="_blank">🎥</a>` : ""}
            </div>
            <div class="ex-grid">
              <label>Séries</label><input value="${e.series}">
              <label>Reps</label><input value="${e.reps}">
              <label>Timer</label>
              <div class="subtimer" data-total="${e.tempo}">${fmt(e.tempo)}</div>
            </div>
          </div>
        `).join("")}

        ${box.extrasHTML || ""}
      </div>
      `;

    if (box.tipo === "hiit" || box.tipo === "cardio")
      return `
      <div class="box hiit">
        <h3>${box.titulo}</h3>
        <p>${box.descricao}</p>
        ${box.protocolo ? `<p><b>Protocolo:</b> ${box.protocolo}</p>` : ""}
        <p><b>Duração:</b> ${(box.tempo_total/60).toFixed(0)} min</p>
      </div>
      `;

    if (box.tipo === "resfriamento")
      return `<div class="box resfriamento"><h3>${box.titulo}</h3><p>${box.mensagem}</p></div>`;

    return "";
  };

  const render = lista => {
    boxes = lista;
    track.innerHTML = lista.map(b => `<div class="carousel-item">${criarBoxHTML(b)}</div>`).join("");
    bindTimers(track);
  };

  render(lista);

  // =====================================================================
  // 8. SALVAR TREINO
  // =====================================================================
  document.querySelector("#salvarTreinoBtn").addEventListener("click", async () => {
    FEMFLOW.abrirPSE(async (pse) => {
      await FEMFLOW.salvarTreino({ id, fase: j.fase, treino:"dia", pse });
      FEMFLOW.toast("Treino salvo com sucesso!");
    });
  });

  // =====================================================================
  // 9. SALVAR DESCANSO
  // =====================================================================
  document.querySelector("#descansoBtn").addEventListener("click", async () => {
    await FEMFLOW.salvarDescanso(j.fase);
    FEMFLOW.toast("Descanso registrado 🌿");
  });

});
