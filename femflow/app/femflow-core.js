/* ===========================================================
   🌸 FEMFLOW CORE SCRIPT v2.3 — Versão Corrigida Final
   =========================================================== */

window.FEMFLOW = {

/* ===========================================================
   🔍 DETECTOR DE PÁGINAS PÚBLICAS
=========================================================== */
_isPublicPage() {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();
  return ["index.html", "home.html", "ciclo.html"].includes(p);
},

/* ===========================================================
   ⚙️ INICIALIZAÇÃO GERAL
=========================================================== */
initTreino() {
  console.log("💫 FemFlow Core v2.3 conectado com sucesso");

  this.criarModalPSE();
  this.autoCiclo();   // → Agora SEM modo simbólico

  if (!localStorage.getItem("femflow_dia_treino")) {
    localStorage.setItem("femflow_dia_treino", "1");
  }

  const p = (location.pathname.split("/").pop() || "").toLowerCase();
  const paginasProtegidas = ["flowcenter.html", "treino.html", "evolucao.html"];

  if (paginasProtegidas.includes(p)) {
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
   📌 ESTADO DO TREINO (SEM FASE_SUGERIDA)
=========================================================== */
getEstadoTreino() {
  return {
    enfase: localStorage.getItem("femflow_enfase") || "geral",
    nivel: localStorage.getItem("nivel_atual") || "iniciante",
    fase: localStorage.getItem("femflow_fase_atual") || "folicular",
    diaCiclo: Number(localStorage.getItem("dia_ciclo") || 1),
    cicloOK:
      localStorage.getItem("femflow_cycle_configured") === "yes" &&
      localStorage.getItem("femflow_startDate") &&
      localStorage.getItem("femflow_cycleLength")
  };
},

/* ===========================================================
   🔗 ENDPOINT PRINCIPAL
=========================================================== */
SCRIPT_URL:
  localStorage.getItem("femflow_script") ||
  "https://api-myflowlife.falling-wildflower-a8c0.workers.dev",

LOGO: "https://carolinebarros1010.github.io/myflowlife/femflow/app/assets/logofemflowterracota.png",

/* ===========================================================
   🔹 LOGIN / CADASTRO (SEM PERFIL REGULAR FORÇADO)
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

    // Ciclo sincronizado com backend
    if (data.ciclo_duracao)
      localStorage.setItem("femflow_cycleLength", String(data.ciclo_duracao));

    if (data.data_inicio)
      localStorage.setItem("femflow_startDate", new Date(data.data_inicio).toISOString());

    // dia/fase REAL do backend
    if (data.fase)
      localStorage.setItem("femflow_fase_atual", data.fase.toLowerCase());

    if (data.diaCiclo)
      localStorage.setItem("dia_ciclo", data.diaCiclo);

    if (data.nivel)
      localStorage.setItem("nivel_atual", data.nivel.toLowerCase());

    if (data.enfase)
      localStorage.setItem("femflow_enfase", data.enfase.toLowerCase());

    const cicloOk =
      localStorage.getItem("femflow_cycle_configured") === "yes";

    this.router(cicloOk ? "home" : "ciclo");
    return data;

  } catch (err) {
    this.toast("❌ Falha de conexão", true);
  }
},

/* ===========================================================
   🔹 LOGOUT
=========================================================== */
logout() {
  [
    "femflow_auth", "femflow_id", "femflow_nome", "femflow_email",
    "dia_ciclo", "femflow_enfase", "nivel_atual",
    "femflow_cycle_configured", "femflow_fase_atual"
  ].forEach(k => localStorage.removeItem(k));

  this.toast("👋 Sessão encerrada!");
  window.location.href = "index.html";
},

/* ===========================================================
   🔹 CABEÇALHO E MENU — SEM ALTERAÇÃO
=========================================================== */
inserirHeaderApp() { /* ... permanece igual ... */ },
criarMenuModal(page) { /* ... permanece igual ... */ },
_getMenuHTML(page) { /* ... permanece igual ... */ },
_bindMenuAcoes(page, modal) { /* ... permanece igual ... */ },

/* ===========================================================
   🔹 SALVAR TREINO / DESCANSO
=========================================================== */
async salvarTreino(d) { /* ... permanece igual ... */ },
salvarDescanso: async function (fase="menstrual") { /* ... igual ... */ },

validarAssinatura: async function (id) { /* ... igual ... */ },
buscarHistorico: async function (id,n=30) { /* ... igual ... */ },

/* ===========================================================
   🔹 MODAL PSE
=========================================================== */
criarModalPSE() { /* ... igual ... */ },
abrirPSE(callback) { /* ... igual ... */ },

/* ===========================================================
   🔹 TOAST UNIVERSAL
=========================================================== */
toast(msg, erro=false, top=false) { /* ... igual ... */ },

/* ===========================================================
   🔹 AUTO CICLO — VERSÃO CORRETA FINAL
=========================================================== */
autoCiclo() {

  const cicloOK = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloOK) return;

  const ciclo = Number(localStorage.getItem("femflow_cycleLength") || 28);
  const startISO = localStorage.getItem("femflow_startDate");
  if (!startISO) return;

  const start = new Date(startISO);
  const hoje = new Date();
  const diff = Math.floor((hoje - start) / 86400000);  

  // Dia REAL baseado na data
  const diaCiclo = ((diff % ciclo) + ciclo) % ciclo + 1;
  localStorage.setItem("dia_ciclo", diaCiclo);

  // Fase fisiológica padrão
  let fase = "folicular";
  if (diaCiclo <= 5) fase = "menstrual";
  else if (diaCiclo <= 13) fase = "folicular";
  else if (diaCiclo <= 17) fase = "ovulatoria";
  else fase = "lutea";

  localStorage.setItem("femflow_fase_atual", fase);

  console.log(`🌿 Ciclo REAL | Dia ${diaCiclo}/${ciclo} → ${fase}`);
},

/* ===========================================================
   🔹 ROTEADOR
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
};

/* ===========================================================
   AUTOEXECUÇÃO
=========================================================== */
document.addEventListener("DOMContentLoaded", () => FEMFLOW.initTreino());
document.addEventListener("click", (e) => {
  const el = e.target.closest("button");
  if (!el) return;
  if (!el.getAttribute("type")) el.setAttribute("type", "button");
}, { capture: true, passive: true });

window.femflowLogout = () => FEMFLOW.logout();

/* ===========================================================
   ANIMAÇÕES
=========================================================== */
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn { 
  from {opacity:0;transform:scale(0.9);} 
  to   {opacity:1;transform:scale(1);} 
}`;
document.head.appendChild(style);

console.log("✅ femflow-core.js v2.3 carregado");

/* ===========================================================
   🔥 FIREBASE (SEM ALTERAÇÕES, APENAS OTIMIZAÇÃO)
=========================================================== */
(function initFirebase() {
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
})();

/* ===========================================================
   🔹 BUSCA DE EXERCÍCIOS FIREBASE — SEM MUDANÇAS
=========================================================== */
FEMFLOW.buscarExerciciosFirebase = async function (nivel,fase,diaKey,enfase) {
  /* ... permanece igual ... */
};


