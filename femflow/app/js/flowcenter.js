/* ============================================================
   FLOWCENTER.JS — FemFlow 2025 • VERSÃO FINAL AJUSTADA
   Correção: Perfil completo vem de carregarPerfil(), não do SYNC
============================================================ */

document.addEventListener("DOMContentLoaded", initFlowCenter);

async function initFlowCenter() {

  FEMFLOW.inserirHeaderApp?.();
  FEMFLOW.inserirMenuLateral?.();
  FEMFLOW.inserirModalIdioma?.();

  /* ============================================================
     1) CARREGAR PERFIL COMPLETO (produto, ativa, personal)
  ============================================================ */
  let perfil = await FEMFLOW.carregarPerfil();
   
   if (!perfil || perfil.status === "blocked") {
  FEMFLOW.toast("Sessão inválida.");
  FEMFLOW.clearSession();
  return FEMFLOW.router("index.html");
}


  const produtoRaw = (perfil.produto || "").toLowerCase();
  const nivelRaw   = perfil.nivel?.toLowerCase() || "iniciante";

  const isPersonal = produtoRaw === "treino_personal";
  const isFollow   = produtoRaw === "followme";
  const isApp      = produtoRaw === "acesso_app";

  /* ============================================================
     2) SINCRONIZAR FASE HORMONAL (não altera produto)
  ============================================================ */
  let ciclo = await FEMFLOW.carregarCicloBackend();

  if (!ciclo) {
    FEMFLOW.toast("Erro ao sincronizar ciclo.");
    return FEMFLOW.router("home.html");
  }

  /* ============================================================
     3) ATUALIZAR NÍVEL NO TOPO
  ============================================================ */
  function aplicarNivelH1() {
    const nivel = (localStorage.getItem("femflow_nivel") || "iniciante")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const mapa = {
      iniciante:{pt:"Iniciante",en:"Beginner",fr:"Débutante"},
      intermediaria:{pt:"Intermediária",en:"Intermediate",fr:"Intermédiaire"},
      avancada:{pt:"Avançada",en:"Advanced",fr:"Avancée"}
    };

    const lang = FEMFLOW.lang || "pt";
    document.getElementById("nivelTag").textContent = `— ${mapa[nivel]?.[lang] || mapa[nivel]?.pt}`;
  }

  aplicarNivelH1();
  document.addEventListener("femflow:langChange", aplicarNivelH1);

function aplicarIdioma() {
  const lang = FEMFLOW.lang || "pt";
  const L = FEMFLOW.langs[lang]?.flowcenter;
  if (!L) return;

  const nome = perfil.nome?.split(" ")[0] || "";

  // Título e subtítulo
  document.getElementById("tituloFlow").textContent = `${nome}, ${L.titulo}`;
  document.getElementById("subFlow").textContent = L.sub;

  // Fase central + texto "sua fase hormonal"
  const faseKey = ciclo.fase;
  const faseLabel = L[faseKey] || faseKey;

  const center = document.getElementById("centerPhase");
  if (center) center.textContent = faseLabel;

  const tCurrent = document.getElementById("t_current");
  if (tCurrent && L.faseAtual) {
    tCurrent.textContent = `${L.faseAtual}: ${faseLabel}`;
  }

  // 🔥 TRADUZIR LABELS DO CÍRCULO (FALTAVA AQUI!)
  const lblMen  = document.getElementById("lbl-menstrual");
  const lblFol  = document.getElementById("lbl-follicular");
  const lblOvu  = document.getElementById("lbl-ovulatory");
  const lblLut  = document.getElementById("lbl-luteal");

  if (lblMen) lblMen.textContent = L.menstrual;
  if (lblFol) lblFol.textContent = L.follicular;
  if (lblOvu) lblOvu.textContent = L.ovulatory;
  if (lblLut) lblLut.textContent = L.luteal;

  // Botões inferiores
  const btnBreath    = document.getElementById("toBreath");
  const btnTrain     = document.getElementById("toTrain");
  const btnEvolution = document.getElementById("toEvolution");
  const btnEndurance = document.getElementById("toEndurance");

  if (btnBreath && L.respiracao) btnBreath.textContent = `💨 ${L.respiracao}`;
  if (btnTrain && L.treino) btnTrain.textContent = `🏃 ${L.treino}`;
  if (btnEvolution && L.evolucao) btnEvolution.textContent = `📈 ${L.evolucao}`;
  if (btnEndurance && L.endurance) btnEndurance.textContent = `🏃‍♂️ ${L.endurance}`;
}

aplicarIdioma();
document.addEventListener("femflow:langChange", aplicarIdioma);


  /* ============================================================
     5) CÍRCULO HORMONAL
  ============================================================ */
   // Normaliza nomes vindos do backend para IDs do SVG
const faseMap = {
  "menstrual": "menstrual",
  "menstruacao": "menstrual",
  "follicular": "follicular",
  "folicular": "follicular",
  "ovulatoria": "ovulatory",
  "ovulacao": "ovulatory",
  "ovulatory": "ovulatory",
  "lutea": "luteal",
  "luteal": "luteal"
};

// aplica a normalização
ciclo.fase = faseMap[ciclo.fase?.toLowerCase()] || ciclo.fase;

  ["menstrual","follicular","ovulatory","luteal"].forEach(f => {
    document.getElementById("seg-"+f)?.classList.toggle("path-active", f===ciclo.fase);
    document.getElementById("lbl-"+f)?.classList.toggle("label-active", f===ciclo.fase);
  });

  /* ============================================================
     6) BOTÕES PRINCIPAIS
  ============================================================ */

  // Respiração
  document.getElementById("toBreath").onclick = () =>
    FEMFLOW.router("respiracao.html");

  // Evolução
  document.getElementById("toEvolution").onclick = () =>
    FEMFLOW.router("evolucao.html");

  // Treino
  document.getElementById("toTrain").onclick = () => {

    const enfase = localStorage.getItem("femflow_enfase") || perfil.enfase;

    if (!enfase) {
      FEMFLOW.toast("Escolha um treino na Home.");
      return FEMFLOW.router("home.html");
    }

    // PERSONAL
    if (isPersonal) {
      if (enfase.startsWith("followme_")) {
        FEMFLOW.toast("Seu plano não inclui FollowMe.");
        return;
      }
      return FEMFLOW.router("treino.html?personal=1");
    }

    // FOLLOWME
    if (isFollow) {
      if (!enfase.startsWith("followme_")) {
        FEMFLOW.toast("Seu plano dá acesso apenas ao FollowMe.");
        return;
      }
      return FEMFLOW.router(`followme/${enfase}.html`);
    }

    // ACESSO APP
    if (isApp) {
      if (enfase.startsWith("followme_")) {
        FEMFLOW.toast("FollowMe não faz parte do seu plano.");
        return;
      }
      return FEMFLOW.router("treino.html");
    }

    FEMFLOW.toast("Adquira um plano para acessar o treino.");
  };

  // Endurance
  document.getElementById("toEndurance").onclick = () => {
    const id = localStorage.getItem("femflow_id");
    if (id) FEMFLOW.router(`treinoendurance/${id}.html`);
    else location.href = "https://www.myflowlife.com.br/#ofertas";
  };

  document.getElementById("ff-loading")?.classList.add("hidden");
}
