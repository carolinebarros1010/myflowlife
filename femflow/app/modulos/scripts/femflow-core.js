/* ==========================
   FEMFLOW CORE SCRIPT
   Autor: Ricardo Fernandes
   Estrutura central do app
   ========================== */

const FEMFLOW = {
  SCRIPT_URL: "https://script.google.com/macros/s/SEU_DEPLOY_ID/exec",
  LOGO: "../../assets/logofemlowverde.png",

  /* ----------- 🩷 INICIALIZAÇÃO ------------ */
  initTreino() {
    console.log("🔥 FemFlow inicializado");
    this.inserirLogo();
  },

  inserirLogo() {
    const header = document.createElement("div");
    header.innerHTML = `
      <div style="display:flex;justify-content:center;margin:15px 0;">
        <img src="${this.LOGO}" alt="FemFlow" style="width:120px;height:auto;">
      </div>`;
    document.body.prepend(header);
  },

  /* ----------- 💾 SALVAR TREINO / DESCANSO ------------ */
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
      const resposta = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (resposta.ok) {
        this.toast("✔️ Registro salvo com sucesso!");
      } else {
        this.toast("⚠️ Erro ao salvar. Tente novamente.", true);
      }
    } catch (err) {
      console.error("Erro no envio:", err);
      this.toast("❌ Falha de conexão. Verifique a internet.", true);
    }
  },

  /* ----------- 😌 PSE MODAL ------------ */
  abrirPSE(callback) {
    const pse = prompt("Qual foi seu PSE hoje (0–10)?");
    if (pse !== null && pse.trim() !== "") callback(pse);
  },

  /* ----------- 🔁 HIIT TIMER ------------ */
  iniciarHIIT(on = 30, off = 30, ciclos = 8) {
    this.toast(`🔥 HIIT iniciado: ${on}s ON / ${off}s OFF x${ciclos}`);
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
    setTimeout(() => (window.location.href = "../../boasvindas.html"), 1500);
  },

  /* ----------- 🏁 FINALIZAÇÃO ------------ */
  finalizarCiclo() {
    alert("🎉 Parabéns! Você completou seu ciclo de 30 dias.");
    window.location.href = "../../boasvindas.html";
  },

  /* ----------- 🍃 TOAST FEMFLOW ------------ */
  toast(msg, erro = false) {
    const toast = document.createElement("div");
    toast.textContent = msg;
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = erro ? "#d9534f" : "#2ecc71";
    toast.style.color = "#fff";
    toast.style.padding = "12px 20px";
    toast.style.borderRadius = "20px";
    toast.style.fontFamily = "Lato, sans-serif";
    toast.style.fontSize = "15px";
    toast.style.zIndex = "9999";
    toast.style.boxShadow = "0 3px

