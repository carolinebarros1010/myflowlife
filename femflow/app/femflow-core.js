/* ===========================================================
   🌸 FEMFLOW CORE SCRIPT v2.7 — Versão Final e Completa
   =========================================================== */

window.FEMFLOW = {

/* ===========================================================
   🔍 PÁGINAS PÚBLICAS
=========================================================== */
_isPublicPage() {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();
  return ["index.html", "home.html", "ciclo.html"].includes(p);
},

/* ===========================================================
   ⚙️ INICIALIZAÇÃO GERAL
=========================================================== */
initTreino() {
  console.log("💫 FemFlow Core v2.7 ativo");

  this.criarModalPSE();
  this.autoCiclo();

  if (!localStorage.getItem("femflow_dia_treino")) {
    localStorage.setItem("femflow_dia_treino", "1");
  }

  const p = (location.pathname.split("/").pop() || "").toLowerCase();
  const protegidas = ["flowcenter.html", "treino.html", "evolucao.html"];

  if (protegidas.includes(p)) {
    const cicloOk =
      localStorage.getItem("femflow_cycle_configured") === "yes" &&
      localStorage.getItem("femflow_startDate") &&
      localStorage.getItem("femflow_cycleLength");

    if (!cicloOk) {
      this.toast("🌿 Configure seu ciclo antes de acessar esta página.");
      location.href = "ciclo.html";
      return;
    }
  }

  if (!this._isPublicPage() && !window.FEMFLOW_DISABLE_UI) {
    this.inserirHeaderApp();
  }
},

/* ===========================================================
   📌 ESTADO GLOBAL
=========================================================== */
getEstadoTreino() {
  return {
    enfase: localStorage.getItem("femflow_enfase") || "geral",
    nivel: localStorage.getItem("nivel_atual") || "iniciante",
    perfil: localStorage.getItem("femflow_perfilHormonal") || "regular",
    fase: localStorage.getItem("femflow_fase_atual") || "follicular",
    diaCiclo: Number(localStorage.getItem("dia_ciclo") || 1)
  };
},

/* ===========================================================
   🔗 ENDPOINT DO BACKEND
=========================================================== */
SCRIPT_URL:
  localStorage.getItem("femflow_script") ||
  "https://api-myflowlife.falling-wildflower-a8c0.workers.dev",

LOGO: "https://carolinebarros1010.github.io/myflowlife/femflow/app/assets/logofemflowterracota.png",

/* ===========================================================
   🔐 LOGIN + CADASTRO
=========================================================== */
async indexOuCadastro(nome, email) {
  if (!nome || !email) {
    this.toast("⚠️ Informe nome e e-mail.", true);
    return;
  }

  try {
    const resp = await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "indexOuCadastro", nome, email }),
    });

    const data = await resp.json();
    if (!(data.status === "ok" || data.status === "created")) {
      this.toast("⚠️ Erro no cadastro.", true);
      return;
    }

    this.toast(`🌸 Bem-vinda, ${data.nome}!`);

    localStorage.setItem("femflow_id", data.id);
    localStorage.setItem("femflow_nome", data.nome);
    localStorage.setItem("femflow_email", data.email);
    localStorage.setItem("femflow_auth", "yes");

    if (data.perfilHormonal)
      localStorage.setItem("femflow_perfilHormonal", data.perfilHormonal);

    if (data.fase)
      localStorage.setItem("femflow_fase_atual", data.fase.toLowerCase());

    if (data.diaCiclo)
      localStorage.setItem("dia_ciclo", data.diaCiclo);

    this.router("ciclo");
    return data;

  } catch (err) {
    this.toast("❌ Falha de conexão", true);
  }
},

/* ===========================================================
   🔐 LOGOUT
=========================================================== */
logout() {
  [
    "femflow_auth", "femflow_id", "femflow_nome", "femflow_email",
    "dia_ciclo", "femflow_enfase", "nivel_atual",
    "femflow_cycle_configured", "femflow_fase_atual",
    "femflow_perfilHormonal", "femflow_faseAlta"
  ].forEach(k => localStorage.removeItem(k));

  this.toast("👋 Sessão encerrada!");
  window.location.href = "index.html";
},

/* ===========================================================
   🔹 CABEÇALHO E MENU — FEMFLOW 2025 TWA EDITION
=========================================================== */
inserirHeaderApp() {
  // evita múltiplas injeções
  if (document.getElementById("femflowHeader")) return;

  const header = document.createElement("div");
  header.id = "femflowHeader";
  header.innerHTML = `
    <img src="${this.LOGO}" class="ff-logo" alt="FemFlow">
    <button id="ffMenuBtn" class="ff-menu-btn">☰</button>
  `;
  document.body.prepend(header);

  document.getElementById("ffMenuBtn").onclick = () => {
    this.criarMenuModal(location.pathname.split("/").pop());
  };
},

criarMenuModal(page) {
  // evita menus duplicados
  if (document.getElementById("femflowMenuModal")) return;

  const modal = document.createElement("div");
  modal.id = "femflowMenuModal";
  modal.className = "ff-menu-modal";

  modal.innerHTML = this._getMenuHTML(page);
  document.body.appendChild(modal);

  // trava scroll
  document.body.classList.add("ff-menu-open");

  setTimeout(() => modal.classList.add("active"), 15);

  this._bindMenuAcoes(page, modal);
},

_getMenuHTML(page) {
  return `
    <div class="ff-menu-overlay"></div>

    <div class="ff-menu-box">
      <button class="ff-close">✕</button>
      <h3 class="ff-menu-title">Menu</h3>

      <button data-nav="home" class="mm-home">🏡 Início</button>
      <button data-nav="flowcenter">📋 FlowCenter</button>
      <button data-nav="treino">💪 Treino</button>
      <button data-nav="respiracao">🌬️ Respiração</button>
      <button data-nav="evolucao">📈 Evolução</button>

      <button id="ffLogoutBtn" class="ff-logout">🚪 Sair</button>
    </div>
  `;
},

_bindMenuAcoes(page, modal) {

  const fechar = () => {
    modal.classList.remove("active");
    document.body.classList.remove("ff-menu-open");
    setTimeout(() => modal.remove(), 180);
  };

  modal.querySelector(".ff-close").onclick = fechar;
  modal.querySelector(".ff-menu-overlay").onclick = fechar;

  // HOME — comportamento especial
  modal.querySelector(".mm-home").onclick = () => {
    fechar();
    FEMFLOW.toast("🏠 Voltando ao início...");
    this.router("home");
  };

  // Demais rotas
  modal.querySelectorAll("[data-nav]").forEach(btn => {
    if (!btn.classList.contains("mm-home")) {
      btn.onclick = () => {
        fechar();
        this.router(btn.dataset.nav);
      };
    }
  });

  // Logout
  modal.querySelector("#ffLogoutBtn").onclick = () => {
    fechar();
    this.logout();
  };
},

   /* ===========================================================
   🔥 AUTO CICLO — ENGINE HORMONAL 23+5 FINAL v2.7
=========================================================== */

autoCiclo() {

  const perfil = localStorage.getItem("femflow_perfilHormonal") || "regular";
  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";

  if (!cicloOK) {
    console.log("⏳ Aguardando configuração do ciclo...");
    return;
  }

  /* -------------------------------------------------------
     1) DATA DE INÍCIO
  ------------------------------------------------------- */
  const startISO = localStorage.getItem("femflow_startDate");
  if (!startISO) {
    console.warn("⚠️ femflow_startDate inexistente");
    return;
  }

  const ciclo = 28;
  const start = new Date(startISO);
  const hoje = new Date();

  /* -------------------------------------------------------
     2) CÁLCULO DO DIA DO CICLO (1 a 28)
  ------------------------------------------------------- */
  const diff = Math.floor((hoje - start) / 86400000);
  const dia = ((diff % ciclo) + ciclo) % ciclo + 1;

  localStorage.setItem("dia_ciclo", String(dia));

  /* -------------------------------------------------------
     3) GRUPO ENERGÉTICO (Menopausa / DIU Hormonal)
     PERFIL = "menopausa" ou "menopausa_tecnica" ou "diu_hormonal"
     → 23 dias FASE ALTA
     → 5 dias MENSTRUAL
  ------------------------------------------------------- */
  if (
    perfil === "menopausa" ||
    perfil === "menopausa_tecnica" ||
    perfil === "diu_hormonal"
  ) {

    const faseAlta = localStorage.getItem("femflow_faseAlta") || "luteal";

    const faseFinal = (dia <= 23) ? faseAlta : "menstrual";

    localStorage.setItem("femflow_fase_atual", faseFinal);

    console.log(`🌕 Energia (${perfil}) | Dia ${dia}/28 → ${faseFinal}`);
    return;
  }

  /* -------------------------------------------------------
     4) GRUPO IRREGULAR
     PERFIL = "irregular"
     → segue também o motor energético 23+5
  ------------------------------------------------------- */
  if (perfil === "irregular") {

    const faseAlta = localStorage.getItem("femflow_faseAlta") || "follicular";
    const faseFinal = (dia <= 23) ? faseAlta : "menstrual";

    localStorage.setItem("femflow_fase_atual", faseFinal);

    console.log(`✨ Irregular | Dia ${dia}/28 → ${faseFinal}`);
    return;
  }

  /* -------------------------------------------------------
     5) GRUPO FISIOLÓGICO (Regular / DIU de Cobre)
     → ciclo real
  ------------------------------------------------------- */
  let fase = "follicular";

  if (dia <= 5) fase = "menstrual";
  else if (dia <= 13) fase = "follicular";
  else if (dia <= 17) fase = "ovulatory";
  else fase = "luteal";

  localStorage.setItem("femflow_fase_atual", fase);

  console.log(`🌿 Regular | Dia ${dia} → ${fase}`);
},

   /* ===========================================================
   🔹 SALVAR TREINO
=========================================================== */
async salvarTreino(dados) {
  try {
    const res = await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarTreino",
        id: localStorage.getItem("femflow_id"),
        ...dados
      }),
    });

    const j = await res.json();
    console.log("💾 Treino salvo:", j);

  } catch (e) {
    console.warn("Erro ao salvar treino:", e);
  }
},

/* ===========================================================
   🔹 SALVAR DESCANSO
=========================================================== */
salvarDescanso: async function (fase = "menstrual") {
  try {
    const res = await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarDescanso",
        id: localStorage.getItem("femflow_id"),
        fase
      }),
    });

    const j = await res.json();
    console.log("😴 Descanso salvo:", j);

  } catch (e) {
    console.error("Erro ao salvar descanso:", e);
  }
},

/* ===========================================================
   🔹 VALIDAR ASSINATURA
=========================================================== */
validarAssinatura: async function (id) {
  try {
    const res = await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validarAssinatura", id }),
    });

    return await res.json();

  } catch (err) {
    console.warn("Erro validar assinatura:", err);
    return { ok: false };
  }
},

/* ===========================================================
   🔹 HISTÓRICO DE TREINOS
=========================================================== */
buscarHistorico: async function (id, n = 30) {
  try {
    const res = await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "buscarHistorico", id, n }),
    });

    const j = await res.json();
    console.log("📘 Histórico:", j);
    return j;

  } catch (err) {
    console.warn("Erro buscar historico:", err);
    return [];
  }
},

/* ===========================================================
   🔹 MODAL PSE
=========================================================== */
criarModalPSE() {
  if (document.getElementById("pseModal")) return;

  const modal = document.createElement("div");
  modal.id = "pseModal";
  modal.style.cssText = `
    display:none; position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.65); justify-content:center; align-items:center;
    z-index:1000;
  `;

  modal.innerHTML = `
    <div style="background:#fff; padding:25px; border-radius:20px; text-align:center;
                width:85%; max-width:340px; animation:fadeIn .4s ease;">
      <h3 style="margin-bottom:10px;color:#335953;font-family:'Playfair Display'">
        Escala PSE 🌿
      </h3>
      <p style="margin-bottom:15px;font-size:.95rem">
        Como você classificaria seu esforço?
      </p>
      <input id="pseValor" type="number" min="0" max="10"
             style="font-size:1.2rem; padding:8px; width:100%; text-align:center;">
      <button id="pseEnviar"
        style="margin-top:18px;background:#335953;color:#fff;padding:10px;
               border-radius:12px;font-size:1rem;">
        Enviar
      </button>
    </div>
  `;

  document.body.appendChild(modal);
},

abrirPSE(callback) {
  const modal = document.getElementById("pseModal");
  modal.style.display = "flex";

  document.getElementById("pseEnviar").onclick = () => {
    const v = Number(document.getElementById("pseValor").value);
    if (isNaN(v) || v < 0 || v > 10) {
      this.toast("Digite um valor entre 0 e 10");
      return;
    }
    modal.style.display = "none";
    callback(v);
  };
},

/* ===========================================================
   🔹 TOAST SIMPLES UNIVERSAL
=========================================================== */
toast(msg, erro = false, top = false) {
  const box = document.createElement("div");
  box.className = "ff-toast";
  box.style.cssText = `
    position:fixed; left:50%; transform:translateX(-50%);
    ${top ? "top:20px" : "bottom:30px"};
    background:${erro ? "#b33636" : "#335953"};
    color:#fff; padding:12px 20px; border-radius:12px;
    font-size:.96rem; z-index:9999; opacity:0;
    transition:opacity .4s ease;
  `;
  box.textContent = msg;

  document.body.appendChild(box);
  setTimeout(() => box.style.opacity = "1", 50);
  setTimeout(() => {
    box.style.opacity = "0";
    setTimeout(() => box.remove(), 300);
  }, 2200);
},

/* ===========================================================
   🔹 ROTEADOR CENTRAL
=========================================================== */
router(dest) {
  const map = {
    home: "home.html",
    cadastro: "cadastro.html",
    ciclo: "ciclo.html",
    flowcenter: "flowcenter.html",
    treino: "treino.html",
    respiracao: "respiracao.html",
    evolucao: "evolucao.html",
  };
  window.location.href = map[dest] || "index.html";
},
/* ===========================================================
   🔥 FIREBASE — INICIALIZAÇÃO
=========================================================== */
initFirebase() {
  if (window._femflowFirebaseReady) return;

  const cfg = {
    apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
    authDomain: "femflow-ebec2.firebaseapp.com",
    projectId: "femflow-ebec2",
    storageBucket: "femflow-ebec2.appspot.com",
    messagingSenderId: "1043953159611",
    appId: "1:1043953159611:web:d12b82f744740f3124c89e",
    measurementId: "G-6F644L5VTW",
  };

  if (!firebase.apps.length) firebase.initializeApp(cfg);

  window._femflowFirebaseReady = true;
  console.log("🔥 Firebase conectado");
},

/* ===========================================================
   🔹 BUSCA EXERCÍCIOS NO FIREBASE — HÍBRIDO + CACHE
=========================================================== */
buscarExerciciosFirebase: async function (nivel, fase, diaKey, enfase) {

  const norm = s =>
    (s || "").toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  nivel  = norm(nivel  || localStorage.getItem("nivel_atual")      || "iniciante");
  fase   = norm(fase   || localStorage.getItem("femflow_fase_atual") || "follicular");
  enfase = norm(enfase || localStorage.getItem("femflow_enfase")     || "geral");
  diaKey = norm(diaKey || localStorage.getItem("dia_ciclo")          || "1");

  const grupoId  = `${nivel}_${enfase}`;
  const cacheKey = `ff_fb_${grupoId}_${fase}_${diaKey}`;
  const now      = Date.now();

  try {
    const cache = JSON.parse(localStorage.getItem(cacheKey));
    if (cache && now - cache.time < 12 * 60 * 60 * 1000) {
      console.log("📦 Cache Firebase:", cache.data);
      return cache.data;
    }
  } catch (_) {}

  try {
    const snap = await firebase.firestore()
      .collection("femflow")
      .doc(grupoId)
      .collection(fase)
      .doc(diaKey)
      .get();

    if (!snap.exists) {
      console.warn("⚠️ Firebase vazio:", grupoId, fase, diaKey);
      return null;
    }

    const data = snap.data();

    localStorage.setItem(cacheKey, JSON.stringify({
      time: now,
      data
    }));

    console.log("🔥 Firebase:", data);
    return data;

  } catch (err) {
    console.error("Erro Firebase:", err);
    return null;
  }
},

/* ===========================================================
   🎨 ANIMAÇÕES GLOBAIS
=========================================================== */
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn { 
  from {opacity:0; transform:scale(.92);}
  to   {opacity:1; transform:scale(1);}
}

.ff-menu-modal {
  position:fixed; inset:0; background:rgba(0,0,0,.55);
  opacity:0; transition:opacity .3s ease;
  display:flex; justify-content:center; align-items:center;
  z-index:2000;
}
.ff-menu-modal.active { opacity:1; }

.ff-menu-box {
  background:#fff; padding:22px; border-radius:18px;
  width:85%; max-width:330px;
  animation:fadeIn .35s ease;
}
.ff-header {
  display:flex; justify-content:space-between;
  padding:12px 16px; background:#fff;
  box-shadow:0 2px 8px rgba(0,0,0,.08);
}
.ff-logo {
  height:32px;
}
.ff-menu-btn {
  background:none; border:none; font-size:1.4rem;
}
.ff-toast {
  animation:fadeIn .4s ease;
}
`;
document.head.appendChild(style);


/* ===========================================================
   🛠 AUTOEXECUÇÃO
=========================================================== */
document.addEventListener("DOMContentLoaded", () => FEMFLOW.initTreino());


/* ===========================================================
   📱 FIX iOS — botões
=========================================================== */
document.addEventListener(
  "click",
  (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (!el.getAttribute("type")) el.setAttribute("type", "button");
  },
  { capture: true, passive: true }
);


/* ===========================================================
   🔐 LOGOUT GLOBAL
=========================================================== */
window.femflowLogout = () => FEMFLOW.logout();


/* ===========================================================
   🎉 VERSÃO FINAL
=========================================================== */
console.log("✅ femflow-core.js v2.7 carregado");





