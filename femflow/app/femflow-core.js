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
    if (document.querySelector("header.femflow-header")) return;

    const h = document.createElement("header");
    h.className = "femflow-header";

    h.innerHTML = `
      <div class="logo-area">
        <img src="./assets/logofemflowterracota.png" class="logo-img" />
      </div>
      <nav>
        <button class="btn-home">Home</button>
        <button class="btn-flow">Flowcenter</button>
      </nav>
    `;

    document.body.prepend(h);

    // Bind
    h.querySelector(".btn-home").onclick = () => this.router("home");
    h.querySelector(".btn-flow").onclick = () => this.router("flowcenter");
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

}; // ← FECHA o objeto FEMFLOW (ATENÇÃO!)
/* ===========================================================
   AUTO-START
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  window.FEMFLOW.init();
});
