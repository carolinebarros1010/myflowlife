/* =======================================================================
   🌸 MALEFLOW CORE — VERSÃO FINAL 5.3 AJUSTADA — 2025
   Arquitetura Stargate — Estável • Seguro • Sem sobrescrever produto
======================================================================= */

window.MALEFLOW = window.MALEFLOW || {};

/* ===========================================================
   1. CONFIG GLOBAL
=========================================================== */

MALEFLOW.SCRIPT_URL = "https://api-myflowlife.falling-wildflower-a8c0.workers.dev/";
MALEFLOW.API_URL = MALEFLOW.SCRIPT_URL;

MALEFLOW.lang = localStorage.getItem("maleflow_lang") || "pt";
MALEFLOW.setLang = function (lang) {
  MALEFLOW.lang = lang;
  localStorage.setItem("maleflow_lang", lang);
  document.dispatchEvent(new Event("maleflow:langChange"));
};

MALEFLOW.t = function (key) {
  const lang = MALEFLOW.lang || "pt";
  const parts = key.split(".");
  let obj = window.MALEFLOW_LANG?.[lang] || window.MALEFLOW_LANG?.pt;

  for (const p of parts) {
    if (!obj || obj[p] === undefined) return key;
    obj = obj[p];
  }
  return obj;
};

MALEFLOW.dispatch = function(type, detail = {}) {
  document.dispatchEvent(
    new CustomEvent(`maleflow:${type}`, { detail })
  );
};

/* ============================================================
   🔐 MALEFLOW — Device + Session helpers
============================================================ */

MALEFLOW.getDeviceId = function () {
  // 1️⃣ tenta localStorage
  let d = localStorage.getItem("maleflow_device_id");
  if (d) return d;

  // 2️⃣ tenta cookie persistente
  const m = document.cookie.match(/(?:^|;)\s*mf_device=([^;]+)/);
  if (m && m[1]) {
    d = decodeURIComponent(m[1]);
    localStorage.setItem("maleflow_device_id", d);
    return d;
  }

  // 3️⃣ gera novo (primeiro acesso real)
  d =
    crypto?.randomUUID?.() ||
    ("dev-" + Date.now() + "-" + Math.random().toString(36).slice(2));

  // salva nos dois
  localStorage.setItem("maleflow_device_id", d);
  document.cookie =
    "mf_device=" +
    encodeURIComponent(d) +
    "; path=/; max-age=31536000; SameSite=Lax";

  return d;
};


MALEFLOW.getSessionToken = function () {
  return localStorage.getItem("maleflow_session_token") || "";
};

MALEFLOW.setSessionToken = function (token) {
  if (token) {
    localStorage.setItem("maleflow_session_token", token);
  }
};

MALEFLOW.clearSession = function () {
  localStorage.removeItem("maleflow_session_token");
};


MALEFLOW.dev = () => localStorage.getItem("maleflow_dev") === "on";
MALEFLOW.log   = (...a) => MALEFLOW.dev() && console.log("%c[MALEFLOW]", "color:#cc6a5a", ...a);
MALEFLOW.warn  = (...a) => MALEFLOW.dev() && console.warn("%c[MALEFLOW ⚠]", "color:#e07f67", ...a);
MALEFLOW.error = (...a) => MALEFLOW.dev() && console.error("%c[MALEFLOW ❌]", "color:#b74333", ...a);

MALEFLOW.toast = (msg, error = false) => {
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

MALEFLOW.toggleBodyScroll = function (locked) {
  document.body.classList.toggle("ff-modal-open", locked);
};
/* ============================================================
   ⏳ LOADING GLOBAL — MALEFLOW (PADRÃO OFICIAL)
============================================================ */

MALEFLOW.loading = MALEFLOW.loading || {};

MALEFLOW.loading.show = function (msg = "Processando…") {
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

MALEFLOW.loading.hide = function () {
  const box = document.getElementById("ff-loading");
  if (box) box.classList.add("hidden");
};

MALEFLOW.log = function (...args) {
  if (localStorage.getItem("maleflow_dev") === "true") {
    console.log("[MaleFlow]", ...args);
  }
};



MALEFLOW.getSession = function () {
  return {
    deviceId: MALEFLOW.getDeviceId(),
    sessionToken: MALEFLOW.getSessionToken()
  };
};
/* ============================================================
   🌐 POST SEGURO — inclui sessão automaticamente
============================================================ */

MALEFLOW.post = async function (payload) {
  if (!payload || !payload.action) {
    console.warn("⚠️ MALEFLOW.post sem action:", payload);
    return { status: "ignored", msg: "missing_action" };
  }

  const session = MALEFLOW.getSession();

  const body = {
    ...payload,
    ...session
  };

  const resp = await fetch(MALEFLOW.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(r => r.json());

  // Sessão inválida ou bloqueada
  if (resp?.status === "blocked" || resp?.status === "denied") {
    MALEFLOW.toast?.("Sessão inválida. Faça login novamente.", true);
    MALEFLOW.clearSession();

localStorage.removeItem("maleflow_auth");
localStorage.removeItem("maleflow_id");
localStorage.removeItem("maleflow_email");
// ❗ NÃO remover maleflow_device_id
    location.href = "index.html";
    throw new Error("Sessão inválida");
  }

  return resp;
};


/* ===========================================================
   DIA PROGRAMA — CONTADOR CONTÍNUO (GLOBAL)
=========================================================== */
MALEFLOW.getDiaPrograma = async function () {

  // 1) tentar ler do localStorage
  let d = Number(localStorage.getItem("maleflow_diaPrograma"));

  if (d && !isNaN(d) && d > 0) {
    return d; // retorno imediato
  }

  // 2) fallback → buscar no backend
  const id = localStorage.getItem("maleflow_id");
  if (!id) return 1;

  try {
   const resp = await MALEFLOW.post({
  action: "getdiaprograma",
  id
});


    if (resp?.diaPrograma > 0) {
      localStorage.setItem("maleflow_diaPrograma", resp.diaPrograma);
      return resp.diaPrograma;
    }
  } catch (e) {
    console.warn("⚠️ Erro ao buscar DiaPrograma do backend:", e);
  }

  // fallback final
  localStorage.setItem("maleflow_diaPrograma", "1");
  return 1;
};


MALEFLOW.setDiaPrograma = async function (novoValor) {
  novoValor = Number(novoValor) || 1;

  // Local
  localStorage.setItem("maleflow_diaPrograma", String(novoValor));

  // Backend
  const id = localStorage.getItem("maleflow_id");
  if (!id) return;

  try {
    await MALEFLOW.post({
  action: "setDiaPrograma",
  id,
  diaPrograma: novoValor
});

 } catch (e) {
    console.warn("⚠️ Falhou envio DiaPrograma para backend:", e);
  }
};


MALEFLOW.incrementarDiaPrograma = async function () {
  let d = Number(localStorage.getItem("maleflow_diaPrograma")) || 1;
  d++;

  await MALEFLOW.setDiaPrograma(d);

  return d;
};


MALEFLOW.reiniciarDiaPrograma = async function () {
  await MALEFLOW.setDiaPrograma(1);
  return 1;
};


/* ===========================================================
   2. ROUTER
=========================================================== */

MALEFLOW.router = pag => {
  const destino = pag.endsWith(".html") ? pag : pag + ".html";

  if (localStorage.getItem("maleflow_mode_personal") === "true") {
    location.href = `${destino}?personal=1`;
  } else {
    location.href = destino;
  }
};


/* ===========================================================
   3. HEADER
=========================================================== */

MALEFLOW.renderVipBadge = function () {
  const id = localStorage.getItem("maleflow_id");
  const produto = localStorage.getItem("maleflow_produto");
  const isVip = Boolean(id) && String(produto || "").toLowerCase() === "vip";
  const existing = document.getElementById("ffVipBadge");

  if (!isVip) {
    existing?.remove();
    return;
  }

  if (!document.getElementById("ffVipBadgeStyle")) {
    const style = document.createElement("style");
    style.id = "ffVipBadgeStyle";
    style.textContent = `
      #ffVipBadge {
        position: fixed;
        top: 10px;
        right: 12px;
        z-index: 120000;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(51, 89, 83, 0.15);
        color: #335953;
        border: 1px solid rgba(51, 89, 83, 0.35);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        backdrop-filter: blur(6px);
        pointer-events: none;
      }

      body.dark #ffVipBadge {
        background: rgba(209, 166, 151, 0.2);
        color: #f4e7e1;
        border-color: rgba(209, 166, 151, 0.5);
      }

      @media (max-width: 600px) {
        #ffVipBadge {
          top: 8px;
          right: 8px;
          font-size: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (!existing) {
    const badge = document.createElement("div");
    badge.id = "ffVipBadge";
    badge.textContent = "VIP";
    document.body.appendChild(badge);
  }
};

MALEFLOW.inserirHeaderApp = function () {
  if (document.querySelector("#maleflowHeader")) return;

  const h = document.createElement("header");
  h.id = "maleflowHeader";
  h.innerHTML = `
    <img src="/maleflow/assets/logo-maleflow.png" class="ff-logo">
    <button id="ffMenuBtn" class="ff-menu-btn">&#9776;</button>
  `;

  document.body.prepend(h);
  MALEFLOW.renderVipBadge?.();

  h.querySelector("#ffMenuBtn").onclick = () =>
    document.querySelector(".ff-menu-modal")?.classList.add("active");
};

/* ===========================================================
   🌸 COMMIT DE MUDANÇAS ESTRUTURAIS (NÍVEL / CICLO)
   Fonte da verdade: BACKEND
=========================================================== */
MALEFLOW.commitMudanca = async function ({ tipo, payload = {} }) {
  const id = localStorage.getItem("maleflow_id");
  if (!id) return;

  MALEFLOW.log?.("Commit mudança:", tipo, payload);

  try {
    // ----------------------------
    // 🔁 MUDANÇA DE NÍVEL
    // ----------------------------
    if (tipo === "nivel" && payload.nivel) {
      const nivelNorm = String(payload.nivel || "").toLowerCase().trim();
      if (!nivelNorm) {
        return;
      }
      await MALEFLOW.post({
        action: "setnivel",
        id,
        nivel: nivelNorm
      });

      // reset de programa é OBRIGATÓRIO
      await MALEFLOW.post({
        action: "resetprograma",
        id
      });

      localStorage.setItem("maleflow_nivel", nivelNorm);
      localStorage.removeItem("maleflow_diaPrograma");
    }

    // ----------------------------
    // 🌙 MUDANÇA DE CICLO
    // ----------------------------
    if (tipo === "ciclo") {
      if (payload.perfilHormonal) {
        await MALEFLOW.post({
          action: "setperfilhormonal",
          id,
          perfil: payload.perfilHormonal
        });
      }

      if (payload.startDate) {
        await MALEFLOW.post({
          action: "setciclostart",
          id,
          startDate: payload.startDate
        });
      }

      // sempre resetar programa
      await MALEFLOW.post({
        action: "resetprograma",
        id
      });

      if (payload.perfilHormonal) {
        localStorage.setItem("maleflow_perfilHormonal", payload.perfilHormonal);
      }

      if (payload.startDate) {
        localStorage.setItem("maleflow_startDate", payload.startDate);
      }

      localStorage.removeItem("maleflow_diaPrograma");
    }

  } catch (err) {
    console.error("Erro commitMudanca:", err);
    MALEFLOW.toast?.("Erro ao aplicar mudança. Tente novamente.");
  }
};



/* ===========================================================
   4. SYNC (NÃO altera produto)
=========================================================== */

MALEFLOW.carregarCicloBackend = async function () {
  MALEFLOW.log("🔄 SYNC ciclo…");

  const id = localStorage.getItem("maleflow_id");
  if (!id) return null;

  try {
    const resp = await fetch(`${MALEFLOW.SCRIPT_URL}?action=sync&id=${id}`).then(r => r.json());
    MALEFLOW.log("📌 SYNC:", resp);

    if (!resp || !resp.fase) return null;

    // Dados hormonais — sem alterar produto/ativa/personal
    localStorage.setItem("maleflow_fase", resp.fase);
    localStorage.setItem("maleflow_diaCiclo", resp.diaCiclo);
    localStorage.setItem("maleflow_perfilHormonal", resp.perfilHormonal);
    if (resp.nivel) {
      localStorage.setItem("maleflow_nivel", resp.nivel);
    }
    const enfaseAtual = localStorage.getItem("maleflow_enfase");
    const extraAtivo = localStorage.getItem("maleflow_treino_extra") === "true";
    const enfaseAtualExtra = String(enfaseAtual || "").toLowerCase().startsWith("extra_");
    const enfaseBackend = String(resp.enfase || "").toLowerCase().trim();
    const enfaseValida = Boolean(enfaseBackend && enfaseBackend !== "nenhuma");
    if (extraAtivo && enfaseAtualExtra) {
      if (enfaseValida && !localStorage.getItem("maleflow_enfase_base")) {
        localStorage.setItem("maleflow_enfase_base", enfaseBackend);
      }
    } else if (enfaseValida) {
      localStorage.setItem("maleflow_enfase", enfaseBackend);
    }
    localStorage.setItem("maleflow_cycleLength", resp.ciclo_duracao);
    localStorage.setItem("maleflow_startDate", resp.data_inicio);

    return resp;

  } catch (err) {
    MALEFLOW.error("❌ SYNC falhou:", err);
    return null;
  }
};

/* ===========================================================
   5. MENU LATERAL
=========================================================== */

MALEFLOW.renderMenuLateral = function () {
  const modal = document.querySelector(".ff-menu-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="ff-menu-box">
      <h2 class="ff-menu-title">${MALEFLOW.t("menu.title")}</h2>

      <button class="ff-menu-op ff-close" data-go="fechar">✖️ ${MALEFLOW.t("menu.fechar")}</button>
      <button class="ff-menu-op" data-go="idioma">🌐 ${MALEFLOW.t("menu.idioma")}</button>
      <button class="ff-menu-op" data-go="sac">🛟 ${MALEFLOW.t("menu.sac")}</button>
      <button class="ff-menu-op" data-go="ciclo">🎯 ${MALEFLOW.t("menu.ciclo")}</button>
      <button class="ff-menu-op" data-go="respiracao">💨 ${MALEFLOW.t("menu.respiracao")}</button>
      <button class="ff-menu-op" data-go="treinos">🏃 ${MALEFLOW.t("menu.treinos")}</button>
      <button class="ff-menu-op" data-go="nivel">📊 ${MALEFLOW.t("menu.nivel")}</button>
      <button class="ff-menu-op" data-go="tema">🌓 ${MALEFLOW.t("menu.tema")}</button>
      <button class="ff-menu-op" data-go="voltar">🔙 ${MALEFLOW.t("menu.voltar")}</button>

      <button class="ff-logout" data-go="logout">🚪 ${MALEFLOW.t("menu.sair")}</button>
    </div>
  `;

  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn =>
    btn.onclick = () => MALEFLOW._acaoMenu(btn.dataset.go)
  );
};

MALEFLOW.inserirMenuLateral = function () {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";

  document.body.appendChild(modal);

  MALEFLOW.renderMenuLateral();

  modal.onclick = e => {
    if (e.target.classList.contains("ff-menu-modal"))
      modal.classList.remove("active");
  };
};

document.addEventListener("maleflow:langChange", () => {
  MALEFLOW.renderMenuLateral?.();
  MALEFLOW.renderSAC?.();
  MALEFLOW.renderNivelModal?.();
});

/* ===========================================================
   6. MODAL DE IDIOMA
=========================================================== */

MALEFLOW.inserirModalIdioma = function () {

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
      localStorage.setItem("maleflow_lang", lang);
      MALEFLOW.toast("Idioma atualizado!");
      setTimeout(() => location.reload(), 500);
    };
  });

  modal.querySelector(".ff-lang-close").onclick =
    () => modal.classList.add("hidden");
};

/* ===========================================================
   6.5 MODAL SAC
=========================================================== */

MALEFLOW.renderSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="ff-sac-box">
      <h2>🛟 ${MALEFLOW.t("sac.title")}</h2>

      <p>${MALEFLOW.t("sac.subtitle")}</p>

      <div class="ff-sac-options">
        <label><input type="radio" name="sac_cat" value="treino"> ${MALEFLOW.t("sac.options.treino")}</label>
        <label><input type="radio" name="sac_cat" value="ciclo"> ${MALEFLOW.t("sac.options.ciclo")}</label>
        <label><input type="radio" name="sac_cat" value="registro"> ${MALEFLOW.t("sac.options.registro")}</label>
        <label><input type="radio" name="sac_cat" value="acesso"> ${MALEFLOW.t("sac.options.acesso")}</label>
        <label><input type="radio" name="sac_cat" value="outro"> ${MALEFLOW.t("sac.options.outro")}</label>
      </div>

      <textarea id="ff-sac-msg" placeholder="${MALEFLOW.t("sac.placeholder")}"></textarea>

      <div class="ff-sac-actions">
        <button id="ff-sac-enviar">${MALEFLOW.t("sac.enviar")}</button>
        <button id="ff-sac-cancelar">${MALEFLOW.t("sac.cancelar")}</button>
      </div>
    </div>
  `;

  const closeModal = () => {
    modal.classList.add("hidden");
    MALEFLOW.toggleBodyScroll(false);
  };

  modal.onclick = e => {
    if (e.target.id === "ff-sac-modal") closeModal();
  };

  modal.querySelector("#ff-sac-cancelar").onclick = closeModal;
  modal.querySelector("#ff-sac-enviar").onclick = MALEFLOW.enviarSAC;
};

MALEFLOW.inserirModalSAC = function () {
  if (document.getElementById("ff-sac-modal")) return;

  const modal = document.createElement("div");
  modal.id = "ff-sac-modal";
  modal.className = "ff-sac-modal hidden";

  document.body.appendChild(modal);
  MALEFLOW.renderSAC();
};

MALEFLOW.abrirModalSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  MALEFLOW.toggleBodyScroll(true);
};

MALEFLOW.fecharModalSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  MALEFLOW.toggleBodyScroll(false);
};

MALEFLOW.enviarSAC = async function () {
  const cat = document.querySelector("input[name='sac_cat']:checked")?.value;
  if (!cat) return MALEFLOW.toast(MALEFLOW.t("sac.selecione"));

  const mensagem = document.getElementById("ff-sac-msg").value || "";

  const payload = {
    action: "sac_abrir",
    id: localStorage.getItem("maleflow_id"),
    categoria_ui: cat,
    mensagem,
    lang: MALEFLOW.lang,
    contexto: {
      pagina: location.pathname.split("/").pop(),
      fase: localStorage.getItem("maleflow_fase"),
      diaCiclo: Number(localStorage.getItem("maleflow_diaCiclo") || 0),
      diaPrograma: Number(localStorage.getItem("maleflow_diaPrograma") || 0),
      perfilHormonal: localStorage.getItem("maleflow_perfilHormonal"),
      nivel: localStorage.getItem("maleflow_nivel"),
      enfase: localStorage.getItem("maleflow_enfase")
    }
  };

  try {
    MALEFLOW.loading.show(MALEFLOW.t("sac.enviando"));
    await MALEFLOW.post(payload);
    MALEFLOW.toast(MALEFLOW.t("sac.sucesso"));
    MALEFLOW.fecharModalSAC();
  } catch (e) {
    MALEFLOW.toast(MALEFLOW.t("sac.erro"), true);
  } finally {
    MALEFLOW.loading.hide();
  }
};

/* ===========================================================
   7. AÇÕES DO MENU
=========================================================== */

MALEFLOW._acaoMenu = function (op) {
  document.querySelector(".ff-menu-modal")?.classList.remove("active");

  switch (op) {

    case "idioma":
      document.getElementById("ff-lang-modal")?.classList.remove("hidden");
      break;

    case "sac":
      MALEFLOW.abrirModalSAC();
      break;

    case "ciclo":
  
 // dispatch
MALEFLOW.dispatch("stateChanged", {
  type: "ciclo",
  impact: "fisiologico",
  source: location.pathname.includes("home") ? "home" : "flowcenter"
});
;

 
      MALEFLOW.router(`ciclo?ret=${location.pathname.split("/").pop()}`);
      break;

    case "respiracao":
      MALEFLOW.router("respiracao");
      break;

    case "treinos":
      MALEFLOW.router("evolucao");
      break;

    case "nivel":
      // ⚠️ apenas abre modal
      // o dispatch estrutural acontece SOMENTE na confirmação do nível
      document.querySelector("#modal-nivel")?.classList.remove("oculto");
      break;

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "maleflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "logout":
      MALEFLOW.clearSession();
      localStorage.removeItem("maleflow_id");
      localStorage.removeItem("maleflow_auth");
      localStorage.removeItem("maleflow_email");
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
      MALEFLOW.router(rota[p] || "home.html");
      break;
    }
  }
};


MALEFLOW.resetProgramaAtual = function () {
  localStorage.removeItem("maleflow_diaPrograma");
  localStorage.removeItem("maleflow_enfase");
  localStorage.removeItem("maleflow_treinoAtual");
};

MALEFLOW.renderNivelModal = function () {
  const modal = document.getElementById("modal-nivel");
  if (!modal) return;

  const title = modal.querySelector("h2");
  if (title) title.textContent = `📊 ${MALEFLOW.t("nivelModal.title")}`;

  const labels = {
    iniciante: MALEFLOW.t("nivelModal.iniciante"),
    intermediaria: MALEFLOW.t("nivelModal.intermediaria"),
    avancada: MALEFLOW.t("nivelModal.avancada")
  };

  modal.querySelectorAll(".nivel-btn").forEach(btn => {
    const key = btn.dataset.nivel;
    if (labels[key]) btn.textContent = labels[key];
  });

  const btnConfirmar = modal.querySelector("#btnConfirmarNivel");
  if (btnConfirmar) btnConfirmar.textContent = MALEFLOW.t("nivelModal.confirmar");

  const btnFechar = modal.querySelector("#fecharNivel");
  if (btnFechar) btnFechar.textContent = MALEFLOW.t("nivelModal.fechar");
};

MALEFLOW.initNivelHandler = function () {
  const modal = document.getElementById("modal-nivel");
  const btnConfirmar = document.getElementById("btnConfirmarNivel");
  const btnFechar = document.getElementById("fecharNivel");

  if (!modal || !btnConfirmar || !btnFechar) return; // 🔧 proteção

  MALEFLOW.renderNivelModal?.();

  btnConfirmar.dataset.bound = "true";

  modal.querySelectorAll(".nivel-btn").forEach(btn => {
    btn.onclick = () => {
      modal.querySelectorAll(".nivel-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  btnConfirmar.onclick = async () => {
    const nivel = modal.querySelector(".nivel-btn.active")?.dataset.nivel;
    const nivelNorm = String(nivel || "").toLowerCase().trim();
    if (!nivelNorm) return MALEFLOW.toast(MALEFLOW.t("nivelModal.selecione"));

    localStorage.setItem("maleflow_nivel", nivelNorm);

    await MALEFLOW.post({
      action: "setnivel",
      id: localStorage.getItem("maleflow_id"),
      nivel: nivelNorm
    });

    MALEFLOW.dispatch("stateChanged", {
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

MALEFLOW.carregarPerfil = async function () {
  const id = localStorage.getItem("maleflow_id");
  if (!id) return null;

  try {
    const r = await fetch(`${MALEFLOW.SCRIPT_URL}?action=validar&id=${id}`).then(r => r.json());
    if (r.status !== "ok") return null;

    localStorage.setItem("maleflow_nome", r.nome || "Aluna");
    localStorage.setItem("maleflow_fase", r.fase);
    const enfaseAtual = localStorage.getItem("maleflow_enfase");
    const extraAtivo = localStorage.getItem("maleflow_treino_extra") === "true";
    const enfaseAtualExtra = String(enfaseAtual || "").toLowerCase().startsWith("extra_");
    const enfaseBackend = String(r.enfase || "").toLowerCase().trim();
    const enfaseValida = Boolean(enfaseBackend && enfaseBackend !== "nenhuma");
    if (extraAtivo && enfaseAtualExtra) {
      if (enfaseValida && !localStorage.getItem("maleflow_enfase_base")) {
        localStorage.setItem("maleflow_enfase_base", enfaseBackend);
      }
    } else if (enfaseValida) {
      localStorage.setItem("maleflow_enfase", enfaseBackend);
    }
    localStorage.setItem("maleflow_diaCiclo", r.diaCiclo);
    if (r.nivel) {
      localStorage.setItem("maleflow_nivel", r.nivel);
    }
    localStorage.setItem("maleflow_startDate", r.data_inicio);
    localStorage.setItem("maleflow_cycleLength", r.ciclo_duracao);
    localStorage.setItem("maleflow_perfilHormonal", r.perfilHormonal);

    const produtoRaw = (r.produto || "").toLowerCase().trim();
    const isVip = produtoRaw === "vip";
    const ativaRaw   = isVip || r.ativa === true || r.ativa === "true";

    localStorage.setItem("maleflow_produto", produtoRaw);
    localStorage.setItem("maleflow_ativa", ativaRaw ? "true" : "false");

    localStorage.setItem(
      "maleflow_has_personal",
      r.personal || isVip ? "true" : "false"
    );
    localStorage.removeItem("maleflow_personal");
    MALEFLOW.renderVipBadge?.();

    return r;

  } catch (e) {
    MALEFLOW.error("Erro carregarPerfil:", e);
    return null;
  }
};

/* ===========================================================
   9. SYNC + EVENTO READY
=========================================================== */

MALEFLOW.sincronizarECdisparar = async function () {
  const perfil = await MALEFLOW.carregarCicloBackend();

  window.dispatchEvent(new CustomEvent("maleflow:ready", {
    detail: perfil
  }));
};
/* ===========================================================
   7.5 STATE CHANGED → SEMPRE CAI NO FLOWCENTER
   (FlowCenter valida/sincroniza no começo)
=========================================================== */
document.addEventListener("maleflow:stateChanged", e => {
  const {
    impact = "none",
    source = "flowcenter"
  } = e.detail || {};

  if (impact === "none") return;

  if (impact === "fisiologico") {
    MALEFLOW.toast("Ajustes aplicados 🌸");
    MALEFLOW.router(source);
    return;
  }

  if (impact === "estrutural") {
    MALEFLOW.resetProgramaAtual?.();
    MALEFLOW.toast("Estrutura atualizada 🌱");
    MALEFLOW.router(source);
  }
});



/* ===========================================================
   10. INIT — FLUXO PRINCIPAL
=========================================================== */

MALEFLOW.init = async function () {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();
  MALEFLOW.renderVipBadge?.();

  // HOME → sem SYNC
  if (p === "home.html") {
    this.inserirHeaderApp();
    this.inserirMenuLateral();
    this.inserirModalIdioma();
    this.inserirModalSAC();
     
     // ⏱️ aguarda o DOM completar
    requestAnimationFrame(() => {
      MALEFLOW.initNivelHandler();
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
      MALEFLOW.initNivelHandler();
    });

    if (!localStorage.getItem("maleflow_cycle_configured")) {
      location.href = "ciclo.html";
      return;
    }

    await MALEFLOW.sincronizarECdisparar();
  }
};

/* ===========================================================
   11. AUTO START
=========================================================== */

document.addEventListener("DOMContentLoaded", () => MALEFLOW.init());
