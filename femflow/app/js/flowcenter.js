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

  if (!perfil) {
    FEMFLOW.toast("Falha ao carregar dados da aluna.");
    return FEMFLOW.router("home.html");
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

  /* ============================================================
     4) IDIOMA
  ============================================================ */
  function aplicarIdioma() {
    const lang = FEMFLOW.lang || "pt";
    const L = FEMFLOW.langs[lang]?.flowcenter;
    if (!L) return;

    const nome = perfil.nome?.split(" ")[0] || "";

    document.getElementById("tituloFlow").textContent = `${nome}, ${L.titulo}`;
    document.getElementById("subFlow").textContent = L.sub;

    document.getElementById("centerPhase").textContent = L[ciclo.fase];
    document.getElementById("t_current").textContent =
      `${L.faseAtual}: ${L[ciclo.fase]}`;
  }

  aplicarIdioma();
  document.addEventListener("femflow:langChange", aplicarIdioma);

  /* ============================================================
     5) CÍRCULO HORMONAL
  ============================================================ */
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
