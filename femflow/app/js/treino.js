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
const cicloOK = localStorage.getItem("femflow_cycle_configured");

if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo antes de treinar.");
    return location.href = "ciclo.html";
}

  FEMFLOW.log("🚀 treino.js v4.0 iniciado!");

  /* ============================================================
     0. VARIÁVEIS DA TELA
  ============================================================ */
  /* ============================================================
   PERSONAL MODE — 3 fontes:
   1) query string (?personal=1)
   2) backend (perfil.personal = true)
   3) localStorage (persistência)
============================================================ */
let isPersonalQuery   = location.search.includes("personal=1");
let isPersonalStorage = localStorage.getItem("femflow_personal") === "true";

let isPersonal = isPersonalQuery || isPersonalStorage;
if (isPersonal) {
  document.body.classList.add("personal-mode");
  FEMFLOW.log("🎨 Layout PERSONAL aplicado");
}


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
  const SERIE_BEHAVIOR = {
  T: { combinados: 3, descansoNoUltimo: true },
  B: { combinados: 2, descansoNoUltimo: true },
  Q: { combinados: 4, descansoNoUltimo: true },

  C: { cluster: true, pausas: 10 },

  I: { isometria: 3 },

  CC: { cadenciaExcentrica: true },

  D: { dropset: 3 },

  RP: { restPause: true },

  AE: { ativacao: true }
};

  if (!track) {
    FEMFLOW.error("❌ #carouselTrack não encontrado!");
    return;
  }
/* ============================================================
   PERSONAL MODE — detectar pelo backend e salvar localmente
============================================================ */
function detectarPersonalDoBackend(perfil) {
  // Produto armazenado na planilha (coluna F)
  const produto = (perfil.produto || "").toLowerCase().trim();

  // Se for PERSONAL, salvar no localStorage
  if (produto === "treino_personal") {
    FEMFLOW.log("🔥 Personal habilitado via backend");
    localStorage.setItem("femflow_personal", "true");
    return true;
  }

  // Se não for personal, limpar eventual flag antiga
  localStorage.removeItem("femflow_personal");
  return false;
}

  /* ============================================================
     1. AGUARDAR SINAL DO BACKEND (perfil carregado)
  ============================================================ */
  window.addEventListener("femflow:ready", async (ev) => {

    const perfil = ev.detail;
     const personalBackend = detectarPersonalDoBackend(perfil);

// prioridade do backend sobre query
if (personalBackend) {
  isPersonal = true;
  localStorage.setItem("femflow_personal", "true");
} 

const personalFinal = isPersonal;



    if (!perfil) {
      FEMFLOW.toast("Erro ao carregar perfil.", true);
      return;
    }

    const nivel    = perfil.nivel;
    const enfase   = perfil.enfase;
    FEMFLOW.enfaseAtual = enfase;
    const fase     = perfil.fase;
    const diaCiclo = perfil.diaCiclo;

    // 1) Carregar DiaPrograma (LS → backend → fallback)
const diaPrograma = await FEMFLOW.getDiaPrograma();
FEMFLOW.diaProgramaAtual = diaPrograma;

if (tituloDia) {
  tituloDia.textContent = t("treino.diaProgramaLabel", { dia: diaPrograma });
}

    FEMFLOW.log("📌 Perfil recebido:", perfil);

 /* ============================================================
   🔥 1.1 PERSONAL — modo completo
============================================================ */
if (personalFinal) {
  FEMFLOW.log("🎨 Modo PERSONAL ativado");

let lista = await FEMFLOW.engineTreino.montarTreinoFinal({
  id,
  nivel,
  enfase,
  fase,
  diaCiclo,
  personal: true
});


  // fallback se não existir treino personal
  if (!lista || lista.length === 0) {
    FEMFLOW.warn("⚠️ Nenhum treino PERSONAL encontrado. Voltando ao modo NORMAL.");

    lista = await FEMFLOW.engineTreino.montarTreinoFinal({
      id,
      nivel,
      enfase,
      fase,
      diaCiclo,
      personal: false
    });
  }

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
     localStorage.setItem("femflow_fase", fase);
localStorage.setItem("femflow_diaCiclo", diaCiclo);

  });

    function parseSerieEspecial(raw) {
  if (!raw) return null;

  const match = raw.match(/^(\d+)?([A-Z]+)/i);

  if (!match) return null;

  return {
    ordem: match[1] ? Number(match[1]) : null, // ex: 3
    codigo: match[2].toUpperCase(),            // ex: D, AE, T
    raw
  };
}
 


  /* ============================================================
     2. FUNÇÃO DE RENDER
  ============================================================ */

  function fmtTime(seg) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
   
function renderTreino(lista) {

   console.log("🎯 RENDER TREINO LISTA:", lista);
lista.forEach(item => {
  console.log("🎯 ITEM:", {
    tipo: item.tipo,
    box: item.box,
    boxKey: item.boxKey,
    serieEspecial: item.serieEspecial
  });
});


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
    const box = item.boxKey ?? item.box ?? 0;
    if (!grupos[box]) grupos[box] = [];
    grupos[box].push(item);
  });
   
console.log("🧪 GRUPOS RAW:", grupos);
console.log("🧪 BOX KEYS RAW:", Object.keys(grupos));
   
   Object.entries(grupos).forEach(([key, arr]) => {
  console.log(`🧩 GRUPO ${key}:`, arr.map(i => ({
    tipo: i.tipo,
    box: i.box,
    serieEspecial: i.serieEspecial
  })));
});

  /* ordenar box: -100 → 0 → 1 → 2 → … → 500 → 900 → 999 */
  const boxKeys = Object.keys(grupos).sort((a, b) => {
  const na = parseInt(a);
  const nb = parseInt(b);

  // ambos numéricos → ordena normal
  if (!isNaN(na) && !isNaN(nb)) return na - nb;

  // um numérico, outro não → numérico vem primeiro
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;

  // ambos strings → ordem alfabética
  return a.localeCompare(b);
});

console.log("🧪 BOX KEYS ORDENADAS:", boxKeys);
  track.innerHTML = "";

  /* ============================================================
     2) RENDERIZAR CADA BOX
  ============================================================ */
  boxKeys.forEach(boxNum => {
    const bloco = grupos[boxNum];
     if (!Array.isArray(bloco) || bloco.length === 0) {
  FEMFLOW.warn("⚠️ Box ignorado (vazio ou inválido):", boxNum);
  return;
}
    const html = renderBox(bloco);
    if (html) track.insertAdjacentHTML("beforeend", html);
  });

initTimers();
initHIIT();
initClusterTimers(); // 🔥 CLUSTER TIMER REAL
initRestPause(); // ✅
initSeriesProgress();
initPeso();
}
 /* ============================================================
     3) RENDER BOX
  ============================================================ */
   
function renderBox(bloco) {

   console.log("🧱 RENDER BOX:", {
  tipoDominante: bloco[0].tipo,
  box: bloco[0].box,
  serieEspecial: bloco[0].serieEspecial,
  bloco
});


   
  if (!Array.isArray(bloco) || bloco.length === 0) {
    FEMFLOW.warn("⚠️ renderBox recebeu bloco inválido:", bloco);
    return "";
  }

  const tipoDominante = bloco[0].tipo;
  const boxNum = Number(bloco[0].box || 0);

  // 🔒 segurança: box técnico nunca vira treino
  if (boxNum >= 900 && tipoDominante === "treino") return "";

  /* ======================================================
     AQUECIMENTO PREMIUM
  ====================================================== */
 if (tipoDominante === "aquecimentoPremium") {
  const ui = getAquecimentoUI();

  return `
    <div class="carousel-item ff-box">
      <h2 class="ff-ex-titulo">${bloco[0].titulo}</h2>

      <ul class="ff-passos">
        ${(bloco[0].passos || []).map(p => `<li>${p.nome}</li>`).join("")}
      </ul>

      <p class="ff-sugestao-resp">
        ${ui.sugestao}
      </p>

      <button class="ff-btn-resp-sugerida"
              type="button"
              onclick="location.href='respiracao.html?ret=treino'">
        ${ui.btn}
      </button>
    </div>
  `;
}


  /* ======================================================
     RESFRIAMENTO PREMIUM
  ====================================================== */
 if (tipoDominante === "resfriamentoPremium") {
  const ui = getResfriamentoUI();

  return `
    <div class="carousel-item ff-box">
      <h2 class="ff-ex-titulo">${bloco[0].titulo}</h2>

      <ul class="ff-passos">
        ${(bloco[0].passos || []).map(p => `<li>${p.nome}</li>`).join("")}
      </ul>

      <p class="ff-sugestao-resp">
        ${ui.sugestao}
      </p>

      <button class="ff-btn-resp-sugerida"
              type="button"
              onclick="location.href='respiracao.html?ret=treino'">
        ${ui.btn}
      </button>
    </div>
  `;
}

  /* ======================================================
     CARDIO FINAL
  ====================================================== */
  if (tipoDominante === "cardio_final") {
    const c = bloco[0];
    return `
      <div class="carousel-item ff-box">
        <h2 class="ff-ex-titulo">${c.titulo}</h2>

        <div class="ff-descanso-wrap">
          <button class="ff-descanso-btn btnStartTimer">▶️ Iniciar cardio</button>
          <span class="ff-timer-count">${fmtTime(Number(c.duracao) || 0)}</span>

          <div class="ff-timer-bar" data-timer="${Number(c.duracao) || 0}">
            <div class="ff-timer-fill"></div>
          </div>
        </div>
      </div>
    `;
  }

 /* ======================================================
   HIIT PREMIUM
====================================================== */
if (tipoDominante === "hiitPremium") {
  const h = bloco[0];

  const forte  = Number(h.forte)  || 40;
  const leve   = Number(h.leve)   || 20;
  const ciclos = Number(h.ciclos) || 6;

  return `
    <div class="carousel-item ff-box">
      <h2 class="ff-ex-titulo">${h.titulo}</h2>

      <p class="ff-sugestao-hiit">
        🔥 <b>${t("treino.hiit.protocolo", { forte, leve })}</b><br>
        ${t("treino.hiit.descricao", { forte, leve })}<br>
        ${t("treino.hiit.ciclos", { ciclos })}<br><br>

        <span class="ff-hiit-exemplos">
          • <b>${t("treino.hiit.exemplosAcademia")}</b><br>
          • <b>${t("treino.hiit.exemplosCasa")}</b>
        </span>
      </p>

      <div class="hiit-bubble">
        <div class="hiit-circle"
             data-estimulo="${forte}"
             data-descanso="${leve}"
             data-ciclos="${ciclos}">
          ▶
        </div>
        <div class="hiit-phase">${t("treino.hiit.iniciar")}</div>
      </div>
    </div>
  `;
}

  /* ======================================================
     TREINO (box com exercícios + série especial)
  ====================================================== */
  const serieParsed = parseSerieEspecial(bloco[0].serieEspecial);

const codigoSerie = serieParsed?.codigo || null;
const ordemSerie  = serieParsed?.ordem || null;

const behavior = SERIE_BEHAVIOR[codigoSerie] || null;

  const serieInfo  = getSerieEspecialInfo(codigoSerie);

const serieClass = codigoSerie
  ? `carousel-item ff-box ff-serie-especial ff-serie-${codigoSerie}`
  : `carousel-item ff-box`;

const serieData = codigoSerie
  ? `data-serie="${codigoSerie}"`
  : "";

 let htmlBox = `
  <div class="${serieClass}"
       ${serieData}
       data-serie-ordem="${ordemSerie ?? ""}"
       data-serie-codigo="${codigoSerie ?? ""}">
`;

  if (serieInfo) {
    htmlBox += `
      <h2 class="ff-ex-titulo">${serieInfo.titulo}</h2>
      <div class="ff-serie-box ff-serie-${codigoSerie}">
        <p>${serieInfo.texto}</p>
      </div>
    `;
  } else {
    htmlBox += `<h2 class="ff-ex-titulo">Box ${boxNum}</h2>`;
  }

  const totalCombo = behavior?.combinados || bloco.length;

   
 bloco.forEach((ex, index) => {
    
    console.log("🧪 EX:", {
  titulo: ex.titulo,
  serieEspecial: ex._serieCodigo,
  isCluster: ex._isCluster,
  behavior
});

  // 🔥 PROPAGAÇÃO DA SÉRIE DO BOX PARA O EXERCÍCIO
  ex.serieEspecial = codigoSerie;

  ex._comboIndex = index + 1;
  ex._comboTotal = totalCombo;
  ex._isUltimoDoCombo = index === totalCombo - 1;

  ex._hideRest =
    behavior?.descansoNoUltimo === true &&
    !ex._isUltimoDoCombo;

  // 🔥 ATIVAÇÕES
  ex._isCluster   = behavior?.cluster === true;
  ex._isRestPause = behavior?.restPause === true;
    // RP
if (behavior?.restPause) {
  ex._rpPausa = behavior.pausas || 15; // fallback seguro
}
    // Cadência excêntrica
if (behavior?.cadenciaExcentrica) {
  ex._cadenciaExcentrica = true;
}

// Isometria
if (behavior?.isometria) {
  ex._isometriaTempo = behavior.isometria; // ex: 3s
}


   
  ex._serieOrdem  = ordemSerie;
  ex._serieCodigo = codigoSerie;

  htmlBox += renderExercicio(ex);
});


  htmlBox += `</div>`;
  return htmlBox;
}


/* ============================================================
   BLOCO EXERCÍCIO INDIVIDUAL
============================================================ */
function renderExercicio(ex) {

  const intervalo = Number(ex.intervalo) || 0;
const totalSeries = Number(ex.series) || 1;
   const isRP = ex._isRestPause && ex._isUltimoDoCombo;


const serieProgressHTML = `
  <div class="ff-serie-progress"
     data-role="serie-progress"
     data-serie-atual="1"
     data-serie-total="${totalSeries}">
    Série <b>1</b> / ${totalSeries}
  </div>
`;

const serieBtnHTML = `
  <button class="ff-serie-next-btn"
        data-role="serie-next">
    ✔️ Concluir série
  </button>
`;

  /* ===========================
     BLOCO DE DESCANSO (CONDICIONAL)
  ============================ */

  let descansoHTML = "";

  // 🔥 CLUSTER — timer próprio
  if (ex._isCluster) {
    descansoHTML = `
      <div class="ff-cluster-wrap" data-cluster="true">

        <button class="ff-cluster-btn" data-cluster-start>
          ▶️ Iniciar bloco
        </button>

        <div class="ff-cluster-timer hidden">
          <span class="ff-cluster-count">10</span>s
          <div class="ff-cluster-bar">
            <div class="ff-cluster-fill"></div>
          </div>
        </div>

      </div>
    `;
  }
   
if (ex._isRestPause && ex._isUltimoDoCombo) {
  descansoHTML = `
    <div class="ff-restpause-wrap hidden" data-rp="true">

      <p class="ff-restpause-label">
        ⚡ Rest-Pause — reduza a carga e execute novamente
      </p>

      <button class="ff-restpause-btn">
        ▶️ Iniciar pausa RP
      </button>

      <span class="ff-restpause-status">
        Pausa curta • execute novamente
      </span>

      <div class="ff-rp-bar">
        <div class="ff-rp-fill"></div>
      </div>
    </div>
  `;
}


 let observacoesHTML = "";

// 🐢 Cadência
if (ex._cadenciaExcentrica) {
  observacoesHTML += `
    <div class="ff-cadencia-note">
      🐢 Controle a descida do movimento
    </div>
  `;
}

// 🧊 Isometria
if (ex._isometriaTempo) {
  observacoesHTML += `
    <div class="ff-isometria-note">
      🧊 Segure ${ex._isometriaTempo}s na contração
    </div>
  `;
}


   

  // ⚠️ COMBO — descanso só no último
  else if (ex._hideRest) {
    descansoHTML = "";
  }

  // ✅ NORMAL
  else {
    descansoHTML = `
      <div class="ff-descanso-wrap">
        <button class="ff-descanso-btn btnStartTimer">
          ▶️ Iniciar descanso
        </button>

        <span class="ff-timer-count">${fmtTime(intervalo)}</span>

        <div class="ff-timer-bar" data-timer="${intervalo}">
          <div class="ff-timer-fill"></div>
        </div>
      </div>
    `;
  }

  /* ===========================
     RENDER FINAL
  ============================ */

return `
  <div class="ff-ex-item"
       data-combo-index="${ex._comboIndex || 1}"
       data-combo-total="${ex._comboTotal || 1}"
       ${isRP ? 'data-rp-required="true" data-rp-done="false"' : ''}>

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

    <!-- 📊 PROGRESSO DE SÉRIES -->
    ${serieProgressHTML}

    <!-- ✅ CONCLUIR SÉRIE -->
    ${serieBtnHTML}

    <!-- 🧠 OBSERVAÇÕES TÉCNICAS (RP / ISOMETRIA / CADÊNCIA) -->
    ${observacoesHTML}

    <!-- ⏱️ DESCANSO OU REST-PAUSE -->
    ${descansoHTML}

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
   
function initClusterTimers() {
  const nodes = document.querySelectorAll("[data-cluster='true']");
  console.log("🟣 initClusterTimers() nodes:", nodes.length);

  nodes.forEach((wrap, idx) => {
    const btn      = wrap.querySelector("[data-cluster-start]");
    const timerBox = wrap.querySelector(".ff-cluster-timer");
    const countEl  = wrap.querySelector(".ff-cluster-count");
    const fill     = wrap.querySelector(".ff-cluster-fill");

    if (!btn || !timerBox || !countEl || !fill) {
      console.warn("⚠️ Cluster wrap incompleto:", { idx });
      return;
    }

    // evita múltiplos binds
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    let tempo = 10;
    let rodando = false;
    let intv = null;

    btn.addEventListener("click", () => {

      if (rodando) return;

      rodando = true;
      btn.textContent = "⏸️ Rodando…";
      timerBox.classList.remove("hidden");

      tempo = 10;
      countEl.textContent = tempo;
      fill.style.width = "100%";

      clearInterval(intv);
      intv = setInterval(() => {
        tempo--;
        if (tempo < 0) tempo = 0;

        countEl.textContent = tempo;
        fill.style.width = `${(tempo / 10) * 100}%`;

        if (tempo <= 0) {
          clearInterval(intv);
          rodando = false;
          btn.textContent = "▶️ Próximo bloco";
          timerBox.classList.add("hidden");
        }
      }, 1000);
    });
  });
}

function initRestPause() {

  document.querySelectorAll("[data-rp='true']").forEach(rpWrap => {

    const btn  = rpWrap.querySelector(".ff-restpause-btn");
    const fill = rpWrap.querySelector(".ff-rp-fill");

    if (!btn || !fill) return;

    let rodando = false;
    let intv = null;
    const pausa = 20;

    btn.addEventListener("click", () => {
      if (rodando) return;

      rodando = true;
      btn.textContent = "⏸️ Pausando…";
      fill.style.width = "100%";

      let restante = pausa;

      clearInterval(intv);
      intv = setInterval(() => {
        restante--;
        fill.style.width = `${(restante / pausa) * 100}%`;

        if (restante <= 0) {
          clearInterval(intv);
          rodando = false;

          btn.textContent = "✔️ RP concluído";

          const exItem = rpWrap.closest(".ff-ex-item");
          if (exItem) {
            exItem.dataset.rpDone = "true";
          }

          // 🔥 DISPARA EVENTO PARA O CONTADOR DE SÉRIES
         rpWrap.dispatchEvent(
  new CustomEvent("rp:concluido", { bubbles: true })
);

        }
      }, 1000);
    });
  });
}



function initSeriesProgress() {

  document.querySelectorAll(".ff-ex-item").forEach(exItem => {

    const progressEl = exItem.querySelector("[data-role='serie-progress']");
    const btnSerie   = exItem.querySelector("[data-role='serie-next']");
    const rpWrap     = exItem.querySelector("[data-rp='true']");

    if (!progressEl || !btnSerie) return;

    let atual = Number(progressEl.dataset.serieAtual || 1);
    const total = Number(progressEl.dataset.serieTotal || 1);

    const exigeRP = !!rpWrap;
    let rpConcluido = false;

    /* ===============================
       EVENTO → RP CONCLUÍDO
    =============================== */
    if (rpWrap) {
      rpWrap.addEventListener("rp:concluido", () => {
        rpConcluido = true;
        exItem.dataset.rpDone = "true";

        btnSerie.disabled = false;
        btnSerie.textContent = "✔️ Finalizar exercício";
      }, { once: true });
    }

    /* ===============================
       CLICK → CONCLUIR SÉRIE
    =============================== */
    btnSerie.addEventListener("click", () => {

      /* 🔹 AINDA NÃO CHEGOU NA ÚLTIMA SÉRIE */
      if (atual < total - 1) {
        atual++;
        progressEl.dataset.serieAtual = atual;
        progressEl.innerHTML = `Série <b>${atual}</b> / ${total}`;
        return;
      }

      /* 🔥 ENTROU NA ÚLTIMA SÉRIE → MOSTRA RP */
      if (atual === total - 1 && exigeRP && !rpConcluido) {
        atual++;
        progressEl.dataset.serieAtual = atual;
        progressEl.innerHTML = `Série <b>${atual}</b> / ${total}`;

        rpWrap.classList.remove("hidden");

        btnSerie.textContent = "⚡ Executar Rest-Pause";
        btnSerie.disabled = true;

        return;
      }

      /* ✅ FINALIZA EXERCÍCIO */
      if (atual === total && (!exigeRP || rpConcluido)) {
        btnSerie.textContent = "✔️ Exercício concluído";
        btnSerie.classList.add("done");
        btnSerie.disabled = true;

        exItem.classList.add("ff-ex-done");
      }

    });

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
      if (!phase) return;
         phase.textContent = "Toque para iniciar";


     function atualizar() {
  if (!phase) return;
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
     6. SALVAR PESO AUTOMATICAMENTE
============================================================ */
function initPeso() {
  document.querySelectorAll(".ff-ex-peso").forEach(inp => {

    inp.addEventListener("change", async () => {

      const exercicio = inp.dataset.ex;  // Nome oficial do exercício
      const peso      = inp.value.trim();

      const card = inp.closest(".ff-ex-item");

      // Capturar séries e reps reais do card (correto)
      const reps   = card.querySelector(".ff-info-line span:nth-child(2) b")?.textContent || "";
      const series = card.querySelector(".ff-info-line span:nth-child(1) b")?.textContent || "";

      // DiaPrograma já carregado no início do treino.js
      const diaPrograma = FEMFLOW.diaProgramaAtual || 1;

      if (!id) {
        console.warn("⚠️ Sem ID no localStorage para salvar evolução");
        return;
      }
      const diaCiclo = Number(localStorage.getItem("femflow_diaCiclo") || 1);
const treino = `${FEMFLOW.enfaseAtual}_dia_${diaCiclo}`;


 
      try {
        const resp = await FEMFLOW.post({
  action: "salvarevolucao",
  id,
  treino,
  exercicio,
  peso,
  reps,
  series,
  pse: 0,
  diaPrograma
});


       console.log("📈 EVOLUÇÃO AUTOMÁTICA:", resp);


        FEMFLOW.toast("Peso registrado!");

      } catch (err) {
        console.error("❌ Erro ao salvar evolução automática:", err);
        FEMFLOW.toast("Erro ao salvar evolução", "error");
      }

    }); // fim do change listener

  }); // fim do forEach
}

/* ============================================================
   7. SALVAR TREINO — VERSÃO FINAL CORRETA
============================================================ */
if (btnSalvar) {
  btnSalvar.onclick = () => modalPSE.classList.remove("hidden");
}

if (btnCancelarPSE) {
  btnCancelarPSE.onclick = () => modalPSE.classList.add("hidden");
}

if (btnConfirmarPSE) {
  btnConfirmarPSE.onclick = async () => {

    const fase        = localStorage.getItem("femflow_fase");
    const diaCiclo    = Number(localStorage.getItem("femflow_diaCiclo") || 1);
    const diaPrograma = Number(localStorage.getItem("femflow_diaPrograma") || 1);
    const pse         = Number(pseInput.value || 0);

    if (!id) {
      FEMFLOW.toast("Erro: sessão inválida.", true);
      return;
    }

    try {
      const treino = `${FEMFLOW.enfaseAtual}_dia_${diaCiclo}`;
        const resp = await FEMFLOW.post({
      action: "salvartreino",
id,
diaPrograma,
diaCiclo,
pse,
treino,

        deviceId: FEMFLOW.getDeviceId(),
        sessionToken: FEMFLOW.getSessionToken()
      });

      FEMFLOW.log("📌 salvarTreino:", resp);

      if (resp?.status === "ok") {

        // 🔥 BACKEND É A FONTE DA VERDADE
        if (resp.diaPrograma) {
          localStorage.setItem("femflow_diaPrograma", String(resp.diaPrograma));
        }

        if (resp.novaFase) {
          localStorage.setItem("femflow_fase", resp.novaFase);
        }

        if (resp.novoDiaCiclo) {
          localStorage.setItem("femflow_diaCiclo", String(resp.novoDiaCiclo));
        }

        FEMFLOW.toast("Treino salvo com sucesso! 💪");

      } else {
        FEMFLOW.toast("Erro ao salvar treino.", true);
      }

    } catch (err) {
      FEMFLOW.error("Erro salvar treino:", err);
      FEMFLOW.toast("Erro de conexão.", true);
    }

    modalPSE.classList.add("hidden");
  };
}


/* ============================================================
   8. BOTÃO DESCANSO — VERSÃO FINAL CORRETA
============================================================ */
if (btnDescanso) {
  btnDescanso.onclick = async () => {

    if (!id) {
      FEMFLOW.toast("Erro: sessão inválida.", true);
      return;
    }

    try {
      const resp = await FEMFLOW.post({
        action: "salvarDescanso",
        id,
        deviceId: FEMFLOW.getDeviceId(),
        sessionToken: FEMFLOW.getSessionToken()
      });

      FEMFLOW.log("📌 descanso:", resp);

      if (resp?.status === "ok") {

        // 🔥 Atualiza SOMENTE pelo retorno do backend
        if (resp.diaPrograma) {
          localStorage.setItem("femflow_diaPrograma", String(resp.diaPrograma));
        }

        FEMFLOW.toast("Descanso registrado 🧘‍♀️");

      } else {
        FEMFLOW.toast("Erro ao registrar descanso.", true);
      }

    } catch (e) {
      FEMFLOW.error("Erro descanso:", e);
      FEMFLOW.toast("Erro ao salvar descanso.", true);
    }
  };
}


/* ============================================================
   🔥 PATCH EVOLUÇÃO – BUSCAR ÚLTIMO PESO
============================================================ */
async function getUltimoPeso(id, exercicio) {
  try {
   const resp = await FEMFLOW.post({
  action: "getultimopeso",
  id,
  exercicio
});
return resp?.peso || "";
  } catch (e) {
    console.warn("Erro ao buscar último peso:", e);
    return "";
  }
}

/* ============================================================
   Preencher automaticamente (modo futuro se abrir modal)
============================================================ */
async function preencherUltimoPeso(exercicioSlug) {
  const peso = await getUltimoPeso(id, exercicioSlug);
  const input = document.querySelector("#input-peso");
  if (input && peso) input.value = peso;
}

/* ============================================================
   salvarEvolucaoFront (mantido para modais custom)
============================================================ */
async function salvarEvolucaoFront(exercicioSlug) {

  const peso    = document.querySelector("#input-peso")?.value || "";
  const reps    = document.querySelector("#input-reps")?.value || "";
  const series  = document.querySelector("#input-series")?.value || "";
  const pse     = FEMFLOW.estadoPSE || 0;
  const diaProg = FEMFLOW.diaProgramaAtual || 1;

  try {
  const resp = await FEMFLOW.post({
  action: "salvarEvolucao",
  id,
  exercicio: exercicioSlug,
  peso,
  reps,
  series,
  pse,
  diaPrograma: diaProg
});


    const json = await resp.json();
    console.log("📈 Evolução salva:", json);

    FEMFLOW.toast("Evolução registrada!");

  } catch (err) {
    console.error("Erro ao salvar evolução:", err);
    FEMFLOW.toast("Erro ao salvar evolução", "error");
  }
}
 
}); // ← fecha o DOMContentLoaded

window.getSerieEspecialInfo = function (codigo) {
  if (!codigo) return null;

  const lang = FEMFLOW.lang || "pt";
  const series = FEMFLOW.langs?.[lang]?.series;

  return series?.[codigo] || null;
};
window.getHiitInfo = function ({ forte, leve, ciclos }) {
  const lang = FEMFLOW.lang || "pt";
  const hiit = FEMFLOW.langs?.[lang]?.treino?.hiit;
  if (!hiit) return null;

  return {
    protocolo: hiit.protocolo
      .replace("{forte}", forte)
      .replace("{leve}", leve),

    descricao: hiit.descricao
      .replace("{forte}", forte)
      .replace("{leve}", leve),

    ciclos: hiit.ciclos.replace("{ciclos}", ciclos),

    exemplosAcademia: hiit.exemplosAcademia,
    exemplosCasa: hiit.exemplosCasa,
    iniciar: hiit.iniciar
  };
};
window.getTreinoText = function (path, fallback = "") {
  const lang = FEMFLOW.lang || "pt";
  const parts = String(path || "").split(".");
  let cur = FEMFLOW.langs?.[lang];

  for (const p of parts) {
    cur = cur?.[p];
    if (cur == null) return fallback;
  }
  return cur ?? fallback;
};

window.getAquecimentoUI = function () {
  return {
    sugestao: getTreinoText("treino.aquecimento.sugestao",
      "💨 Sugestão: prepare seu corpo com uma respiração consciente antes de começar."
    ),
    btn: getTreinoText("treino.aquecimento.btn",
      "🌬️ Abrir protocolos de respiração"
    )
  };
};

window.getResfriamentoUI = function () {
  return {
    sugestao: getTreinoText("treino.resfriamento.sugestao",
      "🌬️ Sugestão: finalize seu treino desacelerando com respiração suave."
    ),
    btn: getTreinoText("treino.resfriamento.btn",
      "💗 Fazer respiração de fechamento"
    )
  };
};
window.t = function (path, vars = {}) {
  const lang = FEMFLOW.lang || "pt";
  const parts = path.split(".");
  
  let text = FEMFLOW.langs?.[lang];
  for (const p of parts) {
    text = text?.[p];
  }

  if (typeof text !== "string") return path;

  return text
    // 🔁 suporta {variavel}
    .replace(/\{(\w+)\}/g, (_, key) => {
      return vars[key] !== undefined ? vars[key] : `{${key}}`;
    })
    // 🔁 suporta {{variavel}} (legado)
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return vars[key] !== undefined ? vars[key] : `{{${key}}}`;
    });
};




