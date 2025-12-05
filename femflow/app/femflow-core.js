/* =======================================================================
   🌸 FEMFLOW CORE — VERSÃO FINAL 5.2 — 2025
   Arquitetura Stargate — 100% sincronizado com Backend (Apps Script)
======================================================================= */

window.FEMFLOW = window.FEMFLOW || {};


/* ===========================================================
   1. CONFIG GLOBAL
=========================================================== */

FEMFLOW.SCRIPT_URL = "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";
FEMFLOW.ENDPOINT_BACKEND = FEMFLOW.SCRIPT_URL;
FEMFLOW.API_URL = FEMFLOW.SCRIPT_URL;
FEMFLOW.BACKEND = FEMFLOW.SCRIPT_URL;

FEMFLOW.lang = localStorage.getItem("femflow_lang") || "pt";
FEMFLOW.setLang = function (lang) {
  FEMFLOW.lang = lang;
  localStorage.setItem("femflow_lang", lang);
  document.dispatchEvent(new Event("femflow:langChange"));
};

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
  box.classList.remove("error");
  if (error) box.classList.add("error");

  box.classList.add("visible");

  if (!offline) {
    setTimeout(() => box.classList.remove("visible"), 2400);
  }
};


/* ===========================================================
   2. ROUTER (PRESERVA PERSONAL AUTOMATICAMENTE)
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

  h.querySelector("#ffMenuBtn").onclick =
    () => document.querySelector(".ff-menu-modal")?.classList.add("active");
};


/* ===========================================================
   4. SINCRONIZAR CICLO COM BACKEND (SEM DISPARAR READY)
=========================================================== */

FEMFLOW.carregarCicloBackend = async function () {
  FEMFLOW.log("🔄 Sincronizando ciclo com backend…");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.error("❌ Sem ID no localStorage!");
    return null;
  }

  try {
    const resp = await fetch(FEMFLOW.SCRIPT_URL + "?action=sync&id=" + id)
      .then(r => r.json());

    FEMFLOW.log("📌 SYNC:", resp);

    if (!resp || !resp.fase) {
      FEMFLOW.toast("Erro ao sincronizar fase hormonal.");
      return null;
    }

    /* Atualizar localStorage */
    localStorage.setItem("femflow_fase", resp.fase);
    localStorage.setItem("femflow_diaCiclo", resp.diaCiclo);
    localStorage.setItem("femflow_perfilHormonal", resp.perfilHormonal);
    localStorage.setItem("femflow_nivel", resp.nivel);
    localStorage.setItem("femflow_enfase", resp.enfase);
    localStorage.setItem("femflow_cycleLength", resp.ciclo_duracao);
    localStorage.setItem("femflow_startDate", resp.data_inicio);

    /* 🔥 PERSONAL GLOBAL */
    if (resp.personal === true || String(resp.produto).toLowerCase() === "treino_personal") {
      localStorage.setItem("femflow_personal", "true");
    } else {
      localStorage.removeItem("femflow_personal");
    }

    return resp;

  } catch (err) {
    FEMFLOW.error("❌ Falha no sync:", err);
    FEMFLOW.toast("Falha ao sincronizar ciclo.");
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

  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn => {
    btn.onclick = () => FEMFLOW._acaoMenu(btn.dataset.go);
  });
};


/* ===========================================================
   6. MODAL IDIOMA
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
      setTimeout(() => location.reload(), 600);
    };
  });

  modal.querySelector(".ff-lang-close").onclick =
    () => modal.classList.add("hidden");
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

    case "ciclo": {
      const atual = location.pathname.split("/").pop();
      FEMFLOW.router(`ciclo?ret=${atual}`);
      break;
    }

    case "respiracao":
      FEMFLOW.router("respiracao");
      break;

    case "treinos":
      FEMFLOW.router("evolucao");
      break;

    case "nivel": {
      const m = document.querySelector("#modal-nivel");
      if (m) m.classList.remove("oculto");
      break;
    }

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "femflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "logout":
      localStorage.clear();
      FEMFLOW.router("index");
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


/* ===========================================================
   8. NOME DA ALUNA
=========================================================== */
FEMFLOW.getNome = () => localStorage.getItem("femflow_nome") || "Aluna";


/* ===========================================================
   9. ALTERAR NÍVEL (Backend + Local)
=========================================================== */

FEMFLOW.initNivelSelector = function () {
  const modal = document.querySelector("#modal-nivel");
  if (!modal) return;

  const fechar = document.querySelector("#fecharNivel");
  fechar.onclick = () => modal.classList.add("oculto");

  document.querySelectorAll(".nivel-btn").forEach(btn => {
    btn.onclick = async () => {

      const nivel = btn.dataset.nivel;
      const id = localStorage.getItem("femflow_id");

      if (!id) {
        FEMFLOW.toast("Faça login novamente.", true);
        return;
      }

      FEMFLOW.log("📈 SetNivel →", nivel);

      localStorage.setItem("femflow_nivel", nivel);

      try {
        const r = await fetch(FEMFLOW.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "setnivel",
            id: id,
            nivel: nivel
          })
        }).then(r => r.json());

        FEMFLOW.log("Resposta backend setnivel:", r);

        if (r.status === "ok") {
          FEMFLOW.toast("Nível atualizado: " + nivel);
          window.dispatchEvent(new Event("femflow:nivelChange"));
        } else {
          FEMFLOW.toast("Erro ao salvar no servidor", true);
        }
      } catch (e) {
        FEMFLOW.error("Erro setnivel:", e);
        FEMFLOW.toast("Erro de conexão", true);
      }

      modal.classList.add("oculto");

      await FEMFLOW.carregarCicloBackend();
    };
  });
};


/* ===========================================================
   10. CARREGAR PERFIL (VALIDAÇÃO RÁPIDA)
=========================================================== */

FEMFLOW.carregarPerfil = async function () {
  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const r = await fetch(`${FEMFLOW.SCRIPT_URL}?action=validar&id=${id}`);
    const j = await r.json();

    if (j.status !== "ok") return null;

    localStorage.setItem("femflow_nome", j.nome || "Aluna");
    localStorage.setItem("femflow_fase", j.fase);
    localStorage.setItem("femflow_enfase", j.enfase);
    localStorage.setItem("femflow_diaCiclo", j.diaCiclo);
    localStorage.setItem("femflow_nivel", j.nivel);
    localStorage.setItem("femflow_perfilHormonal", j.perfilHormonal || "regular");
    localStorage.setItem("femflow_startDate", j.data_inicio);
    localStorage.setItem("femflow_cycleLength", j.ciclo_duracao);

    /* PERSONAL */
    if (j.personal === true || String(j.produto).toLowerCase() === "treino_personal") {
      localStorage.setItem("femflow_personal", "true");
    } else {
      localStorage.removeItem("femflow_personal");
    }

    FEMFLOW.log("🌙 CICLO STARGATE SYNC →", j);

    return j;

  } catch (e) {
    FEMFLOW.error("Erro carregarPerfil:", e);
    return null;
  }
};


/* ===========================================================
   11. DIA PROGRAMA — 1→30 automático
=========================================================== */

FEMFLOW.calcularDiaPrograma = function () {
  const start = new Date(localStorage.getItem("femflow_startDate") || new Date());
  const hoje = new Date();

  const diff = Math.floor((hoje - start) / 86400000) + 1;
  const diaPrograma = diff > 30 ? ((diff - 1) % 30) + 1 : diff;

  localStorage.setItem("femflow_diaPrograma", diaPrograma);

  return diaPrograma;
};


/* ===========================================================
   12. SINCRONIZAR E DISPARAR READY (PONTO CENTRAL)
=========================================================== */

FEMFLOW.sincronizarECdisparar = async function () {
  const perfil = await FEMFLOW.carregarCicloBackend();

  window.dispatchEvent(new CustomEvent("femflow:ready", {
    detail: perfil
  }));
};


/* ===========================================================
   13. INIT CORE (AUTO)
=========================================================== */

FEMFLOW.init = async function () {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();

  if (["flowcenter.html","treino.html","respiracao.html","evolucao.html"]
      .includes(p)) {

    this.inserirHeaderApp();
    this.inserirMenuLateral();
    this.inserirModalIdioma();
    this.initNivelSelector();

    if (!localStorage.getItem("femflow_cycle_configured")) {
      console.warn("⚠️ Ciclo não configurado — redirecionando.");
      location.href = "ciclo.html";
      return;
    }

    await FEMFLOW.sincronizarECdisparar();
  }
};


/* ===========================================================
   14. INSPECTOR
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
    "femflow_dia_treino","femflow_dev","femflow_personal"
  ];

  keys.forEach(k => console.log(k, "→", localStorage.getItem(k)));
};


/* ===========================================================
   15. AUTO-START COM DOMContentLoaded
=========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  FEMFLOW.init();
});

/* ===========================================================
   16. EVENTO GLOBAL — Nível atualizado
=========================================================== */
window.addEventListener("femflow:nivelChange", () => {
  const nivel = localStorage.getItem("femflow_nivel");
  FEMFLOW.log("🔥 NivelChange capturado no CORE:", nivel);
});

