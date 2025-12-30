/* =======================================================================
   🌸 FEMFLOW CORE — VERSÃO FINAL 5.3 AJUSTADA — 2025
   Arquitetura Stargate — Estável • Seguro • Sem sobrescrever produto
======================================================================= */

window.FEMFLOW = window.FEMFLOW || {};

/* ===========================================================
   1. CONFIG GLOBAL
=========================================================== */

FEMFLOW.SCRIPT_URL = "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";
FEMFLOW.API_URL = FEMFLOW.SCRIPT_URL;

FEMFLOW.lang = localStorage.getItem("femflow_lang") || "pt";
FEMFLOW.setLang = function (lang) {
  FEMFLOW.lang = lang;
  localStorage.setItem("femflow_lang", lang);
  document.dispatchEvent(new Event("femflow:langChange"));
};

FEMFLOW.t = function (key) {
  const lang = FEMFLOW.lang || "pt";
  const parts = key.split(".");
  let obj = window.FEMFLOW_LANG?.[lang] || window.FEMFLOW_LANG?.pt;

  for (const p of parts) {
    if (!obj || obj[p] === undefined) return key;
    obj = obj[p];
  }
  return obj;
};

FEMFLOW.dispatch = function(type, detail = {}) {
  document.dispatchEvent(
    new CustomEvent(`femflow:${type}`, { detail })
  );
};

/* ============================================================
   🔐 FEMFLOW — Device + Session helpers
============================================================ */

FEMFLOW.getDeviceId = function () {
  // 1️⃣ tenta localStorage
  let d = localStorage.getItem("femflow_device_id");
  if (d) return d;

  // 2️⃣ tenta cookie persistente
  const m = document.cookie.match(/(?:^|;)\s*ff_device=([^;]+)/);
  if (m && m[1]) {
    d = decodeURIComponent(m[1]);
    localStorage.setItem("femflow_device_id", d);
    return d;
  }

  // 3️⃣ gera novo (primeiro acesso real)
  d =
    crypto?.randomUUID?.() ||
    ("dev-" + Date.now() + "-" + Math.random().toString(36).slice(2));

  // salva nos dois
  localStorage.setItem("femflow_device_id", d);
  document.cookie =
    "ff_device=" +
    encodeURIComponent(d) +
    "; path=/; max-age=31536000; SameSite=Lax";

  return d;
};


FEMFLOW.getSessionToken = function () {
  return localStorage.getItem("femflow_session_token") || "";
};

FEMFLOW.setSessionToken = function (token) {
  if (token) {
    localStorage.setItem("femflow_session_token", token);
  }
};

FEMFLOW.clearSession = function () {
  localStorage.removeItem("femflow_session_token");
};


FEMFLOW.dev = () => localStorage.getItem("femflow_dev") === "on";
FEMFLOW.log   = (...a) => FEMFLOW.dev() && console.log("%c[FEMFLOW]", "color:#cc6a5a", ...a);
FEMFLOW.warn  = (...a) => FEMFLOW.dev() && console.warn("%c[FEMFLOW ⚠]", "color:#e07f67", ...a);
FEMFLOW.error = (...a) => FEMFLOW.dev() && console.error("%c[FEMFLOW ❌]", "color:#b74333", ...a);

FEMFLOW.toast = (msg, error = false) => {
  let box = document.querySelector(".toast-box");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.classList.toggle("error", error);
  box.classList.add("visible");
  setTimeout(() => box.classList.remove("visible"), 2400);
};

FEMFLOW.toggleBodyScroll = function (locked) {
  document.body.classList.toggle("ff-modal-open", locked);
};
/* ============================================================
   ⏳ LOADING GLOBAL — FEMFLOW (PADRÃO OFICIAL)
============================================================ */

FEMFLOW.loading = FEMFLOW.loading || {};

FEMFLOW.loading.show = function (msg = "Processando…") {
  let box = document.getElementById("ff-loading");

  if (!box) {
    box = document.createElement("div");
    box.id = "ff-loading";
    box.className = "ff-loading";
    box.innerHTML = `
      <div class="ff-loading-box">
        <div class="ff-spinner"></div>
        <p id="ff-loading-text">${msg}</p>
      </div>
    `;
    document.body.appendChild(box);
  } else {
    const text = document.getElementById("ff-loading-text");
    if (text) text.textContent = msg;
    box.classList.remove("hidden");
  }
};

FEMFLOW.loading.hide = function () {
  const box = document.getElementById("ff-loading");
  if (box) box.classList.add("hidden");
};

FEMFLOW.log = function (...args) {
  if (localStorage.getItem("femflow_dev") === "true") {
    console.log("[FemFlow]", ...args);
  }
};



FEMFLOW.getSession = function () {
  return {
    deviceId: FEMFLOW.getDeviceId(),
    sessionToken: FEMFLOW.getSessionToken()
  };
};
/* ============================================================
   🌐 POST SEGURO — inclui sessão automaticamente
============================================================ */

FEMFLOW.post = async function (payload) {
  const session = FEMFLOW.getSession();

  const body = {
    ...payload,
    ...session
  };

  const resp = await fetch(FEMFLOW.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(r => r.json());

  // Sessão inválida ou bloqueada
  if (resp?.status === "blocked" || resp?.status === "denied") {
    FEMFLOW.toast?.("Sessão inválida. Faça login novamente.", true);
    FEMFLOW.clearSession();

localStorage.removeItem("femflow_auth");
localStorage.removeItem("femflow_id");
localStorage.removeItem("femflow_email");
// ❗ NÃO remover femflow_device_id
    location.href = "index.html";
    throw new Error("Sessão inválida");
  }

  return resp;
};


/* ===========================================================
   DIA PROGRAMA — CONTADOR CONTÍNUO (GLOBAL)
=========================================================== */
FEMFLOW.getDiaPrograma = async function () {

  // 1) tentar ler do localStorage
  let d = Number(localStorage.getItem("femflow_diaPrograma"));

  if (d && !isNaN(d) && d > 0) {
    return d; // retorno imediato
  }

  // 2) fallback → buscar no backend
  const id = localStorage.getItem("femflow_id");
  if (!id) return 1;

  try {
   const resp = await FEMFLOW.post({
  action: "getdiaprograma",
  id
});


    if (resp?.diaPrograma > 0) {
      localStorage.setItem("femflow_diaPrograma", resp.diaPrograma);
      return resp.diaPrograma;
    }
  } catch (e) {
    console.warn("⚠️ Erro ao buscar DiaPrograma do backend:", e);
  }

  // fallback final
  localStorage.setItem("femflow_diaPrograma", "1");
  return 1;
};


FEMFLOW.setDiaPrograma = async function (novoValor) {
  novoValor = Number(novoValor) || 1;

  // Local
  localStorage.setItem("femflow_diaPrograma", String(novoValor));

  // Backend
  const id = localStorage.getItem("femflow_id");
  if (!id) return;

  try {
    await FEMFLOW.post({
  action: "setDiaPrograma",
  id,
  diaPrograma: novoValor
});

 } catch (e) {
    console.warn("⚠️ Falhou envio DiaPrograma para backend:", e);
  }
};


FEMFLOW.incrementarDiaPrograma = async function () {
  let d = Number(localStorage.getItem("femflow_diaPrograma")) || 1;
  d++;

  await FEMFLOW.setDiaPrograma(d);

  return d;
};


FEMFLOW.reiniciarDiaPrograma = async function () {
  await FEMFLOW.setDiaPrograma(1);
  return 1;
};


/* ===========================================================
   2. ROUTER
=========================================================== */

FEMFLOW.router = pag => {
  const destino = pag.endsWith(".html") ? pag : pag + ".html";

  if (localStorage.getItem("femflow_personal") === "true") {
    location.href = `${destino}?personal=1`;
  } else {
    location.href = destino;
  }
};


/* ===========================================================
   3. HEADER
=========================================================== */

FEMFLOW.inserirHeaderApp = function () {
  if (document.querySelector("#femflowHeader")) return;

  const h = document.createElement("header");
  h.id = "femflowHeader";
  h.innerHTML = `
    <img src="./assets/logofemflowterracotasf.png" class="ff-logo">
    <button id="ffMenuBtn" class="ff-menu-btn">&#9776;</button>
  `;

  document.body.prepend(h);

  h.querySelector("#ffMenuBtn").onclick = () =>
    document.querySelector(".ff-menu-modal")?.classList.add("active");
};

/* ===========================================================
   🌸 COMMIT DE MUDANÇAS ESTRUTURAIS (NÍVEL / CICLO)
   Fonte da verdade: BACKEND
=========================================================== */
FEMFLOW.commitMudanca = async function ({ tipo, payload = {} }) {
  const id = localStorage.getItem("femflow_id");
  if (!id) return;

  FEMFLOW.log?.("Commit mudança:", tipo, payload);

  try {
    // ----------------------------
    // 🔁 MUDANÇA DE NÍVEL
    // ----------------------------
    if (tipo === "nivel" && payload.nivel) {
      await FEMFLOW.post({
        action: "setnivel",
        id,
        nivel: payload.nivel
      });

      // reset de programa é OBRIGATÓRIO
      await FEMFLOW.post({
        action: "resetprograma",
        id
      });

      localStorage.setItem("femflow_nivel", payload.nivel);
      localStorage.removeItem("femflow_diaPrograma");
    }

    // ----------------------------
    // 🌙 MUDANÇA DE CICLO
    // ----------------------------
    if (tipo === "ciclo") {
      if (payload.perfilHormonal) {
        await FEMFLOW.post({
          action: "setperfilhormonal",
          id,
          perfil: payload.perfilHormonal
        });
      }

      if (payload.startDate) {
        await FEMFLOW.post({
          action: "setciclostart",
          id,
          startDate: payload.startDate
        });
      }

      // sempre resetar programa
      await FEMFLOW.post({
        action: "resetprograma",
        id
      });

      if (payload.perfilHormonal) {
        localStorage.setItem("femflow_perfilHormonal", payload.perfilHormonal);
      }

      if (payload.startDate) {
        localStorage.setItem("femflow_startDate", payload.startDate);
      }

      localStorage.removeItem("femflow_diaPrograma");
    }

  } catch (err) {
    console.error("Erro commitMudanca:", err);
    FEMFLOW.toast?.("Erro ao aplicar mudança. Tente novamente.");
  }
};



/* ===========================================================
   4. SYNC (NÃO altera produto)
=========================================================== */

FEMFLOW.carregarCicloBackend = async function () {
  FEMFLOW.log("🔄 SYNC ciclo…");

  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const resp = await fetch(`${FEMFLOW.SCRIPT_URL}?action=sync&id=${id}`).then(r => r.json());
    FEMFLOW.log("📌 SYNC:", resp);

    if (!resp || !resp.fase) return null;

    // Dados hormonais — sem alterar produto/ativa/personal
    localStorage.setItem("femflow_fase", resp.fase);
    localStorage.setItem("femflow_diaCiclo", resp.diaCiclo);
    localStorage.setItem("femflow_perfilHormonal", resp.perfilHormonal);
    localStorage.setItem("femflow_nivel", resp.nivel);
    localStorage.setItem("femflow_enfase", resp.enfase);
    localStorage.setItem("femflow_cycleLength", resp.ciclo_duracao);
    localStorage.setItem("femflow_startDate", resp.data_inicio);

    return resp;

  } catch (err) {
    FEMFLOW.error("❌ SYNC falhou:", err);
    return null;
  }
};

/* ===========================================================
   5. MENU LATERAL
=========================================================== */

FEMFLOW.renderMenuLateral = function () {
  const modal = document.querySelector(".ff-menu-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="ff-menu-box">
      <h2 class="ff-menu-title">${FEMFLOW.t("menu.title")}</h2>

      <button class="ff-menu-op ff-close" data-go="fechar">✖️ ${FEMFLOW.t("menu.fechar")}</button>
      <button class="ff-menu-op" data-go="idioma">🌐 ${FEMFLOW.t("menu.idioma")}</button>
      <button class="ff-menu-op" data-go="sac">🛟 ${FEMFLOW.t("menu.sac")}</button>
      <button class="ff-menu-op" data-go="ciclo">🎯 ${FEMFLOW.t("menu.ciclo")}</button>
      <button class="ff-menu-op" data-go="respiracao">💨 ${FEMFLOW.t("menu.respiracao")}</button>
      <button class="ff-menu-op" data-go="treinos">🏃 ${FEMFLOW.t("menu.treinos")}</button>
      <button class="ff-menu-op" data-go="nivel">📊 ${FEMFLOW.t("menu.nivel")}</button>
      <button class="ff-menu-op" data-go="tema">🌓 ${FEMFLOW.t("menu.tema")}</button>
      <button class="ff-menu-op" data-go="voltar">🔙 ${FEMFLOW.t("menu.voltar")}</button>

      <button class="ff-logout" data-go="logout">🚪 ${FEMFLOW.t("menu.sair")}</button>
    </div>
  `;

  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn =>
    btn.onclick = () => FEMFLOW._acaoMenu(btn.dataset.go)
  );
};

FEMFLOW.inserirMenuLateral = function () {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";

  document.body.appendChild(modal);

  FEMFLOW.renderMenuLateral();

  modal.onclick = e => {
    if (e.target.classList.contains("ff-menu-modal"))
      modal.classList.remove("active");
  };
};

document.addEventListener("femflow:langChange", () => {
  FEMFLOW.renderMenuLateral?.();
  FEMFLOW.renderSAC?.();
});

/* ===========================================================
   6. MODAL DE IDIOMA
=========================================================== */

FEMFLOW.inserirModalIdioma = function () {

  if (document.querySelector("#ff-lang-modal")) return;

  const modal = document.createElement("div");
  modal.id = "ff-lang-modal";
  modal.className = "ff-lang-modal hidden";

  modal.innerHTML = `
    <div class="ff-lang-box">
      <h2>🌐 Idioma / Language / Langue</h2>

      <button class="ff-lang-btn" data-lang="pt">🇧🇷 Português</button>
      <button class="ff-lang-btn" data-lang="en">🇺🇸 English</button>
      <button class="ff-lang-btn" data-lang="fr">🇫🇷 Français</button>

      <button class="ff-lang-close">✖ Fechar</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", e => {
    if (e.target.id === "ff-lang-modal") modal.classList.add("hidden");
  });

  modal.querySelectorAll(".ff-lang-btn").forEach(btn => {
    btn.onclick = () => {
      const lang = btn.dataset.lang;
      localStorage.setItem("femflow_lang", lang);
      FEMFLOW.toast("Idioma atualizado!");
      setTimeout(() => location.reload(), 500);
    };
  });

  modal.querySelector(".ff-lang-close").onclick =
    () => modal.classList.add("hidden");
};

/* ===========================================================
   6.5 MODAL SAC
=========================================================== */

FEMFLOW.renderSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="ff-sac-box">
      <h2>🛟 ${FEMFLOW.t("sac.title")}</h2>

      <p>${FEMFLOW.t("sac.subtitle")}</p>

      <div class="ff-sac-options">
        <label><input type="radio" name="sac_cat" value="treino"> ${FEMFLOW.t("sac.options.treino")}</label>
        <label><input type="radio" name="sac_cat" value="ciclo"> ${FEMFLOW.t("sac.options.ciclo")}</label>
        <label><input type="radio" name="sac_cat" value="registro"> ${FEMFLOW.t("sac.options.registro")}</label>
        <label><input type="radio" name="sac_cat" value="acesso"> ${FEMFLOW.t("sac.options.acesso")}</label>
        <label><input type="radio" name="sac_cat" value="outro"> ${FEMFLOW.t("sac.options.outro")}</label>
      </div>

      <textarea id="ff-sac-msg" placeholder="${FEMFLOW.t("sac.placeholder")}"></textarea>

      <div class="ff-sac-actions">
        <button id="ff-sac-enviar">${FEMFLOW.t("sac.enviar")}</button>
        <button id="ff-sac-cancelar">${FEMFLOW.t("sac.cancelar")}</button>
      </div>
    </div>
  `;

  const closeModal = () => {
    modal.classList.add("hidden");
    FEMFLOW.toggleBodyScroll(false);
  };

  modal.onclick = e => {
    if (e.target.id === "ff-sac-modal") closeModal();
  };

  modal.querySelector("#ff-sac-cancelar").onclick = closeModal;
  modal.querySelector("#ff-sac-enviar").onclick = FEMFLOW.enviarSAC;
};

FEMFLOW.inserirModalSAC = function () {
  if (document.getElementById("ff-sac-modal")) return;

  const modal = document.createElement("div");
  modal.id = "ff-sac-modal";
  modal.className = "ff-sac-modal hidden";

  document.body.appendChild(modal);
  FEMFLOW.renderSAC();
};

FEMFLOW.abrirModalSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  FEMFLOW.toggleBodyScroll(true);
};

FEMFLOW.fecharModalSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  FEMFLOW.toggleBodyScroll(false);
};

FEMFLOW.enviarSAC = async function () {
  const cat = document.querySelector("input[name='sac_cat']:checked")?.value;
  if (!cat) return FEMFLOW.toast(FEMFLOW.t("sac.selecione"));

  const mensagem = document.getElementById("ff-sac-msg").value || "";

  const payload = {
    action: "sac_abrir",
    id: localStorage.getItem("femflow_id"),
    categoria: cat,
    mensagem,
    contexto: {
      pagina: location.pathname.split("/").pop(),
      fase: localStorage.getItem("femflow_fase"),
      diaCiclo: Number(localStorage.getItem("femflow_diaCiclo") || 0),
      diaPrograma: Number(localStorage.getItem("femflow_diaPrograma") || 0),
      perfilHormonal: localStorage.getItem("femflow_perfilHormonal"),
      nivel: localStorage.getItem("femflow_nivel"),
      enfase: localStorage.getItem("femflow_enfase")
    }
  };

  try {
    FEMFLOW.loading.show(FEMFLOW.t("sac.enviando"));
    await FEMFLOW.post(payload);
    FEMFLOW.toast(FEMFLOW.t("sac.sucesso"));
    FEMFLOW.fecharModalSAC();
  } catch (e) {
    FEMFLOW.toast(FEMFLOW.t("sac.erro"), true);
  } finally {
    FEMFLOW.loading.hide();
  }
};

/* ===========================================================
   7. AÇÕES DO MENU
=========================================================== */

FEMFLOW._acaoMenu = function (op) {
  document.querySelector(".ff-menu-modal")?.classList.remove("active");

  switch (op) {

    case "idioma":
      document.getElementById("ff-lang-modal")?.classList.remove("hidden");
      break;

    case "sac":
      FEMFLOW.abrirModalSAC();
      break;

    case "ciclo":
  
 // dispatch
FEMFLOW.dispatch("stateChanged", {
  type: "ciclo",
  impact: "fisiologico",
  source: location.pathname.includes("home") ? "home" : "flowcenter"
});
;

 
      FEMFLOW.router(`ciclo?ret=${location.pathname.split("/").pop()}`);
      break;

    case "respiracao":
      FEMFLOW.router("respiracao");
      break;

    case "treinos":
      FEMFLOW.router("evolucao");
      break;

    case "nivel":
      // ⚠️ apenas abre modal
      // o dispatch estrutural acontece SOMENTE na confirmação do nível
      document.querySelector("#modal-nivel")?.classList.remove("oculto");
      break;

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "femflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "logout":
      FEMFLOW.clearSession();
      localStorage.removeItem("femflow_id");
      localStorage.removeItem("femflow_auth");
      localStorage.removeItem("femflow_email");
      location.href = "index.html";
      break;

    case "voltar": {
      const p = location.pathname.split("/").pop();
      const rota = {
        "treino.html": "flowcenter.html",
        "flowcenter.html": "home.html",
        "respiracao.html": "flowcenter.html",
        "evolucao.html": "flowcenter.html",
        "ciclo.html": "home.html"
      };
      FEMFLOW.router(rota[p] || "home.html");
      break;
    }
  }
};


FEMFLOW.resetProgramaAtual = function () {
  localStorage.removeItem("femflow_diaPrograma");
  localStorage.removeItem("femflow_enfase");
  localStorage.removeItem("femflow_treinoAtual");
};
FEMFLOW.initNivelHandler = function () {
  const modal = document.getElementById("modal-nivel");
  const btnConfirmar = document.getElementById("btnConfirmarNivel");
  const btnFechar = document.getElementById("fecharNivel");

  if (!modal || !btnConfirmar || !btnFechar) return; // 🔧 proteção

  btnConfirmar.dataset.bound = "true";

  modal.querySelectorAll(".nivel-btn").forEach(btn => {
    btn.onclick = () => {
      modal.querySelectorAll(".nivel-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  btnConfirmar.onclick = async () => {
    const nivel = modal.querySelector(".nivel-btn.active")?.dataset.nivel;
    if (!nivel) return FEMFLOW.toast("Selecione um nível");

    localStorage.setItem("femflow_nivel", nivel);

    await FEMFLOW.post({
      action: "setnivel",
      id: localStorage.getItem("femflow_id"),
      nivel
    });

    FEMFLOW.dispatch("stateChanged", {
      type: "nivel",
      impact: "estrutural",
      source: location.pathname.includes("home") ? "home" : "flowcenter"
    });

    modal.classList.add("oculto");
  };

  btnFechar.onclick = () => modal.classList.add("oculto");
};

/* ===========================================================
   8. CARREGAR PERFIL (VALIDAR)
=========================================================== */

FEMFLOW.carregarPerfil = async function () {
  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const r = await fetch(`${FEMFLOW.SCRIPT_URL}?action=validar&id=${id}`).then(r => r.json());
    if (r.status !== "ok") return null;

    localStorage.setItem("femflow_nome", r.nome || "Aluna");
    localStorage.setItem("femflow_fase", r.fase);
    localStorage.setItem("femflow_enfase", r.enfase);
    localStorage.setItem("femflow_diaCiclo", r.diaCiclo);
    localStorage.setItem("femflow_nivel", r.nivel);
    localStorage.setItem("femflow_startDate", r.data_inicio);
    localStorage.setItem("femflow_cycleLength", r.ciclo_duracao);
    localStorage.setItem("femflow_perfilHormonal", r.perfilHormonal);

    const produtoRaw = (r.produto || "").toLowerCase().trim();
    const ativaRaw   = r.ativa === true || r.ativa === "true";

    localStorage.setItem("femflow_produto", produtoRaw);
    localStorage.setItem("femflow_ativa", ativaRaw ? "true" : "false");

    if (produtoRaw.includes("personal"))
      localStorage.setItem("femflow_personal", "true");
    else
      localStorage.removeItem("femflow_personal");

    return r;

  } catch (e) {
    FEMFLOW.error("Erro carregarPerfil:", e);
    return null;
  }
};

/* ===========================================================
   9. SYNC + EVENTO READY
=========================================================== */

FEMFLOW.sincronizarECdisparar = async function () {
  const perfil = await FEMFLOW.carregarCicloBackend();

  window.dispatchEvent(new CustomEvent("femflow:ready", {
    detail: perfil
  }));
};
/* ===========================================================
   7.5 STATE CHANGED → SEMPRE CAI NO FLOWCENTER
   (FlowCenter valida/sincroniza no começo)
=========================================================== */
document.addEventListener("femflow:stateChanged", e => {
  const {
    impact = "none",
    source = "flowcenter"
  } = e.detail || {};

  if (impact === "none") return;

  if (impact === "fisiologico") {
    FEMFLOW.toast("Ajustes aplicados 🌸");
    FEMFLOW.router(source);
    return;
  }

  if (impact === "estrutural") {
    FEMFLOW.resetProgramaAtual?.();
    FEMFLOW.toast("Estrutura atualizada 🌱");
    FEMFLOW.router(source);
  }
});



/* ===========================================================
   10. INIT — FLUXO PRINCIPAL
=========================================================== */

FEMFLOW.init = async function () {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();

  // HOME → sem SYNC
  if (p === "home.html") {
    this.inserirHeaderApp();
    this.inserirMenuLateral();
    this.inserirModalIdioma();
    this.inserirModalSAC();
     
     // ⏱️ aguarda o DOM completar
    requestAnimationFrame(() => {
      FEMFLOW.initNivelHandler();
    });   
    return;
  }

  // Demais páginas
  if ([
    "flowcenter.html",
    "treino.html",
    "respiracao.html",
    "evolucao.html",
    "followme.html",
    "followme_treino.html"
  ].includes(p)) {

     this.inserirHeaderApp();
    this.inserirMenuLateral();
    this.inserirModalIdioma();
    this.inserirModalSAC();

    requestAnimationFrame(() => {
      FEMFLOW.initNivelHandler();
    });

    if (!localStorage.getItem("femflow_cycle_configured")) {
      location.href = "ciclo.html";
      return;
    }

    await FEMFLOW.sincronizarECdisparar();
  }
};

/* ===========================================================
   11. AUTO START
=========================================================== */

document.addEventListener("DOMContentLoaded", () => FEMFLOW.init());
