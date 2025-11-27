/* ===========================================================
   🌸 FEMFLOW CORE — V3 (2025)
   Compatível com:
   - treino.js Engine Hormonal 3.1
   - Firebase (buscarExerciciosFirebase)
   - Backend GAS 2025 (fase, enfase, diaCiclo, treino-dia)
   - Todas as páginas antigas (home, flowcenter, respiracao, anamnese)

    - FEMFLOW.inspect();
    - FEMFLOW.debugBackend();
    - FEMFLOW.debugFirebaseRaw("iniciante_gluteo", "folicular", "dia_08");
    - FEMFLOW_DEBUG_TREINO.log();
     - FEMFLOW_DEBUG_TREINO.printFirebaseQuery({
    pasta: "iniciante_gluteo",
    fase: "folicular",
    diaKey: "dia_08"
});
 - FEMFLOW.buscarExerciciosFirebase("iniciante_gluteo", "folicular", "dia_05");
 - codigo -- limpeza cache: caches.keys().then(keys => keys.forEach(k => caches.delete(k)));


    
   =========================================================== */

window.FEMFLOW = {

  /* -----------------------------------------------------------
     ✓ CONFIGURAÇÃO BASE
  ----------------------------------------------------------- */
  SCRIPT_URL:
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev",

    /* -----------------------------------------------------------
     ✓ SISTEMA DE LOG FEMFLOW (Modo DEV + Logs Pro)
  ----------------------------------------------------------- */
  dev() { 
    return localStorage.getItem("femflow_dev") === "on"; 
  },

  log(...args) {
    if (!this.dev()) return;
    console.log("%c[FEMFLOW]", "color:#cc6a5a;font-weight:bold;", ...args);
  },

  warn(...args) {
    if (!this.dev()) return;
    console.warn("%c[FEMFLOW ⚠]", "color:#e07f67;font-weight:bold;", ...args);
  },

  error(...args) {
    if (!this.dev()) return;
    console.error("%c[FEMFLOW ❌]", "color:#b74333;font-weight:bold;", ...args);
  },
 
  /* -----------------------------------------------------------
     ✓ TOAST UNIVERSAL
  ----------------------------------------------------------- */
  toast(msg, error = false, offline = false) {
    let box = document.querySelector(".toast-box");
    if (!box) {
      box = document.createElement("div");
      box.className = "toast-box";
      document.body.appendChild(box);
    }

    box.textContent = msg;
    box.style.background = error ? "#cc6a5a" : "#335953";
    box.classList.add("visible");

    if (!offline) {
      setTimeout(() => box.classList.remove("visible"), 2600);
    }
  },

  /* -----------------------------------------------------------
     ✓ ROUTER INTELIGENTE
  ----------------------------------------------------------- */
 router(pagina) {
    const destino = pagina.endsWith(".html") ? pagina : pagina + ".html";
    this.log("Router →", destino);
    location.href = destino;
  },

  /* -----------------------------------------------------------
     ✓ CABEÇALHO DINÂMICO
  ----------------------------------------------------------- */
 // ------------------------------------------------------------
// ✓ HEADER COM BOTÃO DE MENU (Hamburger) — 2025
// ------------------------------------------------------------
inserirHeaderApp() {
  if (document.querySelector("#femflowHeader")) return;

  const h = document.createElement("header");
  h.id = "femflowHeader";

  h.innerHTML = `
    <img src="./assets/logofemflowterracotasf.png" class="ff-logo" alt="FemFlow">

    <button id="ffMenuBtn" class="ff-menu-btn">
      &#9776;
    </button>
  `;

  document.body.prepend(h);

  // Abre modal
  h.querySelector("#ffMenuBtn").onclick = () => {
    document.querySelector(".ff-menu-modal")?.classList.add("active");
  };
},

   criarMenuModal(page) {
  if (document.getElementById("ffMenuModal")) return;

  const modal = document.createElement("div");
  modal.id = "ffMenuModal";
  modal.className = "ff-menu-modal";

  modal.innerHTML = `
    <div class="ff-menu-box">
      ${this._getMenuHTML(page)}
    </div>
  `;

  modal.onclick = (e) => {
    if (e.target.id === "ffMenuModal") modal.remove();
  };

  document.body.appendChild(modal);

  this._bindMenuAcoes(page, modal);
},

// ------------------------------------------------------------
// ✓ MENU LATERAL FEMFLOW — COMPLETO
// ------------------------------------------------------------
inserirMenuLateral() {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";

  modal.innerHTML = `
    <div class="ff-menu-box">

      <h2 class="ff-menu-title">Menu</h2>
      
      <button class="ff-menu-op ff-close" data-go="fechar">✖️ Fechar menu</button>
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

  // Fecha ao clicar fora
  modal.onclick = e => {
    if (e.target.classList.contains("ff-menu-modal")) {
      modal.classList.remove("active");
    }
  };

  // Eventos do menu
  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn => {
    btn.onclick = () => this._acaoMenu(btn.dataset.go);
  });
},


// ------------------------------------------------------------
// ✓ AÇÕES DO MENU FEMFLOW
// ------------------------------------------------------------
_acaoMenu(op) {

  const modal = document.querySelector(".ff-menu-modal");
  modal?.classList.remove("active");

  switch(op){
        
case "fechar":
  document.querySelector(".ff-menu-modal")?.classList.remove("active");
  break;

    case "idioma":
      this._alternarIdioma();
      break;

    case "ciclo":
      this.router("ciclo.html");
      break;

    case "respiracao":
      this.router("respiracao.html");
      break;

    case "treinos":
      this.router("evolucao.html");
      break;

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem("femflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "logout":
      localStorage.clear();
      this.router("index.html");
      break;
        
   case "voltar":
   const rota = {
    "treino.html": "flowcenter.html",
    "flowcenter.html": "home.html",
    "respiracao.html": "flowcenter.html",
    "evolucao.html": "flowcenter.html",
    "ciclo.html": "home.html"
  };

  const atual = location.pathname.split("/").pop();
  const destino = rota[atual] || "home.html";

  this.router(destino);
  break;
       
  }
},


 
  /* -----------------------------------------------------------
     ✓ MODAL PSE (compatível com treino.js 2025)
  ----------------------------------------------------------- */
  criarModalPSE() {
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
  },

  abrirPSE(callback) {
    const modal = document.querySelector("#modal-pse");
    if (!modal) return;

    modal.classList.remove("oculto");

    modal.querySelectorAll(".pse-opt").forEach(btn => {
      btn.onclick = () => {
        const v = btn.dataset.v;
        modal.classList.add("oculto");
        if (callback) callback(v);
      };
    });
  },

  /* -----------------------------------------------------------
     ✓ SALVAR TREINO (versão híbrida Firebase + GAS)
  ----------------------------------------------------------- */
    async salvarTreino({ pse, treino, fase, diaFirebase, obs = "" }) {

    this.log("Salvando treino:", { pse, treino, fase, diaFirebase });

    const id = localStorage.getItem("femflow_id");
    if (!id) {
      this.error("Salvar treino sem ID.");
      return;
    }

    try {
      const r = await fetch(this.SCRIPT_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          action:"salvarTreino", id, pse, treino, fase, diaFirebase, obs
        })
      });

      const j = await r.json();
      this.log("Resposta salvarTreino()", j);

      if (j.status === "ok") this.toast("Treino salvo! 🌸");
      else this.error("Erro salvar treino:", j);

    } catch (err) {
      this.error("Erro de conexão ao salvar treino:", err);
    }
  },


  /* -----------------------------------------------------------
     ✓ SALVAR DESCANSO (compatível com treino.js)
  ----------------------------------------------------------- */
  async salvarDescanso(fase) {
    const id = localStorage.getItem("femflow_id");
    if (!id) return;

    try {
      await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "salvarDescanso",
          id,
          fase
        })
      });

      this.toast("Descanso registrado 🌿");
    } catch (err) {
      this.toast("Erro ao registrar descanso.", true);
    }
  },

/* -----------------------------------------------------------
   ✓ BUSCA DE EXERCÍCIOS (Firebase) — DEBUG PRO 2025
----------------------------------------------------------- */
async buscarExerciciosFirebase(pasta, fase, diaKey) {

  // ---------- 1) DEBUG DE ENTRADA ----------
  this.log("🔥 Firebase: Início da busca", {
    pasta,
    fase,
    diaKey
  });

  const url =
    `https://firebasestorage.googleapis.com/v0/b/femflow-firebase.appspot.com/o/` +
    `${encodeURIComponent(`exercicios/${pasta}/${fase}/${diaKey}.json`)}?alt=media`;

  // Mostra a URL final
  this.log("📡 URL Firebase:", url);

  try {
    // ---------- 2) REQUISIÇÃO ----------
    const r = await fetch(url);

    // Loga status da resposta
    this.log("📥 Firebase Status HTTP:", {
      ok: r.ok,
      status: r.status,
      statusText: r.statusText
    });

    // Se o arquivo não existe — 404
    if (!r.ok) {
      this.warn("⚠️ Firebase retornou erro HTTP", {
        pasta,
        fase,
        diaKey,
        status: r.status
      });
      return null;
    }

    // ---------- 3) TENTA LER JSON ----------
    let json = null;

    try {
      json = await r.json();
    } catch (jsonErr) {
      this.error("❌ Erro ao interpretar JSON do Firebase", jsonErr);
      return null;
    }

    // DEBUG: Resposta bruta
    this.log("📦 Firebase JSON bruto:", json);

    // ---------- 4) VALIDAÇÃO ----------
    if (!json) {
      this.warn("⚠️ Firebase retornou vazio.");
      return null;
    }

    if (json.error) {
      this.error("❌ Firebase error:", json.error);
      return null;
    }

    if (!Array.isArray(json)) {
      this.warn("⚠️ Retorno não é lista de exercícios", {
        tipo: typeof json
      });
      return null;
    }

    // DEBUG: Quantidade de exercícios
    this.log("✅ Firebase retornou exercícios:", {
      quantidade: json.length
    });

    return json;

  } catch (err) {
    // ---------- 5) ERRO GERAL ----------
    this.error("🔥 ERRO FATAL NA CONEXÃO COM O FIREBASE:", err);
    return null;
  }
},



  /* -----------------------------------------------------------
     ✓ AUTO LOAD DO USUÁRIO (login → páginas internas)
  ----------------------------------------------------------- */
    async carregarPerfil() {
    const id = localStorage.getItem("femflow_id");
    if (!id) {
      this.warn("carregarPerfil(): ID não encontrado no localStorage");
      return null;
    }

    try {
      this.log("Validando ID com backend:", id);

      const r = await fetch(`${this.SCRIPT_URL}?action=validar&id=${id}`);
      const j = await r.json();

      this.log("Resposta validar():", j);

      if (j.status !== "ok") return null;

      localStorage.setItem("femflow_nome", j.nome);
      localStorage.setItem("femflow_fase", j.fase);
      localStorage.setItem("femflow_enfase", j.enfase);
      localStorage.setItem("femflow_diaCiclo", j.diaCiclo);
      localStorage.setItem("femflow_nivel", j.nivel);

      this.log("Perfil atualizado no localStorage.");

      return j;

    } catch (err) {
      this.error("Erro validar perfil:", err);
      return null;
    }
  },

/* -----------------------------------------------------------
   ✓ INSPECTOR FULL — FEMFLOW 2025
   Console: FEMFLOW.inspect()
----------------------------------------------------------- */
inspect() {

  console.clear();
  console.log("%c🔍 FEMFLOW INSPECTOR — FULL MODE (2025)", "font-size:18px;font-weight:bold;color:#cc6a5a;");

  /* -----------------------------------------------------------
     1) Dados principais do front
  ----------------------------------------------------------- */
  console.groupCollapsed("📌 LOCALSTORAGE");
  const keys = [
    "femflow_id", "femflow_email", "femflow_nome",
    "femflow_fase", "femflow_enfase",
    "femflow_nivel", "femflow_diaCiclo",
    "femflow_cycleLength", "femflow_startDate",
    "femflow_perfilHormonal", "femflow_dia_treino",
    "femflow_dev", "femflow_theme",
    "femflow_dia_energetico"
  ];
  keys.forEach(k => console.log(k, "→", localStorage.getItem(k)));
  console.groupEnd();


  /* -----------------------------------------------------------
     2) Motor hormonal atual
  ----------------------------------------------------------- */
  console.groupCollapsed("🌙 ENGINE HORMONAL");
  try {
    const h = calcularEngineHormonal();
    console.log("Engine Hormonal →", h);
  } catch (e) {
    console.warn("Erro na engine hormonal:", e);
  }
  console.groupEnd();


  /* -----------------------------------------------------------
     3) Firebase Query completa
  ----------------------------------------------------------- */
  console.groupCollapsed("🔥 FIREBASE QUERY");
  try {
    const nivel  = localStorage.getItem("femflow_nivel")  || "iniciante";
    const enfase = localStorage.getItem("femflow_enfase") || "geral";

    const hormonal = calcularEngineHormonal();
    const pasta = `${nivel}_${enfase}`;
    const firebaseQuery = {
      pasta,
      fase: hormonal.faseFirebase,
      diaKey: hormonal.diaKey
    };
    console.table(firebaseQuery);

    const url =
      `https://firebasestorage.googleapis.com/v0/b/femflow-firebase.appspot.com/o/` +
      encodeURIComponent(`exercicios/${pasta}/${hormonal.faseFirebase}/${hormonal.diaKey}.json`) +
      `?alt=media`;

    console.log("URL:", url);

  } catch (e) {
    console.warn("Erro ao montar query Firebase:", e);
  }
  console.groupEnd();


  /* -----------------------------------------------------------
     4) Snapshot Offline
  ----------------------------------------------------------- */
  console.groupCollapsed("📦 SNAPSHOT OFFLINE");
  try {
    const snap = JSON.parse(localStorage.getItem("femflow_offline_treino_v1"));
    if (!snap) console.log("Nenhum snapshot existente.");
    else {
      console.log("Meta:", snap.meta);
      console.log("Boxes:", snap.lista);
    }
  } catch (e) {
    console.warn("Erro ao ler snapshot:", e);
  }
  console.groupEnd();


  /* -----------------------------------------------------------
     5) Backend GET treino
  ----------------------------------------------------------- */
  console.groupCollapsed("🛠 BACKEND (ULTIMA RESPOSTA)");
  try {
    console.warn("→ Ativar logs da função executarTreinoDia() para ver resposta completa.");
  } catch (e) {}
  console.groupEnd();


  /* -----------------------------------------------------------
     6) DOM (Carrossel / Treino)
  ----------------------------------------------------------- */
  console.groupCollapsed("📱 DOM — TREINO.HTML");
  try {
    const track = document.querySelector("#carouselTrack");
    const boxes = track ? track.children.length : 0;

    console.log("Track encontrado:", !!track);
    console.log("Total de boxes:", boxes);

    const bar = document.querySelector("#progressBar");
    console.log("ProgressBar:", bar?.style.width);

  } catch (e) {
    console.warn("DOM não disponível:", e);
  }
  console.groupEnd();


  /* -----------------------------------------------------------
     7) Dispositivo
  ----------------------------------------------------------- */
  console.groupCollapsed("📱 DEVICE INFO");
  console.log("UserAgent:", navigator.userAgent);
  console.log("Viewport:", window.innerWidth, "x", window.innerHeight);
  console.groupEnd();

  console.log("%c✔ INSPEÇÃO COMPLETA — FIM", "font-weight:bold;color:#4ba387;font-size:16px;");
},

  /* -----------------------------------------------------------
   ✓ DEBUG — VER DADO CRU DO BACKEND (GET treino)
   Console: FEMFLOW.debugBackend()
----------------------------------------------------------- */
async debugBackend() {

  console.clear();
  console.log("%c🔍 DEBUG BACKEND RAW — GET TREINO", "font-size:18px;font-weight:bold;color:#cc6a5a;");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    console.error("❌ Sem ID. Faça login.");
    return;
  }

  // Recalcular engine hormonal como o treino.js
  let h = null;
  try {
    h = calcularEngineHormonal();
  } catch (err) {
    console.warn("Engine hormonal falhou:", err);
  }

  // Montar URL idêntica à usada no treino.js
  const url =
    `${this.SCRIPT_URL}?action=treino` +
    `&id=${encodeURIComponent(id)}` +
    `&fase=${encodeURIComponent(h?.faseFirebase || "")}` +
    `&diaFirebase=${encodeURIComponent(h?.diaFirebase || "")}` +
    `&diaKey=${encodeURIComponent(h?.diaKey || "")}` +
    `&nivel=${encodeURIComponent(localStorage.getItem("femflow_nivel") || "")}` +
    `&enfase=${encodeURIComponent(localStorage.getItem("femflow_enfase") || "")}`;

  // Mostra a URL final usada
  console.log("%c📡 URL GET →", "color:#cc6a5a;font-weight:bold;", url);

  try {

    // Fazer requisição
    const r = await fetch(url);

    console.log("%c📥 HTTP Status:", "color:#cc6a5a;font-weight:bold;", {
      ok: r.ok,
      status: r.status,
      statusText: r.statusText
    });

    const raw = await r.text(); // ← texto cru
    console.log("%c📦 RAW TEXT DO BACKEND:", "color:#cc6a5a;font-weight:bold;", raw);

    // Tentar parsear para JSON
    let json = null;
    try {
      json = JSON.parse(raw);
      console.log("%c🔍 JSON PARSEADO:", "color:#4ba387;font-weight:bold;", json);
    } catch (err) {
      console.warn("⚠️ JSON inválido (não parseou).");
      return;
    }

    // Destacar campos importantes
    console.groupCollapsed("🧩 CAMPOS IMPORTANTES DO BACKEND");
    console.log("status:", json.status);
    console.log("fase:", json.fase);
    console.log("diaFirebase:", json.diaFirebase);
    console.log("diaCiclo:", json.diaCiclo);
    console.log("boxes:", json.boxes);
    console.log("hiitCardio:", json.hiitCardio);
    console.log("erro:", json.error);
    console.groupEnd();

  } catch (err) {
    console.error("%c❌ ERRO AO BUSCAR BACKEND RAW:", "color:#b74333;font-weight:bold;", err);
  }

  console.log("%c✔ DEBUG BACKEND FINALIZADO", "font-weight:bold;color:#4ba387;font-size:16px;");
},
 

  /* -----------------------------------------------------------
     ✓ INICIALIZAÇÃO GERAL (treino.html, ciclo.html, etc.)
  ----------------------------------------------------------- */
 async init() {

  const p = (location.pathname.split("/").pop() || "").toLowerCase();

  /* ------------------------------------------------------------
     1) Páginas SEM header
  ------------------------------------------------------------ */
  const paginasSemHeader = [
    "index.html",
    "anamnese_deluxe.html",
    "home.html",
    "ciclo.html"
  ];

  const paginasComHeader = [
    "flowcenter.html",
    "treino.html",
    "respiracao.html",
    "evolucao.html"
  ];


   

  /* ------------------------------------------------------------
     2) HEADER — apenas nas páginas internas certas
  ------------------------------------------------------------ */
  if (paginasComHeader.includes(p)) {
    this.inserirHeaderApp();
  }


 // Menu aparece somente nas páginas internas
const internas = ["flowcenter.html","treino.html","respiracao.html","evolucao.html"];

if (internas.includes(p)) {
  this.inserirHeaderApp();
  this.inserirMenuLateral();
}


  this.log("Init concluído para", p);
},
// ← FECHA a função init
     /* -----------------------------------------------------------
     ✓ BOTAO RECOMECAR ASSIDUIDADE 
  ----------------------------------------------------------- */
   modalRetomarTreino(dias) {
       this.log("Modal Retomar Treino → Usuária parou há", dias, "dias");
  if (document.querySelector("#retomar-modal")) return;

  const box = document.createElement("div");
  box.id = "retomar-modal";
  box.className = "retomar-backdrop";

  box.innerHTML = `
    <div class="retomar-card">
      <h2>Retomar treino</h2>
      <p>Você está há <strong>${dias} dias</strong> sem treinar.</p>
      <p>O que deseja fazer?</p>

      <button id="btnRecomecar" class="recomecar-btn">Recomeçar</button>
      <button id="btnContinuar" class="continuar-btn">Continuar</button>
      <button id="btnCancelarRetomar" class="cancelar-btn">Cancelar</button>
    </div>
  `;

  document.body.appendChild(box);

  document.querySelector("#btnRecomecar").onclick = () => this.recomecarPrograma();
  document.querySelector("#btnContinuar").onclick = () => this.continuarPrograma();
  document.querySelector("#btnCancelarRetomar").onclick = () => box.remove();
},
 /* -----------------------------------------------------------
✓ BOTAO RESET ASSIDUIDADE 
  ----------------------------------------------------------- */
async recomecarPrograma() {
  const id = localStorage.getItem("femflow_id");

  await fetch(this.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "resetprograma",
      id
    })
  });

  this.toast("✨ Novo ciclo iniciado!");

  // Remove modal
  document.querySelector("#retomar-modal")?.remove();

  // Volta para home para iniciar novo fluxo
  this.router("home.html");
},

continuarPrograma() {
  // Apenas fecha o modal
  document.querySelector("#retomar-modal")?.remove();

  // Vai para ciclo para ajustar fase atual
  this.router("ciclo.html?continuar=1");
},

   calcularEngineHormonal() {

  let perfil = (localStorage.getItem("femflow_perfilHormonal") || "regular")
    .toLowerCase().trim();

  const faseManual =
    localStorage.getItem("femflow_fase_manual") ||
    localStorage.getItem("femflow_fase") ||
    null;

  const cicloDuracao = Number(localStorage.getItem("femflow_cycleLength") || 28);
  const dataInicio = localStorage.getItem("femflow_startDate");

  let diaCiclo = Number(localStorage.getItem("dia_ciclo") || 1);

  if (["regular", "diu", "diu_cobre", "irregular"].includes(perfil)) {
    const fase = (faseManual || "folicular").toLowerCase();
    return {
      modo: "ciclo_real",
      faseFirebase: fase,
      diaFirebase: diaCiclo,
      diaKey: `dia_${diaCiclo}`
    };
  }

  if (perfil === "menopausa" || perfil === "tecnica" || perfil === "diu_hormonal") {

    const nivel = (localStorage.getItem("femflow_nivel") || "iniciante")
      .toLowerCase();

    let total = 23;
    let zonaInicio = 18;

    if (nivel === "intermediaria") {
      total = 23;
      zonaInicio = 6;
    }

    if (nivel === "avancada") {
      total = 32;
      zonaInicio = 14;
    }

    let diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);
    const diaFirebase = zonaInicio + ((diaEner - 1) % total);
    const fase = this._faseDoNumero(diaFirebase);

    return {
      modo: "menopausa",
      faseFirebase: fase,
      diaFirebase: diaFirebase,
      diaKey: `dia_${diaFirebase}`
    };
  }

  return {
    modo: "fallback",
    faseFirebase: "folicular",
    diaFirebase: 1,
    diaKey: "dia_1"
  };
},
   
calcularEngineHormonal() {
    return window.calcularEngineHormonal();
},

   
}; // ← FECHA o objeto FEMFLOW (ATENÇÃO!)


// CSS do Header + Menu (FemFlow Signature 2025)
(function(){
  const style = document.createElement("style");
  style.innerHTML = `
    #femflowHeader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 56px;
      background: #fff5ef;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 9999;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }

    .ff-logo { height: 28px; }

    .ff-menu-btn {
      background: none;
      border: none;
      font-size: 26px;
      color: var(--teal);
    }

    .ff-menu-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(3px);
      z-index: 99999;
    }

    .ff-menu-box {
      position: absolute;
      right: 0;
      top: 0;
      width: 78%;
      max-width: 320px;
      height: 100%;
      background: white;
      padding: 24px;
      box-shadow: -4px 0 20px rgba(0,0,0,0.2);
      animation: slideIn .3s ease-out;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .ff-menu-item {
      width: 100%;
      padding: 14px;
      margin-bottom: 12px;
      border-radius: 10px;
      background: #fff5ef;
      border: 1px solid #e4d5cc;
      text-align: left;
      color: var(--teal);
      font-weight: 600;
      font-family: "Lato";
    }

    .ff-menu-item:active {
      background: #f7dbd3;
    }

    .ff-menu-item.ff-logout {
      background: #ffe6e4;
      color: #b44135;
    }
  `;
  document.head.appendChild(style);
})();

/* ===========================================================
   AUTO-START
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  window.FEMFLOW.init();
});
