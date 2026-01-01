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
  localStorage.setItem("femflow_dataInicioPrograma", perfil.dataInicioPrograma ? String(perfil.dataInicioPrograma) : "");

  localStorage.setItem(
    "femflow_enfase",
    String(perfil.enfase || "nenhuma").toLowerCase()
  );
}

/* ============================================================
   CATÁLOGO DINÂMICO (FIREBASE)
=========================================================== */
const MUSCULAR_ENFASES = new Set([
  "gluteo",
  "quadril",
  "posterior",
  "quadriceps",
  "costas",
  "peito",
  "braco",
  "core"
]);

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
  if (enfase.startsWith("personal")) return "personal";
  if (enfase.startsWith("casa")) return "casa";
  if (MUSCULAR_ENFASES.has(enfase)) return "muscular";
  return "esportes";
}

function podeAcessar(enfase, perfil) {
  if (!enfase) return false;

  const categoria = inferirCategoria(enfase);
  const produto = (perfil.produto || "").toLowerCase();
  const ativa = !!perfil.ativa;
  const personal = !!perfil.personal;

  if (personal) {
    return categoria !== "followme";
  }

  if (produto === "acesso_app" && ativa) {
    return ["muscular", "esportes", "casa"].includes(categoria);
  }

  if (produto.startsWith("followme_") && ativa) {
    return enfase === produto;
  }

  return false;
}

function formatarTitulo(enfase) {
  if (!enfase) return "Treino";
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

async function carregarCatalogoFirebase() {
  const nivelAluno = normalizarNivel(localStorage.getItem("femflow_nivel"));
  const perfil = {
    produto: localStorage.getItem("femflow_produto"),
    ativa: localStorage.getItem("femflow_ativa") === "true",
    personal: localStorage.getItem("femflow_personal") === "true"
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
    const isFollowme = categoria === "followme";
    const isPersonal = categoria === "personal";
    const isCasa = categoria === "casa";

    const nivelOk = nivel === nivelAluno;
    const incluir = isFollowme || isPersonal || (isCasa ? nivelOk : nivelOk);
    if (!incluir) return;

    const card = normalizarCardFirebase(enfase, doc.data());
    card.locked = !podeAcessar(enfase, perfil);
    catalogo[categoria].push(card);
  });

  return catalogo;
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

  return `
    <article class="card${lockedClass}" data-enfase="${p.enfase}" data-locked="${p.locked}">
      <div class="thumb thumb-${p.enfase}" style="background:${p.color}; --thumb-url:url('/femflow/css/cards/${p.enfase}.png');">
        ${lockOverlay}
        <span class="badge">${titulo}</span>
      </div>
      <div class="info">
        <h3 class="ttl">${titulo}</h3>
        <p class="desc">${desc || ""}</p>
      </div>
    </article>`;
}

function renderRail(el, lista) {
  el.innerHTML = lista.map(cardHTML).join("");
  el.querySelectorAll(".card").forEach(c =>
    c.onclick = () => handleCardClick(c.dataset.enfase, c.dataset.locked === "true")
  );
}

/* ============================================================
   LÓGICA DE ACESSO POR PRODUTO
=========================================================== */
function handleCardClick(enfase, locked) {
  if (locked) {
    FEMFLOW.toast("Plano necessário para acessar este treino.");
    return;
  }

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

  if (inferirCategoria(enfase) === "followme") {
    return selecionarCoach(enfase);
  }

  return selecionarEnfase(enfase);
}

/* ============================================================
   SALVAR ENFASE NORMAL
=========================================================== */
async function selecionarEnfase(enfase) {
  const id = localStorage.getItem("femflow_id");

  FEMFLOW.loading.show("Preparando novo programa…");

  // 🔥 1. salvar nova ênfase
  localStorage.setItem("femflow_enfase", enfase);

  // 🔥 2. reset explícito do programa (REGRA FEMFLOW)
  localStorage.setItem("femflow_diaPrograma", "1");

  if (id) {
    // 3. backend: salvar ênfase
    await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setenfase",
        id,
        enfase
      })
    });

    // 4. backend: resetar programa
    await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "resetprograma",
        id
      })
    });
  }

  // 5. seguir fluxo normal
  FEMFLOW.router("flowcenter");
}

/* FOLLOWME */
async function selecionarCoach(coach) {
  const id = localStorage.getItem("femflow_id");
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
    // usa o texto do lang + primeiro nome
    bv.textContent = `${L.bemvinda}, ${primeiroNome}!`;
  }

  // Títulos das seções
  const tPersonal = document.getElementById("tituloPersonalTopo");
  const tFollowMe = document.getElementById("tituloFollowMe");
  const tMuscular = document.getElementById("tituloMuscular");
  const tEsportes = document.getElementById("tituloEsportes");
  const tCasa = document.getElementById("tituloCasa");

  if (tPersonal) tPersonal.textContent = L.tituloPersonal;
  if (tFollowMe) tFollowMe.textContent = L.tituloFollowMe;
  if (tMuscular) tMuscular.textContent = L.tituloMuscular;
  if (tEsportes) tEsportes.textContent = L.tituloEsportes;
  if (tCasa) tCasa.textContent = L.tituloCasa;

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
