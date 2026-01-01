/* ============================================================
   FemFlow • HOME.JS — VERSÃO FINAL 2025 2(CORRIGIDA)
   Home usa VALIDAR — NUNCA usa SYNC
=========================================================== */

/* LINKS */
const LINK_ACESSO_APP = "https://pay.hotmart.com/E102962105N";
const LINK_PERSONAL   = "https://myflowlife.com.br/#ofertas";

/* FOLLOWME */
const FOLLOWME_LINKS = {
  livia: "#",
  karoline: "#",
  thalita: "#"
};

/* ============================================================
   🔄 PERFIL: puxar do backend e persistir no localStorage
============================================================ */
async function carregarPerfilEAtualizarStorage() {
  const id = localStorage.getItem("femflow_id") || "";
  const email = localStorage.getItem("femflow_email") || "";

  // sem identificador -> volta pro login
  if (!id && !email) return { status: "no_auth" };

  // ✅ chama VALIDAR (fonte da verdade)
  const qs = new URLSearchParams({ action: "validar" });
  if (id) qs.set("id", id);
  else qs.set("email", email);

  const url = `${FEMFLOW.SCRIPT_URL}?${qs.toString()}`;
  const perfil = await fetch(url).then(r => r.json()).catch(() => ({ status: "error" }));

  return perfil;
}

function persistPerfil(perfil) {
  // essenciais
  localStorage.setItem("femflow_id", perfil.id || "");
  localStorage.setItem("femflow_nome", perfil.nome || "");
  localStorage.setItem("femflow_email", perfil.email || "");
  localStorage.setItem("femflow_produto", String(perfil.produto || "").toLowerCase());
  localStorage.setItem("femflow_ativa", String(!!perfil.ativa));
  localStorage.setItem("femflow_personal", String(!!perfil.personal));

  // ciclo + programa (CRÍTICO)
  localStorage.setItem("femflow_perfilHormonal", String(perfil.perfilHormonal || "regular").toLowerCase());
  localStorage.setItem("femflow_cycleLength", String(perfil.ciclo_duracao || 28));
  localStorage.setItem("femflow_fase", String(perfil.fase || "follicular").toLowerCase());
  localStorage.setItem("femflow_diaCiclo", String(perfil.diaCiclo || 1));
  localStorage.setItem("femflow_diaPrograma", String(perfil.diaPrograma || 1));
   localStorage.setItem(  "femflow_dataInicioPrograma",   perfil.dataInicioPrograma ? String(perfil.dataInicioPrograma) : "" );


localStorage.setItem(
  "femflow_enfase",
  String(perfil.enfase || "nenhuma").toLowerCase()
);
}
   
/* ============================================================
   LISTAS DE CARDS
=========================================================== */
const LISTA_MUSCULAR = [
  { titulo:"Glúteo", enfase:"gluteo", color:"#d98f80", desc:"Foco total no glúteo" },
  { titulo:"Costas", enfase:"costas", color:"#a6b8c8", desc:"Remadas e postura" },
  { titulo:"Peito",  enfase:"peito",  color:"#e6a09b", desc:"Força de empurrar" },
  { titulo:"Braço",  enfase:"braco",  color:"#d38b6e", desc:"Bíceps + tríceps" },
  { titulo:"Posterior", enfase:"posterior", color:"#b58fb5", desc:"Cadeia posterior" },
  { titulo:"Quadríceps", enfase:"quadriceps", color:"#9fb7ac", desc:"Pernas fortes" },
  { titulo:"Militar", enfase:"militar", color:"#8c9aa3", desc:"Teste físico operacional" }
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
  { titulo:"Treino Personal", enfase:"personal", color:"#335953", desc:"Treino criado pelo Coach" }
];

const LISTA_FOLLOWME = [
  {
    titulo:{pt:"Treine com Lívia Rapaci",en:"Train with Lívia Rapaci",fr:"Entraînez-vous avec Lívia"},
    desc:{pt:"30 dias com a coach Lívia",en:"30 days with Lívia",fr:"30 jours avec Lívia"},
    enfase:"followme_livia",
    color:"#f3c1c1"
  },
  {
    titulo:{pt:"Treine com Karoline Bombeira",en:"Train with Karoline",fr:"Entraînez-vous avec Karoline"},
    desc:{pt:"30 dias com Karoline",en:"30 days with Karoline",fr:"30 jours avec Karoline"},
    enfase:"followme_karoline",
    color:"#ff9f7f"
  },
  {
    titulo:{pt:"Treine com Thalita Prates",en:"Train with Thalita",fr:"Entraînez-vous avec Thalita"},
    desc:{pt:"30 dias com Thalita",en:"30 days with Thalita",fr:"30 jours avec Thalita"},
    enfase:"followme_thalita",
    color:"#cbb1e6"
  }
];

/* ============================================================
   RENDERIZAÇÃO DOS CARDS
=========================================================== */
function cardHTML(p){
  const lang = FEMFLOW.lang || "pt";
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
  el.innerHTML = lista.map(cardHTML).join("");
  el.querySelectorAll(".card").forEach(c =>
    c.onclick = () => handleCardClick(c.dataset.enfase)
  );
}

/* ============================================================
   LÓGICA DE ACESSO POR PRODUTO
=========================================================== */
function handleCardClick(enfase){
   
if (!localStorage.getItem("femflow_cycle_configured")) {

  FEMFLOW.loading.show("Configurando seu ciclo…");

  localStorage.setItem("femflow_enfase", enfase);

 FEMFLOW.dispatch("stateChanged", {
  type: "ciclo",
  impact: "fisiologico",
  source: "home"
});
return;
}



  const produto  = (localStorage.getItem("femflow_produto") || "").toLowerCase();
  const ativa    = localStorage.getItem("femflow_ativa") === "true";
  const personal = localStorage.getItem("femflow_personal") === "true";

  /* PERSONAL TEM ACESSO TOTAL (menos FollowMe) */
  if (personal){
    if (enfase.startsWith("followme_")){
      FEMFLOW.toast("FollowMe não faz parte do seu plano.");
      return;
    }
    return selecionarEnfase(enfase);
  }

  /* FOLLOWME */
  if (produto === "followme" && ativa){
    if (!enfase.startsWith("followme_")){
      FEMFLOW.toast("Seu plano dá acesso apenas ao FollowMe.");
      return;
    }
    return selecionarCoach(enfase);
  }

  /* ACESSO APP */
  if (produto === "acesso_app" && ativa){
    if (enfase.startsWith("followme_")){
      FEMFLOW.toast("✨ Em breve! Treine junto.");
      return;
    }
    if (enfase === "personal"){
      FEMFLOW.toast("Treino Personal é um produto adicional.");
      return;
    }
    return selecionarEnfase(enfase);
  }

  FEMFLOW.toast("Adquira acesso para liberar seus treinos.");
}

/* ============================================================
   SALVAR ENFASE NORMAL
=========================================================== */
async function selecionarEnfase(enfase){
  const id = localStorage.getItem("femflow_id");

 FEMFLOW.loading.show("Preparando novo programa…");


  // 🔥 1. salvar nova ênfase
  localStorage.setItem("femflow_enfase", enfase);

  // 🔥 2. reset explícito do programa (REGRA FEMFLOW)
  localStorage.setItem("femflow_diaPrograma", "1");

  if (id){
    // 3. backend: salvar ênfase
    await fetch(FEMFLOW.SCRIPT_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        action:"setenfase",
        id,
        enfase
      })
    });

    // 4. backend: resetar programa
    await fetch(FEMFLOW.SCRIPT_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        action:"resetprograma",
        id
      })
    });
  }

  // 5. seguir fluxo normal
  FEMFLOW.router("flowcenter");
}



/* FOLLOWME */
async function selecionarCoach(coach){
  const id = localStorage.getItem("femflow_id");
  localStorage.setItem("femflow_enfase", coach);

  if (id){
    await fetch(FEMFLOW.SCRIPT_URL,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ action:"setenfase", id, enfase:coach })
    });
   await FEMFLOW.reiniciarDiaPrograma();
  }

  FEMFLOW.router("flowcenter");
}
/* ============================================================
   APLICAR IDIOMA NA HOME (inclui VÍDEO)
=========================================================== */
function aplicarIdiomaHome() {
  const lang = FEMFLOW.lang || "pt";
  const L = FEMFLOW.langs?.[lang]?.home;
  if (!L) return;

  const nomeRaw = localStorage.getItem("femflow_nome") || "Aluna";
  const primeiroNome = nomeRaw.split(" ")[0];

  // Saudação
  const bv = document.getElementById("bvTexto");
  if (bv) {
    // usa o texto do lang + primeiro nome
    bv.textContent = `${L.bemvinda}, ${primeiroNome}!`;
  }

   // Títulos das seções
  const tPersonal  = document.getElementById("tituloPersonalTopo");
  const tFollowMe  = document.getElementById("tituloFollowMe");
  const tMuscular  = document.getElementById("tituloMuscular");
  const tEsportes  = document.getElementById("tituloEsportes");
  const tCasa      = document.getElementById("tituloCasa");

  if (tPersonal)  tPersonal.textContent  = L.tituloPersonal;
  if (tFollowMe)  tFollowMe.textContent  = L.tituloFollowMe;
  if (tMuscular)  tMuscular.textContent  = L.tituloMuscular;
  if (tEsportes)  tEsportes.textContent  = L.tituloEsportes;
  if (tCasa)      tCasa.textContent      = L.tituloCasa;


  // 🔥 VÍDEO
  const vTitle = document.getElementById("homeVideoTitle");
  const vSub   = document.getElementById("homeVideoSub");
  const vFrame = document.getElementById("homeVideoFrame");

  if (vTitle && L.videoTitulo) vTitle.textContent = L.videoTitulo;
  if (vSub   && L.videoSub)   vSub.textContent   = L.videoSub;
  if (vFrame && L.videoUrl)   vFrame.src         = L.videoUrl;
}

/* ============================================================
   HOME — AGORA USANDO SOMENTE VALIDAR (SEM SYNC)
=========================================================== */
document.addEventListener("DOMContentLoaded", async () => {

   FEMFLOW.loading.show("Carregando…");

   

  try {
    const perfil = await carregarPerfilEAtualizarStorage();

   
 

      if (perfil.status !== "ok") {
      FEMFLOW.toast("Erro ao atualizar dados. Tente novamente.");
      FEMFLOW.loading.hide();
      return;
    }

        if (perfil.status === "blocked" || perfil.status === "denied") {
      FEMFLOW.toast("Sessão inválida. Faça login novamente.");
      FEMFLOW.clearSession?.();
      FEMFLOW.loading.hide();
      return FEMFLOW.router("index.html");
   }
     
persistPerfil(perfil);

     // ✅ ciclo configurado vem do VALIDAR
if (perfil.fase && perfil.diaCiclo) {
  localStorage.setItem("femflow_cycle_configured", "yes");
}
     
     if (!localStorage.getItem("femflow_cycle_configured")) {
  FEMFLOW.loading.hide?.();
  FEMFLOW.toast("Configure seu ciclo antes de escolher o treino 🌸");
  FEMFLOW.router("ciclo");
  return;
}

    renderRail(document.getElementById("railFollowMe"), LISTA_FOLLOWME);
    renderRail(document.getElementById("railMuscular"), LISTA_MUSCULAR);
    renderRail(document.getElementById("railEsportes"), LISTA_ESPORTES);
    renderRail(document.getElementById("railCasa"), LISTA_CASA);
    renderRail(document.getElementById("railPersonal"), LISTA_PERSONAL);

    aplicarIdiomaHome();

  } catch (err) {
    console.error("HOME init erro:", err);
    FEMFLOW.toast("Falha ao carregar. Verifique internet.");
  } finally {
    FEMFLOW.loading.hide();
  }
});




/* ============================================================
   🔥 Quando o idioma mudar → traduz de novo a home
=========================================================== */
document.addEventListener("femflow:langChange", aplicarIdiomaHome);
