/* ===========================================================
   🌸 FEMFLOW CORE SCRIPT v2.2 (patch clean)
   =========================================================== */

window.FEMFLOW = {
   /* =======================================================
   🔍 DETECTOR DE PÁGINAS PÚBLICAS
======================================================= */
  _isPublicPage() {
    const p = (location.pathname.split("/").pop() || "").toLowerCase();
    return ["index.html", "home.html", "ciclo.html"].includes(p);
  },

  /* =======================================================
     ⚙️ INICIALIZAÇÃO GERAL
  ======================================================= */
  initTreino() {
   console.log("💫 FemFlow Core v2.2 conectado com sucesso");
  this.criarModalPSE();
  this.autoCiclo();

  // 🚧 Verificação global de ciclo antes de carregar o app
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
  /* ----------- 🔗 ENDPOINT PRINCIPAL ------------ */
  SCRIPT_URL:
    localStorage.getItem("femflow_script") ||
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev",

  /* ----------- 🎨 LOGO PADRÃO ------------ */
  LOGO: "./assets/logofemflowterracota.png",

  /* =======================================================
     🌸 Cadastro / Anamnese → Apps Script
  ======================================================= */
  async enviarCadastro(dados) {
    if (!dados || !dados.email) {
      this.toast("⚠️ E-mail é obrigatório.", true);
      return;
    }

    try {
      const resp = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginOuCadastro",
          nome: dados.nome || "",
          email: dados.email || "",
          telefone: dados.telefone || "",
          senha: dados.senha || "",
          perfil: dados.perfil || "iniciante",
          pontuacao: dados.pontuacao || 0,
          anamnese: dados.anamnese || ""
        }),
      });

      const r = await resp.json();
      if (r.status === "ok" || r.status === "created") {
        this.toast("✨ Cadastro enviado com sucesso!");
        return r;
      } else {
        this.toast("❌ Erro ao cadastrar: " + (r.msg || r.status), true);
        return null;
      }
    } catch (err) {
      this.toast("⚠️ Falha de rede.", true);
      console.error("Erro enviarCadastro:", err);
      return null;
    }
  },
  /* =======================================================
   🔹 1. index / CADASTRO
======================================================= */
async indexOuCadastro(nome, email) {
  if (!nome || !email) {
    this.toast("⚠️ Informe nome e e-mail para continuar.", true);
    return;
  }

  try {
    const resp = await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "indexOuCadastro", nome, email }),
    });
    const data = await resp.json();

    if (data.status === "ok" || data.status === "created") {
      this.toast(`🌸 Bem-vinda, ${data.nome}!`);

      // 🔹 Identificação e autenticação
      localStorage.setItem("femflow_id", data.id);
      localStorage.setItem("femflow_nome", data.nome);
      localStorage.setItem("femflow_email", data.email);
      localStorage.setItem("femflow_auth", "yes");

      // 🔹 Ciclo — sincroniza com o backend (ou mantém padrão)
      if (data.ciclo_duracao) localStorage.setItem("femflow_cycleLength", String(data.ciclo_duracao));
      else if (!localStorage.getItem("femflow_cycleLength")) localStorage.setItem("femflow_cycleLength", "28");

      if (data.data_inicio) localStorage.setItem("femflow_startDate", new Date(data.data_inicio).toISOString());
      else if (!localStorage.getItem("femflow_startDate")) localStorage.setItem("femflow_startDate", new Date().toISOString());

      // 🔹 Fase e Dia do Ciclo — sincronização direta com backend
      if (data.fase) localStorage.setItem("fase_sugerida", data.fase.toLowerCase());
      if (data.diaCiclo) localStorage.setItem("dia_ciclo", data.diaCiclo);

      // 🔹 Ênfase e Nível
      if (data.enfase) localStorage.setItem("femflow_enfase", data.enfase.toLowerCase());
      if (data.nivel) localStorage.setItem("nivel_atual", data.nivel.toLowerCase());

      // 🔹 Perfil hormonal
      localStorage.setItem("femflow_perfilHormonal", "regular");

      // 🔹 Backup global de segurança (para PWA / mobile)
      const backup = {
        femflow_id: data.id,
        femflow_nome: data.nome,
        femflow_email: data.email,
        femflow_cycleLength: localStorage.getItem("femflow_cycleLength"),
        femflow_startDate: localStorage.getItem("femflow_startDate"),
        femflow_perfilHormonal: localStorage.getItem("femflow_perfilHormonal"),
        fase_sugerida: localStorage.getItem("fase_sugerida"),
        dia_ciclo: localStorage.getItem("dia_ciclo"),
        enfase: localStorage.getItem("femflow_enfase"),
        nivel: localStorage.getItem("nivel_atual")
      };
      localStorage.setItem("femflow_backup", JSON.stringify(backup));

      // 🔹 Redireciona após login ou cadastro
      const cicloOk =
        localStorage.getItem("femflow_startDate") &&
        localStorage.getItem("femflow_cycleLength") &&
        localStorage.getItem("femflow_perfilHormonal") &&
        localStorage.getItem("femflow_cycle_configured") === "yes";

      if (!cicloOk) {
        this.toast("🌿 Configure seu ciclo antes de começar");
        this.router("ciclo");  // leva para ciclo.html
      } else {
        this.router("home");   // se já configurado, vai direto para home.html
      }

      return data; // ✅ retorno DENTRO do try
    } else {
      this.toast("⚠️ Erro no cadastro/index.", true);
    }
  } catch (err) {
    console.error("Erro em indexOuCadastro", err);
    this.toast("❌ Falha de conexão com o servidor.", true);
  }
}, // ✅ vírgula necessária para encerrar o método
/* =======================================================
   🔹 1.1 LOGOUT
   ======================================================= */
logout() {
  // Remove credenciais e dados sensíveis
  const KEYS = [
    "femflow_auth",
    "femflow_id",
    "femflow_nome",
    "femflow_email",
    "fase_sugerida",
    "dia_ciclo",
    "femflow_enfase",
    "nivel_atual",
    "femflow_cycle_configured",
  ];
  KEYS.forEach((k) => localStorage.removeItem(k));

  this.toast("👋 Sessão encerrada com sucesso!");
  window.location.href = "index.html";
},
   
/* =======================================================
   🔹 CABEÇALHO + MENU CONTEXTUAL FEMFLOW (2025)
   ======================================================= */
inserirHeaderApp() {
  if (document.querySelector(".ff-topbar")) return;
  const page = location.pathname.split("/").pop().toLowerCase();
  if (/home|index/i.test(page)) return;

  const header = document.createElement("div");
  header.className = "ff-topbar";
  header.innerHTML = `
    <a href="https://www.femflow.com.br" target="_blank" rel="noopener">
      <img src="${this.LOGO}" alt="FemFlow" class="ff-logo">
    </a>
    <button class="ff-menu-btn" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  `;
  document.body.prepend(header);

const style = document.createElement("style");
style.textContent = `
  .ff-topbar {
      position:fixed;top:0;left:0;width:100%;
      display:flex;justify-content:space-between;align-items:center;
      padding:10px 22px; /* 👈 margem lateral aumentada */
      background:rgba(255,255,255,0.9);
      backdrop-filter:blur(8px);box-shadow:0 1px 6px rgba(0,0,0,0.08);
      z-index:999;
    }
  .ff-logo{width:42px;height:auto;cursor:pointer;}
  /* botão hamburguer */
  .ff-menu-btn{
      width:34px;height:26px;display:flex;flex-direction:column;
      justify-content:space-between;background:none;border:none;
      padding:0;cursor:pointer;
    }
    .ff-menu-btn span{
      display:block;width:100%;height:3px;
      background:var(--terracota,#cc6a5a);
      border-radius:3px;transition:all .3s ease;
    }
    .ff-menu-btn:hover span:nth-child(2){width:80%;}
    /* modal */
  .ff-menu-modal{
    display:none;position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.45);align-items:center;justify-content:center;
    z-index:1000;
  }
  .ff-menu-box{
    background:#fff;border-radius:20px;padding:22px;text-align:center;
    width:80%;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.25);
  }
  .ff-menu-box h3{
    color:#335953;font-family:'Playfair Display',serif;margin-bottom:10px;
  }
  .ff-menu-box button{
    display:block;width:100%;margin:8px 0;padding:10px;border:none;
    border-radius:12px;font-family:"Lato",sans-serif;font-weight:600;
    cursor:pointer;background:var(--bege,#f9f3ef);color:var(--terracota,#cc6a5a);
    transition:all .3s;
  }
  .ff-menu-box button:hover{background:var(--terracota,#cc6a5a);color:#fff;}
`;
document.head.appendChild(style);

FEMFLOW.criarMenuModal(page);
},

criarMenuModal(page) {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";
  document.body.appendChild(modal);

  const openMenu = () => {
    modal.innerHTML = FEMFLOW._getMenuHTML(page);
    modal.style.display = "flex";
    FEMFLOW._bindMenuAcoes(page, modal);

    // 🌐 alterna idioma global (para qualquer página)
    const langBtn = modal.querySelector("#btnLangToggle");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        const lang = localStorage.getItem("femflow_lang") === "en" ? "pt" : "en";
        localStorage.setItem("femflow_lang", lang);
        FEMFLOW.toast(lang === "pt" ? "🌸 Idioma: Português" : "🌸 Language: English");
        modal.style.display = "none";
        location.reload();
      });
    }
  };

  // abre menu
  document.querySelector(".ff-menu-btn").onclick = openMenu;
},

_getMenuHTML(page) {
  let items = "";
  switch (page) {
    case "flowcenter.html":
    case "evolucao.html":
      items = `
        <h3>Menu</h3>
        <button id="btnLangToggle">🌐 Idioma / Language</button>
        <button id="btnPersonalizar">🎯 Personalizar treino</button>
        <button id="btnCancelarPlano">❌ Cancelar plano</button>
        <button id="btnVoltarInicio">🏠 Voltar</button>
        <button id="btnFecharMenu">Fechar</button>`;
      break;

    case "treino.html":
      items = `
        <h3>Menu</h3>
        <button id="btnLangToggle">🌐 Idioma / Language</button>
        <button id="btnCancelarTreino">🛑 Cancelar treino</button>
        <button id="btnRespirar">🧘 Respiração</button>
        <button id="btnVoltarFlow">🏠 Voltar ao Flow Center</button>
        <button id="btnFecharMenu">Fechar</button>`;
      break;

    case "respiracao.html":
      items = `
        <h3>Menu</h3>
        <button id="btnLangToggle">🌐 Idioma / Language</button>
        <button id="btnCancelar">🛑 Cancelar</button>
        <button id="btnVoltarFlow">🏠 Voltar ao Flow Center</button>
        <button id="btnPlano">💳 Adquirir plano</button>
        <button id="btnFecharMenu">Fechar</button>`;
      break;

    default:
      items = `<h3>Menu</h3>
               <button id="btnLangToggle">🌐 Idioma / Language</button>
               <button id="btnFecharMenu">Fechar</button>`;
  }
  return `<div class="ff-menu-box">${items}</div>`;
},

_bindMenuAcoes(page, modal) {
  const fechar = () => (modal.style.display = "none");
  modal.querySelector("#btnFecharMenu")?.addEventListener("click", fechar);

  // Flowcenter e Evolução
  if (["flowcenter.html", "evolucao.html"].includes(page)) {
    modal.querySelector("#btnPersonalizar")?.addEventListener("click", () =>
      window.open("https://www.myflowlife.com.br/#planos", "_blank")
    );

  modal.querySelector("#btnLangToggle")?.addEventListener("click", () => FEMFLOW.toggleLang());

    modal.querySelector("#btnVoltarInicio")?.addEventListener("click", () => FEMFLOW.router("home"));
  }

 // Treino
  if (page === "treino.html") {
    modal.querySelector("#btnCancelarTreino").onclick = () => {
      FEMFLOW.toast("❌ Treino cancelado");
      FEMFLOW.router("flowcenter");
    };
    modal.querySelector("#btnRespirar").onclick = () => FEMFLOW.router("respiracao");
    modal.querySelector("#btnVoltarFlow").onclick = () => FEMFLOW.router("flowcenter");
  }

  // Respiração
  if (page === "respiracao.html") {
    modal.querySelector("#btnCancelar").onclick = () => FEMFLOW.router("respiracao");
    modal.querySelector("#btnVoltarFlow").onclick = () => FEMFLOW.router("flowcenter");
    modal.querySelector("#btnPlano").onclick = () => FEMFLOW.router("home");
     // 🔄 alterna idioma global
modal.querySelector("#btnLangToggle")?.addEventListener("click", () => {
  const lang = localStorage.getItem("femflow_lang") === "en" ? "pt" : "en";
  localStorage.setItem("femflow_lang", lang);
  FEMFLOW.toast(lang === "pt" ? "🌸 Idioma: Português" : "🌸 Language: English");
  modal.style.display = "none";
  location.reload();
});

  }
},
         /* =======================================================
     🌐 2.9 SISTEMA DE IDIOMA GLOBAL (PT ↔ EN)
  ======================================================= */
  setLang(lang) {
    const langNorm = (lang === "en" ? "en" : "pt");
    localStorage.setItem("femflow_lang", langNorm);
    window.dispatchEvent(new Event("femflow:langchange"));
    this.toast(langNorm === "pt" ? "🌸 Idioma: Português" : "🌸 Language: English");
  },

  toggleLang() {
    const current = localStorage.getItem("femflow_lang") || "pt";
    const newLang = current === "pt" ? "en" : "pt";
    this.setLang(newLang);
  },

  /* =======================================================
     🔹 3. SALVAR TREINO / DESCANSO / PSE
  ======================================================= */
  async salvarTreino({
    id = localStorage.getItem("femflow_id") || "FF-TESTE",
    fase = "folicular",
    treino = "A",
    tipo_dia = "treino",
    pse = "N/A",
    observacao = "",
  } = {}) {
    const payload = {
      action: tipo_dia === "descanso" ? "descanso" : "pse",
      id,
      data: new Date().toISOString(),
      fase,
      treino,
      tipo_dia,
      pse,
      observacao,
    };

    try {
      const resp = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await resp.json();

      if (result.status?.includes("ok") || result.status?.includes("registrado")) {
        this.toast("✔️ Registro salvo com sucesso!");
        navigator.vibrate?.([100]);
      } else this.toast("⚠️ Erro ao salvar. Tente novamente.", true);
    } catch (err) {
      console.error("Erro no envio:", err);
      this.toast("❌ Falha de conexão. Verifique a internet.", true);
    }
  },

  async salvarDescanso(fase = "menstrual") {
    await this.salvarTreino({
      tipo_dia: "descanso",
      fase,
      treino: "Descanso",
      pse: "N/A",
      observacao: "Descanso ativo",
    });
    setTimeout(() => this.router("flowcenter"), 1800);
  },

  /* =======================================================
     🔹 4. MODAL PSE
  ======================================================= */
  criarModalPSE() {
    if (document.getElementById("pseModal")) return;

    const modal = document.createElement("div");
    modal.id = "pseModal";
    modal.style.cssText = `
      display:none; position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.7); justify-content:center; align-items:center;
      z-index:1000; font-family:'Lato',sans-serif;`;

    modal.innerHTML = `
      <div style="background:#fff; padding:25px; border-radius:20px; text-align:center;
                  width:85%; max-width:340px; box-shadow:0 3px 12px rgba(0,0,0,0.2); animation:fadeIn 0.4s ease;">
        <h3 style="color:#335953;font-family:'Playfair Display';margin-bottom:10px;">Escala PSE 🌿</h3>
        <p style="margin-bottom:15px;">Como foi a intensidade do treino?</p>
        <div id="pseBtns" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;"></div>
        <button id="cancelarPSE" style="margin-top:15px;background:#aaa;color:#fff;border:none;
                padding:8px 16px;border-radius:15px;cursor:pointer;">Cancelar</button>
      </div>`;
    document.body.appendChild(modal);

    const pseBtns = modal.querySelector("#pseBtns");
    for (let i = 0; i <= 10; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.style.cssText = `
        background:#335953; color:#fff; border:none; border-radius:50%;
        width:40px; height:40px; font-size:16px; cursor:pointer;`;
      btn.onclick = () => {
        modal.style.display = "none";
        FEMFLOW.onPSESelecionado && FEMFLOW.onPSESelecionado(i);
      };
      pseBtns.appendChild(btn);
    }

    modal.querySelector("#cancelarPSE").onclick = () => (modal.style.display = "none");
  },

  abrirPSE(callback) {
    this.onPSESelecionado = callback;
    const el = document.getElementById("pseModal");
    if (el) el.style.display = "flex";
  },

  /* =======================================================
     🔹 5. HIIT SIMPLES
  ======================================================= */
  iniciarHIIT(on = 30, off = 30, ciclos = 8) {
    this.toast(`🔥 HIIT iniciado: ${on}s ON / ${off}s OFF ×${ciclos}`);
  },

  /* =======================================================
     🔹 6. TOAST UNIVERSAL
  ======================================================= */
  toast(msg, erro = false, top = false) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.position = "fixed";
    toast.style[top ? "top" : "bottom"] = "25px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = erro ? "#d9534f" : "#335953";
    toast.style.color = "#fff";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "20px";
    toast.style.fontFamily = "Lato, sans-serif";
    toast.style.fontSize = "15px";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 3px 8px rgba(0,0,0,0.2)";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  /* =======================================================
     🔹 7. AUTO CICLO
  ======================================================= */
autoCiclo() {
  const perfil = localStorage.getItem("femflow_perfilHormonal") || "regular";
  const ciclo = Number(localStorage.getItem("femflow_cycleLength") || 28);
  let dia = Number(localStorage.getItem("dia_ciclo") || 1);

  // 🌿 Caso REGULAR → calcula fase real baseada na data de início
  if (perfil === "regular") {
    const startDate = new Date(localStorage.getItem("femflow_startDate") || new Date());
    const hoje = new Date();
    const diffDias = Math.floor((hoje - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Se o ciclo passou do limite, reinicia
    const diaCiclo = ((diffDias - 1) % ciclo) + 1;
    localStorage.setItem("dia_ciclo", diaCiclo);

    // Define fase com base no ciclo fisiológico
    const fase = (() => {
      if (diaCiclo <= 5) return "menstrual";
      if (diaCiclo <= 13) return "folicular";
      if (diaCiclo <= 17) return "ovulatoria";
      return "lutea";
    })();

    localStorage.setItem("fase_atual", fase);
    localStorage.setItem("fase_sugerida", fase);
    console.log(`🩸 Regular: Dia ${diaCiclo}/${ciclo} → ${fase}`);
    return;
  }

  // 🌸 Caso IRREGULAR / DIU / MENOPAUSA → ciclo simbólico contínuo
  dia = (dia % ciclo) + 1;
  localStorage.setItem("dia_ciclo", dia);

  const fase = (() => {
    if (dia <= 5) return "menstrual";
    if (dia <= 13) return "folicular";
    if (dia <= 17) return "ovulatoria";
    return "lutea";
  })();

  localStorage.setItem("fase_atual", fase);
  localStorage.setItem("fase_sugerida", fase);

  if (dia === 1) {
    this.toast("🌸 Novo ciclo simbólico iniciado!");
    localStorage.setItem(
      `femflow_reiniciado_${localStorage.getItem("femflow_id")}`,
      new Date().toISOString()
    );
  }

  console.log(`🩸 Simbólico: Dia ${dia}/${ciclo} → ${fase}`);
},


  /* =======================================================
     🔹 8. ROTEADOR
  ======================================================= */
    router(destino) {
    const map = {
      home: "home.html",
      cadastro: "cadastro.html",
      ciclo: "ciclo.html",
      flowcenter: "flowcenter.html",
      treino: "treino.html",
      respiracao: "respiracao.html",   // ✅ adicionado aqui
      evolucao: "evolucao.html",
    };
    const url = map[destino] || "index.html";
    window.location.href = url;
  },
};

/* ----------- 🚀 AUTOEXECUÇÃO ------------ */
document.addEventListener("DOMContentLoaded", () => FEMFLOW.initTreino());

/* ----------- 🔗 Alias global de logout ------------ */
window.femflowLogout = () => FEMFLOW.logout();

/* ----------- ✨ ANIMAÇÕES ------------ */
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn {
  from {opacity:0; transform:scale(0.9);}
  to {opacity:1; transform:scale(1);}
}`;
document.head.appendChild(style);

console.log("✅ femflow-core.js carregado e executando");


// 🌸 Inicialização segura do Firebase FemFlow
(function initFirebase() {
  if (window._femflowFirebaseReady) return;

  const firebaseConfig = {
    apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
    authDomain: "femflow-ebec2.firebaseapp.com",
    projectId: "femflow-ebec2",
    storageBucket: "femflow-ebec2.appspot.com",  // ✅ corrigido
    messagingSenderId: "1043953159611",
    appId: "1:1043953159611:web:d12b82f744740f3124c89e",
    measurementId: "G-6F644L5VTW",
  };

  try {
    // Garante que o SDK está carregado
    if (typeof firebase === "undefined") {
      console.error("❌ Firebase SDK não encontrado. Inclua firebase-app-compat.js antes deste script.");
      return;
    }

    // Evita múltiplas inicializações
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log("🔥 Firebase inicializado com sucesso (FemFlow)");
    } else {
      console.log("⚙️ Firebase já estava inicializado.");
    }

    window._femflowFirebaseReady = true;
  } catch (e) {
    console.warn("⚠️ Falha ao inicializar Firebase:", e);
    window._femflowFirebaseReady = false;
  }
})();
     
FEMFLOW.calcularCiclos = function () {
  const start = new Date(localStorage.getItem("femflow_startDate"));
  const cicloLen = Number(localStorage.getItem("femflow_cycleLength") || 28);
  const hoje = new Date();
  const diff = Math.floor((hoje - start) / 86400000) + 1; // dias desde início do ciclo

  // 🔹 Dia biológico (1–28)
  const diaCiclo = ((diff - 1) % cicloLen) + 1;

  // 🔹 Determina fase hormonal atual
  let fase = "folicular";
  if (diaCiclo <= 5) fase = "menstrual";
  else if (diaCiclo <= 13) fase = "folicular";
  else if (diaCiclo <= 16) fase = "ovulatoria";
  else fase = "lutea";

  // 🔹 Dia do programa (progresso de treino sequencial)
  let diaPrograma = Number(localStorage.getItem("femflow_diaPrograma") || 1);

  return { diaCiclo, fase, diaPrograma };
};

/* ===========================================================
   🔹 Busca de Exercícios no Firebase
  =========================================================== */
FEMFLOW.buscarExerciciosFirebase = async function (nivel, fase, diaKey, enfase) {
  const norm = (s) => (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  nivel = norm(nivel || localStorage.getItem("nivel_atual") || "iniciante");
  fase = norm(fase || localStorage.getItem("fase_atual") || "folicular");
  // 🔧 Corrige variações estrangeiras ou acentuadas
const faseMap = {
  follicular: "folicular",
  ovulatory: "ovulatoria",
  luteal: "lutea",
  menstrual: "menstrual"
};
if (faseMap[fase]) fase = faseMap[fase];
 
  diaKey = (diaKey || `dia_${localStorage.getItem("dia_ciclo") || 1}`).toLowerCase();
  enfase = norm(enfase || localStorage.getItem("enfase_atual") || "geral");

  const grupoId = `${nivel}_${enfase}`;
  const cacheKey = `ff_fb_${grupoId}_${fase}_${diaKey}`;
  const now = Date.now();

  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (cached && now - cached.ts < 15 * 60 * 1000) return cached.data;
  } catch (_) {}

  if (!window._femflowFirebaseReady || !window.firebase?.firestore) return [];

  const db = firebase.firestore();
  const path = db
    .collection("exercicios")
    .doc(grupoId)
    .collection("fases")
    .doc(fase)
    .collection("dias")
    .doc(diaKey)
    .collection("exercicios");

  const snap = await path.get();
  const itens = [];
  snap.forEach((doc) => {
    const d = doc.data() || {};
    itens.push({
      id: doc.id,
      box: d.box || "Box 1",
      titulo: d.titulo || d.nome || "Exercício",
      series: d.series ? String(d.series).trim() : null,
      reps: d.reps ? String(d.reps).trim() : null,
      tempo: d.tempo ? Number(String(d.tempo).replace(/\D/g, "")) : null,
      link: d.link || d.url || d.video || "",
      grupo: d.grupo || "",
      enfase: d.enfase || "",
      fase: d.fase || fase,
      nivel: d.nivel || nivel,
      dia: d.dia || Number((diaKey.match(/\d+/) || [1])[0]),
    });
  });

itens.sort((a, b) => 
  a.box.localeCompare(b.box) || a.titulo.localeCompare(b.titulo)
);

try {
  localStorage.setItem(cacheKey, JSON.stringify({ ts: now, data: itens }));
} catch (_) {}

return itens;
};




