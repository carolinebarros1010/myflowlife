/* ============================================================
   FEMFLOW — treino.js v3.5.1 (FIX NULL ELEMENTS)
   ------------------------------------------------------------
   - Render completo dos cards
   - Timers: séries | descanso
   - HIIT com start/pause + protocolos alternados
   - Respiração com modal iOS funcional
   - Footer inteligente (oculta quando modal abre)
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  FEMFLOW.log("🚀 treino.js v3.5.1 iniciado!");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.", true);
    location.href = "index.html";
    return;
  }

  /* ---------- ELEMENTOS FIXOS DA PÁGINA ---------- */
  const track           = document.querySelector("#carouselTrack");
  const tituloDia       = document.querySelector("#tituloDiaTreino");
  const footer          = document.querySelector(".fix-footer");

  const btnSalvar       = document.getElementById("salvarTreinoBtn");
  const btnDescanso     = document.getElementById("descansoBtn");
  const btnCancelar     = document.getElementById("cancelarTreinoBtn");

  const modalPSE        = document.getElementById("modalPSE");
  const pseInput        = document.getElementById("pseInput");
  const btnConfirmarPSE = document.getElementById("btnConfirmarPSE");
  const btnCancelarPSE  = document.getElementById("btnCancelarPSE");

  const breathBackdrop  = document.getElementById("breathBackdrop");
  const breathSheet     = document.getElementById("breathModal");
  const breathStartBtn  = document.getElementById("btnStart");
  const breathCloseBtn  = document.getElementById("btnRespClose");
  const breathCircle    = document.getElementById("breathCircle");
  const breathPhaseLbl  = document.getElementById("faseLabel");

  if (!track) {
    FEMFLOW.error("❌ #carouselTrack não encontrado em treino.html");
    return;
  }

  /* ============================================================
     1. QUANDO BACKEND TERMINAR → montar treino
  ============================================================ */
  window.addEventListener("femflow:ready", async (ev) => {
    const perfil = ev.detail;

    if (!perfil) {
      FEMFLOW.toast("Erro ao carregar perfil", true);
      return;
    }

    const fase     = perfil.fase;
    const enfase   = perfil.enfase;
    const nivel    = perfil.nivel;
    const diaCiclo = perfil.diaCiclo;

    const diaPrograma = FEMFLOW.calcularDiaPrograma();
    if (tituloDia) tituloDia.textContent = `Dia ${diaPrograma}`;

    if (!FEMFLOW.engineTreino || !FEMFLOW.engineTreino.montarTreino) {
      FEMFLOW.error("FEMFLOW.engineTreino.montarTreino não está definido.");
      FEMFLOW.toast("Erro interno do treino (engine).", true);
      return;
    }

    const lista = await FEMFLOW.engineTreino.montarTreino({
      nivel,
      enfase,
      fase,
      diaCiclo
    });

    renderTreino(lista);
  });

  /* ============================================================
     2. RENDERIZAÇÃO COMPLETA
  ============================================================ */

  function renderTreino(lista) {
    track.innerHTML = "";

    lista.forEach((box) => {
      let html = `<div class="carousel-item">`;

      switch (box.tipo) {
        /* AQUECIMENTO */
        case "aquecimentoPremium":
          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">${box.descricao}</p>
            <ul class="ff-passos">
              ${box.passos.map(p => `
                <li data-desc="${p.desc}">${p.nome}</li>
              `).join("")}
            </ul>
            <button class="ff-btn-protocolo"
                    data-proto="${box.protocolo}"
                    data-origem="aquecimento">
              💨 Respiração Wake
            </button>
          `;
        break;

        /* TREINO (BOXES DO FIREBASE) */
        case "treino":
          html += `<h2 class="ff-ex-titulo">Box ${box.box}</h2>`;
          box.exercicios.forEach(ex => {
            html += `
              <div class="ff-ex-item">
                <div class="ff-ex-top">
                  <div class="ff-ex-nome">
                    <a href="${ex.youtube}" target="_blank" rel="noopener">
                      ${ex.titulo}
                    </a>
                  </div>
                  <input class="ff-ex-peso"
                         type="number"
                         placeholder="kg"
                         data-ex="${ex.titulo}">
                </div>
                <div class="ff-ex-info">
                  <span>🌀 ${ex.series} séries</span>
                  <span>🔁 ${ex.reps} reps</span>
                  <span>⏱️ ${ex.intervalo}s</span>
                </div>
                <div class="ff-timer-bar" data-timer="${ex.intervalo}">
                  <div class="ff-timer-fill"></div>
                  <div class="ff-timer-count">${ex.intervalo}</div>
                </div>
                <button class="ff-btn-protocolo btnStartTimer">
                  ▶️ Iniciar descanso
                </button>
              </div>
            `;
          });
        break;

        /* HIIT */
        case "hiitPremium":
          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">${box.descricao}</p>
            <div class="hiit-bubble">
              <div class="hiit-circle"
                   data-forte="${box.forte}"
                   data-leve="${box.leve}">
                ${box.forte}
              </div>
              <div class="hiit-phase">Preparar</div>
            </div>
            <button class="ff-btn-protocolo hiit-start-btn">
              ▶️ Iniciar HIIT
            </button>
            <button class="ff-btn-protocolo hiit-opcoes-btn">
              ⚙️ Opções de exercício
            </button>
            <div class="hiit-opcoes hidden">
              <div class="hiit-card"><span class="hiit-card-icon">🏃‍♀️</span> Esteira</div>
              <div class="hiit-card"><span class="hiit-card-icon">🚴‍♀️</span> Bike</div>
              <div class="hiit-card"><span class="hiit-card-icon">🏋️‍♀️</span> Air Bike</div>
              <div class="hiit-card"><span class="hiit-card-icon">🪜</span> Escada</div>
              <div class="hiit-card"><span class="hiit-card-icon">⚡</span> Corrida no lugar</div>
              <div class="hiit-card"><span class="hiit-card-icon">⭐</span> Burpee</div>
            </div>
          `;
        break;

        /* CARDIO */
        case "cardio":
          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">${box.descricao}</p>
            <div class="ff-timer-bar" data-timer="${box.tempo_total}">
              <div class="ff-timer-fill"></div>
              <div class="ff-timer-count">${box.tempo_total}</div>
            </div>
            <button class="ff-btn-protocolo btnStartTimer">
              ▶️ Iniciar cardio
            </button>
          `;
        break;

        /* RESFRIAMENTO */
        case "resfriamentoPremium":
          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">${box.descricao}</p>
            <ul class="ff-passos">
              ${box.passos.map(p => `
                <li data-desc="${p.desc}">${p.nome}</li>
              `).join("")}
            </ul>
            <button class="ff-btn-protocolo"
                    data-proto="${box.protocolo}"
                    data-origem="resfriamento">
              🌬️ Respiração Release
            </button>
          `;
        break;
      }

      html += `</div>`;
      track.insertAdjacentHTML("beforeend", html);
    });

    initTimers();
    initHIIT();
    initBreathing();
    initPeso();
  }

  /* ============================================================
     3. TIMER — descanso / cardio
  ============================================================ */
  function initTimers() {
    document.querySelectorAll(".btnStartTimer").forEach(btn => {
      btn.onclick = () => {
        const bar = btn.previousElementSibling;
        if (bar) startTimer(bar, btn);
      };
    });
  }

  function startTimer(bar, btn) {
    const fill  = bar.querySelector(".ff-timer-fill");
    const label = bar.querySelector(".ff-timer-count");
    const total = Number(bar.dataset.timer) || 60;
    let restante = total;

    btn.disabled = true;

    const intv = setInterval(() => {
      restante--;
      if (label) label.textContent = restante;
      if (fill)  fill.style.width = `${(restante / total) * 100}%`;

      if (restante <= 0) {
        clearInterval(intv);
        btn.disabled = false;
        btn.textContent = "✔️ Finalizado";
      }
    }, 1000);
  }

  /* ============================================================
     4. HIIT — Start/Pause + opções
  ============================================================ */
  function initHIIT() {
    document.querySelectorAll(".hiit-start-btn").forEach(btn => {
      btn.onclick = () => {
        const card = btn.closest(".carousel-item");
        if (!card) return;
        const circle = card.querySelector(".hiit-circle");
        const phase  = card.querySelector(".hiit-phase");
        if (!circle || !phase) return;
        startHIIT(circle, phase, btn);
      };
    });

    document.querySelectorAll(".hiit-opcoes-btn").forEach(btn => {
      btn.onclick = () => {
        const card = btn.closest(".carousel-item");
        const box  = card?.querySelector(".hiit-opcoes");
        if (box) box.classList.toggle("hidden");
      };
    });
  }

  function startHIIT(circle, phase, btn) {
    const forte = Number(circle.dataset.forte) || 40;
    const leve  = Number(circle.dataset.leve)  || 20;
    let tempo   = forte;
    let modo    = "forte";
    let pausado = false;

    circle.textContent = tempo;
    phase.textContent  = "Força";

    btn.textContent = "⏸️ Pausar HIIT";

    circle.onclick = () => {
      pausado = !pausado;
      circle.classList.toggle("paused", pausado);
      btn.textContent = pausado ? "▶️ Retomar HIIT" : "⏸️ Pausar HIIT";
    };

    const intv = setInterval(() => {
      if (pausado) return;

      tempo--;
      circle.textContent = tempo;

      if (tempo <= 0) {
        if (modo === "forte") {
          modo = "leve";
          tempo = leve;
          phase.textContent = "Recuperar";
        } else {
          modo = "forte";
          tempo = forte;
          phase.textContent = "Força";
        }
      }
    }, 1000);
  }

  /* ============================================================
     5. RESPIRAÇÃO — Modal iOS
  ============================================================ */
  function initBreathing() {
    document.querySelectorAll("[data-proto]").forEach(btn => {
      btn.onclick = () => abrirBreathing(btn.dataset.proto || "wake");
    });

    if (!breathBackdrop || !breathSheet || !breathStartBtn || !breathCloseBtn || !breathCircle || !breathPhaseLbl) {
      FEMFLOW.warn("Modal de respiração não encontrado em treino.html");
      return;
    }

    let intv = null;
    let state = "stopped";
    let tempo = 0;

    function abrirBreathing(proto) {
      if (footer) footer.style.display = "none";

      breathBackdrop.classList.remove("hidden");
      breathSheet.classList.remove("hidden");
      setTimeout(() => breathSheet.classList.add("visible"), 10);

      if (proto === "wake") {
        tempo = 4;
        breathPhaseLbl.textContent = "Inspirar";
      } else {
        tempo = 6;
        breathPhaseLbl.textContent = "Soltar o ar";
      }
      breathCircle.textContent = tempo;
      state = "stopped";
      breathStartBtn.textContent = "Iniciar";
    }

    breathStartBtn.onclick = () => {
      if (state === "running") {
        state = "paused";
        breathStartBtn.textContent = "Retomar";
        clearInterval(intv);
        return;
      }

      if (state === "paused") {
        state = "running";
        breathStartBtn.textContent = "Pausar";
        iniciarCiclo();
        return;
      }

      state = "running";
      breathStartBtn.textContent = "Pausar";
      iniciarCiclo();
    };

    function iniciarCiclo() {
      clearInterval(intv);

      intv = setInterval(() => {
        if (state !== "running") return;

        tempo--;
        breathCircle.textContent = tempo;

        if (tempo <= 0) {
          if (breathPhaseLbl.textContent === "Inspirar") {
            tempo = 2;
            breathPhaseLbl.textContent = "Segurar";
          } else if (breathPhaseLbl.textContent === "Segurar") {
            tempo = 4;
            breathPhaseLbl.textContent = "Soltar";
          } else {
            tempo = 4;
            breathPhaseLbl.textContent = "Inspirar";
          }
          breathCircle.textContent = tempo;
        }
      }, 1000);
    }

    breathCloseBtn.onclick = () => {
      clearInterval(intv);
      breathSheet.classList.remove("visible");
      breathBackdrop.classList.add("hidden");
      setTimeout(() => {
        breathSheet.classList.add("hidden");
        if (footer) footer.style.display = "flex";
      }, 250);
    };
  }

  /* ============================================================
     6. SALVAR PESO POR EXERCÍCIO (stub simples)
  ============================================================ */
  function initPeso() {
    document.querySelectorAll(".ff-ex-peso").forEach(inp => {
      inp.addEventListener("change", () => {
        FEMFLOW.log("Peso alterado:", inp.dataset.ex, inp.value);
        // aqui no futuro chama backend / firestore
      });
    });
  }

  /* ============================================================
     7. FOOTER: SALVAR / DESCANSO / CANCELAR
  ============================================================ */
  if (btnSalvar && modalPSE) {
    btnSalvar.onclick = () => {
      modalPSE.classList.remove("hidden");
    };
  }

  if (btnCancelar && FEMFLOW.router) {
    btnCancelar.onclick = () => FEMFLOW.router("flowcenter.html");
  }

  if (btnCancelarPSE && modalPSE) {
    btnCancelarPSE.onclick = () => modalPSE.classList.add("hidden");
  }

  if (btnConfirmarPSE && modalPSE && pseInput) {
    btnConfirmarPSE.onclick = async () => {
      const pse = Number(pseInput.value || 0);
      const fase = localStorage.getItem("femflow_fase");
      const dia  = localStorage.getItem("femflow_diaPrograma");

      try {
        await firebase.firestore()
          .collection("historico")
          .add({
            id,
            fase,
            dia,
            pse,
            data: new Date().toISOString()
          });

        FEMFLOW.toast("Treino salvo!");
      } catch (e) {
        FEMFLOW.error("Erro salvar treino:", e);
        FEMFLOW.toast("Erro ao salvar treino", true);
      }

      modalPSE.classList.add("hidden");
    };
  }

  if (btnDescanso) {
    btnDescanso.onclick = () => {
      FEMFLOW.toast("Dia registrado como descanso.");
      // aqui no futuro envia pro backend se quiser
    };
  }

});
