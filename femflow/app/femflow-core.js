/* ===========================================================
   🌸 FEMFLOW CORE SCRIPT — compatível com Engine v2025.11C
   Autor: Ricardo Fernandes • 2025
   =========================================================== */

export const FEMFLOW = {
  SCRIPT_URL:
    localStorage.getItem("femflow_script") ||
    "https://script.google.com/macros/s/AKfycby1OydWK-Akw0zx0QqKJfZS7tc28ziSfpIN8lF4thtEEifWaLUTKKtBBAy1q_nhy3ot/exec",

  LOGO: "./assets/logofemflowterracota.png",

  async initTreino() {
    console.log("💫 FemFlow Core integrado ao Engine 2025.11C");

    this.inserirLogo();
    this.inserirBotaoVoltar();
    this.criarModalPSE();

    const id = localStorage.getItem("femflow_id");
    if (!id) {
      this.toast("⚠️ Faça login novamente.");
      this.router("login");
      return;
    }

    // carrega dados atualizados do ciclo e ênfase
    await this.syncPerfil(id);
  },

  /* =======================================================
     🔹 Sincroniza perfil completo via doGet
     Recebe: nivel, enfase, fase, diaCiclo
  ======================================================= */
  async syncPerfil(id) {
    try {
      const resp = await fetch(`${this.SCRIPT_URL}?action=validar&id=${id}`);
      const data = await resp.json();
      if (data.status !== "ok") {
        this.toast("❌ ID não encontrado. Refaça o login.", true);
        return;
      }

      // Armazena dados no localStorage
      localStorage.setItem("femflow_nome", data.nome);
      localStorage.setItem("femflow_email", data.email);
      localStorage.setItem("nivel_atual", data.nivel || "iniciante");
      localStorage.setItem("enfase_atual", data.enfase || "geral");
      localStorage.setItem("fase_atual", data.fase || "folicular");
      localStorage.setItem("dia_ciclo", data.diaCiclo || 1);
      localStorage.setItem("link_planilha", data.link_planilha || "");

      console.log(`📡 Perfil sincronizado: ${data.nome} — ${data.nivel}/${data.enfase} | ${data.fase} (Dia ${data.diaCiclo})`);
    } catch (err) {
      console.error("Erro ao sincronizar perfil:", err);
      this.toast("⚠️ Erro ao conectar ao servidor.", true);
    }
  },

  /* =======================================================
     🔹 Carrega treino do dia via Engine (_gerarTreinoDia)
     Backend já monta todos os boxes e exercícios
  ======================================================= */
  async buscarTreinoDoDia() {
    const id = localStorage.getItem("femflow_id");
    if (!id) return null;
    try {
      const resp = await fetch(`${this.SCRIPT_URL}?action=treino&id=${id}`);
      const data = await resp.json();

      if (!data || !data.boxes) {
        this.toast("⚠️ Nenhum treino encontrado.");
        return null;
      }
      console.log(`📦 Treino carregado: ${data.fase} | Dia ${data.diaCiclo} | Ênfase ${data.enfase}`);
      return data;
    } catch (err) {
      console.error("Erro ao buscar treino:", err);
      this.toast("⚠️ Erro ao carregar treino.");
      return null;
    }
  },

  /* =======================================================
     🔹 Salva PSE / Descanso / Treino detalhado
  ======================================================= */
  async salvarTreino({ id, fase, treino, tipo_dia = "treino", pse, observacao, exercicios = [] } = {}) {
    try {
      const payload = {
        action: tipo_dia === "descanso" ? "descanso" : "pse",
        id: id || localStorage.getItem("femflow_id"),
        fase: fase || localStorage.getItem("fase_atual"),
        treino,
        pse,
        observacao,
        exercicios
      };

      const resp = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await resp.json();
      console.log("📤 Registro salvo:", result);
      this.toast("✔️ Treino salvo com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar treino:", err);
      this.toast("❌ Falha ao salvar treino.", true);
    }
  },

  /* =======================================================
     🔹 Utilidades visuais
  ======================================================= */
  inserirLogo() {
    if (document.querySelector(".logo-img")) return;
    const div = document.createElement("div");
    div.style.textAlign = "center";
    div.innerHTML = `<img src="${this.LOGO}" alt="FemFlow" class="logo-img" style="width:120px;height:auto;margin:20px 0;">`;
    document.body.prepend(div);
  },

  inserirBotaoVoltar() {
    const voltar = document.createElement("button");
    voltar.textContent = "← Voltar";
    voltar.className = "btn-voltar";
    voltar.style.cssText = `
      position:fixed;top:15px;left:15px;
      background:#335953;color:#fff;border:none;
      padding:8px 14px;border-radius:20px;
      font-family:'Lato',sans-serif;font-size:14px;
      box-shadow:0 3px 6px rgba(0,0,0,0.2);cursor:pointer;z-index:999;
    `;
    voltar.onclick = () => this.router("flowcenter");
    document.body.appendChild(voltar);
  },

  criarModalPSE() {
    if (document.getElementById("pseModal")) return;
    const modal = document.createElement("div");
    modal.id = "pseModal";
    modal.style.cssText = `
      display:none;position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.6);justify-content:center;align-items:center;
      z-index:1000;font-family:'Lato',sans-serif;
    `;
    modal.innerHTML = `
      <div style="background:#fff;padding:25px;border-radius:20px;text-align:center;width:85%;max-width:340px;">
        <h3 style="color:#335953;margin-bottom:10px;">Escala PSE 🌿</h3>
        <p>Como foi a intensidade do treino?</p>
        <div id="pseBtns" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;"></div>
        <button id="cancelarPSE" style="margin-top:15px;background:#aaa;color:#fff;border:none;
                padding:8px 16px;border-radius:15px;cursor:pointer;">Cancelar</button>
      </div>`;
    document.body.appendChild(modal);

    const pseBtns = modal.querySelector("#pseBtns");
    for (let i = 0; i <= 10; i++) {
      const b = document.createElement("button");
      b.textContent = i;
      b.style.cssText = `
        background:#335953;color:#fff;border:none;border-radius:50%;
        width:40px;height:40px;font-size:16px;cursor:pointer;`;
      b.onclick = () => {
        modal.style.display = "none";
        this.onPSESelecionado && this.onPSESelecionado(i);
      };
      pseBtns.appendChild(b);
    }
    modal.querySelector("#cancelarPSE").onclick = () => (modal.style.display = "none");
  },

  abrirPSE(callback) {
    this.onPSESelecionado = callback;
    document.getElementById("pseModal").style.display = "flex";
  },

  toast(msg, erro = false) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = `
      position:fixed;bottom:25px;left:50%;transform:translateX(-50%);
      background:${erro ? "#d9534f" : "#335953"};
      color:#fff;padding:12px 20px;border-radius:20px;
      font-family:'Lato',sans-serif;font-size:15px;
      box-shadow:0 3px 8px rgba(0,0,0,0.2);z-index:9999;
    `;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  router(destino) {
    const map = {
      home: "index.html",
      flowcenter: "flowcenter.html",
      treino: "treino.html",
      evolucao: "evolucao.html",
      ciclo: "ciclo.html"
    };
    window.location.href = map[destino] || "index.html";
  }
};

/* ----------- 🚀 AUTOEXECUÇÃO ------------ */
document.addEventListener("DOMContentLoaded", () => FEMFLOW.initTreino());
