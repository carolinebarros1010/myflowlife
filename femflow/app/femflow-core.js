/* ==========================
   FEMFLOW CORE SCRIPT 2.0
   Autor: Ricardo Fernandes
   ========================== */

const FEMFLOW = {
  SCRIPT_URL: "https://script.google.com/macros/s/SEU_DEPLOY_ID/exec",
  LOGO: "../../assets/logofemlowverde.png",

  /* ----------- ⚙️ INICIALIZAÇÃO ------------ */
  initTreino() {
    console.log("💫 FemFlow carregado com sucesso");
    this.inserirLogo();
    this.criarModalPSE();
    this.inserirBotaoVoltar();
  },

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

    // Detecta contexto (página interna)
    if (window.location.pathname.includes("treino"))
      logoEscolhido = logos.secundario;
    if (window.location.pathname.includes("boasvindas"))
      logoEscolhido = logos.boasvindas;

    // Atualiza logo visível
    const logoImg = document.querySelector(".logo-img");
    if (logoImg) logoImg.src = "../../" + logoEscolhido;

    console.log("🌸 Logo carregado:", logoEscolhido);
  } catch (err) {
    console.error("Erro ao carregar logos:", err);
  }
},

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

  /* ----------- 💾 SALVAR ------------ */
  async salvarTreino({
    id = "FF-TESTE",
    fase = "Folicular",
    treino = "A",
    tipo_dia = "treino",
    pse = "N/A",
    observacao = "",
  } = {}) {
    const payload = {
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
      if (resp.ok) this.toast("✔️ Registro salvo com sucesso!");
      else this.toast("⚠️ Erro ao salvar. Tente novamente.", true);
    } catch (err) {
      console.error("Erro no envio:", err);
      this.toast("❌ Falha de conexão. Verifique a internet.", true);
    }
  },

  /* ----------- 🌙 DESCANSO ------------ */
  async salvarDescanso(fase = "Menstrual") {
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

  /* ----------- 🔥 HIIT ------------ */
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

this.carregarLogoContextual();


/* ----------- ✨ ANIMAÇÕES ------------ */
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn { from {opacity:0; transform:scale(0.9);} to {opacity:1; transform:scale(1);} }
`;
document.head.appendChild(style);
