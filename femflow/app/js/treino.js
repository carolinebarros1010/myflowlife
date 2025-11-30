/* ================================================================
   FemFlow — treino.js FRONT-END PREMIUM v3.0 (Arquitetura A)
   ---------------------------------------------------------------
   • Interação com:
       - treino-engine v3.0
       - GAS backend (salvarTreino / salvarDescanso / salvarEvolucao)
       - Firestore (carregar exercícios)

   • Features Premium:
       - Render especial por tipo de box
       - Timer por exercício + progresso
       - Pré-contagem HIIT (3–2–1)
       - Final countdown (5–4–3–2–1)
       - Peso salvo por exercício
       - Modal PSE obrigatório para salvar treino
       - Protocolos de respiração inline (wake / release)
================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v3.0 (Arquitetura A) iniciado!");

  const diaProg = FEMFLOW.calcularDiaPrograma();
  document.getElementById("tituloDiaTreino").textContent = `Dia ${diaProg}`;

  const OFFLINE_KEY = "femflow_offline_treino_v1";

  /* ============================================================
     1. LOGIN OBRIGATÓRIO
  ============================================================ */
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    return location.href = "index.html?ret=treino.html";
  }

  /* ============================================================
     2. CICLO PRECISA ESTAR CONFIGURADO
  ============================================================ */
  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo primeiro.");
    return location.href = "ciclo.html";
  }

  /* ============================================================
     3. ELEMENTOS HTML
  ============================================================ */
  const track      = document.querySelector("#carouselTrack");
  const bar        = document.querySelector("#progressBar");
  const btnRest    = document.getElementById("descansoBtn");
  const btnSalvar  = document.getElementById("salvarTreinoBtn");

  if (!track || !bar) {
    FEMFLOW.log("❌ Estrutura do treino.html não encontrada.");
    return;
  }

  /* ============================================================
     4. ESTADO LOCAL
  ============================================================ */
  let boxes = [];
  let current = 0;

  /* ============================================================
     5. CARROSSEL — Swipe
  ============================================================ */
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
     6. TIMER PREMIUM
  ============================================================ */
  function aplicarTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(barra => {

      const total = Number(barra.dataset.total);
      const fill = barra.querySelector(".ff-timer-fill");
      const label = barra.querySelector(".ff-timer-count");
      let restante = total;
      let intv = null;

      const atualizar = () => {
        fill.style.width = `${(restante / total) * 100}%`;
        label.textContent = `00:${String(restante).padStart(2, "0")}`;
      };

      atualizar();

      barra.onclick = () => {
        clearInterval(intv);
        restante = total;
        atualizar();

        intv = setInterval(() => {
          restante--;
          atualizar();

          if (restante <= 0) {
            clearInterval(intv);
            label.textContent = "✔";
            fill.style.width = "0%";
          }
        }, 1000);
      };
    });
  }

  /* ============================================================
     7. RENDER PREMIUM — POR TIPO
  ============================================================ */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista || [];

    boxes.forEach(box => {
      const div = document.createElement("div");
      div.className = "carousel-item";

      /* -------------------------------
         AQUECIMENTO PREMIUM
      -------------------------------- */
      if (box.tipo === "aquecimentoPremium") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${box.passos.map(p => `<li>${p}</li>`).join("")}
          </ul>

          <button class="ff-btn-protocolo" data-prot="${box.protocolo}">
            🌬️ Iniciar Respiração Wake
          </button>
        `;
      }

      /* -------------------------------
         RESFRIAMENTO PREMIUM
      -------------------------------- */
      else if (box.tipo === "resfriamentoPremium") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${box.passos.map(p => `<li>${p}</li>`).join("")}
          </ul>

          <button class="ff-btn-protocolo" data-prot="${box.protocolo}">
            🌬️ Respiração Release
          </button>

          <p class="ff-final-msg">
            Para finalizar seu treino, clique em <b>Salvar treino</b> abaixo.
          </p>
        `;
      }

      /* -------------------------------
         HIIT PREMIUM
      -------------------------------- */
      else if (box.tipo === "hiitPremium") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <div class="ff-hiit-contagem">
            <span class="ff-hiit-start">3 • 2 • 1</span>
            <span class="ff-hiit-end">5 • 4 • 3 • 2 • 1</span>
          </div>

          <div class="ff-timer-bar" data-total="${box.tempo_total}">
            <div class="ff-timer-fill"></div>
            <span class="ff-timer-count">06:00</span>
          </div>
        `;
      }

      /* -------------------------------
         CARDIO
      -------------------------------- */
      else if (box.tipo === "cardio") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <div class="ff-timer-bar" data-total="${box.tempo_total}">
            <div class="ff-timer-fill"></div>
            <span class="ff-timer-count">10:00</span>
          </div>
        `;
      }

      /* -------------------------------
         TREINO (BOX NORMAL)
      -------------------------------- */
      else if (box.tipo === "treino") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">Box ${box.box}</h3>

         <div class="ff-ex-item">
  <div class="ff-ex-top">
    <h4 class="ff-ex-nome">${ex.titulo || ex.nome || "Exercício"}</h4>
    <input 
      type="number"
      class="ff-ex-peso"
      placeholder="kg"
      data-ex="${ex.titulo || ex.nome}"
    />
  </div>

  <div class="ff-ex-info">
    Séries: <b>${ex.series}</b> —  
    Reps: <b>${ex.reps}</b> —  
    Desc: <b>${ex.intervalo}s</b>
  </div>

  <div class="ff-timer-bar" data-total="${ex.intervalo}">
    <div class="ff-timer-fill"></div>
    <span class="ff-timer-count">${fmt(ex.intervalo)}</span>
  </div>
</div>

            `).join("")}
          </div>
        `;
      }

      track.appendChild(div);
    });

    aplicarTimers(track);
    bindRespiracaoButtons(track);
    bindPeso();
    moveTo("reset");
  }

  /* ============================================================
     8. BOTÕES DE RESPIRAÇÃO
  ============================================================ */
  function bindRespiracaoButtons(root) {
    root.querySelectorAll(".ff-btn-protocolo").forEach(btn => {
      btn.onclick = () => {
        const p = btn.dataset.prot;
        FEMFLOW.router(`respiracao.html?prot=${p}`);
      };
    });
  }

  /* ============================================================
     9. PESO → SALVAR EVOLUÇÃO
  ============================================================ */
  function bindPeso() {
    document.querySelectorAll(".ff-input-peso").forEach(inp => {
      inp.addEventListener("change", async () => {
        const exercicio = inp.dataset.ex;
        const peso = inp.value;

        await FEMFLOW.salvarEvolucao({
          id: localStorage.getItem("femflow_id"),
          exercicio,
          peso,
          reps: "",
          series: "",
          diaPrograma: diaProg,
          pse: ""
        });

        FEMFLOW.toast("Peso salvo ✔");
      });
    });
  }

  /* ============================================================
     10. BOTÃO SALVAR TREINO → MODAL PSE
  ============================================================ */
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
            id,
            pse: valorPSE,
            fase,
            diaFirebase,
            treino: "Força",
            obs: ""
          })
        });

        const j = await r.json();

        if (j.novaFase)
          localStorage.setItem("femflow_fase", j.novaFase);

        if (j.novoDiaCiclo)
          localStorage.setItem("femflow_diaCiclo", j.novoDiaCiclo);

        FEMFLOW.calcularDiaPrograma();

        FEMFLOW.toast("Treino salvo!");
        FEMFLOW.router("flowcenter");
      });

    };
  }

  /* ============================================================
     11. DESCANSO
  ============================================================ */
  if (btnRest) {
    btnRest.onclick = async () => {
      const r = await FEMFLOW.salvarDescanso();
      FEMFLOW.toast("Descanso registrado 🌿");
      setTimeout(() => FEMFLOW.router("flowcenter"), 800);
    };
  }

  /* ============================================================
     12. SNAPSHOT OFFLINE
  ============================================================ */
  const salvarSnapshot = (meta, lista) => {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify({ meta, lista, salvoEm: Date.now() }));
  };

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
     13. SINCRONIZAR CICLO COM BACKEND
  ============================================================ */
  const perfil = await FEMFLOW.carregarCicloBackend();

  const fase     = perfil?.fase     || localStorage.getItem("femflow_fase");
  const enfase   = perfil?.enfase   || localStorage.getItem("femflow_enfase");
  const diaCiclo = Number(perfil?.diaCiclo || localStorage.getItem("femflow_diaCiclo"));

  /* ============================================================
     14. MONTAR TREINO FINAL
  ============================================================ */
  const listaMontada = await FEMFLOW.engineTreino.montarTreino({
    nivel:   localStorage.getItem("femflow_nivel"),
    enfase,
    fase,
    diaCiclo
  });

  salvarSnapshot({ fase, diaCiclo }, listaMontada);
  renderBoxes(listaMontada);

});
