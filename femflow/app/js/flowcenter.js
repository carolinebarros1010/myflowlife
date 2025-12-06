/* ============================================================
   FLOWCENTER.JS — FemFlow 2025
   Atualizado para FollowMe + Produtos + Backend Sync
============================================================ */

document.addEventListener("DOMContentLoaded", initFlowCenter);

async function initFlowCenter() {

  FEMFLOW.inserirHeaderApp?.();
  FEMFLOW.inserirMenuLateral?.();
  FEMFLOW.inserirModalIdioma?.();

  /* ============================================================
     1) BUSCAR PERFIL DO BACKEND
  ============================================================ */
  let perfil = await FEMFLOW.carregarCicloBackend();

  if (!perfil || !perfil.produto) {
    FEMFLOW.toast("Configure seu ciclo novamente.");
    return FEMFLOW.router("home.html");
  }

  const produtoRaw = perfil.produto.toLowerCase();
  const nivelRaw   = perfil.nivel?.toLowerCase() || "iniciante";

  localStorage.setItem("femflow_produto", produtoRaw);
  localStorage.setItem("femflow_nivel", perfil.nivel);
  localStorage.setItem("femflow_nome", perfil.nome || "");
  localStorage.setItem("femflow_fase", perfil.fase || "");
  localStorage.setItem("femflow_diaCiclo", perfil.diaCiclo || "1");

  const isPersonal = produtoRaw === "treino_personal";
  const isFollow   = produtoRaw === "followme";
  const isApp      = produtoRaw === "acesso_app";

  /* ============================================================
     2) APLICAR NÍVEL NO TOPO
  ============================================================ */
  function aplicarNivelH1() {
    const nivel = (localStorage.getItem("femflow_nivel") || "iniciante")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    const mapa = {
      iniciante:      { pt:"Iniciante", en:"Beginner", fr:"Débutante" },
      intermediaria:  { pt:"Intermediária", en:"Intermediate", fr:"Intermédiaire" },
      avancada:       { pt:"Avançada", en:"Advanced", fr:"Avancée" }
    };

    const lang = FEMFLOW.lang || "pt";
    const txt = mapa[nivel]?.[lang] || mapa[nivel]?.pt;

    document.getElementById("nivelTag").textContent = `— ${txt}`;
  }

  aplicarNivelH1();
  document.addEventListener("femflow:langChange", aplicarNivelH1);

  /* ============================================================
     3) APLICAR IDIOMA
  ============================================================ */
  function aplicarIdioma() {
    const lang = FEMFLOW.lang || "pt";
    const L = FEMFLOW.langs[lang]?.flowcenter;
    if (!L) return;

    const nome = perfil.nome?.split(" ")[0] || "";

    document.getElementById("tituloFlow").textContent = `${nome}, ${L.titulo}`;
    document.getElementById("subFlow").textContent = L.sub;

    const MAP = {
      menstrual:"lbl-menstrual",
      follicular:"lbl-follicular",
      ovulatory:"lbl-ovulatory",
      luteal:"lbl-luteal"
    };

    for (let f in MAP){
      const el = document.getElementById(MAP[f]);
      if (el) el.textContent = L[f];
    }

    document.getElementById("centerPhase").textContent = L[perfil.fase];
    document.getElementById("t_current").textContent = `${L.faseAtual}: ${L[perfil.fase]}`;

    document.getElementById("toBreath").textContent = `💨 ${L.menu.respiracao}`;
    document.getElementById("toTrain").textContent = `🏃 ${L.treino.tituloTopo}`;
    document.getElementById("toEvolution").textContent = `📈 ${L.evolucao.titulo}`;
  }

  aplicarIdioma();
  document.addEventListener("femflow:langChange", aplicarIdioma);

  /* ============================================================
     4) CÍRCULO HORMONAL
  ============================================================ */
  ["menstrual","follicular","ovulatory","luteal"].forEach(f => {
    document.getElementById("seg-"+f)?.classList.toggle("path-active", f===perfil.fase);
    document.getElementById("lbl-"+f)?.classList.toggle("label-active", f===perfil.fase);
  });

  /* ============================================================
     5) NAVEGAÇÃO DO FLOWCENTER
  ============================================================ */
  document.getElementById("toBreath").onclick = () => FEMFLOW.router("respiracao.html");
  document.getElementById("toEvolution").onclick = () => FEMFLOW.router("evolucao.html");

  document.getElementById("toTrain").onclick = () => {
    const enfase = localStorage.getItem("femflow_enfase") || perfil.enfase;

    if (!enfase) {
      FEMFLOW.toast("Escolha um treino na Home.");
      return FEMFLOW.router("home.html");
    }

    /* PERSONAL */
    if (isPersonal) {
      if (enfase.startsWith("followme_")){
        FEMFLOW.toast("Seu plano não inclui FollowMe.");
        return;
      }
      return FEMFLOW.router("treino.html?personal=1");
    }

    /* FOLLOWME */
    if (isFollow){
      if (enfase.startsWith("followme_")){
        return FEMFLOW.router(`followme/${enfase}.html`);
      }
      FEMFLOW.toast("Seu plano permite apenas Treino Junto (FollowMe).");
      return;
    }

    /* ACESSO_APP */
    if (isApp){
      if (enfase.startsWith("followme_")){
        FEMFLOW.toast("FollowMe não faz parte do seu plano.");
        return;
      }
      return FEMFLOW.router("treino.html");
    }

    /* SEM PRODUTO */
    FEMFLOW.toast("Adquira um plano para acessar o treino.");
    return FEMFLOW.router("home.html");
  };

  /* ENDURANCE */
  document.getElementById("toEndurance").onclick = () => {
    const id = localStorage.getItem("femflow_id");

    if (id){
      FEMFLOW.router(`treinoendurance/${id}.html`);
    } else {
      window.location.href = "https://www.myflowlife.com.br/#ofertas";
    }
  };

  /* FIM */
  document.getElementById("ff-loading")?.classList.add("hidden");
}
