/* ============================================================
   FLOWCENTER.JS — FemFlow 2025 • VERSÃO FINAL AJUSTADA
   Correção: Perfil completo vem de carregarPerfil(), não do SYNC
============================================================ */
/* ============================================================
   🔄 SYNC PERFIL VIA VALIDAR (fonte da verdade)
============================================================ */
async function flowcenterSyncPerfil() {
  const id = localStorage.getItem("femflow_id") || "";
  const email = localStorage.getItem("femflow_email") || "";
  if (!id && !email) return { status: "no_auth" };

  const qs = new URLSearchParams({ action: "validar" });
  if (id) qs.set("id", id);
  else qs.set("email", email);

  const url = `${FEMFLOW.SCRIPT_URL}?${qs.toString()}`;
  return await fetch(url).then(r => r.json()).catch(() => ({ status: "error" }));
}

function flowcenterPersistPerfil(perfil) {
  localStorage.setItem("femflow_fase", String(perfil.fase || "follicular").toLowerCase());
  localStorage.setItem("femflow_diaCiclo", String(perfil.diaCiclo || 1));
  localStorage.setItem("femflow_diaPrograma", String(perfil.diaPrograma || 1));
  localStorage.setItem("femflow_enfase", String(perfil.enfase || "nenhuma").toLowerCase());
}

document.addEventListener("DOMContentLoaded", initFlowCenter);

async function initFlowCenter() {

   
 FEMFLOW.loading.show("Preparando seu painel…");


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
  FEMFLOW.dispatch("stateChanged", {
  type: "auth",
  impact: "estrutural"
});
return;
   }
/* ============================================================
   🔥 GARANTIR LOCALSTORAGE ATUALIZADO (diaPrograma, fase, diaCiclo)
============================================================ */
const perfilFresh = await flowcenterSyncPerfil();

if (!perfilFresh || perfilFresh.status === "no_auth") {
  FEMFLOW.toast("Faça login novamente 🌸");
  FEMFLOW.clearSession();
  FEMFLOW.dispatch("stateChanged", {
  type: "ciclo",
  impact: "estrutural"
});
return;
}
if (perfilFresh.status === "blocked" || perfilFresh.status === "denied") {
  FEMFLOW.toast("Sessão inválida.");
  FEMFLOW.clearSession();
  FEMFLOW.dispatch("stateChanged", {
  type: "auth",
  impact: "estrutural"
});
return;
}

if (perfilFresh.status !== "ok") {
  FEMFLOW.toast("Erro ao atualizar dados. Tente novamente.");
  FEMFLOW.dispatch("stateChanged", {
  type: "ciclo",
  impact: "estrutural"
});
return;
}

// ✅ Atualiza engrenagens principais
flowcenterPersistPerfil(perfilFresh);

// ✅ mantém a variável "perfil" coerente para o resto do arquivo
perfil = { ...perfil, ...perfilFresh };

 const cycleChanged = localStorage.getItem("femflow_cycle_changed") === "true";
const veioDaHome = !!localStorage.getItem("femflow_enfase");

if (cycleChanged && !veioDaHome) {
  localStorage.removeItem("femflow_enfase");
  localStorage.removeItem("femflow_diaPrograma");
  localStorage.removeItem("femflow_cycle_changed");

  FEMFLOW.toast("Ciclo atualizado. Escolha um novo treino 🌸");
  FEMFLOW.dispatch("stateChanged", {
    type: "ciclo",
    impact: "estrutural"
  });
  return;
}

// se veio da Home, apenas consome a flag
if (cycleChanged && veioDaHome) {
  localStorage.removeItem("femflow_cycle_changed");
}

  const produtoRaw = (perfil.produto || "").toLowerCase();
  const nivelRaw   = perfil.nivel?.toLowerCase() || "iniciante";

  const isPersonal = produtoRaw === "treino_personal";
  const isFollow   = produtoRaw === "followme";
  const isApp      = produtoRaw === "acesso_app";

  /* ============================================================
   2) CICLO (vem do VALIDAR + localStorage)
============================================================ */
let ciclo = {
  fase: perfil.fase?.toLowerCase() || "follicular",
  diaCiclo: Number(perfil.diaCiclo || 1),
  diaPrograma: Number(perfil.diaPrograma || 1)
};


   
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

  const enfase = localStorage.getItem("femflow_enfase");

  // ❌ Não escolheu treino → Home resolve
  if (!enfase) {
    FEMFLOW.toast("Escolha um treino na Home 🌸");
    FEMFLOW.dispatch("stateChanged", {
      type: "programa",
      impact: "none"
    });
    return;
  }

     // PERSONAL
  if (isPersonal) {
    if (enfase.startsWith("followme_")) {
      FEMFLOW.toast("FollowMe não faz parte do seu plano.");
      return FEMFLOW.router("home.html"); // 🔥 venda
    }
    return FEMFLOW.router("treino.html?personal=1");
  }

  // FOLLOWME
  if (isFollow) {
    if (!enfase.startsWith("followme_")) {
      FEMFLOW.toast("Seu plano dá acesso apenas ao FollowMe.");
      return FEMFLOW.router("home.html"); // 🔥 venda
    }
    return FEMFLOW.router(`followme/${enfase}.html`);
  }

  // ACESSO APP
  if (isApp) {
    if (enfase.startsWith("followme_")) {
      FEMFLOW.toast("✨ Em breve! Treine junto.");
      return FEMFLOW.router("home.html"); // 🔥 venda
    }
    return FEMFLOW.router("treino.html");
  }

  // fallback comercial
  FEMFLOW.toast("Escolha um plano para continuar 🌱");
  FEMFLOW.router("home.html");
};

     // Endurance
  document.getElementById("toEndurance").onclick = () => {
    const id = localStorage.getItem("femflow_id");
    if (id) FEMFLOW.router(`treinoendurance/${id}.html`);
    else location.href = "https://www.myflowlife.com.br/#ofertas";
  };
   
FEMFLOW.loading.hide();
}
