/* ================================================================
   FemFlow — treino.js FRONT-END PREMIUM v3.1
   COMPLETO • SEM REMOVER FUNÇÕES EXISTENTES
================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v3.1 iniciado!");

  const diaProg = FEMFLOW.calcularDiaPrograma();
  document.getElementById("tituloDiaTreino").textContent = `Dia ${diaProg}`;

  const OFFLINE_KEY = "femflow_offline_treino_v1";

  /* ---------------------- LOGIN / CICLO ---------------------- */
  const id = localStorage.getItem("femflow_id");
  if (!id) return FEMFLOW.router("index.html?ret=treino.html");

  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloOK) return FEMFLOW.router("ciclo.html");

  /* ---------------------- ELEMENTOS ---------------------- */
  const track     = document.querySelector("#carouselTrack");
  const bar       = document.querySelector("#progressBar");
  const btnRest   = document.getElementById("descansoBtn");
  const btnSalvar = document.getElementById("salvarTreinoBtn");

  let boxes = [];
  let current = 0;

  /* ---------------------- SWIPE / CARROSSEL ---------------------- */
  function goto(i) {
    current = Math.max(0, Math.min(i, boxes.length - 1));
    const item = track.children[current];
    track.scrollTo({ left: item.offsetLeft - 12, behavior: "smooth" });
    bar.style.width = `${((current + 1) / boxes.length) * 100}%`;
  }

  let startX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) goto(delta < 0 ? current + 1 : current - 1);
  });

  /* ---------------------- TIMER PREMIUM ---------------------- */
  function aplicarTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(barra => {

      const total = Number(barra.dataset.total);
      const fill  = barra.querySelector(".ff-timer-fill");
      const label = barra.querySelector(".ff-timer-count");

      let restante = total;
      let intv = null;

      const atualizar = () => {
        fill.style.width = `${(restante / total) * 100}%`;
        label.textContent = `00:${String(restante).padStart(2, "0")}`;
      };

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

      atualizar();
    });
  }

  /* ---------------------- HIIT BUBBLE ---------------------- */
  function iniciarHIIT(box) {
    const circle = box.querySelector(".hiit-circle");
    const phase  = box.querySelector(".hiit-phase");
    const btn    = box.querySelector(".hiit-start");

    let t;
    btn.style.display = "none";

    function pre() {
      t = 3;
      phase.textContent = "Preparar...";
      circle.textContent = t;

      const int = setInterval(() => {
        t--; circle.textContent = t;
        if (t <= 0) { clearInterval(int); forca(); }
      }, 1000);
    }

    function forca() {
      t = Number(box.dataset.forca);
      phase.textContent = "Força!";
      circle.textContent = t;

      const int = setInterval(() => {
        t--; circle.textContent = t;
        if (t <= 0) { clearInterval(int); final(); }
      }, 1000);
    }

    function final() {
      t = 5;
      phase.textContent = "Finalizando…";
      circle.textContent = t;

      const int = setInterval(() => {
        t--; circle.textContent = t;
        if (t <= 0) { clearInterval(int); descanso(); }
      }, 1000);
    }

    function descanso() {
      t = Number(box.dataset.desc);
      phase.textContent = "Descanso";
      circle.textContent = t;

      const int = setInterval(() => {
        t--; circle.textContent = t;
        if (t <= 0) { clearInterval(int); pre(); }
      }, 1000);
    }

    pre();
  }

  /* ---------------------- RENDER ---------------------- */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista;

    const fmt = s => `00:${String(s).padStart(2, "0")}`;

    lista.forEach(box => {
      const div = document.createElement("div");
      div.className = "carousel-item";

      /* AQUECIMENTO */
      if (box.tipo === "aquecimentoPremium") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <ul class="ff-passos">
            ${box.passos.map(p => `<li>${p}</li>`).join("")}
          </ul>

          <button class="ff-btn-protocolo" data-prot="${box.protocolo}">
            🌬️ Respiração Wake
          </button>
        `;
      }

      /* TREINO */
      else if (box.tipo === "treino") {
        const blocosHTML = box.exercicios.map(ex => `
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
              Séries: <b>${ex.series}</b> —  
              Reps: <b>${ex.reps}</b> —  
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

      /* HIIT */
      else if (box.tipo === "hiitBubble") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>

          <div class="hiit-bubble" data-forca="${box.tempoForca}" data-desc="${box.tempoDesc}">
            <div class="hiit-circle">${box.tempoForca}</div>
            <div class="hiit-phase">Preparar…</div>
            <button class="hiit-start">Iniciar</button>
          </div>
        `;
      }

      /* RESFRIAMENTO */
      else if (box.tipo === "resfriamentoPremium") {
        div.innerHTML = `
          <h3 class="ff-ex-titulo">${box.titulo}</h3>
          <p class="ff-ex-sub">${box.descricao}</p>

          <button class="ff-btn-protocolo" data-prot="${box.protocolo}">
            🌬️ Respiração Release
          </button>

          <p class="ff-final-msg">
            Ao finalizar, clique em <b>Salvar treino</b>.
          </p>
        `;
      }

      track.appendChild(div);
    });

    aplicarTimers(track);

    /* Botões respiração */
    track.querySelectorAll(".ff-btn-protocolo").forEach(btn => {
      btn.onclick = () => abrirResp(btn.dataset.prot);
    });

    /* Peso */
    track.querySelectorAll(".ff-ex-peso").forEach(inp => {
      inp.onchange = async () => {
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
      };
    });

    /* HIIT */
    track.querySelectorAll(".hiit-bubble .hiit-start").forEach(btn => {
      btn.onclick = () => iniciarHIIT(btn.closest(".hiit-bubble"));
    });

    goto(0);
  }

  /* ---------------------- MODAL RESPIRAÇÃO ---------------------- */
  const breathModal  = document.getElementById("breathModal");
  const breathCircle = document.getElementById("breathCircle");
  const faseLabel    = document.getElementById("faseLabel");

  function abrirResp(tipo) {
    breathModal.classList.remove("hidden");
    breathCircle.textContent = "5";
    faseLabel.textContent = "Preparar...";
  }

  btnRespClose.onclick = () => breathModal.classList.add("hidden");

  /* ---------------------- SALVAR TREINO ---------------------- */
  btnSalvar.onclick = () => {
    document.getElementById("modalPSE").classList.add("show");
  };

  document.getElementById("btnConfirmarPSE").onclick = async () => {

    const pse = Number(document.getElementById("pseInput").value);
    const fase = localStorage.getItem("femflow_fase");
    const diaFirebase = localStorage.getItem("femflow_diaCiclo");

    await fetch(FEMFLOW.SCRIPT_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        action:"salvarTreino",
        id,
        pse,
        fase,
        diaFirebase,
        treino:"Força",
        obs:""
      })
    });

    FEMFLOW.toast("Treino salvo!");
    FEMFLOW.router("flowcenter");
  };

  document.getElementById("btnCancelarPSE").onclick = () => {
    document.getElementById("modalPSE").classList.remove("show");
  };

  /* ---------------------- DESCANSO ---------------------- */
  btnRest.onclick = async () => {
    await FEMFLOW.salvarDescanso();
    FEMFLOW.toast("Descanso registrado 🌿");
    setTimeout(() => FEMFLOW.router("flowcenter"), 800);
  };

  /* ---------------------- OFFLINE ---------------------- */
  const snap = !navigator.onLine && JSON.parse(localStorage.getItem(OFFLINE_KEY) || "null");
  if (snap?.lista) {
    renderBoxes(snap.lista);
    FEMFLOW.toast("Modo offline ⚡");
    return;
  }

  /* ---------------------- BUSCAR TREINO ---------------------- */
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

  localStorage.setItem(OFFLINE_KEY, JSON.stringify({
    meta:{fase,diaCiclo},
    lista:listaMontada,
    salvoEm:Date.now()
  }));

  renderBoxes(listaMontada);

});

