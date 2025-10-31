/* ===========================================================
   🌸 FEMFLOW CORE SCRIPT v2.1
   Autor: Ricardo Fernandes • 2025
   Integração direta com FemFlow Core (Hotmart + App)
   =========================================================== */

const FEMFLOW = {
  /* ----------- 🔗 ENDPOINT PRINCIPAL ------------ */
  SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbzmHvGjUwLjOIgDAARCxPgvGbTxGsH5zo9U8wx6a8LScWfiCtyiuz6w_cKdc4e9_WOL/exec",

  /* ----------- 🎨 LOGO PADRÃO ------------ */
  LOGO: "../../assets/logofemlowverde.png",

  /* ----------- ⚙️ INICIALIZAÇÃO ------------ */
  initTreino() {
    console.log("💫 FemFlow Core JS conectado com sucesso");
    this.inserirLogo();
    this.criarModalPSE();
    this.inserirBotaoVoltar();
    this.carregarLogoContextual();
  },

  /* ----------- 🌸 LOGIN OU CADASTRO (APP) ------------ */
  async loginOuCadastro(nome, email) {
    try {
      const resp = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginOuCadastro",
          nome,
          email,
        }),
      });
      const data = await resp.json();
      if (data.status === "ok" || data.status === "created") {
        this.toast(`🌸 Bem-vinda, ${data.nome}!`);
        console.log("Perfil:", data);
        localStorage.setItem("femflow_id", data.id);
        localStorage.setItem("femflow_nome", data.nome);
        localStorage.setItem("femflow_email", data.email);
        return data;
      } else {
        this.toast("⚠️ Erro no cadastro/login.", true);
      }
    } catch (err) {
      console.error("Erro em loginOuCadastro:", err);
      this.toast("❌ Falha de conexão com o servidor.", true);
    }
  },

  /* ----------- 🖼️ INSERIR LOGO ------------ */
  inserirLogo() {
    const header = document.createElement("div");
    header.innerHTML = `
      <div style="display:flex;justify-content:center;margin:15px 0;">
        <img src="${this.LOGO}" alt="FemFlow" style="width:130px;height:auto;">
      </div>`;
    document.body.prepend(header);
  },

  /* ----------- 🎨 LOGO DINÂMICO ------------ */
  async carregarLogoContextual() {
    try {
      const resp = await fetch("../../assets/logos.json");
      const logos = await resp.json();
      let logoEscolhido = logos.principal;

      const hora = new Date().getHours();
      const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (darkMode) logoEscolhido = logos.escuro;
      else if (hora >= 18 || hora < 6) logoEscolhido = logos.escuro;
      else logoEscolhido = logos.principal;

      if (window.location.pathname.includes("treino"))
        logoEscolhido = logos.secundario;
      if (window.location.pathname.includes("boasvindas"))
        logoEscolhido = logos.boasvindas;

      const logoImg = document.querySelector(".logo-img");
      if (logoImg) logoImg.src = "../../" + logoEscolhido;

      console.log("🌸 Logo carregado:", logoEscolhido);
    } catch (err) {
      console.error("Erro ao carregar logos:", err);
    }
  },

  /* ----------- 🔙 BOTÃO VOLTAR ------------ */
  inserirBotaoVoltar() {
    const voltar = document.createElement("button");
    voltar.textContent = "← Voltar ao ciclo";
    voltar.style.cssText = `
      position:fixed;
      top:15px;
      left:15px;
      background:#335953;
      color:#fff;
      border:none;
      padding:8px 14px;
      border-radius:20px;
      font-family:'Lato',sans-serif;
      font-size:14px;
      box-shadow:0 3px 6px rgba(0,0,0,0.2);
      z-index:999;
    `;
    voltar.onclick = () => (window.location.href = "../../index.html");
    document.body.appendChild(voltar);
  },

  /* ----------- 💾 SALVAR TREINO / PSE ------------ */
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
      console.log("📤 Retorno FemFlow Core:", result);

      if (result.status?.includes("ok") || result.status?.includes("registrado"))
        this.toast("✔️ Registro salvo com sucesso!");
      else this.toast("⚠️ Erro ao salvar. Tente novamente.", true);
    } catch (err) {
      console.error("Erro no envio:", err);
      this.toast("❌ Falha de conexão. Verifique a internet.", true);
    }
  },

  /* ----------- 🌙 SALVAR DESCANSO ------------ */
  async salvarDescanso(fase = "menstrual") {
    await this.salvarTreino({
      tipo_dia: "descanso",
      fase,
      treino: "Descanso",
      pse: "N/A",
      observacao: "Descanso ativo",
    });
    setTimeout(() => (window.location.href = "../../boasvindas.html"), 1800);
  },

  /* ----------- 😌 MODAL PSE ------------ */
  criarModalPSE() {
    const modal = document.createElement("div");
    modal.id = "pseModal";
    modal.style.cssText = `
      display:none;
      position:fixed;
      top:0;left:0;
      width:100%;height:100%;
      background:rgba(0,0,0,0.7);
      justify-content:center;
      align-items:center;
      z-index:1000;
      font-family:'Lato',sans-serif;
    `;
    modal.innerHTML = `
      <div style="
        background:#fff;
        padding:25px;
        border-radius:20px;
        text-align:center;
        width:85%;
        max-width:340px;
        box-shadow:0 3px 12px rgba(0,0,0,0.2);
        animation:fadeIn 0.4s ease;">
        <h3 style="color:#335953;font-family:'Playfair Display';margin-bottom:10px;">
          Escala PSE 🌿
        </h3>
        <p style="margin-bottom:15px;">Como foi a intensidade do treino?</p>
        <div id="pseBtns" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;"></div>
        <button id="cancelarPSE" style="
          margin-top:15px;
          background:#aaa;
          color:#fff;
          border:none;
          padding:8px 16px;
          border-radius:15px;
          cursor:pointer;">Cancelar</button>
      </div>
    `;
    document.body.appendChild(modal);

    const pseBtns = modal.querySelector("#pseBtns");
    for (let i = 0; i <= 10; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.style.cssText = `
        background:#335953;
        color:#fff;
        border:none;
        border-radius:50%;
        width:40px;
        height:40px;
        font-size:16px;
        cursor:pointer;
      `;
      btn.onclick = () => {
        modal.style.display = "none";
        FEMFLOW.onPSESelecionado && FEMFLOW.onPSESelecionado(i);
      };
      pseBtns.appendChild(btn);
    }
    modal.querySelector("#cancelarPSE").onclick = () =>
      (modal.style.display = "none");
  },

  abrirPSE(callback) {
    this.onPSESelecionado = callback;
    document.getElementById("pseModal").style.display = "flex";
  },

  /* ----------- 🔥 HIIT SIMPLES ------------ */
  iniciarHIIT(on = 30, off = 30, ciclos = 8) {
    this.toast(`🔥 HIIT iniciado: ${on}s ON / ${off}s OFF x${ciclos}`);
  },

  /* ----------- 🌸 TOAST ------------ */
  toast(msg, erro = false) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.position = "fixed";
    toast.style.bottom = "25px";
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
};

/* ----------- 🚀 AUTOEXECUÇÃO ------------ */
document.addEventListener("DOMContentLoaded", () => FEMFLOW.initTreino());

/* ----------- ✨ ANIMAÇÕES ------------ */
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn {
  from {opacity:0; transform:scale(0.9);}
  to {opacity:1; transform:scale(1);}
}`;
document.head.appendChild(style);

