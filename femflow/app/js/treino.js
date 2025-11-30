/* ================================================================
   FemFlow — treino.js FRONT-END TOTAL v3.0 (Arquitetura A - 2025)
   ---------------------------------------------------------------
   • Fase hormonal REAL → backend
   • Dia do programa → local (1–30)
   • Intercalação BOX ↔ HIIT ↔ CARDIO
   • Timers individuais (Descanso)
   • Modal obrigatório de PSE
   • Protocolo de respiração integrado:
        - Box 0 → Wake Flow
        - Box Final → Restore Flow
   • Snapshot Offline
   ================================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v3.0 iniciado!");

  const OFFLINE_KEY = "femflow_offline_treino_v1";

  /* ============================================================
     1) LOGIN OBRIGATÓRIO
  ============================================================ */
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    return location.href = "index.html?ret=treino.html";
  }

  /* ============================================================
     2) CICLO PRECISA ESTAR CONFIGURADO
  ============================================================ */
  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo primeiro.");
    return location.href = "ciclo.html";
  }

  /* ============================================================
     3) ELEMENTOS HTML
  ============================================================ */
  const track      = document.querySelector("#carouselTrack");
  const bar        = document.querySelector("#progressBar");
  const titulo     = document.querySelector("#tituloDiaTreino");
  const btnRest    = document.querySelector("#descansoBtn");
  const btnSalvar  = document.querySelector("#salvarTreinoBtn");

  if (!track || !bar) {
    FEMFLOW.log("❌ Estrutura HTML não encontrada.");
    return;
  }

  /* ============================================================
     4) DIA DO PROGRAMA
  ============================================================ */
  const diaProg = FEMFLOW.calcularDiaPrograma();
  if (titulo) titulo.textContent = `Dia ${diaProg} do Programa`;

  /* ============================================================
     5) ESTADO LOCAL
  ============================================================ */
  let boxes = [];
  let current = 0;

  /* ============================================================
     6) CARROSSEL (Swipe)
  ============================================================ */
  function moveTo(dir) {
    const total = boxes.length;

    if (dir === "reset") {
      current = 0;
    }
    else if (dir === "next" && current < total - 1) current++;
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
     7) TIMER INDIVIDUAL (por exercício)
  ============================================================ */
  function aplicarTimers(root) {
    root.querySelectorAll(".ff-exercicio").forEach(ex => {

      const intervalo = Number(ex.dataset.intervalo);
      const fill  = ex.querySelector(".ff-timer-fill");
      const label = ex.querySelector(".ff-timer-time");
      const btn   = ex.querySelector(".ff-btn-descanso");

      let restante = intervalo;
      let intv = null;

      const atualizar = () => {
        label.textContent = `Descanso: ${restante}s`;
        fill.style.width = `${(restante / intervalo) * 100}%`;
      };

      atualizar();

      const iniciar = () => {
        clearInterval(intv);
        restante = intervalo;
        atualizar();

        intv = setInterval(() => {
          restante--;
          atualizar();

          if (restante <= 0) {
            clearInterval(intv);
            label.textContent = "Pronto!";
            fill.style.width = `0%`;
          }
        }, 1000);
      };

      btn.onclick = iniciar;
    });
  }

  /* ============================================================
     8) RESPIRAÇÃO DIRETA (wake / restore)
  ============================================================ */
  function renderRespBotao(protocolo) {
    if (!protocolo) return "";

    return `
      <button class="ff-btn-breathe" data-proto="${protocolo}">
        🌬 Abrir respiração (${protocolo})
      </button>
    `;
  }

  function bindRespiracao(root) {
    root.querySelectorAll(".ff-btn-breathe").forEach(btn => {
      btn.onclick = () => {
        const p = btn.dataset.proto;
        FEMFLOW.abrirRespiracao(p); // função já no core
      };
    });
  }

  /* ============================================================
     9) RENDERIZAÇÃO DOS BOXES
  ============================================================ */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista || [];

    boxes.forEach(box => {
      const div = document.createElement("div");
      div.className = "carousel-item";

      /* ---------------------------- BOX 0 ---------------------------- */
      if (box.tipo === "box0") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${box.passos.map(p => `<li>${p}</li>`).join("")}
          </ul>

          ${renderRespBotao(box.protocolo)}
        `;
      }

      /* ---------------------------- BOX FINAL ---------------------------- */
      else if (box.tipo === "final") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${box.passos.map(p => `<li>${p}</li>`).join("")}
          </ul>

          <div class="ff-pse-box">
            <p class="ff-pse-label">Como foi sua percepção de esforço?</p>
          </div>

          ${renderRespBotao(box.protocolo)}
        `;
      }

      /* ---------------------------- BOX DE TREINO ---------------------------- */
      else if (box.tipo === "treino") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">Box ${box.box}</h3>

          ${box.exercicios.map(ex => `
            <div class="ff-exercicio" data-intervalo="${ex.intervalo}">
              
              <h4 class="ff-ex-nome">${ex.titulo || ex.nome || "Sem título"}</h4>

              <div class="ff-ex-info">
                Séries: <b>${ex.series}</b>
                &nbsp;•&nbsp;
                Reps: <b>${ex.reps}</b>
              </div>

              <button class="ff-btn-descanso">Descanso</button>

              <div class="ff-timer">
                <div class="ff-timer-bar">
                  <div class="ff-timer-fill"></div>
                </div>
                <div class="ff-timer-time">Descanso: ${ex.intervalo}s</div>
              </div>

            </div>
          `).join("")}
        `;
      }

      /* ---------------------------- HIIT / CARDIO ---------------------------- */
      else if (box.tipo === "hiit" || box.tipo === "cardio") {

        const extraTexto = box.tipo === "hiit" 
          ? `<p class="ff-hiit-proto"><b>Protocolo:</b> ${box.protocoloTexto}</p>`
          : "";

        div.innerHTML = `
          <div class="ff-box-especial ${box.tipo}">
            <h3>${box.titulo}</h3>
            <p>${box.descricao}</p>

            ${extraTexto}

            <div class="ff-timer-bar" data-total="${box.tempo_total}">
              <div class="ff-timer-fill"></div>
              <span class="ff-timer-count">00:${box.tempo_total}</span>
            </div>
          </div>
        `;
      }

      track.appendChild(div);
    });

    aplicarTimers(track);
    bindRespiracao(track);
    moveTo("reset");
  }

  /* ============================================================
     10) SALVAR TREINO (modal PSE obrigatório)
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
            id: localStorage.getItem("femflow_id"),
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
     11) BOTÃO DESCANSO (do FlowCenter)
  ============================================================ */
  if (btnRest) {
    btnRest.onclick = async () => {
      const hist = JSON.parse(localStorage.getItem("femflow_hist") || "[]");
      hist.push({ data: Date.now(), pse: 0, descanso: true });
      localStorage.setItem("femflow_hist", JSON.stringify(hist));

      FEMFLOW.toast("Descanso registrado 🌿");
      await FEMFLOW.salvarDescanso();
      setTimeout(() => FEMFLOW.router("flowcenter"), 700);
    };
  }

  /* ============================================================
     12) SNAPSHOT OFFLINE
  ============================================================ */
  function salvarSnapshot(meta, lista) {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify({
      meta, lista, salvoEm: Date.now()
    }));
  }

  function carregarSnapshot() {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  if (!navigator.onLine) {
    const snap = carregarSnapshot();
    if (snap?.lista) {
      renderBoxes(snap.lista);
      FEMFLOW.toast("Modo offline ⚡");
      return;
    }
  }

  /* ============================================================
     13) SINCRONIZAR COM BACKEND
  ============================================================ */
  const perfil = await FEMFLOW.carregarCicloBackend();

  const fase     = perfil?.fase     || localStorage.getItem("femflow_fase");
  const enfase   = perfil?.enfase   || localStorage.getItem("femflow_enfase");
  const diaCiclo = Number(perfil?.diaCiclo || localStorage.getItem("femflow_diaCiclo"));

  FEMFLOW.log("🧬 TREINO (fase real):", fase, "diaCiclo:", diaCiclo);

  /* ============================================================
     14) MONTAR TREINO FINAL
  ============================================================ */
  const listaMontada = await FEMFLOW.engineTreino.montarTreino({
    nivel:   localStorage.getItem("femflow_nivel"),
    enfase:  enfase,
    fase:    fase,
    diaCiclo: diaCiclo
  });

  salvarSnapshot({ fase, diaCiclo }, listaMontada);

  renderBoxes(listaMontada);

});
