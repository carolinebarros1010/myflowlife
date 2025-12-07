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
   FUNÇÃO: ATIVAR CARD PERSONAL SEM ERRO
=========================================================== */
function ativarCardPersonalTopo(){
  const rail = document.getElementById("railPersonalTopo");
  if (!rail) return;
  renderRail(rail, LISTA_PERSONAL);
}

/* ============================================================
   SYNC BACKEND
=========================================================== */
async function syncUserHome() {
  try {
    const id = localStorage.getItem("femflow_id");
    if (!id || !FEMFLOW?.SCRIPT_URL) return;

    const url = `${FEMFLOW.SCRIPT_URL}?action=sync&id=${id}`;
    const resp = await fetch(url);
    const data = await resp.json();

    console.log("🔄 SYNC HOME:", data);

    if (data?.status !== "ok") return;

    // salva tudo
    Object.entries({
      femflow_id: data.id,
      femflow_nome: data.nome,
      femflow_produto: data.produto,
      femflow_ativa: data.ativa ? "true" : "false",
      femflow_enfase: data.enfase,
      femflow_nivel: data.nivel,
      femflow_fase: data.fase,
      femflow_diaCiclo: data.diaCiclo,
      femflow_perfilHormonal: data.perfilHormonal
    }).forEach(([k, v]) => v && localStorage.setItem(k, v));

  } catch (err) {
    console.warn("Sync error:", err);
  }
}

/* ============================================================
   LISTAS
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
    titulo: { pt:"Treine com Lívia Rapaci" },
    desc:   { pt:"30 dias com a coach Lívia" },
    enfase: "followme_livia",
    color: "#f3c1c1"
  },
  {
    titulo: { pt:"Treine com Karoline Bombeira" },
    desc:   { pt:"30 dias com Karoline" },
    enfase: "followme_karoline",
    color: "#ff9f7f"
  },
  {
    titulo: { pt:"Treine com Thalita Prates" },
    desc:   { pt:"30 dias com Thalita" },
    enfase: "followme_thalita",
    color: "#cbb1e6"
  }
];

/* ============================================================
   RENDER
=========================================================== */
function cardHTML(p){
  const titulo = typeof p.titulo === "object" ? p.titulo.pt : p.titulo;
  const desc   = typeof p.desc === "object" ? p.desc.pt : p.desc;

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
   LÓGICA DE CLIQUE
=========================================================== */
function handleCardClick(enfase){

  const produto = (localStorage.getItem("femflow_produto") || "").toLowerCase();
  const ativa   = localStorage.getItem("femflow_ativa") === "true";

  const acessoPersonal = produto === "treino_personal" && ativa;
  const acessoApp      = produto === "acesso_app" && ativa;
  const acessoFollow   = produto === "followme" && ativa;

  if (acessoPersonal){
    if (enfase.startsWith("followme_")){
      return FEMFLOW.toast("FollowMe não faz parte do seu plano.");
    }
    return selecionarEnfase(enfase);
  }

  if (acessoApp){
    if (enfase.startsWith("followme_")){
      return FEMFLOW.toast("✨ Em breve!");
    }
    if (enfase === "personal"){
      return FEMFLOW.toast("Treino Personal é um produto adicional.");
    }
    return selecionarEnfase(enfase);
  }

  if (acessoFollow){
    if (enfase.startsWith("followme_")){
      return selecionarCoach(enfase);
    }
    return FEMFLOW.toast("Seu plano dá acesso apenas ao FollowMe.");
  }

  FEMFLOW.toast("Adquira acesso para liberar treinos.");
}

async function selecionarEnfase(enfase){
  const id = localStorage.getItem("femflow_id");
  localStorage.setItem("femflow_enfase", enfase);

  if (id){
    await fetch(FEMFLOW.SCRIPT_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ action:"setenfase", id, enfase })
    });
  }

  FEMFLOW.router("flowcenter");
}

async function selecionarCoach(coach){
  const id = localStorage.getItem("femflow_id");
  localStorage.setItem("femflow_enfase", coach);

  if (id){
    await fetch(FEMFLOW.SCRIPT_URL, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ action:"setenfase", id, enfase: coach })
    });
  }

  FEMFLOW.router("flowcenter");
}

/* ============================================================
   INIT HOME
=========================================================== */
document.addEventListener("DOMContentLoaded", async () => {

  await syncUserHome(); // sincroniza backend → localStorage

  // agora monta a interface
  ativarCardPersonalTopo();

  renderRail(document.getElementById("railMuscular"), LISTA_MUSCULAR);
  renderRail(document.getElementById("railEsportes"), LISTA_ESPORTES);
  renderRail(document.getElementById("railCasa"), LISTA_CASA);
  renderRail(document.getElementById("railFollowMe"), LISTA_FOLLOWME);
});
