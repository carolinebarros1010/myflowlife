/* ===========================================================
   🌸 FEMFLOW CORE SCRIPT v2.2 (patch)
   Autor: Ricardo Fernandes • 2025
   Integração direta com FemFlow Core (Hotmart + App)
   =========================================================== */

const FEMFLOW = {
  /* ----------- 🔗 ENDPOINT PRINCIPAL ------------ */
  SCRIPT_URL:
    localStorage.getItem("femflow_script") ||
    "https://script.google.com/macros/s/AKfycby1OydWK-Akw0zx0QqKJfZS7tc28ziSfpIN8lF4thtEEifWaLUTKKtBBAy1q_nhy3ot/exec",

  /* ----------- 🎨 LOGO PADRÃO (ATUALIZADO) ------------ */
  LOGO: "./assets/logofemflowterracota.png",

  /* ----------- 🔎 PÁGINAS PÚBLICAS (não injetar UI) --- */
  _isPublicPage(){
    const p = location.pathname.split('/').pop().toLowerCase();
    return ['login.html','home.html','index.html'].includes(p);
  },

  /* ----------- ⚙️ INICIALIZAÇÃO GERAL ------------ */
initTreino() {
  console.log("💫 FemFlow Core v2.2 conectado com sucesso");

  // seguro em qualquer tela
  this.carregarLogoContextual();
  this.criarModalPSE();
  this.autoCiclo();

  // opção para cada pagina colar (window.FEMFLOW_DISABLE_UI = true; entre script) //
 if (!this._isPublicPage() && !window.FEMFLOW_DISABLE_UI) {
  this.inserirLogo();
  this.inserirBotaoVoltar();
}

},

  /* =======================================================
     🔹 1. LOGIN / CADASTRO
  ======================================================= */
  async loginouCadastro(nome, email) {
    if (!nome || !email) {
      this.toast("⚠️ Informe nome e e-mail para continuar.", true);
      return;
    }

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
        console.log("Perfil carregado:", data);
        localStorage.setItem("femflow_id", data.id);
        localStorage.setItem("femflow_nome", data.nome);
        localStorage.setItem("femflow_email", data.email);
        localStorage.setItem("femflow_auth","yes");
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

  /* =======================================================
     🔹 1.1 LOGOUT (limpa sessão e volta ao login)
  ======================================================= */
  logout() {
    const KEYS = [
      'femflow_auth',
      'femflow_id',
      'femflow_nome',
      'femflow_email'
      // Se quiser limpar mais, descomente:
      // 'femflow_hasProduct',
      // 'femflow_cycle_configured',
      // 'femflow_startDate',
      // 'femflow_cycleLength',
      // 'femflow_produto_fim'
    ];
    KEYS.forEach(k => localStorage.removeItem(k));
    window.location.href = 'login.html';
  },

  /* =======================================================
     🔹 2. INTERFACE VISUAL
  ======================================================= */
  inserirLogo() {
    if (this._isPublicPage()) return; // não em login/home/index
    if (!document.body) return;
    const header = document.createElement("div");
    header.innerHTML = `
      <div style="display:flex;justify-content:center;margin:15px 0;">
        <img src="${this.LOGO}" alt="FemFlow" class="logo-img" style="width:130px;height:auto;">
      </div>`;
    document.body.prepend(header);
  },

  async carregarLogoContextual() {
    try {
      // opcional: se não tiver logos.json, apenas ignore
      const res = await fetch("./assets/logos.json").catch(()=>null);
      if(!res || !res.ok) return;
      const logos = await res.json();
      let logoEscolhido = logos?.principal || this.LOGO;

      const hora = new Date().getHours();
      const darkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

      if (darkMode) logoEscolhido = logos.escuro || logoEscolhido;
      else if (hora >= 18 || hora < 6) logoEscolhido = logos.escuro || logoEscolhido;

      const page = (location.pathname.split("/").pop() || "").toLowerCase();
      if (page.includes("treino"))       logoEscolhido = logos.secundario || logoEscolhido;
      if (page.includes("boasvindas"))   logoEscolhido = logos.boasvindas || logoEscolhido;

      const logoImg = document.querySelector(".logo-img");
      if (logoImg) logoImg.src = logoEscolhido;

      console.log("🌸 Logo carregado:", logoEscolhido);
    } catch (err) {
      // silencioso para não quebrar UI
      console.debug("logos.json não encontrado/ignorado");
    }
  },

  inserirBotaoVoltar() {
    if (this._isPublicPage()) return; // não em login/home/index

    const voltar = document.createElement("button");
    voltar.textContent = "← Voltar";
    voltar.style.cssText = `
      position:fixed; top:15px; left:15px;
      background:#335953; color:#fff; border:none;
      padding:8px 14px; border-radius:20px;
      font-family:'Lato',sans-serif; font-size:14px;
      box-shadow:0 3px 6px rgba(0,0,0,0.2); z-index:999; cursor:pointer;
    `;

  const map = {
 "flowcenter.html": "home.html",
   "treino.html": "flowcenter.html",
   "evolucao.html": "flowcenter.html",
 "ciclo.html": "home.html",
};

    const page = location.pathname.split("/").pop();
    voltar.onclick = () => this.router(map[page] || "index");
    document.body.appendChild(voltar);
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
    const el = document.getElementById("pseModal");
    if(el) el.style.display = "flex";
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
    const ciclo = Number(localStorage.getItem("femflow_cycleLength") || 28);
    let dia = Number(localStorage.getItem("dia_ciclo") || 1);
    if (dia > ciclo) {
      this.toast("🌸 Novo ciclo iniciado automaticamente!");
      dia = 1;
      localStorage.setItem("dia_ciclo", 1);
      localStorage.setItem(
        `femflow_reiniciado_${localStorage.getItem("femflow_id")}`,
        new Date().toISOString()
      );
    }
  },

  /* =======================================================
     🔹 8. ROTEADOR – Navegação horizontal inteligente
  ======================================================= */
  router(destino) {
    const map = {
      home: "home.html",
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

/* ----------- 🔗 Alias global de logout ------------ */
window.femflowLogout = function(){ FEMFLOW.logout(); };


/* ----------- ✨ ANIMAÇÕES ------------ */
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeIn {
  from {opacity:0; transform:scale(0.9);}
  to {opacity:1; transform:scale(1);}
}`;
document.head.appendChild(style);

/* =======================================================================
   🔥 Firebase init (compat) + busca de exercícios por nível/fase/dia
   ======================================================================= */
(function(){
  // Evita reinit se já estiver pronto
  if (window._femflowFirebaseReady) return;

  const firebaseConfig = {
    apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
    authDomain: "femflow-ebec2.firebaseapp.com",
    projectId: "femflow-ebec2",
    storageBucket: "femflow-ebec2.firebasestorage.app",
    messagingSenderId: "1043953159611",
    appId: "1:1043953159611:web:d12b82f744740f3124c89e",
    measurementId: "G-6F644L5VTW"
  };

  try {
    // compat API (funciona bem via <script src=...>)
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    window._femflowFirebaseReady = true;
    console.log("✅ Firebase pronto");
  } catch(e){
    console.warn("⚠️ Firebase init falhou", e);
  }
})();

/**
 * FEMFLOW.buscarExerciciosFirebase(nivel, fase, diaKey, enfase?)
 * Retorna:
 *  - lista PLANA de exercícios (cada doc) → [{ box, titulo, series, reps, tempo, link, ... }]
 *    (seu treino.js já agrupa por `box`)
 *
 * Convenções:
 *  - `nivel`  : "iniciante" | "intermediaria" | "avancada"  (sem acento/espaco)
 *  - `enfase` : "biceps" | "gluteo" | "costas" | ...
 *  - `fase`   : "folicular" | "menstrual" | "ovulatoria" | "lutea"
 *  - `diaKey` : "dia_1" .. "dia_35"
 */
if (!window.FEMFLOW) window.FEMFLOW = {};
FEMFLOW.buscarExerciciosFirebase = async function(nivel, fase, diaKey, enfase){
  // normalizações simples
  const norm = s => (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  nivel  = norm(nivel||localStorage.getItem('nivel_atual')||'iniciante');
  fase   = norm(fase||localStorage.getItem('fase_atual')||'folicular');
  diaKey = (diaKey||`dia_${localStorage.getItem('dia_ciclo')||1}`).toLowerCase();
  enfase = norm(enfase||localStorage.getItem('enfase_atual')||'geral');

  // Coleção: exercicios/{nivel}_{enfase}/fases/{fase}/dias/{diaKey}/exercicios
  const grupoId = `${nivel}_${enfase}`; // ex.: 'avancada_biceps'

  // Cache leve para evitar leituras repetidas (15 min)
  const cacheKey = `ff_fb_${grupoId}_${fase}_${diaKey}`;
  const now = Date.now();
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && (now - cached.ts) < (15*60*1000)) return cached.data;
  } catch(_) {}

  if (!window._femflowFirebaseReady || !window.firebase?.firestore) {
    console.warn("⚠️ Firebase Firestore indisponível — retornando lista vazia");
    return [];
  }

  const db = firebase.firestore();
  const path = db
    .collection('exercicios').doc(grupoId)
    .collection('fases').doc(fase)
    .collection('dias').doc(diaKey)
    .collection('exercicios');

  // Lê todos os docs do dia
  const snap = await path.get();
  const itens = [];
  snap.forEach(doc => {
    const d = doc.data() || {};
    itens.push({
      id: doc.id,
      box: (d.box || 'Box 1').toString(),
      titulo: d.titulo || d.nome || 'Exercício',
      // Aceita string "4" ou numero 4
      series: d.series != null ? String(d.series).trim() : null,
      reps:   d.reps   != null ? String(d.reps).trim()   : null, // pode ser "8-12"
      tempo:  d.tempo  != null ? Number(String(d.tempo).replace(/\D/g,'')) : null,
      link:   d.link || d.url || d.video || '',
      grupo:  d.grupo || '',
      enfase: d.enfase || '',
      fase:   d.fase   || fase,
      nivel:  d.nivel  || nivel,
      dia:    d.dia    || Number((diaKey.match(/\d+/)||[1])[0])
    });
  });

  // Ordena por `box` (Box 1, 2, 3...) e depois por título
  const bNum = s => { const m = String(s).match(/(\d+)/); return m ? Number(m[1]) : 9999; };
  itens.sort((a,b)=> (bNum(a.box)-bNum(b.box)) ? (bNum(a.box)-bNum(b.box)) : String(a.titulo).localeCompare(String(b.titulo)));

  // Salva cache
  try { localStorage.setItem(cacheKey, JSON.stringify({ ts: now, data: itens })); } catch(_){}

  return itens;
};

