/* ===========================================================
   🌸 FEMFLOW CORE SCRIPT v3.0 — Hotmart Ênfase Ready
   Autor: Ricardo Fernandes • 2025
   =========================================================== */

// ======================================================
// 🔥 Firebase — Importação e inicialização
// ======================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
  authDomain: "femflow-ebec2.firebaseapp.com",
  projectId: "femflow-ebec2",
  storageBucket: "femflow-ebec2.appspot.com",
  messagingSenderId: "1043953159611",
  appId: "1:1043953159611:web:d12b82f744740f3124c89e",
  measurementId: "G-6F644L5VTW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ======================================================
// 🔧 Helpers
// ======================================================
const norm = (s="") =>
  s.toString().trim().toLowerCase()
   .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // remove acentos
   .replace(/\s+/g,""); // remove espaços

// ======================================================
// 🌸 Núcleo FEMFLOW
// ======================================================
export const FEMFLOW = {
  SCRIPT_URL:
    localStorage.getItem("femflow_script") ||
    "https://script.google.com/macros/s/AKfycbxblNEoTTf7YLHZQMJBmVPK26VIJreOGgRblQYlBNP2JO4lyQblLLA9PtHeE32MTtY/exec",

  LOGO: "assets/logofemflowverde.png",

  initTreino() {
    console.log("💫 FemFlow Core v3.0 conectado com sucesso");
    this.inserirLogo();
    this.criarModalPSE();
    this.inserirBotaoVoltar();
    this.carregarLogoContextual();
    this.autoCiclo();

    // Garante chaves mínimas (fallbacks)
    if (!localStorage.getItem("fase_atual")) localStorage.setItem("fase_atual","folicular");
    if (!localStorage.getItem("nivel_atual")) localStorage.setItem("nivel_atual","iniciante");
    if (!localStorage.getItem("enfase_atual")) localStorage.setItem("enfase_atual","geral");
  },

  /* =======================================================
     🔹 1. LOGIN / CADASTRO
     - Recebe do backend nível + ênfase definidos pelo produto Hotmart
  ======================================================= */
  async loginOuCadastro(nome, email) {
    if (!nome || !email) {
      this.toast("⚠️ Informe nome e e-mail para continuar.", true);
      return;
    }

    try {
      const resp = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "loginOuCadastro", nome, email }),
      });

      const data = await resp.json();
      if (data.status === "ok" || data.status === "created") {
        this.toast(`🌸 Bem-vinda, ${data.nome}!`);
        console.log("Perfil carregado:", data);

        // Persistência básica
        localStorage.setItem("femflow_id", data.id);
        localStorage.setItem("femflow_nome", data.nome);
        localStorage.setItem("femflow_email", data.email);

        // 🔥 Integração Hotmart → nível/ênfase vindo do backend
        // Espera-se que o Apps Script retorne: nivel_acesso, enfase, fase_atual, dia_ciclo
        this.aplicarAcessoBackend(data);

        this.router("home");
        return data;
      } else {
        this.toast("⚠️ Erro no cadastro/login.", true);
      }
    } catch (err) {
      console.error("Erro em loginOuCadastro:", err);
      this.toast("❌ Falha de conexão com o servidor.", true);
    }
  },

  // Aplica normalizando e com fallback
  aplicarAcessoBackend(data = {}) {
    const nivel = norm(data.nivel_acesso || localStorage.getItem("nivel_atual") || "iniciante");
    const enfase = norm(data.enfase || localStorage.getItem("enfase_atual") || "geral");
    const fase = norm(data.fase_atual || localStorage.getItem("fase_atual") || "folicular");
    const dia  = Number(data.dia_ciclo || localStorage.getItem("dia_ciclo") || 1);

    localStorage.setItem("nivel_atual", nivel);
    localStorage.setItem("enfase_atual", enfase);
    localStorage.setItem("fase_atual", fase);
    localStorage.setItem("dia_ciclo", String(dia));

    console.log(`🎯 Acesso aplicado → nível: ${nivel} | ênfase: ${enfase} | fase: ${fase} | dia: ${dia}`);
  },

  /* =======================================================
     🔹 2. INTERFACE VISUAL
  ======================================================= */
  inserirLogo() {
    if (!document.querySelector(".logo-img")) {
      const header = document.createElement("div");
      header.innerHTML = `
        <div style="display:flex;justify-content:center;margin:15px 0;">
          <img src="${this.LOGO}" alt="FemFlow" class="logo-img" style="width:130px;height:auto;">
        </div>`;
      document.body.prepend(header);
    }
  },

  async carregarLogoContextual() {
    try {
      const resp = await fetch("../../assets/logos.json");
      const logos = await resp.json();
      let logoEscolhido = logos.principal;
      const hora = new Date().getHours();
      const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (darkMode || hora >= 18 || hora < 6) logoEscolhido = logos.escuro;
      if (window.location.pathname.includes("treino")) logoEscolhido = logos.secundario;
      if (window.location.pathname.includes("boasvindas")) logoEscolhido = logos.boasvindas;

      const logoImg = document.querySelector(".logo-img");
      if (logoImg) logoImg.src = "../../" + logoEscolhido;

      console.log("🌸 Logo carregado:", logoEscolhido);
    } catch (err) {
      console.error("Erro ao carregar logos:", err);
    }
  },

  inserirBotaoVoltar() {
    const voltar = document.createElement("button");
    voltar.textContent = "← Voltar";
    voltar.style.cssText = `
      position:fixed; top:15px; left:15px;
      background:#335953; color:#fff; border:none;
      padding:8px 14px; border-radius:20px;
      font-family:'Lato',sans-serif; font-size:14px;
      box-shadow:0 3px 6px rgba(0,0,0,0.2); z-index:999; cursor:pointer;
    `;

    // 🔹 Mapeamento completo e robusto
    const map = {
      "flowcenter.html": "index.html",
      "treino.html": "flowcenter.html",
      "evolucao.html": "flowcenter.html",
      "respiracao.html": "flowcenter.html",
      "ciclo.html": "index.html",
      "home.html": "index.html",
      "boasvindas.html": "index.html"
    };

    const page = location.pathname.split("/").pop().toLowerCase();
    let destino = map[page];

    // Fallback inteligente: se for página de treino (ex: /modulos/.../treino.html)
    if (!destino && page.includes("treino")) destino = "flowcenter.html";

    voltar.onclick = () => this.router(destino || "index");
    document.body.appendChild(voltar);
  }, // ← ✅ vírgula que faltava

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
      console.log("📤 Retorno FemFlow Core:", result);

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

  // ======================================================
  // 🔹 Buscar exercícios direto do Firestore (nível + ênfase do Hotmart)
  // ======================================================
  async buscarExerciciosFirebase(nivel, fase, dia, enfase = "geral") {
    try {
      // Normaliza entradas (aceita vindas do localStorage ou parâmetros)
      const nivelN  = norm(nivel || localStorage.getItem("nivel_atual") || "iniciante");
      const faseN   = norm(fase  || localStorage.getItem("fase_atual")  || "folicular");
      const diaKey  = dia || `dia_${localStorage.getItem("dia_ciclo") || 1}`;
      const enfaseN = norm(enfase || localStorage.getItem("enfase_atual") || "geral");

      const nivelKey = `${nivelN}_${enfaseN}`; // ex.: avancada_quadriceps
      const caminho = `exercicios/${nivelKey}/fases/${faseN}/dias/${diaKey}/exercicios`;
      const colRef = collection(db, caminho);
      const snapshot = await getDocs(colRef);

      let lista = [];
      snapshot.forEach(doc => lista.push(doc.data()));

      // Fallback: se não houver coleção de ênfase, cai para "geral"
      if (lista.length === 0 && enfaseN !== "geral") {
        this.toast(`⚠️ Sem treino de ênfase "${enfaseN}" hoje — usando geral.`);
        return await this.buscarExerciciosFirebase(nivelN, faseN, diaKey, "geral");
      }

      // Agrupamento por Box
      const agrupado = {};
      lista.forEach(ex => {
        const nomeBox = ex.box || "Sem Box";
        if (!agrupado[nomeBox]) agrupado[nomeBox] = [];
        agrupado[nomeBox].push(ex);
      });

      const boxes = Object.keys(agrupado).map(nome => ({
        tipo: "exercicios",
        titulo: nome,
        itens: agrupado[nome]
      }));

      console.log(`📦 ${lista.length} exercícios carregados (${boxes.length} boxes) [${nivelKey}] / fase=${faseN} / ${diaKey}`);
      return boxes;
    } catch (err) {
      console.error("Erro ao buscar exercícios:", err);
      this.toast("⚠️ Não foi possível carregar os exercícios.");
      return [];
    }
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

    modal.querySelector("#cancelarPSE").onclick = () =>
      (modal.style.display = "none");
  },

  abrirPSE(callback) {
    this.onPSESelecionado = callback;
    document.getElementById("pseModal").style.display = "flex";
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
    toast.style[ top ? "top" : "bottom" ] = "25px";
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
     🔹 7. AUTO CICLO – Reseta automaticamente ao completar
  ======================================================= */
  autoCiclo() {
    const ciclo = Number(localStorage.getItem("ciclo_duracao") || 28);
    let dia = Number(localStorage.getItem("dia_ciclo") || 1);
    if (dia > ciclo) {
      this.toast("🌸 Novo ciclo iniciado automaticamente!");
      dia = 1;
      localStorage.setItem("dia_ciclo", 1);
      localStorage.setItem(`femflow_reiniciado_${localStorage.getItem("femflow_id")}`, new Date().toISOString());
    }
  },

  /* =======================================================
     🔹 8. ROTEADOR – Navegação horizontal inteligente
  ======================================================= */
  router(destino) {
    const map = {
      home: "index.html",
      cadastro: "cadastro.html",
      ciclo: "ciclo.html",
      flowcenter: "flowcenter.html",
      treino: "treino.html",
      evolucao: "evolucao.html",
    };
    const url = map[destino] || "index.html";
    console.log(`➡️ Navegando para: ${url}`);
    window.location.href = url;
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
