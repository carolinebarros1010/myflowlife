/* ===========================================================
   🌸 FEMFLOW CORE — V3 (2025)
   Compatível com:
   - treino.js Engine Hormonal 3.1
   - Firebase (buscarExerciciosFirebase)
   - Backend GAS 2025 (fase, enfase, diaCiclo, treino-dia)
   - Todas as páginas antigas (home, flowcenter, respiracao, anamnese)
   =========================================================== */

window.FEMFLOW = {

  /* -----------------------------------------------------------
     ✓ CONFIGURAÇÃO BASE
  ----------------------------------------------------------- */
  SCRIPT_URL:
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev",

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
    if (!pagina.endsWith(".html")) pagina += ".html";
    location.href = pagina;
  },

  /* -----------------------------------------------------------
     ✓ CABEÇALHO DINÂMICO
  ----------------------------------------------------------- */
 inserirHeaderApp() {
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

_getMenuHTML(page) {
  return `
    <button class="ff-menu-item" data-go="home">🏠 Home</button>
    <button class="ff-menu-item" data-go="flowcenter">🔄 FlowCenter</button>
    <button class="ff-menu-item" data-go="respiracao">💨 Respiração</button>
    <button class="ff-menu-item" data-go="treino">🏃 Treino</button>
    <button class="ff-menu-item" data-go="evolucao">📈 Evolução</button>
    <button class="ff-menu-item" data-go="ciclo">🌙 Ajustar Ciclo</button>

    <hr>

    <button class="ff-menu-item" data-go="lang">🌐 Idioma</button>

    <hr>

    <button class="ff-menu-item ff-logout" data-go="logout">🚪 Sair</button>
  `;
},

_bindMenuAcoes(page, modal) {
  modal.querySelectorAll(".ff-menu-item").forEach(btn => {
    btn.onclick = () => {
      const go = btn.dataset.go;

      if (go === "logout") {
        localStorage.clear();
        location.href = "index.html";
        return;
      }

      if (go === "lang") {
        this._alternarIdioma?.();
        modal.remove();
        return;
      }

      this.router(go);
      modal.remove();
    };
  });
},


  /* -----------------------------------------------------------
     ✓ BOTÃO VOLTAR (somente páginas internas)
  ----------------------------------------------------------- */
  inserirBotaoVoltar() {
    if (document.querySelector(".btn-voltar")) return;

    const map = {
      "treino.html": "flowcenter.html",
      "flowcenter.html": "home.html",
      "respiracao.html": "flowcenter.html",
      "evolucao.html": "flowcenter.html",
      "ciclo.html": "home.html"
    };

    const p = location.pathname.split("/").pop();

    if (!map[p]) return;

    const b = document.createElement("button");
    b.className = "btn-voltar";
    b.textContent = "← Voltar";
    b.onclick = () => this.router(map[p]);

    document.body.appendChild(b);
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
    const id = localStorage.getItem("femflow_id");
    if (!id) return this.toast("Erro: sem ID.", true);

    try {
      const r = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "salvarTreino",
          id,
          pse,
          treino,
          fase,
          diaFirebase,
          obs
        })
      });

      const j = await r.json();
      if (j.status === "ok") {
        this.toast("Treino salvo! 🌸");
      } else {
        this.toast("Erro ao salvar treino.", true);
      }
    } catch (err) {
      this.toast("Erro de conexão.", true);
      console.error(err);
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
     ✓ BUSCA DE EXERCÍCIOS (Firebase)
  ----------------------------------------------------------- */
  async buscarExerciciosFirebase(pasta, fase, diaKey) {
    try {
      const url =
        `https://firebasestorage.googleapis.com/v0/b/femflow-firebase.appspot.com/o/` +
        `${encodeURIComponent(`exercicios/${pasta}/${fase}/${diaKey}.json`)}?alt=media`;

      const r = await fetch(url);
      return await r.json();
    } catch (err) {
      console.warn("Erro Firebase:", err);
      return null;
    }
  },

  /* -----------------------------------------------------------
     ✓ AUTO LOAD DO USUÁRIO (login → páginas internas)
  ----------------------------------------------------------- */
  async carregarPerfil() {
    const id = localStorage.getItem("femflow_id");
    if (!id) return null;

    try {
      const r = await fetch(`${this.SCRIPT_URL}?action=validar&id=${id}`);
      const j = await r.json();

      if (j.status !== "ok") return null;

      // Salvar sessão local atualizada
      localStorage.setItem("femflow_nome", j.nome);
      localStorage.setItem("femflow_fase", j.fase);
      localStorage.setItem("femflow_enfase", j.enfase);
      localStorage.setItem("femflow_diaCiclo", j.diaCiclo);
      localStorage.setItem("femflow_nivel", j.nivel);

      return j;

    } catch (err) {
      console.error("Erro validar perfil:", err);
      return null;
    }
  },

  /* -----------------------------------------------------------
     ✓ INICIALIZAÇÃO GERAL (treino.html, ciclo.html, etc.)
  ----------------------------------------------------------- */
 async init() {

  // 🔒 Regra ABSOLUTA: páginas com classe login-page NUNCA recebem header
  if (document.body.classList.contains("login-page")) {
    return; // não adiciona header, não adiciona voltar, não cria modal
  }

  // 🔍 DETECTA o arquivo atual
  let p = location.pathname;
  p = p.split("?")[0];
  if (p.endsWith("/")) p = "index.html";
  else p = p.split("/").pop() || "index.html";

  const paginasSemHeader = [
    "index.html",
    "home.html",
    "ciclo.html",
    "anamnese_deluxe.html"
  ];

  if (!paginasSemHeader.includes(p)) {
    this.inserirHeaderApp();
    this.inserirBotaoVoltar();
    this.criarModalPSE();
    await this.carregarPerfil();
  }
} // ← FECHA a função init
     /* -----------------------------------------------------------
     ✓ BOTAO RECOMECAR ASSIDUIDADE 
  ----------------------------------------------------------- */
   modalRetomarTreino(dias) {
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
