/* ============================================================
   LINKS HOTMART (placeholders)
=========================================================== */
const LINK_ACESSO_APP = "https://pay.hotmart.com/E102962105N";
const LINK_PERSONAL   = "https://myflowlife.com.br/#ofertas";

/* FOLLOWME (quando ativar links) */
const FOLLOWME_LINKS = {
  livia: "#",
  karoline: "#",
  thalita: "#"
};


/* ============================================================
   0) VALIDAR USUÁRIO NO BACKEND — VERSÃO FINAL
   (Esse é o endpoint completo, retorna produto e ativa)
=========================================================== */
FEMFLOW.validarUserHome = async function () {
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    console.warn("⚠️ Nenhum ID encontrado no localStorage.");
    return null;
  }

  const url = `${FEMFLOW.SCRIPT_URL}?action=validar&id=${id}`;
  const resp = await fetch(url);
  const data = await resp.json();

  console.log("🔎 VALIDAR → BACKEND:", data);

  // falha / expirado
  if (!data || data.status !== "ok") return data;

  // grava tudo necessário no localStorage
  localStorage.setItem("femflow_nome", data.nome || "");
  localStorage.setItem("femflow_produto", (data.produto || "").toLowerCase());
  localStorage.setItem("femflow_ativa", data.ativa ? "true" : "false");

  localStorage.setItem("femflow_enfase", data.enfase || "nenhuma");
  localStorage.setItem("femflow_nivel", data.nivel || "iniciante");

  localStorage.setItem("femflow_fase", data.fase || "follicular");
  localStorage.setItem("femflow_diaCiclo", data.diaCiclo || 1);

  localStorage.setItem("femflow_perfilHormonal", data.perfilHormonal || "regular");

  return data;
};


/* ============================================================
   1) LOAD INICIAL (HOME) — chama VALIDAR antes de tudo
=========================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  
  console.log("🏠 HOME carregando… validando backend…");

  const user = await FEMFLOW.validarUserHome();

  if (user?.nome) {
    document.getElementById("bvTexto").textContent = `Bem-vinda, ${user.nome}!`;
  }

  // Depois da validação → renderiza tudo
  ativarCardPersonalTopo();
  inicializarRails();

});


/* ============================================================
   2) LISTAS DE CARDS — TREINOS NORMAIS + FOLLOWME
=========================================================== */
const LISTA_MUSCULAR = [
  { titulo:"Glúteo", enfase:"gluteo", color:"#d98f80", desc:"Foco total no glúteo" },
  { titulo:"Costas", enfase:"costas", color:"#a6b8c8", desc:"Remadas e postura" },
  { titulo:"Peito",  enfase:"peito",  color:"#e6a09b", desc:"Força de empurrar" },
  { titulo:"Braço",  enfase:"braco",  color:"#d38b6e", desc:"Bíceps + tríceps" },
  { titulo:"Posterior", enfase:"posterior", color:"#b58fb5", desc:"Cadeia posterior" },
  { titulo:"Quadríceps", enfase:"quadriceps", color:"#9fb7ac", desc:"Pernas fortes" }
];

const LISTA_ESPORTES = [
  { titulo:"Corrida", enfase:"corrida", color:"#b8a59c", desc:"Base aeróbica" },
  { titulo:"Natação", enfase:"natacao", color:"#80a8b3", desc:"Propulsão aquática" },
  { titulo:"Remo",    enfase:"remo",    color:"#7f9d94", desc:"Tração e core" },
  { titulo:"Bike",    enfase:"bike",    color:"#9cc2c1", desc:"Cardio leve/moderado" },
  { titulo:"Beach",   enfase:"beach",   color:"#e3a689", desc:"Areia e potência" }
];

const LISTA_CASA = [
  { titulo:"Em Casa", enfase:"casa", color:"#d1a697", desc:"Sem equipamentos" },
  { titulo:"Casa Glúteo", enfase:"casa_gluteo", color:"#dc9d8c", desc:"Glúteos em casa" },
  { titulo:"Casa Core",   enfase:"casa_core",   color:"#cababa", desc:"Abdômen e lombar" },
  { titulo:"Casa Elástico", enfase:"casa_elastico", color:"#d8c4b0", desc:"Elástico" },
  { titulo:"Casa Halter",   enfase:"casa_halter",   color:"#c6b4a4", desc:"Halter" }
];

const LISTA_PERSONAL = [
  { titulo:"Treino Personal", enfase:"personal", color:"#335953", desc:"Treino exclusivo criado pelo Coach" }
];

const LISTA_FOLLOWME = [
  {
    titulo:{pt:"Treine com Lívia Rapaci",en:"Train with Lívia Rapaci",fr:"Entraînez-vous avec Lívia Rapaci"},
    desc:{pt:"30 dias com a coach Lívia",en:"30 days with Coach Lívia",fr:"30 jours avec Coach Lívia"},
    enfase:"followme_livia",
    color:"#f3c1c1"
  },
  {
    titulo:{pt:"Treine com Karoline Bombeira",en:"Train with Karoline Bombeira",fr:"Entraînez-vous avec Karoline Bombeira"},
    desc:{pt:"30 dias com Karoline",en:"30 days with Karoline",fr:"30 jours avec Karoline"},
    enfase:"followme_karoline",
    color:"#ff9f7f"
  },
  {
    titulo:{pt:"Treine com Thalita Prates",en:"Train with Thalita Prates",fr:"Entraînez-vous avec Thalita Prates"},
    desc:{pt:"30 dias com Thalita",en:"30 days with Thalita",fr:"30 jours avec Thalita"},
    enfase:"followme_thalita",
    color:"#cbb1e6"
  }
];


/* ============================================================
   3) RENDER MULTILINGUE
=========================================================== */
function cardHTML(p){
  const lang = FEMFLOW?.lang || "pt";
  const titulo = typeof p.titulo === "object" ? p.titulo[lang] : p.titulo;
  const desc   = typeof p.desc   === "object" ? p.desc[lang]   : p.desc;

  return `
    <article class="card" data-enfase="${p.enfase}">
      <div class="thumb" style="background:${p.color}">
        <span class="badge">${titulo}</span>
      </div>
      <div class="info">
        <h3 class="ttl">${titulo}</h3>
        <p class="desc">${desc||""}</p>
      </div>
    </article>`;
}

function renderRail(el, lista){
  el.innerHTML = lista.map(cardHTML).join("");
  el.querySelectorAll(".card").forEach(c => {
    c.onclick = () => handleCardClick(c.dataset.enfase);
  });
}


/* ============================================================
   4) LÓGICA DE ACESSO — FINAL
=========================================================== */
function handleCardClick(enfase){

  const produto = (localStorage.getItem("femflow_produto") || "").toLowerCase();
  const ativa   = localStorage.getItem("femflow_ativa") === "true";

  const acessoPersonal = (produto === "treino_personal" && ativa);
  const acessoApp      = (produto === "acesso_app" && ativa);
  const acessoFollow   = (produto === "followme" && ativa);

  /* PERSONAL → tudo exceto FollowMe */
  if (acessoPersonal){
    if (enfase.startsWith("followme_")){
      FEMFLOW.toast("FollowMe não faz parte do seu plano.");
      return;
    }
    return selecionarEnfase(enfase);
  }

  /* ACESSO APP → tudo exceto Personal e FollowMe */
  if (acessoApp){
    if (enfase.startsWith("followme_")){
      FEMFLOW.toast("✨ Em breve! Treine junto por 30 dias.");
      return;
    }
    return selecionarEnfase(enfase);
  }

  /* FOLLOWME → apenas FollowMe */
  if (acessoFollow){
    if (enfase.startsWith("followme_")){
      return selecionarCoach(enfase);
    }
    FEMFLOW.toast("Seu plano dá acesso apenas ao FollowMe.");
    return;
  }

  FEMFLOW.toast("Adquira acesso para liberar os treinos.");
}


/* ============================================================
   5) SALVAR ENFASE NORMAL
=========================================================== */
async function selecionarEnfase(enfase){
  const id = localStorage.getItem("femflow_id");
  localStorage.setItem("femflow_enfase", enfase);

  if (id){
    try{
      await fetch(FEMFLOW.SCRIPT_URL, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ action:"setenfase", id, enfase })
      });
    }catch{}
  }

  FEMFLOW.router("flowcenter");
}


/* ============================================================
   6) SALVAR COACH DO FOLLOWME
=========================================================== */
async function selecionarCoach(coach){
  const id = localStorage.getItem("femflow_id");

  localStorage.setItem("femflow_enfase", coach);

  await fetch(FEMFLOW.SCRIPT_URL, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ action:"setenfase", id, enfase: coach })
  });

  FEMFLOW.router("flowcenter");
}


/* ============================================================
   7) CARD PERSONAL SEMPRE VISÍVEL
=========================================================== */
function ativarCardPersonalTopo(){

  const produto = (localStorage.getItem("femflow_produto") || "").toLowerCase();
  const ativa   = localStorage.getItem("femflow_ativa") === "true";

  const temPersonal = (produto === "treino_personal" && ativa);

  const sec = document.getElementById("tituloPersonalTopo");
  const rail = document.getElementById("railPersonal");

  if (temPersonal){
    sec.style.display = "block";
    rail.style.display = "flex";
    renderRail(rail, LISTA_PERSONAL);
  } else {
    sec.style.display = "none";
    rail.style.display = "none";
  }
}


/* ============================================================
   8) INIT RAILS
=========================================================== */
function inicializarRails(){
  renderRail(document.getElementById("railMuscular"), LISTA_MUSCULAR);
  renderRail(document.getElementById("railEsportes"), LISTA_ESPORTES);
  renderRail(document.getElementById("railCasa"), LISTA_CASA);
  renderRail(document.getElementById("railFollowMe"), LISTA_FOLLOWME);

  document.getElementById("btnFlow").onclick = () => FEMFLOW.router("flowcenter");
  document.getElementById("btnCad").onclick  = () => FEMFLOW.router("index");
}
