/* ================================================================
   FemFlow — treino.js FRONT-END PREMIUM v3.0 (Arquitetura A)
================================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v3.0 (Arquitetura A) iniciado!");

  const diaProg = FEMFLOW.calcularDiaPrograma();
  document.getElementById("tituloDiaTreino").textContent = `Dia ${diaProg}`;

  const OFFLINE_KEY = "femflow_offline_treino_v1";

  /* ============================
       LOGIN / CICLO
  ============================ */
  const id = localStorage.getItem("femflow_id");
  if (!id) return location.href = "index.html?ret=treino.html";

  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloOK) return location.href = "ciclo.html";

  /* ============================
       ELEMENTOS HTML
  ============================ */
  const track     = document.querySelector("#carouselTrack");
  const bar       = document.querySelector("#progressBar");
  const btnRest   = document.getElementById("descansoBtn");
  const btnSalvar = document.getElementById("salvarTreinoBtn");

  if (!track || !bar) return;

  let boxes = [];
  let current = 0;

  /* ============================
       CARROSSEL (Swipe)
  ============================ */
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

  /* ============================
       TIMER PREMIUM
  ============================ */
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

  /* ============================
       RENDER
  ============================ */
  function renderBoxes(lista) {
    track.innerHTML = "";
    boxes = lista || [];

    const fmt = s => `00:${String(s).padStart(2, "0")}`;

    boxes.forEach(box => {

      const div = document.createElement("div");
      div.className = "carousel-item";

      /* ============ AQUECIMENTO PREMIUM ============ */
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

      /* ============ RESFRIAMENTO PREMIUM ============ */
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
            Ao finalizar, clique em <b>Salvar treino</b> abaixo.
          </p>
        `;
      }

      /* ============ HIIT PREMIUM ============ */
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

        const blocosHTML = box.exercicios.map(ex => `
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

  /* ============================
       BOTÕES RESPIRAÇÃO
  ============================ */
  function bindRespiracaoButtons(root) {
    root.querySelectorAll(".ff-btn-protocolo").forEach(btn => {
      btn.onclick = () => {
        const p = btn.dataset.prot;
        FEMFLOW.router(`respiracao.html?prot=${p}`);
      };
    });
  }

  /* ============================
       SALVAR PESO INDIVIDUAL
  ============================ */
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

  /* ============================
       SALVAR TREINO → MODAL PSE
  ============================ */
  if (btnSalvar) {
    btnSalvar.onclick = () => {
      document.getElementById("modalPSE").classList.add("show");
    };
  }

  document.getElementById("btnConfirmarPSE")?.addEventListener("click", async () => {

    const pse = Number(document.getElementById("pseInput").value);

    const fase = localStorage.getItem("femflow_fase");
    const diaFirebase = localStorage.getItem("femflow_diaCiclo");

    const r = await fetch(FEMFLOW.SCRIPT_URL, {
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

    FEMFLOW.toast("Treino salvo!");
    FEMFLOW.router("flowcenter");
  });

  document.getElementById("btnCancelarPSE")?.addEventListener("click", () => {
    document.getElementById("modalPSE").classList.remove("show");
  });

  /* ============================
       DESCANSO
  ============================ */
  btnRest.onclick = async () => {
    await FEMFLOW.salvarDescanso();
    FEMFLOW.toast("Descanso registrado 🌿");
    setTimeout(() => FEMFLOW.router("flowcenter"), 800);
  };

  /* ============================
       OFFLINE
  ============================ */
  const salvarSnapshot = (meta, lista) => {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify({ meta, lista, salvoEm: Date.now() }));
  };

  const snap = !navigator.onLine && JSON.parse(localStorage.getItem(OFFLINE_KEY) || "null");
  if (snap?.lista) {
    renderBoxes(snap.lista);
    FEMFLOW.toast("Modo offline ⚡");
    return;
  }

  /* ============================
       SINCRONIZAR COM BACKEND
  ============================ */
  const perfil = await FEMFLOW.carregarCicloBackend();

  const fase     = perfil?.fase     || localStorage.getItem("femflow_fase");
  const enfase   = perfil?.enfase   || localStorage.getItem("femflow_enfase");
  const diaCiclo = Number(perfil?.diaCiclo || localStorage.getItem("femflow_diaCiclo"));

  /* ============================
       MONTAR TREINO
  ============================ */
  const listaMontada = await FEMFLOW.engineTreino.montarTreino({
    nivel: localStorage.getItem("femflow_nivel"),
    enfase,
    fase,
    diaCiclo
  });

  salvarSnapshot({ fase, diaCiclo }, listaMontada);
  renderBoxes(listaMontada);

});

