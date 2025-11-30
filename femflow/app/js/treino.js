/* ================================================================
   FemFlow — treino.js FRONT-END PREMIUM v3.3
   ---------------------------------------------------------------
   • Modal Respiração estilo iOS (sheet)
   • HIIT com Start/Pause dentro do círculo
   • Link YouTube nos exercícios
   • Botões corrigidos
   • Render Premium completo
================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v3.3 iniciado!");

  const diaProg = FEMFLOW.calcularDiaPrograma();
  document.getElementById("tituloDiaTreino").textContent = `Dia ${diaProg}`;

  const OFFLINE_KEY = "femflow_offline_treino_v1";


  /* ============================================================
       LOGIN / CICLO
  ============================================================ */
  const id = localStorage.getItem("femflow_id");
  if (!id) return location.href = "index.html?ret=treino.html";

  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloOK) return location.href = "ciclo.html";


  /* ============================================================
       ELEMENTOS HTML
  ============================================================ */
  const track     = document.querySelector("#carouselTrack");
  const bar       = document.querySelector("#progressBar");
  const btnRest   = document.getElementById("descansoBtn");
  const btnSalvar = document.getElementById("salvarTreinoBtn");

  if (!track || !bar) return;

  let boxes = [];
  let current = 0;


  /* ============================================================
       CARROSSEL — SWIPE
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
       TIMER PREMIUM
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
            fill.style.width = "0%";
            label.textContent = "✔";
          }
        }, 1000);
      };

    });
  }


  /* ============================================================
       MODAL RESPIRAÇÃO (sheet iOS)
  ============================================================ */

  const breathBackdrop = document.getElementById("breathBackdrop");
  const breathSheet    = document.getElementById("breathSheet");

  const breathCircle   = document.getElementById("breathCircle");
  const breathPhase    = document.getElementById("breathPhase");
  const breathStartBtn = document.getElementById("breathStart");
  const breathCloseBtn = document.getElementById("breathClose");

  let breathIntv = null;
  let breathRestante = 0;
  let breathState = "stopped"; // stopped / running / paused

  function abrirRespiracao(tempo, faseNome) {
    breathRestante = tempo;
    breathPhase.textContent = faseNome;
    breathCircle.textContent = tempo;

    breathBackdrop.classList.remove("hidden");
    breathSheet.classList.add("visible");

    breathState = "stopped";
  }

  function fecharRespiracao() {
    breathBackdrop.classList.add("hidden");
    breathSheet.classList.remove("visible");

    clearInterval(breathIntv);
    breathState = "stopped";
  }

  breathStartBtn.onclick = () => {
    if (breathState === "running") {
      // pausa
      breathState = "paused";
      breathStartBtn.textContent = "Retomar";
      clearInterval(breathIntv);
      return;
    }

    breathState = "running";
    breathStartBtn.textContent = "Pausar";

    breathIntv = setInterval(() => {
      breathRestante--;
      breathCircle.textContent = breathRestante;

      if (breathRestante <= 0) {
        clearInterval(breathIntv);
        breathState = "stopped";
        breathStartBtn.textContent = "Iniciar";
      }
    }, 1000);
  };

  breathCloseBtn.onclick = () => fecharRespiracao();


  /* ============================================================
       HIIT PREMIUM — START/PAUSE + CARDS
  ============================================================ */

  let hiitIntv = null;
  let hiitRestante = 0;
  let hiitEstado = "stopped"; // stopped / running / paused
  let hiitCicloAtual = 1;

  function iniciarHIIT(bubble, circle, faseLabel, config) {

    if (hiitEstado === "running") {
      hiitEstado = "paused";
      circle.classList.add("paused");
      bubble.dataset.btn = "Retomar";
      clearInterval(hiitIntv);
      return;
    }

    hiitEstado = "running";
    circle.classList.remove("paused");
    bubble.dataset.btn = "Pausar";

    let fase = "estimulo";
    hiitRestante = config.estimulo;

    faseLabel.textContent = "Forte";

    hiitIntv = setInterval(() => {

      hiitRestante--;
      circle.textContent = hiitRestante;

      if (hiitRestante <= 0) {

        if (fase === "estimulo") {
          fase = "descanso";
          hiitRestante = config.descanso;
          faseLabel.textContent = "Leve";
        }
        else {
          hiitCicloAtual++;

          if (hiitCicloAtual > config.ciclos) {
            clearInterval(hiitIntv);
            hiitEstado = "stopped";
            circle.textContent = "✔";
            faseLabel.textContent = "Concluído";
            return;
          }

          fase = "estimulo";
          hiitRestante = config.estimulo;
          faseLabel.textContent = "Forte";
        }
      }

    }, 1000);
  }


  /* ============================================================
       SALVAR PESO INDIVIDUAL
  ============================================================ */
  function bindPeso() {
    document.querySelectorAll(".ff-ex-peso").forEach(inp => {
      inp.addEventListener("change", async () => {

        await FEMFLOW.salvarEvolucao({
          id: localStorage.getItem("femflow_id"),
          exercicio: inp.dataset.ex,
          peso: inp.value,
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
       BOTÃO RESPIRAÇÃO NOS BOXES (abre modal)
  ============================================================ */
  function bindRespiracaoButtons(root) {
    root.querySelectorAll(".ff-btn-protocolo").forEach(btn => {
      btn.onclick = () => {
        abrirRespiracao(5, "Respire...");
      };
    });
  }


  /* ============================================================
       RENDER BOXES
  ============================================================ */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista || [];

    const fmt = s => `00:${String(s).padStart(2, "0")}`;


    boxes.forEach(box => {

      const div = document.createElement("div");
      div.className = "carousel-item";

      /* --------------------------------------------------------
         AQUECIMENTO PREMIUM
      -------------------------------------------------------- */
      if (box.tipo === "aquecimentoPremium") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${box.passos.map(p => `
              <li data-desc="${p.desc}">${p.nome}</li>
            `).join("")}
          </ul>

          <button class="ff-btn-protocolo">🌬️ Respiração Wake</button>
        `;
      }


      /* --------------------------------------------------------
         RESFRIAMENTO PREMIUM
      -------------------------------------------------------- */
      else if (box.tipo === "resfriamentoPremium") {

        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${box.passos.map(p => `
              <li data-desc="${p.desc}">${p.nome}</li>
            `).join("")}
          </ul>

          <button class="ff-btn-protocolo">🌬️ Respiração Release</button>

          <p class="ff-final-msg">
            Ao finalizar, clique em <b>Salvar treino</b> abaixo.
          </p>
        `;
      }


      /* --------------------------------------------------------
         HIIT PREMIUM
      -------------------------------------------------------- */
      else if (box.tipo === "hiitPremium") {

        const idHIIT = `hiit-${Math.random().toString(36).substr(2,8)}`;

        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <div id="${idHIIT}" class="hiit-bubble">
            <div class="hiit-circle">Start</div>
            <div class="hiit-phase">Pronto</div>
          </div>

          <h4 style="margin-top:20px;font-family:'Playfair Display',serif;">Opções Academia</h4>
          <div class="hiit-sugestoes-wrapper">
            ${box.cardsAcademia.map(c => `
              <div class="hiit-card">
                <span class="hiit-card-icon">${c.icon}</span>
                ${c.nome}
              </div>
            `).join("")}
          </div>

          <h4 style="margin-top:20px;font-family:'Playfair Display',serif;">Opções Casa</h4>
          <div class="hiit-sugestoes-wrapper">
            ${box.cardsCasa.map(c => `
              <div class="hiit-card">
                <span class="hiit-card-icon">${c.icon}</span>
                ${c.nome}
              </div>
            `).join("")}
          </div>
        `;

        setTimeout(() => {
          const bubble = document.getElementById(idHIIT);
          const circle = bubble.querySelector(".hiit-circle");
          const phase  = bubble.querySelector(".hiit-phase");

          circle.onclick = () => {
            iniciarHIIT(bubble, circle, phase, box);
          };
        }, 100);
      }


      /* --------------------------------------------------------
         CARDIO
      -------------------------------------------------------- */
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


      /* --------------------------------------------------------
         TREINO NORMAL
      -------------------------------------------------------- */
      else if (box.tipo === "treino") {

        const blocosHTML = box.exercicios.map(ex => `

          <div class="ff-ex-item">

            <div class="ff-ex-top">
              <h4 class="ff-ex-nome">
                <a href="${ex.youtube || ex.link || '#'}" target="_blank">
                  ${ex.titulo || ex.nome}
                </a>
              </h4>

              <input 
                type="number"
                class="ff-ex-peso"
                placeholder="kg"
                data-ex="${ex.titulo || ex.nome}"
              />
            </div>

            <div class="ff-ex-info">
              Séries: <b>${ex.series}</b>
              Reps: <b>${ex.reps}</b>
              Desc: <b>${ex.intervalo}s</b>
            </div>

            <div class="ff-timer-bar" data-total="${ex.intervalo}">
              <div class="ff-timer-fill"></div>
              <span class="ff-timer-count">${fmt(ex.intervalo)}</span>
            </div>

          </div>

        `).join("");

        div.innerHTML = `
          <h3 class="ff-ex-titulo">Box ${box.box}</h3>
          ${blocosHTML}
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
       BOTÃO SALVAR TREINO → MODAL PSE
  ============================================================ */
  const pseOverlay = document.getElementById("modalPSE");
  const pseInput   = document.getElementById("pseInput");
  const pseOk      = document.getElementById("btnConfirmarPSE");
  const pseCancel  = document.getElementById("btnCancelarPSE");

  if (btnSalvar) {
    btnSalvar.onclick = () => {
      pseOverlay.classList.add("show");
    };
  }

  pseOk.onclick = async () => {

    const pse = Number(pseInput.value);
    const fase = localStorage.getItem("femflow_fase");
    const diaFirebase = localStorage.getItem("femflow_diaCiclo");

    await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarTreino",
        id,
        pse,
        fase,
        diaFirebase,
        treino: "Força",
        obs: ""
      })
    });

    FEMFLOW.toast("Treino salvo! ✔");
    FEMFLOW.router("flowcenter");
  };

  pseCancel.onclick = () => {
    pseOverlay.classList.remove("show");
  };


  /* ============================================================
       DESCANSO
  ============================================================ */
  btnRest.onclick = async () => {
    await FEMFLOW.salvarDescanso();
    FEMFLOW.toast("Descanso registrado 🌿");
    setTimeout(() => FEMFLOW.router("flowcenter"), 800);
  };


  /* ============================================================
       MODO OFFLINE
  ============================================================ */
  const salvarSnapshot = (meta, lista) => {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify({ meta, lista, salvoEm: Date.now() }));
  };

  const snap = !navigator.onLine && JSON.parse(localStorage.getItem(OFFLINE_KEY) || "null");
  if (snap?.lista) {
    renderBoxes(snap.lista);
    FEMFLOW.toast("Modo offline ⚡");
    return;
  }


  /* ============================================================
       SINCRONIZAR COM BACKEND
  ============================================================ */
  const perfil = await FEMFLOW.carregarCicloBackend();

  const fase     = perfil?.fase     || localStorage.getItem("femflow_fase");
  const enfase   = perfil?.enfase   || localStorage.getItem("femflow_enfase");
  const diaCiclo = Number(perfil?.diaCiclo || localStorage.getItem("femflow_diaCiclo"));


  /* ============================================================
       MONTAR TREINO FINAL
  ============================================================ */
  const listaMontada = await FEMFLOW.engineTreino.montarTreino({
    nivel: localStorage.getItem("femflow_nivel"),
    enfase,
    fase,
    diaCiclo
  });

  salvarSnapshot({ fase, diaCiclo }, listaMontada);
  renderBoxes(listaMontada);

});
