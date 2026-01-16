/* ============================================================
   FemFlow • HOME.JS — VERSÃO FINAL 2025 2(CORRIGIDA)
   Home usa VALIDAR — NUNCA usa SYNC
   ✅ separa ACESSO (has_personal) de MODO (mode_personal)
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
  localStorage.setItem("femflow_nivel", String(perfil.nivel || "iniciante").toLowerCase());
  localStorage.setItem("femflow_produto", String(perfil.produto || "").toLowerCase());
  localStorage.setItem("femflow_ativa", String(!!perfil.ativa));

  // ✅ acesso personal = direito (backend), separado do modo personal (front)
  const acessos = perfil.acessos || {};
  const hasPersonal = acessos.personal === true;
  localStorage.setItem("femflow_has_personal", String(hasPersonal));
  localStorage.removeItem("femflow_personal"); // legado: nunca usar mais

  localStorage.setItem(
    "femflow_free_access",
    perfil.free_access ? JSON.stringify(perfil.free_access) : ""
  );

  // ciclo + programa (CRÍTICO)
  localStorage.setItem("femflow_perfilHormonal", String(perfil.perfilHormonal || "regular").toLowerCase());
  localStorage.setItem("femflow_cycleLength", String(perfil.ciclo_duracao || 28));
  localStorage.setItem("femflow_fase", String(perfil.fase || "follicular").toLowerCase());
  localStorage.setItem("femflow_diaCiclo", String(perfil.diaCiclo || 1));
  localStorage.setItem("femflow_diaPrograma", String(perfil.diaPrograma || 1));
  localStorage.setItem("femflow_dataInicioPrograma", perfil.dataInicioPrograma ? String(perfil.dataInicioPrograma) : "");

  localStorage.setItem(
    "femflow_enfase",
    String(perfil.enfase || "nenhuma").toLowerCase()
  );

  // ✅ segurança: se não tiver personal, não deixa modo personal ficar travado
    if (!hasPersonal) {
    localStorage.setItem("femflow_mode_personal", "false");
  } else {
    // se ainda não existe, inicializa como false (não ativa sozinho)
    if (localStorage.getItem("femflow_mode_personal") == null) {
      localStorage.setItem("femflow_mode_personal", "false");
    }
  }
}

/* ============================================================
   CATÁLOGO DINÂMICO (FIREBASE)
=========================================================== */
const MUSCULAR_ENFASES = new Set([
  "gluteo",
  "gluteos",
  "quadril",
  "posterior",
  "quadriceps",
  "costas",
  "peito",
  "braco",
  "core",
  "forcaabc",
  "militar"
]);

const TITULOS_ESPECIAIS = {
  forcaabc: "Força",
  quadriceps: "Quadríceps",
  gluteos: "Glúteos",
  corrida_longa: "Corrida longa",
  casa_core_gluteo: "Glúteo e Core"
};

const CARDS_HOME_PRESETS = [
  "avancada_corrida_longa",
  "avancada_forcaabc",
  "avancada_gluteos",
  "avancada_casa_core_gluteo",
  "avancada_militar",
  "avancada_quadriceps",
  "iniciante_corrida_longa",
  "iniciante_casa_core_gluteo",
  "iniciante_costas",
  "iniciante_forcaabc",
  "iniciante_gluteos",
  "iniciante_militar",
  "iniciante_quadriceps",
  "intermediaria_corrida_longa",
  "intermediaria_casa_core_gluteo",
  "intermediaria_forcaabc",
  "intermediaria_gluteos",
  "intermediaria_militar",
  "intermediaria_quadriceps"
];

function extrairNivelEnfase(docId) {
  if (!docId) return null;
  const partes = String(docId).split("_");
  if (partes.length < 2) return null;
  const [nivelRaw, ...resto] = partes;
  const nivel = nivelRaw.toLowerCase().trim();
  const enfase = resto.join("_").toLowerCase().trim();
  if (!nivel || !enfase) return null;
  return { nivel, enfase };
}

function normalizarNivel(raw) {
  const n = (raw || "").toLowerCase().trim();
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
  return "iniciante";
}

function inferirCategoria(enfase) {
  if (!enfase) return "esportes";
  if (enfase.startsWith("followme_")) return "followme";
 if (enfase === "personal") return "personal";
  if (enfase.startsWith("casa")) return "casa";
  if (MUSCULAR_ENFASES.has(enfase)) return "muscular";
  return "esportes";
}

function podeAcessar(enfase, perfil) {
  if (!enfase) return false;

  const categoria = inferirCategoria(enfase);
  const produto = (perfil.produto || "").toLowerCase();
  const ativa = !!perfil.ativa;
 const personal = localStorage.getItem("femflow_has_personal") === "true";


  if (!ativa) return false;

  // 🔥 PERSONAL (direito) = acesso_app + personal
  if (personal) {
    if (categoria === "followme") return false;
    return true; // muscular, esportes, casa e personal
  }

  // 🔹 ACESSO APP
  if (produto === "acesso_app") {
    return ["muscular", "esportes", "casa"].includes(categoria);
  }

  // 🔹 FOLLOWME
  if (produto.startsWith("followme_")) {
    return enfase === produto;
  }

  return false;
}

function formatarTitulo(enfase) {
  if (!enfase) return "Treino";
  if (TITULOS_ESPECIAIS[enfase]) return TITULOS_ESPECIAIS[enfase];
  const limpo = enfase
    .replace(/^followme_/, "")
    .replace(/^personal_?/, "personal ")
    .replace(/_/g, " ")
    .trim();

  return limpo
    .split(" ")
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function normalizarCardFirebase(enfase, data) {
  const titulo = data?.titulo || data?.title || formatarTitulo(enfase);
  const desc = data?.desc || data?.descricao || "";
  const color = data?.color || data?.cor || "#d1a697";

  return {
    titulo,
    desc,
    enfase,
    color
  };
}

function avaliarAcessoCard(enfase, perfil) {
  const podeAcessarProduto = podeAcessar(enfase, perfil);

  const freeAccessEnfases = (perfil.free_access?.enfases || []).map(item =>
    String(item || "").toLowerCase()
  );

  const podeAcessarFree =
    perfil.free_access?.enabled === true &&
    freeAccessEnfases.includes(enfase);

  return {
    locked: !(podeAcessarProduto || podeAcessarFree),
    isFree: !podeAcessarProduto && podeAcessarFree
  };
}

function injetarCardsPresets(catalogo, perfil, nivelAluno) {
  CARDS_HOME_PRESETS.forEach(docId => {
    const parsed = extrairNivelEnfase(docId);
    if (!parsed) return;

    const { nivel, enfase } = parsed;
    if (nivel !== nivelAluno) return;

    const categoria = inferirCategoria(enfase);
    if (!catalogo[categoria]) return;

    const jaExiste = catalogo[categoria].some(card => card.enfase === enfase);
    if (jaExiste) return;

    const card = normalizarCardFirebase(enfase, { titulo: formatarTitulo(enfase) });
    const acesso = avaliarAcessoCard(enfase, perfil);
    card.locked = acesso.locked;
    if (acesso.isFree) card.isFree = true;
    catalogo[categoria].push(card);
  });
}

async function carregarCatalogoFirebase() {
  const nivelAluno = normalizarNivel(localStorage.getItem("femflow_nivel"));

  let freeAccess = null;
  const freeAccessRaw = localStorage.getItem("femflow_free_access");
  if (freeAccessRaw) {
    try { freeAccess = JSON.parse(freeAccessRaw); }
    catch (err) { freeAccess = null; }
  }

  const perfil = {
    produto: localStorage.getItem("femflow_produto"),
    ativa: localStorage.getItem("femflow_ativa") === "true",
    personal: localStorage.getItem("femflow_has_personal") === "true",
    free_access: freeAccess
  };

  const catalogo = {
    followme: [],
    personal: [],
    muscular: [],
    esportes: [],
    casa: []
  };

  const snap = await firebase.firestore().collection("exercicios").get();
  snap.forEach(doc => {
    const parsed = extrairNivelEnfase(doc.id);
    if (!parsed) return;

    const { nivel, enfase } = parsed;
    const categoria = inferirCategoria(enfase);

    const nivelOk = nivel === nivelAluno;

    // followme e personal entram independente do nível do docId
    const incluir =
      categoria === "followme" ||
      categoria === "personal" ||
      nivelOk;

    if (!incluir) return;

    const card = normalizarCardFirebase(enfase, doc.data());

    const acesso = avaliarAcessoCard(enfase, perfil);
    card.locked = acesso.locked;
    if (acesso.isFree) card.isFree = true;

    catalogo[categoria].push(card);
  });

  injetarCardsPresets(catalogo, perfil, nivelAluno);

  return catalogo;
}

/* ============================================================
   🧩 CARDS SIMBÓLICOS (VITRINE COMERCIAL)
=========================================================== */

const CARDS_PERSONAL_SIMBOLICOS = [
  {
    enfase: "personal",
    titulo: "Treino Personalizado",
    desc: "Treino feito exclusivamente para você",
    color: "#335953",
    locked: true,
    simbolico: true
  }
];

const CARDS_FOLLOWME_SIMBOLICOS = [
  {
    enfase: "followme_livia_rapaci",
    titulo: "Treine com Lívia Rapaci",
    desc: "Programa completo de 30 dias com a coach",
    color: "#f3c1c1",
    locked: true,
    simbolico: true
  },
  {
    enfase: "followme_karoline",
    titulo: "Treine com Karoline Bombeira",
    desc: "Rotina intensa e funcional",
    color: "#ff9f7f",
    locked: true,
    simbolico: true
  },
  {
    enfase: "followme_thalita",
    titulo: "Treine com Thalita Prates",
    desc: "Força e constância no feminino",
    color: "#cbb1e6",
    locked: true,
    simbolico: true
  }
];

const CARD_THUMBS = {
  gluteo: "gluteos.jpg",
  gluteos: "gluteos.jpg",
  quadriceps: "quadriceps.jpg",
  costas: "costas.jpg",
  ombro: "ombro.jpg",
  peito: "peitoral.jpg",
  peitoral: "peitoral.jpg",
  militar: "militar.jpg"
};

function getThumbUrl(enfase) {
  const file = CARD_THUMBS[enfase];
  if (!file) return "";
  return new URL(`/femflow/app/css/cards/${file}`, window.location.origin).toString();
}

/* ============================================================
   RENDERIZAÇÃO DOS CARDS
=========================================================== */
function cardHTML(p) {
  const lang = FEMFLOW.lang || "pt";
  const titulo = typeof p.titulo === "object" ? p.titulo[lang] : p.titulo;
  const desc = typeof p.desc === "object" ? p.desc[lang] : p.desc;
  const lockedClass = p.locked ? " locked" : "";
  const lockOverlay = p.locked ? '<span class="lock-overlay">🔒</span>' : "";
  const freeBadge = p.isFree ? '<span class="badge-free">Gratuito</span>' : "";
  const thumbUrl = getThumbUrl(p.enfase);
  const thumbClass = `thumb thumb-${p.enfase}${thumbUrl ? " has-image" : ""}`;
  const thumbStyle = `${thumbUrl ? `--thumb-url:url('${thumbUrl}');` : ""}background-color:${p.color};`;

  return `
    <article class="card${lockedClass}" data-enfase="${p.enfase}" data-locked="${p.locked}">
      <div class="${thumbClass}" style="${thumbStyle}">
        ${lockOverlay}
        ${freeBadge}
        <span class="badge">${titulo}</span>
      </div>
      <div class="info">
        <h3 class="ttl">${titulo}</h3>
        <p class="desc">${desc || ""}</p>
      </div>
    </article>`;
}

function renderRail(el, lista) {
  if (!el) return;
  el.innerHTML = lista.map(cardHTML).join("");
  el.querySelectorAll(".card").forEach(c =>
    c.onclick = () => handleCardClick(c.dataset.enfase, c.dataset.locked === "true")
  );
}

/* ============================================================
   LÓGICA DE ACESSO POR PRODUTO
=========================================================== */
function handleCardClick(enfase, locked) {

  /* =========================================
     🔒 CARD BLOQUEADO (VITRINE COMERCIAL)
  ========================================= */
  if (locked) {

    // 🧠 PERSONAL — CTA dedicado (propaganda)
    if (enfase === "personal" || enfase.startsWith("personal_")) {
      FEMFLOW.toast("🔒 Treino Personal é um plano exclusivo.");
      window.open(LINK_PERSONAL, "_blank");
      return;
    }

    // ✨ FOLLOWME — programa especial
    if (enfase.startsWith("followme_")) {
      FEMFLOW.toast("✨ Programa especial de 30 dias com coach.");
      return;
    }

    // 🔹 BLOQUEIO PADRÃO
    FEMFLOW.toast("Plano necessário para acessar este treino.");
    return;
  }

  /* =========================================
     🧭 PERSONAL DESBLOQUEADO = ativa modo e vai pro FLOWCENTER
     (NUNCA vai direto para treino)
  ========================================= */
  if (enfase === "personal") {
    FEMFLOW.toast("🌟 Modo Personal ativado!");
    localStorage.setItem("femflow_mode_personal", "true");
    return FEMFLOW.router("flowcenter.html");
  }

  // qualquer card normal desativa o modo personal
  localStorage.setItem("femflow_mode_personal", "false");

  /* =========================================
     🌸 CICLO NÃO CONFIGURADO
  ========================================= */
  if (localStorage.getItem("femflow_cycle_configured") !== "yes") {

    FEMFLOW.loading.show("Configurando seu ciclo…");

    localStorage.setItem("femflow_enfase", enfase);

    FEMFLOW.dispatch("stateChanged", {
      type: "ciclo",
      impact: "fisiologico",
      source: "home"
    });

    return;
  }

  /* =========================================
     ✅ GARANTIA DE ESTADO MÍNIMO
  ========================================= */
  const diaProgramaRaw = localStorage.getItem("femflow_diaPrograma");
  const diaPrograma = Number(diaProgramaRaw);
  if (!diaProgramaRaw || Number.isNaN(diaPrograma) || diaPrograma < 1) {
    localStorage.setItem("femflow_diaPrograma", "1");
  }

  /* =========================================
     ✨ FOLLOWME ATIVO
  ========================================= */
  if (inferirCategoria(enfase) === "followme") {
    return selecionarCoach(enfase);
  }

  /* =========================================
     🔥 TREINO NORMAL
  ========================================= */
  return selecionarEnfase(enfase);
}

/* ============================================================
   SALVAR ENFASE NORMAL
=========================================================== */
async function selecionarEnfase(enfase) {
  const id = localStorage.getItem("femflow_id");

  if (!enfase || enfase === "nenhuma" || enfase === "personal") {
    console.warn("Ênfase inválida bloqueada:", enfase);
    return;
  }

  FEMFLOW.loading.show("Preparando novo programa…");

  // 1) salvar nova ênfase
  localStorage.setItem("femflow_enfase", enfase);

  // 2) reset explícito do programa (REGRA FEMFLOW)
  localStorage.setItem("femflow_diaPrograma", "1");

  if (id) {
    // 3) backend: salvar ênfase
    await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setenfase",
        id,
        enfase
      })
    });

    // 4) backend: resetar programa
    await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resetprograma",
        id
      })
    });
  }

  // 5) seguir fluxo normal
  FEMFLOW.router("flowcenter");
}

/* ============================================================
   FOLLOWME
=========================================================== */
async function selecionarCoach(coach) {
  const id = localStorage.getItem("femflow_id");

  localStorage.setItem("femflow_mode_personal", "false");
  localStorage.setItem("femflow_enfase", coach);

  if (id) {
    await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setenfase", id, enfase: coach })
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
    bv.textContent = `${L.bemvinda}, ${primeiroNome}!`;
  }

  // Títulos das seções
  const tPersonal = document.getElementById("tituloPersonalTopo");
  const tFollowMe = document.getElementById("tituloFollowMe");
  const tMuscular = document.getElementById("tituloMuscular");
  const tEsportes = document.getElementById("tituloEsportes");
  const tCasa = document.getElementById("tituloCasa");
  const btnFlow = document.getElementById("btnFlow");

  if (tPersonal) tPersonal.textContent = L.tituloPersonal;
  if (tFollowMe) tFollowMe.textContent = L.tituloFollowMe;
  if (tMuscular) tMuscular.textContent = L.tituloMuscular;
  if (tEsportes) tEsportes.textContent = L.tituloEsportes;
  if (tCasa) tCasa.textContent = L.tituloCasa;
  if (btnFlow && L.botaoFlowcenter) btnFlow.textContent = L.botaoFlowcenter;

  // 🔥 VÍDEO
  const vTitle = document.getElementById("homeVideoTitle");
  const vSub = document.getElementById("homeVideoSub");
  const vFrame = document.getElementById("homeVideoFrame");

  if (vTitle && L.videoTitulo) vTitle.textContent = L.videoTitulo;
  if (vSub && L.videoSub) vSub.textContent = L.videoSub;
  if (vFrame && L.videoUrl) vFrame.src = L.videoUrl;
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

    const catalogo = await carregarCatalogoFirebase();

    /* ============================================================
       🧩 INJETAR VITRINE COMERCIAL (LOCAL CORRETO)
    ============================================================ */
    const perfilTemPersonal =
      localStorage.getItem("femflow_has_personal") === "true";

    const produto =
      String(localStorage.getItem("femflow_produto") || "").toLowerCase();

    // PERSONAL — sempre aparece:
    // - se tem personal → desbloqueado (ativa modo personal)
    // - se não tem → locked e vira propaganda CTA
    if (catalogo.personal.length === 0) {
      const cards = CARDS_PERSONAL_SIMBOLICOS.map(c => ({
        ...c,
        locked: !perfilTemPersonal
      }));
      catalogo.personal.push(...cards);
    }

    // FOLLOWME — sempre aparece como vitrine
    if (catalogo.followme.length === 0) {
      const cards = CARDS_FOLLOWME_SIMBOLICOS.map(c => ({
        ...c,
        locked: produto !== c.enfase
      }));
      catalogo.followme.push(...cards);
    }

    renderRail(document.getElementById("railFollowMe"), catalogo.followme);
    renderRail(document.getElementById("railMuscular"), catalogo.muscular);
    renderRail(document.getElementById("railEsportes"), catalogo.esportes);
    renderRail(document.getElementById("railCasa"), catalogo.casa);
    renderRail(document.getElementById("railPersonal"), catalogo.personal);

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
