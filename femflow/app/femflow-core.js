/* =======================================================================
   🌸 FEMFLOW CORE — VERSÃO FINAL 5.3 — 2025
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

FEMFLOW.dev = () => localStorage.getItem("femflow_dev") === "on";
FEMFLOW.log = (...a) => FEMFLOW.dev() && console.log("%c[FEMFLOW]", "color:#cc6a5a", ...a);
FEMFLOW.warn = (...a) => FEMFLOW.dev() && console.warn("%c[FEMFLOW ⚠]", "color:#e07f67", ...a);
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
   4. SYNC — CUIDADO: NÃO ALTERA PRODUTO MAIS!
=========================================================== */

FEMFLOW.carregarCicloBackend = async function () {
  FEMFLOW.log("🔄 SYNC ciclo…");

  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const resp = await fetch(FEMFLOW.SCRIPT_URL + "?action=sync&id=" + id)
      .then(r => r.json());

    FEMFLOW.log("📌 SYNC:", resp);

    if (!resp || !resp.fase) return null;

    // Apenas dados hormonais — NÃO tocar produto/ativa/personal
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

FEMFLOW.inserirMenuLateral = function () {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";
  modal.innerHTML = `
    <div class="ff-menu-box">
      <h2 class="ff-menu-title">Menu</h2>

      <button class="ff-menu-op ff-close"  data-go="fechar">✖️ Fechar</button>
      <button class="ff-menu-op" data-go="idioma">🌐 Idioma</button>
      <button class="ff-menu-op" data-go="ciclo">🎯 Ajustar ciclo</button>
      <button class="ff-menu-op" data-go="respiracao">💨 Respiração</button>
      <button class="ff-menu-op" data-go="treinos">🏃 Meus Treinos</button>
      <button class="ff-menu-op" data-go="nivel">📊 Alterar nível</button>
      <button class="ff-menu-op" data-go="tema">🌓 Tema</button>
      <button class="ff-menu-op" data-go="voltar">🔙 Voltar</button>

      <button class="ff-logout" data-go="logout">🚪 Sair</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.onclick = e => {
    if (e.target.classList.contains("ff-menu-modal"))
      modal.classList.remove("active");
  };

  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn =>
    btn.onclick = () => FEMFLOW._acaoMenu(btn.dataset.go)
  );
};
/* ===========================================================
   6. MODAL IDIOMA — Restaurado para CORE 5.3
=========================================================== */
FEMFLOW.inserirModalIdioma = function () {

  // Evita criar duas vezes
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

  // Fecha clicando no fundo
  modal.addEventListener("click", e => {
    if (e.target.id === "ff-lang-modal") modal.classList.add("hidden");
  });

  // Botões de idioma
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
   6. AÇÕES DO MENU
=========================================================== */

FEMFLOW._acaoMenu = function (op) {
  document.querySelector(".ff-menu-modal")?.classList.remove("active");

  switch (op) {
    case "idioma":
      document.getElementById("ff-lang-modal")?.classList.remove("hidden");
      break;

    case "ciclo":
      FEMFLOW.router(`ciclo?ret=${location.pathname.split("/").pop()}`);
      break;

    case "respiracao":
      FEMFLOW.router("respiracao");
      break;

    case "treinos":
      FEMFLOW.router("evolucao");
      break;

    case "nivel":
      document.querySelector("#modal-nivel")?.classList.remove("oculto");
      break;

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem("femflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "logout":
      localStorage.clear();
      FEMFLOW.router("index");
      break;

    case "voltar":
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
};

/* ===========================================================
   7. PERFIL — ESTE SIM ATUALIZA PRODUTO!
=========================================================== */

FEMFLOW.carregarPerfil = async function () {
  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const r = await fetch(`${FEMFLOW.SCRIPT_URL}?action=validar&id=${id}`).then(r => r.json());
    if (r.status !== "ok") return null;

    // Dados de perfil completo
    localStorage.setItem("femflow_nome", r.nome || "Aluna");
    localStorage.setItem("femflow_fase", r.fase);
    localStorage.setItem("femflow_enfase", r.enfase);
    localStorage.setItem("femflow_diaCiclo", r.diaCiclo);
    localStorage.setItem("femflow_nivel", r.nivel);
    localStorage.setItem("femflow_startDate", r.data_inicio);
    localStorage.setItem("femflow_cycleLength", r.ciclo_duracao);
    localStorage.setItem("femflow_perfilHormonal", r.perfilHormonal);

    // ✔ AQUI SIM: produto / ativa / personal
    const produtoRaw = (r.produto || "").toLowerCase().trim();
    const ativaRaw = r.ativa === true || r.ativa === "true";

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
   8. SINCRONIZAR → DISPARAR READY
=========================================================== */

FEMFLOW.sincronizarECdisparar = async function () {
  const perfil = await FEMFLOW.carregarCicloBackend();

  window.dispatchEvent(new CustomEvent("femflow:ready", {
    detail: perfil
  }));
};

/* ===========================================================
   9. INIT — NUNCA RODA SYNC NA HOME
=========================================================== */

FEMFLOW.init = async function () {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();

  // HOME NÃO USA SYNC — APENAS INSERIR HEADER / MENU
  if (p === "home.html") {
    this.inserirHeaderApp();
    this.inserirMenuLateral();
    this.inserirModalIdioma();
    return; // NÃO RODA SYNC
  }

  // OUTRAS PÁGINAS SIM
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
    this.initNivelSelector();

    if (!localStorage.getItem("femflow_cycle_configured")) {
      location.href = "ciclo.html";
      return;
    }

    await FEMFLOW.sincronizarECdisparar();
  }
};


/* ===========================================================
   10. AUTO START
=========================================================== */

document.addEventListener("DOMContentLoaded", () => FEMFLOW.init());
