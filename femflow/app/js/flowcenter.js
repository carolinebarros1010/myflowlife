/* ============================================================
   FLOWCENTER.JS — FemFlow 2025 • VERSÃO FINAL CANÔNICA
   ✔ Perfil vem de VALIDAR
   ✔ Suporte total a idioma
   ✔ Círculo hormonal completo
   ✔ Separação ACESSO x MODO PERSONAL
=========================================================== */

/* ============================================================
   🔄 PERFIL — VALIDAR (fonte da verdade)
=========================================================== */
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

  /* ============================================================
     🧭 ÊNFASE — SÓ sobrescreve se vier VÁLIDA do backend
     (protege seleção feita na Home)
  ============================================================ */
  const enfaseBackend = String(perfil.enfase || "").toLowerCase();

  if (enfaseBackend && enfaseBackend !== "nenhuma") {
    localStorage.setItem("femflow_enfase", enfaseBackend);
  }
  // ❗ caso contrário, mantém a enfase atual do front

  /* ============================================================
     🔒 DIREITO PERSONAL (backend)
  ============================================================ */
  localStorage.setItem(
    "femflow_has_personal",
    perfil.personal ? "true" : "false"
  );
}


/* ============================================================
   🚀 INIT
=========================================================== */
document.addEventListener("DOMContentLoaded", initFlowCenter);

async function initFlowCenter() {

  FEMFLOW.loading.show("Preparando seu painel…");

  FEMFLOW.inserirHeaderApp?.();
  FEMFLOW.inserirMenuLateral?.();
  FEMFLOW.inserirModalIdioma?.();

  /* ============================================================
     1) PERFIL BASE (auth)
  ============================================================ */
  let perfil = await FEMFLOW.carregarPerfil();
  if (!perfil || perfil.status === "blocked") {
    FEMFLOW.toast("Sessão inválida.");
    FEMFLOW.clearSession();
    FEMFLOW.dispatch("stateChanged", { type: "auth", impact: "estrutural" });
    return;
  }

  /* ============================================================
     2) PERFIL FRESCO (VALIDAR)
  ============================================================ */
  const perfilFresh = await flowcenterSyncPerfil();
  if (!perfilFresh || perfilFresh.status !== "ok") {
    FEMFLOW.toast("Erro ao atualizar dados.");
    FEMFLOW.clearSession();
    FEMFLOW.dispatch("stateChanged", { type: "auth", impact: "estrutural" });
    return;
  }

  flowcenterPersistPerfil(perfilFresh);
  perfil = { ...perfil, ...perfilFresh };

  /* ============================================================
     3) CICLO
  ============================================================ */
  if (perfil.fase && perfil.diaCiclo) {
    localStorage.setItem("femflow_cycle_configured", "yes");
  }

  if (!localStorage.getItem("femflow_cycle_configured")) {
    FEMFLOW.toast("Configure seu ciclo antes 🌸");
    FEMFLOW.dispatch("stateChanged", { type: "ciclo", impact: "estrutural" });
    return;
  }

  /* ============================================================
     4) PRODUTO / ACESSOS (CORRETO)
  ============================================================ */
  const produtoRaw   = String(perfil.produto || "").toLowerCase();
  const hasPersonal  = localStorage.getItem("femflow_has_personal") === "true";
  const modePersonal = localStorage.getItem("femflow_mode_personal") === "true";

  // 🔥 regra canônica
  const personal = hasPersonal && modePersonal;

  const isApp    = produtoRaw === "acesso_app";
  const isFollow = produtoRaw.startsWith("followme_");

  const freeEnabled = perfil.free_access?.enabled === true;
  const freeUntil   = perfil.free_access?.until ? new Date(perfil.free_access.until) : null;
  const freeValido  = freeEnabled && freeUntil && freeUntil >= new Date();
  const freeEnfases = (perfil.free_access?.enfases || []).map(e => e.toLowerCase());

  /* ============================================================
     5) CICLO (UI)
  ============================================================ */
  const ciclo = {
    fase: perfil.fase?.toLowerCase() || "follicular",
    diaCiclo: Number(perfil.diaCiclo || 1),
    diaPrograma: Number(perfil.diaPrograma || 1)
  };

  /* ============================================================
     6) NÍVEL
  ============================================================ */
  function aplicarNivel() {
    const nivel = (perfil.nivel || "iniciante").toLowerCase();
    const map = {
      iniciante:{pt:"Iniciante",en:"Beginner",fr:"Débutante"},
      intermediaria:{pt:"Intermediária",en:"Intermediate",fr:"Intermédiaire"},
      avancada:{pt:"Avançada",en:"Advanced",fr:"Avancée"}
    };
    const lang = FEMFLOW.lang || "pt";
    document.getElementById("nivelTag").textContent =
      `— ${map[nivel]?.[lang] || map[nivel].pt}`;
  }
  aplicarNivel();
  document.addEventListener("femflow:langChange", aplicarNivel);

  /* ============================================================
     7) IDIOMA
  ============================================================ */
  function aplicarIdioma() {
    const lang = FEMFLOW.lang || "pt";
    const L = FEMFLOW.langs?.[lang]?.flowcenter;
    if (!L) return;

    const nome = perfil.nome?.split(" ")[0] || "";
    document.getElementById("tituloFlow").textContent = `${nome}, ${L.titulo}`;
    document.getElementById("subFlow").textContent = L.sub;

    const faseLabel = L[ciclo.fase] || ciclo.fase;
    document.getElementById("centerPhase").textContent = faseLabel;
    document.getElementById("t_current").textContent =
      `${L.faseAtual}: ${faseLabel}`;

    ["menstrual","follicular","ovulatory","luteal"].forEach(f => {
      document.getElementById("lbl-"+f).textContent = L[f];
    });

    document.getElementById("toBreath").textContent    = `💨 ${L.respiracao}`;
    document.getElementById("toTrain").textContent     = `🏃 ${L.treino}`;
    document.getElementById("toEvolution").textContent = `📈 ${L.evolucao}`;
    document.getElementById("toEndurance").textContent = `🏃‍♂️ ${L.endurance}`;
  }
  aplicarIdioma();
  document.addEventListener("femflow:langChange", aplicarIdioma);

  /* ============================================================
     8) CÍRCULO HORMONAL
  ============================================================ */
  ["menstrual","follicular","ovulatory","luteal"].forEach(f => {
    document.getElementById("seg-"+f)
      ?.classList.toggle("path-active", f === ciclo.fase);
    document.getElementById("lbl-"+f)
      ?.classList.toggle("label-active", f === ciclo.fase);
  });

  /* ============================================================
     9) BOTÕES
  ============================================================ */
  document.getElementById("toBreath").onclick =
    () => FEMFLOW.router("respiracao.html");

  document.getElementById("toEvolution").onclick =
    () => FEMFLOW.router("evolucao.html");

  document.getElementById("toTrain").onclick = () => {
    const enfase = localStorage.getItem("femflow_enfase");

    if (!enfase) {
      FEMFLOW.toast("Escolha um treino na Home 🌸");
      return FEMFLOW.router("home.html");
    }

    const freeOk = freeValido && freeEnfases.includes(enfase);

    /* 🧭 PRIORIDADE ABSOLUTA — MODO PERSONAL */
    if (personal) {
      if (enfase.startsWith("followme_") && !freeOk) {
        FEMFLOW.toast("FollowMe não incluso no seu plano.");
        return FEMFLOW.router("home.html");
      }
      return FEMFLOW.router("treino.html");
    }

    /* ✨ FOLLOWME */
    if (isFollow) {
      if (produtoRaw !== enfase && !freeOk) {
        FEMFLOW.toast("Seu plano libera apenas este FollowMe.");
        return FEMFLOW.router("home.html");
      }
      return FEMFLOW.router(`followme/${enfase}.html`);
    }

    /* 🔥 ACESSO APP */
    if (isApp) {
      if (enfase.startsWith("followme_") && !freeOk) {
        FEMFLOW.toast("Programa especial com coach.");
        return FEMFLOW.router("home.html");
      }
      return FEMFLOW.router("treino.html");
    }

    FEMFLOW.toast("Escolha um plano 🌱");
    FEMFLOW.router("home.html");
  };

  document.getElementById("toEndurance").onclick = () => {
    const id = localStorage.getItem("femflow_id");
    if (id) FEMFLOW.router(`treinoendurance/${id}.html`);
    else location.href = "https://www.myflowlife.com.br/#ofertas";
  };

  FEMFLOW.loading.hide();
}
