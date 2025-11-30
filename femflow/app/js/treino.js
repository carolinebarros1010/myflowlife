/* ================================================================
   FemFlow — treino.js FRONT-END PREMIUM v3.2
   ---------------------------------------------------------------
   - HIIT Bubble completo
   - Respiração inline estilo iOS Sheet
   - Salvamento de peso + evolução
   - Timer premium
   - Sugestões HIIT
   - PSE final
================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v3.2 iniciado!");

  const diaProg = FEMFLOW.calcularDiaPrograma();
  document.getElementById("tituloDiaTreino").textContent = `Dia ${diaProg}`;

  const track       = document.querySelector("#carouselTrack");
  const bar         = document.querySelector("#progressBar");
  const btnRest     = document.getElementById("descansoBtn");
  const btnSalvar   = document.getElementById("salvarTreinoBtn");

  const modalPSE    = document.getElementById("modalPSE");
  const btnPSEok    = document.getElementById("btnConfirmarPSE");
  const btnPSEclose = document.getElementById("btnCancelarPSE");

  const breathModal = document.getElementById("breathModal");
  const breathCircle = document.getElementById("breathCircle");
  const faseLabel = document.getElementById("faseLabel");
  const breathStart = document.getElementById("btnStart");
  const breathClose = document.getElementById("btnRespClose");

  const id = localStorage.getItem("femflow_id");
  if (!id) return location.href = "index.html?ret=treino.html";

  if (localStorage.getItem("femflow_cycle_configured") !== "yes") {
    return location.href = "ciclo.html";
  }

  let boxes = [];
  let current = 0;

  /* ============================================================
       CARROSSEL
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
       TIMER PREMIUM (descanso muscular)
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
       MODAL RESPIRAÇÃO – sheet iOS
  ============================================================ */

  let breathTimer = null;
  let breathState = "idle"; // preparacao, inspirar, segurar, soltar
  let currentTime = 0;

  // parâmetros por protocolo
  const protocolos = {
    wake: { inspirar: 4, segurar: 1, soltar: 4, ciclos: 6 },
    release: { inspirar: 4, segurar: 2, soltar: 6, ciclos: 4 }
  };

  function abrirRespSheet(prot) {
    breathModal.classList.add("visible");
    iniciarRespiracao(prot);
  }

  function fecharRespSheet() {
    breathModal.classList.remove("visible");
    clearInterval(breathTimer);
  }

  function iniciarRespiracao(prot) {
    const cfg = protocolos[prot];
    if (!cfg) return;

    let cicloAtual = 0;

    breathState = "inspirar";
    currentTime = cfg.inspirar;
    atualizarRespUI();

    breathTimer = setInterval(() => {

      currentTime--;
      atualizarRespUI();

      if (currentTime <= 0) {
        if (breathState === "inspirar") {
          breathState = "segurar";
          currentTime = cfg.segurar;
        } else if (breathState === "segurar") {
          breathState = "soltar";
          currentTime = cfg.soltar;
        } else if (breathState === "soltar") {
          cicloAtual++;
          if (cicloAtual >= cfg.ciclos) {
            clearInterval(breathTimer);
            breathState = "finalizado";
            faseLabel.textContent = "Concluído";
            breathCircle.textContent = "✔";
            return;
          }
          breathState = "inspirar";
          currentTime = cfg.inspirar;
        }
        atualizarRespUI();
      }

    }, 1000);
  }

  function atualizarRespUI() {
    breathCircle.textContent = currentTime;

    if (breathState === "inspirar") faseLabel.textContent = "Inspirar…";
    if (breathState === "segurar") faseLabel.textContent = "Segurar…";
    if (breathState === "soltar") faseLabel.textContent = "Soltar…";
  }

  breathStart.onclick = () => {};
  breathClose.onclick = fecharRespSheet;

  /* ============================================================
       HIIT BUBBLE COMPLETO
  ============================================================ */
  function iniciarHIIT(node, cfg) {
    let ciclo = 0;
    let fase = "startCount";
    let tempo = 3;

    const circle = node.querySelector(".hiit-circle");
    const faseTxt = node.querySelector(".hiit-phase");

    function tick() {
      circle.textContent = tempo;

      if (fase === "startCount") {
        faseTxt.textContent = "Preparar";

        tempo--;
        if (tempo < 0) {
          fase = "estimulo";
          tempo = cfg.estimulo;
        }
      }

      else if (fase === "estimulo") {
        faseTxt.textContent = "Forte";

        tempo--;
        if (tempo < 0) {
          fase = "endCount";
          tempo = 5;
        }
      }

      else if (fase === "endCount") {
        faseTxt.textContent = "Transição";

        tempo--;
        if (tempo < 0) {
          fase = "descanso";
          tempo = cfg.descanso;
        }
      }

      else if (fase === "descanso") {
        faseTxt.textContent = "Recuperar";

        tempo--;
        if (tempo < 0) {
          ciclo++;

          if (ciclo >= cfg.ciclos) {
            clearInterval(hiitTimer);
            circle.textContent = "✔";
            faseTxt.textContent = "Finalizado";
            return;
          }

          fase = "startCount";
          tempo = 3;
        }
      }
    }

    tick();
    const hiitTimer = setInterval(tick, 1000);

    // pausar ao clicar
    circle.onclick = () => {
      if (hiitTimer.paused) {
        hiitTimer.paused = false;
        hiitTimer.id = setInterval(tick, 1000);
      } else {
        hiitTimer.paused = true;
        clearInterval(hiitTimer.id);
      }
    };
  }

  /* ============================================================
       RENDER (PREMIUM)
  ============================================================ */
  function renderBoxes(lista) {
    boxes = lista;
    track.innerHTML = "";

    lista.forEach(box => {
      const div = document.createElement("div");
      div.className = "carousel-item";

      /* ============ AQUECIMENTO ============ */
      if (box.tipo === "aquecimentoPremium") {

        const itens = box.passos.map(
          p => `<li data-desc="${p.desc}">${p.nome}</li>`
        ).join("");

        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${itens}
          </ul>

          <button class="ff-btn-protocolo" data-prot="${box.protocolo}">
            🌬️ Respiração Wake
          </button>
        `;
      }

      /* ============ RESFRIAMENTO ============ */
      else if (box.tipo === "resfriamentoPremium") {

        const itens = box.passos.map(
          p => `<li data-desc="${p.desc}">${p.nome}</li>`
        ).join("");

        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">${itens}</ul>

          <button class="ff-btn-protocolo" data-prot="${box.protocolo}">
            🌬️ Respiração Release
          </button>
        `;
      }

      /* ============ HIIT PREMIUM ROTATIVO ============ */
      else if (box.tipo === "hiitPremium") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <div class="hiit-bubble">
            <div class="hiit-circle">3</div>
            <div class="hiit-phase">Preparar</div>
            <div class="hiit-sugestoes">${box.sugestao}</div>
          </div>
        `;

        setTimeout(() =>
          iniciarHIIT(div.querySelector(".hiit-bubble"), box), 600);
      }

      /* ============ CARDIO ============ */
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

      /* ============ TREINO NORMAL ============ */
      else if (box.tipo === "treino") {

        const blocos = box.exercicios.map(ex => {
          return `
            <div class="ff-ex-item">
              <div class="ff-ex-top">
                <h4 class="ff-ex-nome">
                  <a href="${ex.link || '#'}" target="_blank">${ex.titulo}</a>
                </h4>

                <input 
                  type="number"
                  class="ff-ex-peso"
                  placeholder="kg"
                  data-ex="${ex.titulo}"
                />
              </div>

              <div class="ff-ex-info">
                <span>Séries: <b>${ex.series}</b></span>
                <span>Reps: <b>${ex.reps}</b></span>
                <span>Desc: <b>${ex.intervalo}s</b></span>
              </div>

              <div class="ff-timer-bar" data-total="${ex.intervalo}">
                <div class="ff-timer-fill"></div>
                <span class="ff-timer-count">00:${ex.intervalo}</span>
              </div>
            </div>
          `;
        }).join("");

        div.innerHTML = `
          <h3 class="ff-ex-titulo">Box ${box.box}</h3>
          ${blocos}
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
       BOTÕES RESPIRAÇÃO
  ============================================================ */
  function bindRespiracaoButtons(root) {
    root.querySelectorAll(".ff-btn-protocolo").forEach(btn => {
      btn.onclick = () => abrirRespSheet(btn.dataset.prot);
    });
  }

  /* ============================================================
       SALVAR PESO INDIVIDUAL
  ============================================================ */
  function bindPeso() {
    document.querySelectorAll(".ff-ex-peso").forEach(inp => {

      inp.addEventListener("change", async () => {

        await FEMFLOW.salvarEvolucao({
          id,
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
       SALVAR TREINO → MODAL PSE
  ============================================================ */
  btnSalvar.onclick = () =>
    modalPSE.classList.remove("hidden");

  btnPSEclose.onclick = () =>
    modalPSE.classList.add("hidden");

  btnPSEok.onclick = async () => {

    const pse = Number(document.getElementById("pseInput").value);
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

    FEMFLOW.toast("Treino salvo ✔");
    FEMFLOW.router("flowcenter");
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
       BUSCA DO TREINO NO BACKEND
  ============================================================ */
  const perfil = await FEMFLOW.carregarCicloBackend();

  const fase     = perfil?.fase     || localStorage.getItem("femflow_fase");
  const enfase   = perfil?.enfase   || localStorage.getItem("femflow_enfase");
  const diaCiclo = Number(perfil?.diaCiclo || localStorage.getItem("femflow_diaCiclo"));

  const listaMontada = await FEMFLOW.engineTreino.montarTreino({
    nivel: localStorage.getItem("femflow_nivel"),
    enfase,
    fase,
    diaCiclo
  });

  renderBoxes(listaMontada);

});
