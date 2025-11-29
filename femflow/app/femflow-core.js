/* =======================================================================
   🌸 FEMFLOW CORE — VERSÃO FINAL 5.1 — 2025
   Arquitetura A — 100% Sincronizado com Backend (Stargate)
======================================================================= */

window.FEMFLOW = {};

/* ===========================================================
   1. CONFIG GLOBAL
=========================================================== */

FEMFLOW.SCRIPT_URL = "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

FEMFLOW.dev = () => localStorage.getItem("femflow_dev") === "on";
FEMFLOW.log   = (...a) => { if (FEMFLOW.dev()) console.log("%c[FEMFLOW]", "color:#cc6a5a", ...a); };
FEMFLOW.warn  = (...a) => { if (FEMFLOW.dev()) console.warn("%c[FEMFLOW ⚠]", "color:#e07f67", ...a); };
FEMFLOW.error = (...a) => { if (FEMFLOW.dev()) console.error("%c[FEMFLOW ❌]", "color:#b74333", ...a); };

FEMFLOW.toast = (msg, error = false, offline = false) => {
  let box = document.querySelector(".toast-box");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.style.background = error ? "#cc6a5a" : "#335953";
  box.classList.add("visible");

  if (!offline) setTimeout(() => box.classList.remove("visible"), 2400);
};

/* ===========================================================
   2. ROUTER + HEADER + MENU
=========================================================== */

FEMFLOW.router = pag => {
  const destino = pag.endsWith(".html") ? pag : pag + ".html";
  location.href = destino;
};

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

FEMFLOW.inserirMenuLateral = function () {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";

  modal.innerHTML = `
    <div class="ff-menu-box">
      <h2 class="ff-menu-title">Menu</h2>

      <button class="ff-menu-op ff-close" data-go="fechar">✖️ Fechar</button>
      <button class="ff-menu-op" data-go="idioma">🌐 Idioma</button>
      <button class="ff-menu-op" data-go="ciclo">🎯 Ajustar ciclo</button>
      <button class="ff-menu-op" data-go="respiracao">💨 Respiração</button>
      <button class="ff-menu-op" data-go="treinos">🏃 Meus Treinos</button>
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

  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn => {
    btn.onclick = () => FEMFLOW._acaoMenu(btn.dataset.go);
  });
};

FEMFLOW._acaoMenu = function (op) {
  document.querySelector(".ff-menu-modal")?.classList.remove("active");

  switch (op) {
    case "idioma": FEMFLOW.toast("🌐 Em desenvolvimento"); break;
    case "ciclo": FEMFLOW.router("ciclo.html"); break;
    case "respiracao": FEMFLOW.router("respiracao.html"); break;
    case "treinos": FEMFLOW.router("evolucao.html"); break;

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "femflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "logout":
      localStorage.clear();
      FEMFLOW.router("index.html");
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
   3. PSE Modal + Salvar Treino
=========================================================== */

FEMFLOW.criarModalPSE = function () {
  if (document.querySelector("#modal-pse")) return;

  const modal = document.createElement("div");
  modal.id = "modal-pse";
  modal.className = "modal oculto";

  modal.innerHTML = `
    <div class="modal-content">
      <h2>Como foi o treino?</h2>
      <div class="pse-list">
        ${[1,2,3,4,5,6,7,8,9,10].map(n =>
          `<button class="pse-opt" data-v="${n}">${n}</button>`
        ).join("")}
      </div>
    </div>
  `;

  modal.onclick = e => {
    if (e.target.id === "modal-pse") modal.classList.add("oculto");
  };

  document.body.appendChild(modal);
};

FEMFLOW.abrirPSE = function (cb) {
  const modal = document.querySelector("#modal-pse");
  if (!modal) return;
  modal.classList.remove("oculto");

  modal.querySelectorAll(".pse-opt").forEach(btn => {
    btn.onclick = () => {
      modal.classList.add("oculto");
      if (cb) cb(btn.dataset.v);
    };
  });
};

/* ===========================================================
   4. CARREGAR PERFIL / CICLO (Stargate Backend)
=========================================================== */

FEMFLOW.carregarPerfil = async function () {
  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const r = await fetch(`${FEMFLOW.SCRIPT_URL}?action=validar&id=${id}`);
    const j = await r.json();

    if (j.status !== "ok") return null;

    /* BACKEND É SEMPRE A VERDADE */
    localStorage.setItem("femflow_nome", j.nome);
    localStorage.setItem("femflow_fase", j.fase);
    localStorage.setItem("femflow_enfase", j.enfase);
    localStorage.setItem("femflow_diaCiclo", j.diaCiclo);
    localStorage.setItem("femflow_nivel", j.nivel);
    localStorage.setItem("femflow_perfilHormonal", j.perfilHormonal || "regular");

    localStorage.setItem("femflow_startDate", j.data_inicio);
    localStorage.setItem("femflow_cycleLength", j.ciclo_duracao);

    FEMFLOW.log("🌙 CICLO SINCRONIZADO (Stargate)", j);

    return j;
  } catch (e) {
    FEMFLOW.error("Erro ao carregar perfil", e);
    return null;
  }
};

FEMFLOW.carregarCicloBackend = FEMFLOW.carregarPerfil;

/* ===========================================================
   5. DISPARADOR femflow:ready PARA TREINO.JS
=========================================================== */

FEMFLOW.sincronizarEC disparar = async function () {
  const perfil = await FEMFLOW.carregarCicloBackend();
  window.dispatchEvent(new CustomEvent("femflow:ready", { detail: perfil }));
};

/* ===========================================================
   6. INIT — Sincroniza ciclo automaticamente
=========================================================== */

FEMFLOW.init = async function () {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();

  if (["flowcenter.html","treino.html","respiracao.html","evolucao.html"]
      .includes(p)) {

    this.inserirHeaderApp();
    this.inserirMenuLateral();

    // 🔥 sempre sincroniza backend antes de exibir conteúdo
    await FEMFLOW.sincronizarECdisparar();
  }
};

/* ===========================================================
   7. INSPECTOR
=========================================================== */

FEMFLOW.inspect = function () {
  console.clear();
  console.log("%c🔍 FEMFLOW INSPECTOR — 2025",
              "font-size:18px;font-weight:bold;color:#cc6a5a;");

  const keys = [
    "femflow_id","femflow_email","femflow_nome",
    "femflow_fase","femflow_diaCiclo",
    "femflow_perfilHormonal","femflow_enfase","femflow_nivel",
    "femflow_cycleLength","femflow_startDate",
    "femflow_dia_treino","femflow_dev"
  ];

  keys.forEach(k => console.log(k, "→", localStorage.getItem(k)));
};

/* ===========================================================
   AUTO-START
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  FEMFLOW.init();
});
