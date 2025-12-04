/* ============================================================
   FEMFLOW — treino.js v4.0 FINAL (2025)
   ------------------------------------------------------------
   • Compatível com treino-engine v4.0
   • 100% Firebase (blocos)
   • Suporte total:
        - Treino PERSONAL
        - Séries Especiais (2E, 3T, 3S, etc.)
        - HIIT Premium vindo do Firestore
        - Cardio Final vindo do Firestore
        - Treinos normais (exercícios)
   • Mantida estética FemFlow Premium
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  FEMFLOW.log("🚀 treino.js v4.0 iniciado!");

  /* ============================================================
     0. VARIÁVEIS DA TELA
  ============================================================ */
  const isPersonal = location.search.includes("personal=1");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.", true);
    location.href = "index.html";
    return;
  }

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

  if (!track) {
    FEMFLOW.error("❌ #carouselTrack não encontrado!");
    return;
  }

  /* ============================================================
     1. AGUARDAR SINAL DO BACKEND (perfil carregado)
  ============================================================ */
  window.addEventListener("femflow:ready", async (ev) => {

    const perfil = ev.detail;

    if (!perfil) {
      FEMFLOW.toast("Erro ao carregar perfil.", true);
      return;
    }

    const nivel    = perfil.nivel;
    const enfase   = perfil.enfase;
    const fase     = perfil.fase;
    const diaCiclo = perfil.diaCiclo;

    const diaPrograma = FEMFLOW.calcularDiaPrograma();
    if (tituloDia) tituloDia.textContent = `Dia ${diaPrograma}`;

    FEMFLOW.log("📌 Perfil recebido:", perfil);

    /* ============================================================
       🔥 1.1 PERSONAL
    ============================================================ */
    if (isPersonal) {
      FEMFLOW.log("🎨 Modo PERSONAL: carregando blocos do Firebase…");

      const lista = await FEMFLOW.engineTreino.montarTreinoFinal({
        id,
        enfase,
        fase,
        diaCiclo,
        personal: true
      });

      renderTreino(lista);
      return;
    }

    /* ============================================================
       🔥 1.2 NORMAL
    ============================================================ */
    const lista = await FEMFLOW.engineTreino.montarTreinoFinal({
      id,
      nivel,
      enfase,
      fase,
      diaCiclo,
      personal: false
    });

    renderTreino(lista);
  });

  /* ============================================================
     2. FUNÇÃO DE RENDER
  ============================================================ */

  function fmtTime(seg) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
function renderTreino(lista) {

  if (!lista || !lista.length) {
    track.innerHTML = `
      <div class="carousel-item">
        <p>Nenhum treino disponível para hoje.</p>
      </div>
    `;
    return;
  }

  /* ============================================================
     1) AGRUPAR ITEMS POR BOX
  ============================================================ */
  const grupos = {}; // { 1:[…], 2:[…], 999:[…]… }

  lista.forEach(item => {
    const box = item.box ?? 0;
    if (!grupos[box]) grupos[box] = [];
    grupos[box].push(item);
  });

  /* ordenar box: -100 → 0 → 1 → 2 → … → 500 → 900 → 999 */
  const boxKeys = Object.keys(grupos)
    .map(n => Number(n))
    .sort((a,b)=>a-b);

  track.innerHTML = "";

  /* ============================================================
     2) RENDERIZAR CADA BOX
  ============================================================ */
  boxKeys.forEach(boxNum => {
    const bloco = grupos[boxNum];
    const html = renderBox(bloco);
    if (html) track.insertAdjacentHTML("beforeend", html);
  });

  initTimers();
  initHIIT();
  initPeso();
}
/* ============================================================
   RENDERIZAR 1 BOX COMPLETO
============================================================ */
function renderBox(bloco) {

  const tipoDominante = bloco[0].tipo;

  let html = `<div class="carousel-item">`;

 /* ======================================================
   AQUECIMENTO PREMIUM
====================================================== */
if (tipoDominante === "aquecimentoPremium") {
  html += `
    <h2 class="ff-ex-titulo">${bloco[0].titulo}</h2>
    <ul class="ff-passos">
      ${bloco[0].passos.map(p => `<li>${p.nome}</li>`).join("")}
    </ul>
    <p class="ff-sugestao-resp">
      💨 Sugestão: prepare seu corpo com uma respiração consciente antes de começar.
    </p>
    <button class="ff-btn-resp-sugerida"
            type="button"
            onclick="location.href='respiracao.html?ret=treino'">
      🌬️ Abrir protocolos de respiração
    </button>
  `;
  html += `</div>`;
  return html;
}

/* ======================================================
   RESFRIAMENTO PREMIUM
====================================================== */
if (tipoDominante === "resfriamentoPremium") {
  html += `
    <h2 class="ff-ex-titulo">${bloco[0].titulo}</h2>
    <ul class="ff-passos">
      ${bloco[0].passos.map(p => `<li>${p.nome}</li>`).join("")}
    </ul>
    <p class="ff-sugestao-resp">
      🌬️ Sugestão: finalize seu treino desacelerando com respiração suave.
    </p>
    <button class="ff-btn-resp-sugerida"
            type="button"
            onclick="location.href='respiracao.html?ret=treino'">
      💗 Fazer respiração de fechamento
    </button>
  `;
  html += `</div>`;
  return html;
}


  /* ======================================================
     CARDIO FINAL
  ====================================================== */
  if (tipoDominante === "cardio_final") {
    const c = bloco[0];
    html += `
      <h2 class="ff-ex-titulo">${c.titulo}</h2>

      <div class="ff-descanso-wrap">
        <button class="ff-descanso-btn btnStartTimer">▶️ Iniciar cardio</button>
        <span class="ff-timer-count">${fmtTime(c.duracao)}</span>

        <div class="ff-timer-bar" data-timer="${c.duracao}">
          <div class="ff-timer-fill"></div>
        </div>
      </div>
    `;
    html += `</div>`;
    return html;
  }

/* ======================================================
   HIIT PREMIUM
====================================================== */
if (tipoDominante === "hiitPremium") {
  const h = bloco[0];

  html += `
    <h2 class="ff-ex-titulo">${h.titulo}</h2>

    <p class="ff-sugestao-hiit">
      🔥 <b>Escolha a sua forma de HIIT:</b><br>
      • <b>Na academia:</b> esteira, bike, escada, remo ou air Bike<br>
      • <b>Em casa:</b> polichinelo, corrida parada, burpee, corda, salto no lugar
    </p>

    <div class="hiit-bubble">
      <div class="hiit-circle"
           data-estimulo="${h.forte}"
           data-descanso="${h.leve}"
           data-ciclos="${h.ciclos}">
           ▶
      </div>
      <div class="hiit-phase">Toque para iniciar</div>
    </div>
  `;

  html += `</div>`;
  return html;
}


  /* ======================================================
     TREINO (1 box com vários exercícios)
  ====================================================== */
  const boxNum = bloco[0].box;
  const serieEsp = bloco[0].serieEspecial
    ? ` — Série ${bloco[0].serieEspecial}`
    : "";

  html += `<h2 class="ff-ex-titulo">Box ${boxNum}${serieEsp}</h2>`;

  bloco.forEach(ex => {
    html += renderExercicio(ex);
  });

  html += `</div>`;
  return html;
}
/* ============================================================
   BLOCO EXERCÍCIO INDIVIDUAL
============================================================ */
function renderExercicio(ex) {

  const intervalo = Number(ex.intervalo) || 0;

  return `
    <div class="ff-ex-item">
      <div class="ff-ex-top">
        <div class="ff-ex-nome">
          <a href="${ex.link || "#"}" target="_blank">
            ${ex.titulo}
          </a>
        </div>

        <input class="ff-ex-peso"
               type="number"
               placeholder="kg"
               data-ex="${ex.titulo}">
      </div>

      <div class="ff-info-line">
        <span>🌀 <b>${ex.series}</b>x</span>
        <span>🔁 <b>${ex.reps}</b></span>
        <span>⏱️ <b>${intervalo}s</b></span>
      </div>

      <div class="ff-descanso-wrap">
        <button class="ff-descanso-btn btnStartTimer">
          ▶️ Iniciar descanso
        </button>

        <span class="ff-timer-count">${fmtTime(intervalo)}</span>

        <div class="ff-timer-bar" data-timer="${intervalo}">
          <div class="ff-timer-fill"></div>
        </div>
      </div>
    </div>
  `;
}

  
  /* ============================================================
     3. TIMERS
  ============================================================ */
  function initTimers() {
    document.querySelectorAll(".ff-descanso-wrap").forEach(wrap => {
      const btn   = wrap.querySelector(".ff-descanso-btn");
      const bar   = wrap.querySelector(".ff-timer-bar");
      const fill  = bar?.querySelector(".ff-timer-fill");
      const label = wrap.querySelector(".ff-timer-count");

      if (!btn || !bar || !fill || !label) return;

      const total = Number(bar.dataset.timer) || 60;
      let restante = total;
      let rodando  = false;
      let intv;

      label.textContent = fmtTime(restante);
      fill.style.width  = "100%";

      btn.onclick = () => {
        if (rodando) {
          rodando = false;
          btn.textContent = "▶️ Retomar";
          clearInterval(intv);
          return;
        }

        rodando = true;
        btn.textContent = "⏸️ Pausar";

        if (restante <= 0) restante = total;

        clearInterval(intv);
        intv = setInterval(() => {

          if (!rodando) return;

          restante--;
          if (restante < 0) restante = 0;

          label.textContent = fmtTime(restante);
          fill.style.width  = `${(restante / total) * 100}%`;

          if (restante <= 0) {
            clearInterval(intv);
            rodando = false;
            btn.textContent = "✔️ Finalizado";
          }

        }, 1000);
      };
    });
  }

  /* ============================================================
     4. HIIT — versão compatível com engine v4.0
  ============================================================ */
  function initHIIT() {
    if (window.FEMFLOW.desativarHIIT) return;

    document.querySelectorAll(".hiit-circle").forEach(circle => {
      const est = Number(circle.dataset.estimulo) || 40;
      const rec = Number(circle.dataset.descanso) || 20;
      const ciclosMax = Number(circle.dataset.ciclos) || 6;

      let tempo = est;
      let modo = "forte";
      let ciclo = 1;
      let rodando = false;
      let intv = null;

      const card = circle.closest(".carousel-item");
      const phase = card?.querySelector(".hiit-phase");

      circle.textContent = "▶";
      phase.textContent = "Toque para iniciar";

      function atualizar() {
        if (modo === "forte") phase.textContent = `Força (${ciclo}/${ciclosMax})`;
        else phase.textContent = `Recuperar (${ciclo}/${ciclosMax})`;
      }

      function iniciar() {
        rodando = true;
        circle.classList.remove("paused");

        atualizar();
        circle.textContent = tempo;

        clearInterval(intv);
        intv = setInterval(() => {
          tempo--;
          circle.textContent = tempo;

          if (tempo <= 0) {
            if (modo === "forte") {
              modo = "leve";
              tempo = rec;
              atualizar();
              return;
            }

            ciclo++;

            if (ciclo > ciclosMax) {
              clearInterval(intv);
              circle.textContent = "✔";
              phase.textContent = "HIIT concluído";
              rodando = false;
              return;
            }

            modo = "forte";
            tempo = est;
            atualizar();
          }
        }, 1000);
      }

      circle.onclick = () => {
        if (!rodando) iniciar();
        else {
          rodando = false;
          clearInterval(intv);
          circle.classList.add("paused");
          phase.textContent = "Pausado — toque para retomar";
        }
      };
    });
  }

  

  /* ============================================================
     6. SALVAR PESO
  ============================================================ */
  function initPeso() {
    document.querySelectorAll(".ff-ex-peso").forEach(inp => {
      inp.addEventListener("change", () => {
        FEMFLOW.log("Peso registrado:", inp.dataset.ex, inp.value);
      });
    });
  }

  /* ============================================================
     7. SALVAR TREINO
  ============================================================ */
  if (btnSalvar) {
    btnSalvar.onclick = () => modalPSE.classList.remove("hidden");
  }

  if (btnCancelarPSE) {
    btnCancelarPSE.onclick = () => modalPSE.classList.add("hidden");
  }

  if (btnConfirmarPSE) {
    btnConfirmarPSE.onclick = async () => {

      const fase = localStorage.getItem("femflow_fase");
      const diaFirebase = Number(localStorage.getItem("femflow_diaCiclo") || 1);
      const pse = Number(pseInput.value || 0);

      if (!id) {
        FEMFLOW.toast("Erro: sem ID.", true);
        return;
      }

      try {
        const resp = await fetch(FEMFLOW.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "salvarTreino",
            id,
            fase,
            diaFirebase,
            pse,
            treino: "",
            obs: ""
          })
        }).then(r => r.json());

        FEMFLOW.log("📌 salvarTreino:", resp);

        if (resp.status === "ok") {
          if (resp.novaFase) localStorage.setItem("femflow_fase", resp.novaFase);
          if (resp.novoDiaCiclo) localStorage.setItem("femflow_diaCiclo", resp.novoDiaCiclo);
          FEMFLOW.toast("Treino salvo!");
        } else {
          FEMFLOW.toast("Erro ao salvar.", true);
        }

      } catch (err) {
        FEMFLOW.error("Erro salvar treino:", err);
        FEMFLOW.toast("Erro de conexão.", true);
      }

      modalPSE.classList.add("hidden");
    };
  }

  /* ============================================================
     8. BOTÃO DESCANSO
  ============================================================ */
  if (btnDescanso) {
    btnDescanso.onclick = async () => {

      try {
        const resp = await fetch(FEMFLOW.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "salvarDescanso",
            id
          })
        }).then(r => r.json());

        FEMFLOW.log("📌 descanso:", resp);
        FEMFLOW.toast("Descanso registrado!");

      } catch (e) {
        FEMFLOW.error("Erro descanso:", e);
        FEMFLOW.toast("Erro ao salvar descanso.", true);
      }
    };
  }
}); // ← fecha o DOMContentLoaded
