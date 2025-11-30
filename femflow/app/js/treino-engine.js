/* ============================================================
   FEMFLOW — treino.js v3.5 (FINAL 2025)
   ------------------------------------------------------------
   - Render completo dos cards
   - Timers: séries | descanso
   - HIIT com start/pause + protocolos alternados
   - Respiração com modal iOS funcional
   - Footer inteligente (oculta quando modal abre)
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v3.5 iniciado!");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.", true);
    return location.href = "index.html";
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

    document.querySelector("#tituloDiaTreino").textContent =
      `Dia ${localStorage.getItem("femflow_diaPrograma")}`;

    /* ENGINE */
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
    const track = document.querySelector("#carouselTrack");
    track.innerHTML = "";

    lista.forEach((box, index) => {
      let html = `<div class="carousel-item">`;

      switch (box.tipo) {

        /* --------------------------------------------------------
           AQUECIMENTO
        -------------------------------------------------------- */
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
               💨 Respiração
            </button>
          `;
        break;

        /* --------------------------------------------------------
           EXERCÍCIOS DO FIREBASE
        -------------------------------------------------------- */
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

        /* --------------------------------------------------------
           HIIT PREMIUM
        -------------------------------------------------------- */
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

            <button class="ff-btn-protocolo hiit-start-btn">▶️ Iniciar HIIT</button>

            <button class="ff-btn-protocolo hiit-opcoes-btn">
              ⚙️ Selecionar equipamento
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

        /* --------------------------------------------------------
           CARDIO LEVE
        -------------------------------------------------------- */
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

        /* --------------------------------------------------------
           RESFRIAMENTO PREMIUM
        -------------------------------------------------------- */
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
  }


  /* ============================================================
     3. TIMER — descanso / cardio
  ============================================================ */
  function initTimers() {
    document.querySelectorAll(".btnStartTimer").forEach(btn => {
      btn.onclick = () => {
        const bar = btn.previousElementSibling;
        startTimer(bar, btn);
      };
    });
  }

  function startTimer(bar, btn) {
    const fill  = bar.querySelector(".ff-timer-fill");
    const label = bar.querySelector(".ff-timer-count");
    let total   = Number(bar.dataset.timer);
    let now = total;

    btn.disabled = true;

    const intv = setInterval(() => {
      now--;
      label.textContent = now;

      fill.style.width = `${(now / total) * 100}%`;

      if (now <= 0) {
        clearInterval(intv);
        btn.disabled = false;
        btn.textContent = "✔️ Finalizado";
      }
    }, 1000);
  }

  /* ============================================================
     4. HIIT — Start/Pause + alternância
  ============================================================ */
  function initHIIT() {
    document.querySelectorAll(".hiit-start-btn").forEach(btn => {
      btn.onclick = () => {
        const parent = btn.closest(".carousel-item");
        const circle = parent.querySelector(".hiit-circle");
        const phase  = parent.querySelector(".hiit-phase");

        startHIIT(circle, phase, btn);
      };
    });

    document.querySelectorAll(".hiit-opcoes-btn").forEach(btn => {
      btn.onclick = () => {
        const parent = btn.closest(".carousel-item");
        parent.querySelector(".hiit-opcoes").classList.toggle("hidden");
      };
    });
  }

  function startHIIT(circle, phase, btn) {
    let forte = Number(circle.dataset.forte);
    let leve  = Number(circle.dataset.leve);

    let tempo = forte;
    let modo = "forte";

    btn.textContent = "⏸️ Pausar HIIT";

    let pausado = false;

    circle.onclick = () => { pausado = !pausado; togglePause(); };

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

    function togglePause() {
      if (pausado) {
        circle.classList.add("paused");
      } else {
        circle.classList.remove("paused");
      }
    }
  }

  /* ============================================================
     5. MODAL DE RESPIRAÇÃO — iOS style
  ============================================================ */
  function initBreathing() {
    document.querySelectorAll("[data-proto]").forEach(btn => {
      btn.onclick = () => abrirBreathing(btn.dataset.proto);
    });

    const backdrop = document.querySelector("#breathBackdrop");
    const sheet    = document.querySelector("#breathModal");
    const startBtn = document.querySelector("#btnStart");
    const closeBtn = document.querySelector("#btnRespClose");
    const circle   = document.querySelector("#breathCircle");
    const faseLab  = document.querySelector("#faseLabel");

    let intv = null;
    let state = "stopped";
    let tempo = 0;

    function abrirBreathing(proto) {
      document.querySelector(".fix-footer").style.display = "none";

      backdrop.classList.remove("hidden");
      sheet.classList.remove("hidden");
      setTimeout(() => sheet.classList.add("visible"), 10);

      if (proto === "wake") {
        tempo = 4;
        circle.textContent = "4";
        faseLab.textContent = "Inspirar";
      } else {
        tempo = 6;
        circle.textContent = "6";
        faseLab.textContent = "Soltar o ar";
      }

      state = "stopped";
      startBtn.textContent = "Iniciar";
    }

    startBtn.onclick = () => {
      if (state === "running") {
        /* PAUSAR */
        state = "paused";
        startBtn.textContent = "Retomar";
        clearInterval(intv);
        return;
      }

      if (state === "paused") {
        /* RETOMAR */
        state = "running";
        startBtn.textContent = "Pausar";
        iniciarCiclo();
        return;
      }

      /* INICIAR */
      state = "running";
      startBtn.textContent = "Pausar";
      iniciarCiclo();
    };

    function iniciarCiclo() {
      clearInterval(intv);

      intv = setInterval(() => {
        if (state !== "running") return;

        tempo--;
        circle.textContent = tempo;

        if (tempo <= 0) {
          if (faseLab.textContent === "Inspirar") {
            tempo = 2;
            faseLab.textContent = "Segurar";
          } else if (faseLab.textContent === "Segurar") {
            tempo = 4;
            faseLab.textContent = "Soltar";
          } else {
            tempo = 4;
            faseLab.textContent = "Inspirar";
          }
          circle.textContent = tempo;
        }

      }, 1000);
    }

    closeBtn.onclick = () => {
      clearInterval(intv);
      backdrop.classList.add("hidden");
      sheet.classList.remove("visible");

      setTimeout(() => {
        sheet.classList.add("hidden");
        document.querySelector(".fix-footer").style.display = "flex";
      }, 300);
    };
  }

  /* ============================================================
     6. BOTÕES FINAIS: SALVAR / DESCANSO / CANCELAR
  ============================================================ */
  salvarTreinoBtn.onclick = () => {
    document.querySelector("#modalPSE").classList.remove("hidden");
  };

  btnCancelarPSE.onclick = () => {
    document.querySelector("#modalPSE").classList.add("hidden");
  };

  btnConfirmarPSE.onclick = async () => {
    const pse = document.querySelector("#pseInput").value;

    const id = localStorage.getItem("femflow_id");
    const fase = localStorage.getItem("femflow_fase");
    const dia = localStorage.getItem("femflow_diaPrograma");

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
      FEMFLOW.toast("Erro ao salvar", true);
    }

    document.querySelector("#modalPSE").classList.add("hidden");
  };

  descansoBtn.onclick = () => {
    FEMFLOW.toast("Dia registrado como descanso.");
  };

});
