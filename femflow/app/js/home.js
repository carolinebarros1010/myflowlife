/* ============================================================
   LINKS HOTMART (placeholders)
=========================================================== */
const LINK_ACESSO_APP = "https://pay.hotmart.com/E102962105N";
const LINK_PERSONAL   = "https://myflowlife.com.br/#ofertas";

/* FOLLOWME (quando ativar links) */
const FOLLOWME_LINKS = {
  livia:    "#", // em breve
  karoline: "#",
  thalita:  "#"
};

/* ============================================================
   SINCRONIZAR COM BACKEND (GET ?action=sync&id=...)
   - Atualiza localStorage com produto, ativa, enfase, fase etc.
=========================================================== */
async function syncUserHome() {
  try {
    const id = localStorage.getItem("femflow_id");
    if (!id || !window.FEMFLOW || !FEMFLOW.SCRIPT_URL) {
      console.warn("⚠️ Sem ID ou SCRIPT_URL para sync.");
      return null;
    }

    const url = `${FEMFLOW.SCRIPT_URL}?action=sync&id=${encodeURIComponent(id)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    console.log("🔄 RESPOSTA SYNC HOME:", data);

    if (!data || data.status !== "ok") return data;

    // Grava chaves importantes no localStorage
    if (data.id)          localStorage.setItem("femflow_id", data.id);
    if (data.nome)        localStorage.setItem("femflow_nome", data.nome);
    if (data.produto)     localStorage.setItem("femflow_produto", data.produto);
    if (typeof data.ativa !== "undefined") {
      localStorage.setItem("femflow_ativa", data.ativa ? "true" : "false");
    }
    if (data.enfase)      localStorage.setItem("femflow_enfase", data.enfase);
    if (data.nivel)       localStorage.setItem("femflow_nivel", data.nivel);
    if (data.fase)        localStorage.setItem("femflow_fase", data.fase);
    if (data.diaCiclo)    localStorage.setItem("femflow_diaCiclo", String(data.diaCiclo));
    if (data.perfilHormonal)
      localStorage.setItem("femflow_perfilHormonal", data.perfilHormonal);
    if (data.ciclo_duracao)
      localStorage.setItem("femflow_cycleLength", String(data.ciclo_duracao));
    if (data.data_inicio)
      localStorage.setItem("femflow_startDate", new Date(data.data_inicio).toISOString());

    return data;

  } catch (err) {
    console.warn("⚠️ Erro no syncUserHome():", err);
    return null;
  }
}

/* ============================================================
   LISTAS DE CARDS — TREINOS NORMAIS
=========================================================== */
const LISTA_MUSCULAR = [
  { titulo:"Glúteo",     enfase:"gluteo",     color:"#d98f80", desc:"Foco total no glúteo" },
  { titulo:"Costas",     enfase:"costas",     color:"#a6b8c8", desc:"Remadas e postura" },
  { titulo:"Peito",      enfase:"peito",      color:"#e6a09b", desc:"Força de empurrar" },
  { titulo:"Braço",      enfase:"braco",      color:"#d38b6e", desc:"Bíceps + tríceps" },
  { titulo:"Posterior",  enfase:"posterior",  color:"#b58fb5", desc:"Cadeia posterior" },
  { titulo:"Quadríceps", enfase:"quadriceps", color:"#9fb7ac", desc:"Pernas fortes" }
];

const LISTA_ESPORTES = [
  { titulo:"Corrida",  enfase:"corrida",  color:"#b8a59c", desc:"Base aeróbica" },
  { titulo:"Natação",  enfase:"natacao",  color:"#80a8b3", desc:"Propulsão aquática" },
  { titulo:"Remo",     enfase:"remo",     color:"#7f9d94", desc:"Tração e core" },
  { titulo:"Bike",     enfase:"bike",     color:"#9cc2c1", desc:"Cardio leve/moderado" },
  { titulo:"Beach",    enfase:"beach",    color:"#e3a689", desc:"Areia e potência" }
];

const LISTA_CASA = [
  { titulo:"Em Casa",       enfase:"casa",         color:"#d1a697", desc:"Sem equipamentos" },
  { titulo:"Casa Glúteo",   enfase:"casa_gluteo",  color:"#dc9d8c", desc:"Glúteos em casa" },
  { titulo:"Casa Core",     enfase:"casa_core",    color:"#cababa", desc:"Abdômen e lombar" },
  { titulo:"Casa Elástico", enfase:"casa_elastico",color:"#d8c4b0", desc:"Elástico" },
  { titulo:"Casa Halter",   enfase:"casa_halter",  color:"#c6b4a4", desc:"Halter" }
];

const LISTA_PERSONAL = [
  { titulo:"Treino Personal", enfase:"personal", color:"#335953", desc:"Treino exclusivo criado pelo Coach" }
];

/* ============================================================
   FOLLOWME — TREINE JUNTO POR 30 DIAS
=========================================================== */
const LISTA_FOLLOWME = [
  {
    titulo: { pt:"Treine com Lívia Rapaci", en:"Train with Lívia Rapaci", fr:"Entraînez-vous avec Lívia Rapaci" },
    desc:   { pt:"30 dias com a coach Lívia", en:"30 days with coach Lívia", fr:"30 jours avec coach Lívia" },
    enfase: "followme_livia",
    color: "#f3c1c1"
  },
  {
    titulo: { pt:"Treine com Karoline Bombeira", en:"Train with Karoline Bombeira", fr:"Entraînez-vous avec Karoline Bombeira" },
    desc:   { pt:"30 dias com Karoline", en:"30 days with Karoline", fr:"30 jours avec Karoline" },
    enfase: "followme_karoline",
    color: "#ff9f7f"
  },
  {
    titulo: { pt:"Treine com Thalita Prates", en:"Train with Thalita Prates", fr:"Entraînez-vous avec Thalita Prates" },
    desc:   { pt:"30 dias com Thalita", en:"30 days with Thalita", fr:"30 jours avec Thalita" },
    enfase: "followme_thalita",
    color: "#cbb1e6"
  }
];

/* ============================================================
   RENDER MULTILINGUE DOS CARDS
=========================================================== */
function cardHTML(p){
  const lang   = (window.FEMFLOW && FEMFLOW.lang) || "pt";
  const titulo = typeof p.titulo === "object" ? p.titulo[lang] : p.titulo;
  const desc   = typeof p.desc   === "object" ? p.desc[lang]   : p.desc;

  return `
    <article class="card" data-enfase="${p.enfase}">
      <div class="thumb" style="background:${p.color}">
        <span class="badge">${titulo}</span>
      </div>
      <div class="info">
        <h3 class="ttl">${titulo}</h3>
        <p class="desc">${desc || ""}</p>
      </div>
    </article>`;
}

function renderRail(el, lista){
  if (!el) return;
  el.innerHTML = lista.map(cardHTML).join("");

  el.querySelectorAll(".card").forEach(c => {
    c.onclick = () => handleCardClick(c.dataset.enfase);
  });
}

/* ============================================================
   LÓGICA DE ACESSO DOS CARDS POR PRODUTO
=========================================================== */
function handleCardClick(enfase){

  const produto = (localStorage.getItem("femflow_produto") || "").toLowerCase();
  const ativa   = localStorage.getItem("femflow_ativa") === "true";

  const acessoPersonal = (produto === "treino_personal" && ativa);
  const acessoApp      = (produto === "acesso_app" && ativa);
  const acessoFollow   = (produto === "followme" && ativa);

  /* 1) PERSONAL — tudo exceto FollowMe */
  if (acessoPersonal){
    if (enfase.startsWith("followme_")){
      FEMFLOW.toast?.("FollowMe não faz parte do seu plano.");
      return;
    }
    if (enfase === "personal"){
      return selecionarEnfase("personal");
    }
    return selecionarEnfase(enfase);
  }

  /* 2) ACESSO_APP — somente ENFASES */
  if (acessoApp){
    if (enfase.startsWith("followme_")){
      FEMFLOW.toast?.("✨ Em breve! Treine junto por 30 dias.");
      return;
    }
    if (enfase === "personal"){
      FEMFLOW.toast?.("O Treino Personal é um produto adicional.");
      return;
    }
    return selecionarEnfase(enfase);
  }

  /* 3) FOLLOWME — somente FollowMe */
  if (acessoFollow){
    if (enfase.startsWith("followme_")){
      return selecionarCoach(enfase); // segue para flowcenter + treino da coach
    }
    FEMFLOW.toast?.("Seu plano dá acesso apenas ao Treino Junto por 30 dias.");
    return;
  }

  /* 4) SEM PRODUTO — tudo vai para compra */
  FEMFLOW.toast?.("Adquira acesso para liberar seus treinos.");
}

/* ============================================================
   SALVAR ENFASE NORMAL
=========================================================== */
async function selecionarEnfase(enfase){
  const id = localStorage.getItem("femflow_id");
  localStorage.setItem("femflow_enfase", enfase);

  if (id && window.FEMFLOW && FEMFLOW.SCRIPT_URL){
    try{
      await fetch(FEMFLOW.SCRIPT_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ action:"setenfase", id, enfase })
      });
    }catch(err){
      console.warn("⚠️ Erro ao salvar enfase:", err);
    }
  }

  FEMFLOW.router?.("flowcenter");
}

/* ============================================================
   SELEÇÃO DE COACH FOLLOWME (salva no backend)
=========================================================== */
async function selecionarCoach(coach){
  const id = localStorage.getItem("femflow_id");
  localStorage.setItem("femflow_enfase", coach);

  if (id && window.FEMFLOW && FEMFLOW.SCRIPT_URL){
    try{
      await fetch(FEMFLOW.SCRIPT_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ action:"setenfase", id, enfase: coach })
      });
    }catch(err){
      console.warn("⚠️ Erro ao salvar coach FollowMe:", err);
    }
  }

  FEMFLOW.router?.("flowcenter");
}

/* ============================================================
   CARD PERSONAL — SEMPRE VISÍVEL
   (controle de acesso só no clique)
=========================================================== */
function ativarCardPersonalTopo(){
  const rail = document.getElementById("railPersonalTopo");
  renderRail(rail, LISTA_PERSONAL); // sempre desenha o card
}

/* ============================================================
   INIT HOME
=========================================================== */
function initHomeUI(){
  // Saudação
  const nome = localStorage.getItem("femflow_nome");
  const elBV = document.getElementById("bvTexto");
  if (elBV){
    elBV.textContent = nome ? `Bem-vinda, ${nome}!` : "Bem-vinda!";
  }

  // Card Personal sempre visível
  ativarCardPersonalTopo();

  // Demais fileiras
  renderRail(document.getElementById("railMuscular"), LISTA_MUSCULAR);
  renderRail(document.getElementById("railEsportes"), LISTA_ESPORTES);
  renderRail(document.getElementById("railCasa"),     LISTA_CASA);
  renderRail(document.getElementById("railFollowMe"), LISTA_FOLLOWME);

  // Botões
  const btnFlow = document.getElementById("btnFlow");
  const btnCad  = document.getElementById("btnCad");

  if (btnFlow) btnFlow.onclick = () => FEMFLOW.router?.("flowcenter");
  if (btnCad)  btnCad.onclick  = () => FEMFLOW.router?.("index");
}

/* ============================================================
   DOM READY
=========================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  // 1) Sincroniza com backend para preencher produto / ativa
  await syncUserHome();

  // 2) Monta UI da Home
  initHomeUI();
});
