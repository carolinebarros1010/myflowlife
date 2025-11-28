/* =======================================================================
   🌸 FEMFLOW CORE v4.1 — 2025
   ARQUIVO ÚNICO OFICIAL
   Contém:
   - Login
   - Ciclo
   - Engine Hormonal Final
   - Treino Diário (Firebase + Backend)
   - Snapshot Offline
   - Inspector + Debug
   - Header + Menu
======================================================================= */

window.FEMFLOW = {};

/* ===========================================================
   1. CONFIGURAÇÃO GLOBAL
=========================================================== */

FEMFLOW.SCRIPT_URL = "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

FEMFLOW.dev = () => localStorage.getItem("femflow_dev") === "on";

/* ------------------------- LOG SYSTEM ------------------------- */
FEMFLOW.log = (...a) => { if (FEMFLOW.dev()) console.log("%c[FEMFLOW]", "color:#cc6a5a", ...a); };
FEMFLOW.warn = (...a) => { if (FEMFLOW.dev()) console.warn("%c[FEMFLOW ⚠]", "color:#e07f67", ...a); };
FEMFLOW.error = (...a) => { if (FEMFLOW.dev()) console.error("%c[FEMFLOW ❌]", "color:#b74333", ...a); };

/* ------------------------- TOAST ------------------------- */
FEMFLOW.toast = function (msg, error = false, offline = false) {
  let box = document.querySelector(".toast-box");

  if (!box) {
    box = document.createElement("div");
    box.className = "toast-box";
    document.body.appendChild(box);
  }

  box.textContent = msg;
  box.style.background = error ? "#cc6a5a" : "#335953";
  box.classList.add("visible");

  if (!offline) {
    setTimeout(() => box.classList.remove("visible"), 2400);
  }
};

/* ===========================================================
   2. ROUTER + HEADER + MENU
=========================================================== */

FEMFLOW.router = pag => {
  const destino = pag.endsWith(".html") ? pag : pag + ".html";
  FEMFLOW.log("Router →", destino);
  location.href = destino;
};

/* ------------------------- HEADER FIXO ------------------------- */
FEMFLOW.inserirHeaderApp = function () {
  if (document.querySelector("#femflowHeader")) return;

  const h = document.createElement("header");
  h.id = "femflowHeader";

  h.innerHTML = `
    <img src="./assets/logofemflowterracotasf.png" class="ff-logo" alt="FemFlow">
    <button id="ffMenuBtn" class="ff-menu-btn">&#9776;</button>
  `;

  document.body.prepend(h);

  h.querySelector("#ffMenuBtn").onclick = () =>
    document.querySelector(".ff-menu-modal")?.classList.add("active");
};

/* ------------------------- MENU LATERAL ------------------------- */
FEMFLOW.inserirMenuLateral = function () {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";

  modal.innerHTML = `
    <div class="ff-menu-box">
      <h2 class="ff-menu-title">Menu</hh2>

      <button class="ff-menu-op ff-close" data-go="fechar">✖️ Fechar menu</button>
      <button class="ff-menu-op" data-go="idioma">🌐 Idioma</button>
      <button class="ff-menu-op" data-go="ciclo">🎯 Ajustar ciclo</button>
      <button class="ff-menu-op" data-go="respiracao">💨 Respiração</button>
      <button class="ff-menu-op" data-go="treinos">🏃 Meus Treinos</button>
      <button class="ff-menu-op" data-go="tema">🌓 Tema</button>
      <button class="ff-menu-op" data-go="voltar">🔙 Voltar</button>

      <button class="ff-logout" data-go="logout">🚪 Sair</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.onclick = e => {
    if (e.target.classList.contains("ff-menu-modal")) {
      modal.classList.remove("active");
    }
  };

  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn => {
    btn.onclick = () => FEMFLOW._acaoMenu(btn.dataset.go);
  });
};

/* -------------------- AÇÕES DO MENU -------------------- */
FEMFLOW._acaoMenu = function (op) {
  const modal = document.querySelector(".ff-menu-modal");
  modal?.classList.remove("active");

  switch (op) {
    case "fechar":
      modal?.classList.remove("active");
      break;

    case "idioma":
      FEMFLOW.toast("🌐 Alternar idioma — em desenvolvimento");
      break;

    case "ciclo":
      FEMFLOW.router("ciclo.html");
      break;

    case "respiracao":
      FEMFLOW.router("respiracao.html");
      break;

    case "treinos":
      FEMFLOW.router("evolucao.html");
      break;

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem("femflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "logout":
      localStorage.clear();
      FEMFLOW.router("index.html");
      break;

    case "voltar":
      const atual = location.pathname.split("/").pop();
      const rota = {
        "treino.html": "flowcenter.html",
        "flowcenter.html": "home.html",
        "respiracao.html": "flowcenter.html",
        "evolucao.html": "flowcenter.html",
        "ciclo.html": "home.html"
      };
      FEMFLOW.router(rota[atual] || "home.html");
      break;
  }
};
/* ===========================================================
   🌸 BLOCO 2 — PSE, Salvar Treino, Salvar Descanso,
   Carregar Perfil, Carregar Ciclo
=========================================================== */

/* -----------------------------------------------------------
   MODAL PSE — Compatível com treino.js v06
----------------------------------------------------------- */
FEMFLOW.criarModalPSE = function () {
  if (document.querySelector("#modal-pse")) return;

  const modal = document.createElement("div");
  modal.id = "modal-pse";
  modal.className = "modal oculto";

  modal.innerHTML = `
    <div class="modal-content">
      <h2>Como foi o treino?</h2>
      <div class="pse-list">
        ${[1,2,3,4,5,6,7,8,9,10].map(n =>
          `<button class="pse-opt" data-v="${n}">${n}</button>`
        ).join("")}
      </div>
    </div>
  `;

  modal.onclick = e => {
    if (e.target.id === "modal-pse") modal.classList.add("oculto");
  };

  document.body.appendChild(modal);
};

FEMFLOW.abrirPSE = function (callback) {
  const modal = document.querySelector("#modal-pse");
  if (!modal) return;

  modal.classList.remove("oculto");

  modal.querySelectorAll(".pse-opt").forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.v;
      modal.classList.add("oculto");
      if (callback) callback(v);
    };
  });
};


/* ===========================================================
   🔥 SALVAR TREINO (Backend GAS)
   Treino.js envia → { pse, treino, fase, diaFirebase, obs }
=========================================================== */
FEMFLOW.salvarTreino = async function ({ pse, treino, fase, diaFirebase, obs = "" }) {

  this.log("💾 Salvando treino:", { pse, treino, fase, diaFirebase, obs });

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    this.error("Tentativa de salvar treino sem ID.");
    return;
  }

  try {
    const r = await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarTreino",
        id,
        pse,
        treino,
        fase,
        diaFirebase,
        obs
      })
    });

    const j = await r.json();
    this.log("Resposta salvarTreino():", j);

    if (j.status === "ok") this.toast("Treino salvo! 🌸");
    else this.error("Erro salvar treino:", j);

  } catch (err) {
    this.error("Erro de conexão ao salvar treino:", err);
    this.toast("Erro ao salvar treino.", true);
  }
};


/* ===========================================================
   🌿 SALVAR DESCANSO (Backend)
=========================================================== */
FEMFLOW.salvarDescanso = async function (fase) {

  const id = localStorage.getItem("femflow_id");
  if (!id) return;

  try {
    await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarDescanso",
        id,
        fase
      })
    });

    this.toast("Descanso registrado 🌿");

  } catch (err) {
    this.toast("Erro ao registrar descanso.", true);
    this.error("Erro salvar descanso:", err);
  }
};


/* ===========================================================
   📥 CARREGAR PERFIL — GET validar
=========================================================== */
FEMFLOW.carregarPerfil = async function () {

  console.log("🔄 GET.VALIDAR.DEBUG → Enviando:", {
    id: localStorage.getItem("femflow_id")
  });

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    this.warn("carregarPerfil(): ID não encontrado");
    return null;
  }

  try {
    this.log("Validando usuário no backend…", id);

    const r = await fetch(`${this.SCRIPT_URL}?action=validar&id=${id}`);
    const j = await r.json();

    this.log("Resposta validar():", j);

    if (j.status !== "ok") return null;

    console.log("🔄 GET.VALIDAR.DEBUG → Recebido do backend:", j);

    /* ------------------------------
       Persistência local atualizada
    -------------------------------- */
    localStorage.setItem("femflow_nome", j.nome);
    localStorage.setItem("femflow_fase", j.fase);
    localStorage.setItem("femflow_enfase", j.enfase);
    localStorage.setItem("femflow_diaCiclo", j.diaCiclo);
    localStorage.setItem("femflow_nivel", j.nivel);
    localStorage.setItem("femflow_perfilHormonal", j.perfilHormonal || "regular");

    if (j.data_inicio)
      localStorage.setItem("femflow_startDate", j.data_inicio);

    if (j.ciclo_duracao)
      localStorage.setItem("femflow_cycleLength", j.ciclo_duracao);

    this.log("Perfil carregado no localStorage ✔");

    return j;

  } catch (err) {
    this.error("Erro ao carregar perfil:", err);
    return null;
  }
};


/* ===========================================================
   📥 CARREGAR CICLO — sincroniza tudo com backend
=========================================================== */
FEMFLOW.carregarCicloBackend = async function () {

  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const r = await fetch(`${this.SCRIPT_URL}?action=validar&id=${id}`);
    const j = await r.json();

    if (j.status !== "ok") return null;

    this.log("⬇ Ciclo carregado do backend:", j);

    /* Salvando no localStorage */
    localStorage.setItem("femflow_fase", j.fase);
    localStorage.setItem("femflow_diaCiclo", j.diaCiclo);
    localStorage.setItem("femflow_perfilHormonal", j.perfilHormonal || "regular");

    if (j.data_inicio)
      localStorage.setItem("femflow_startDate", j.data_inicio);

    if (j.ciclo_duracao)
      localStorage.setItem("femflow_cycleLength", j.ciclo_duracao);

    return j;

  } catch (err) {
    this.error("Erro ao carregar ciclo:", err);
    return null;
  }
};


/* ===========================================================
   🔥 ENGINE HORMONAL FINAL (NÃO CALCULA MAIS NO FRONT)
   Backend entrega:
   - faseFirebase
   - diaCiclo
   - perfilHormonal
=========================================================== */

FEMFLOW.calcularEngineHormonal = function () {

  this.log("⚙ Engine Hormonal Final executando…");

  const perfil   = (localStorage.getItem("femflow_perfilHormonal") || "regular").toLowerCase();
  const fase     = (localStorage.getItem("femflow_fase") || "follicular").toLowerCase();
  const diaCiclo = Number(localStorage.getItem("femflow_diaCiclo") || 1);
  const nivel    = (localStorage.getItem("femflow_nivel") || "iniciante").toLowerCase();

  /* -----------------------------------------------------------
     1) PERFIS HORMONAIS REAIS
----------------------------------------------------------- */
  if (["regular", "irregular", "diu", "diu_cobre"].includes(perfil)) {

    return {
      modo: "hormonal-real",
      perfil,
      faseFirebase: fase,
      diaFirebase: diaCiclo,
      diaKey: `dia_${String(diaCiclo).padStart(2, "0")}`
    };
  }

  /* -----------------------------------------------------------
     2) PERFIS ENERGÉTICOS
----------------------------------------------------------- */
  if (["menopausa", "diu_hormonal", "tecnica", "energetico"].includes(perfil)) {

    let total = 23;
    let zonaInicio = 18;

    if (nivel === "intermediaria") zonaInicio = 6;
    if (nivel === "avancada")     zonaInicio = 14;

    const diaEner = Number(localStorage.getItem("femflow_dia_energetico") || 1);

    const diaFirebase = zonaInicio + ((diaEner - 1) % total);
    const faseCalc = FEMFLOW._faseDoNumero(diaFirebase);

    return {
      modo: "energetico",
      perfil,
      faseFirebase: faseCalc,
      diaFirebase,
      diaKey: `dia_${String(diaFirebase).padStart(2, "0")}`
    };
  }

  /* -----------------------------------------------------------
     3) FALLBACK
----------------------------------------------------------- */
  return {
    modo: "fallback",
    faseFirebase: "follicular",
    diaFirebase: 1,
    diaKey: "dia_01"
  };
};


/* -------------------- TRADUTOR NÚMERO → FASE -------------------- */
FEMFLOW._faseDoNumero = function (n) {
  if (n <= 5) return "menstrual";
  if (n <= 13) return "follicular";
  if (n <= 17) return "ovulatory";
  return "luteal";
};
/* ===========================================================
   🌸 BLOCO 3 — EXECUTAR TREINO DO DIA
   Integração Backend + Firebase + Engine Final + Carrossel
=========================================================== */

/* -----------------------------------------------------------
   1) EXECUTAR TREINO DO DIA — Função Principal
----------------------------------------------------------- */
FEMFLOW.executarTreinoDia = async function () {

  this.log("🚀 Iniciando execução do treino (Front → Backend)…");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    this.error("Sem ID — redirecionando para login.");
    this.router("index.html");
    return;
  }

  /* -----------------------------------------------------------
     A) ENGINE FINAL — usa somente backend (fase + diaCiclo)
  ----------------------------------------------------------- */
  const H = this.calcularEngineHormonal();
  this.log("⚙ Engine Final usada:", H);

  const nivel  = localStorage.getItem("femflow_nivel")  || "";
  const enfase = localStorage.getItem("femflow_enfase") || "";

  /* -----------------------------------------------------------
     B) URL GET TREINO (backend 2025)
  ----------------------------------------------------------- */
  const urlTreino =
    `${this.SCRIPT_URL}?action=treino` +
    `&id=${encodeURIComponent(id)}` +
    `&fase=${encodeURIComponent(H.faseFirebase)}` +
    `&diaFirebase=${encodeURIComponent(H.diaFirebase)}` +
    `&diaKey=${encodeURIComponent(H.diaKey)}` +
    `&nivel=${encodeURIComponent(nivel)}` +
    `&enfase=${encodeURIComponent(enfase)}`;

  this.log("📡 URL GET treino:", urlTreino);

  let dadosTreino = null;

  try {
    const r = await fetch(urlTreino);
    const txt = await r.text();

    this.log("📦 RAW BACKEND:", txt);

    try {
      dadosTreino = JSON.parse(txt);
    } catch (e) {
      this.error("❌ JSON inválido:", e);
      this.toast("Erro ao interpretar treino.");
      return;
    }

  } catch (err) {
    this.error("❌ Conexão falhou:", err);
    this.toast("Falha ao acessar servidor.");
    return;
  }

  if (!dadosTreino || dadosTreino.status !== "ok") {
    this.error("❌ Backend retornou erro:", dadosTreino);
    this.toast("Erro ao montar treino.");
    return;
  }

  this.log("🔥 Treino recebido do backend:", dadosTreino);

  /* -----------------------------------------------------------
     C) Montar UI do treino
  ----------------------------------------------------------- */
  await this._montarTreinoUI(dadosTreino);
};



/* ===========================================================
   2) BUSCAR EXERCÍCIOS DO FIREBASE
=========================================================== */
FEMFLOW._buscarExerciciosTreino = async function (firebaseQuery) {

  if (!firebaseQuery) {
    this.warn("⚠ firebaseQuery ausente — backend não enviou.");
    return [];
  }

  /* Exemplo de firebaseQuery:
     {
       nivel: "iniciante",
       enfase: "gluteo",
       fase: "follicular",
       diaKey: "dia_06"
     }
  */

  const pasta = `${firebaseQuery.nivel || ""}_${firebaseQuery.enfase || ""}`
    .replace("__", "_")
    .trim();

  const fase   = firebaseQuery.fase;
  const diaKey = firebaseQuery.diaKey;

  this.log("📁 Pasta Firebase:", pasta);

  // A função verdadeira de leitura está abaixo
  const lista = await this._carregarExerciciosFirebase(pasta, fase, diaKey);

  if (!lista || !Array.isArray(lista)) {
    this.warn("⚠ Firebase vazio para query:", firebaseQuery);
    return [];
  }

  return lista;
};



/* ===========================================================
   3) MONTAR UI COMPLETA DO TREINO
   Backend entrega:
   - boxes[0] → intro
   - boxes[last] → final
   - firebaseQuery → pasta/fase/diaKey
=========================================================== */
FEMFLOW._montarTreinoUI = async function (j) {

  const track = document.querySelector("#carouselTrack");
  if (!track) {
    this.error("❌ DOM Error: #carouselTrack não encontrado.");
    return;
  }

  track.innerHTML = "";

  /* -----------------------------------------------------------
     1) BOX 0 — Introdução
  ----------------------------------------------------------- */
  const boxIntro = this._criarBoxTexto(j.boxes[0]);
  track.appendChild(boxIntro);

  /* -----------------------------------------------------------
     2) EXERCÍCIOS DO FIREBASE
  ----------------------------------------------------------- */
  const exList = await this._buscarExerciciosTreino(j.firebaseQuery);

  exList.forEach(ex => {
    const box = this._criarBoxExercicio(ex);
    track.appendChild(box);
  });

  /* -----------------------------------------------------------
     3) BOX FINAL
  ----------------------------------------------------------- */
  const boxFinal = this._criarBoxTexto(
    j.boxes[j.boxes.length - 1] || { titulo: "Final", mensagem: "" }
  );
  track.appendChild(boxFinal);

  /* -----------------------------------------------------------
     4) SNAPSHOT OFFLINE
  ----------------------------------------------------------- */
  this._salvarSnapshotTreino(j, exList);

  this.toast("Treino carregado! 🌸💪");
};



/* ===========================================================
   4) Criar BOX texto (Intro / Final)
=========================================================== */
FEMFLOW._criarBoxTexto = function (box) {
  const el = document.createElement("div");
  el.className = "carousel-item";

  el.innerHTML = `
    <div class="box-card">
      <h2>${box.titulo || "Treino"}</h2>
      <p>${box.mensagem || ""}</p>
    </div>
  `;

  return el;
};



/* ===========================================================
   5) Criar BOX de Exercício (Firebase)
=========================================================== */
FEMFLOW._criarBoxExercicio = function (ex) {
  const el = document.createElement("div");
  el.className = "carousel-item";

  el.innerHTML = `
    <div class="ex-card">
      <h3>${ex.nome || "Exercício"}</h3>
      <p>${ex.descricao || ""}</p>
      <p class="series">
        Séries: ${ex.series || "-"} · Reps: ${ex.reps || "-"}
      </p>
    </div>
  `;

  return el;
};



/* ===========================================================
   6) Snapshot Offline — salva treino completo
=========================================================== */
FEMFLOW._salvarSnapshotTreino = function (j, lista) {

  const snap = {
    meta: {
      fase: j.fase,
      diaFirebase: j.diaFirebase,
      diaKey: j.diaKey,
      perfilHormonal: localStorage.getItem("femflow_perfilHormonal"),
      data: new Date().toISOString()
    },
    boxes: j.boxes,
    lista
  };

  localStorage.setItem("femflow_offline_treino_v1", JSON.stringify(snap));

  this.log("💾 Snapshot Offline salvo!", snap);
};



/* ===========================================================
   7) Carregar arquivos do Firebase (JSON via Storage)
=========================================================== */
FEMFLOW._carregarExerciciosFirebase = async function (pasta, fase, diaKey) {

  const url =
    `https://firebasestorage.googleapis.com/v0/b/femflow-firebase.appspot.com/o/` +
    encodeURIComponent(`exercicios/${pasta}/${fase}/${diaKey}.json`) +
    `?alt=media`;

  this.log("🔥 Firebase URL:", url);

  try {
    const r = await fetch(url);

    if (!r.ok) {
      this.warn("⚠ Firebase HTTP Status:", r.status);
      return [];
    }

    const txt = await r.text();

    try {
      const j = JSON.parse(txt);
      this.log("🔥 Firebase JSON retornado:", j);
      return j;
    } catch (e) {
      this.warn("⚠ Firebase retornou texto não JSON:", txt);
      return [];
    }

  } catch (err) {
    this.error("❌ Erro ao acessar Firebase:", err);
    return [];
  }
};
/* ===========================================================
   🌸 BLOCO 4 — DEBUG, INSPECTOR, INIT, AUTO-START
=========================================================== */

/* -----------------------------------------------------------
   🔍 INSPECTOR — Console: FEMFLOW.inspect()
----------------------------------------------------------- */
FEMFLOW.inspect = function () {

  console.clear();
  console.log("%c🔍 FEMFLOW INSPECTOR — 2025",
              "font-size:18px;font-weight:bold;color:#cc6a5a;");

  /* ---------------------------
     LOCALSTORAGE
  --------------------------- */
  console.groupCollapsed("📌 LOCALSTORAGE");
  [
    "femflow_id",
    "femflow_email",
    "femflow_nome",
    "femflow_fase",
    "femflow_diaCiclo",
    "femflow_perfilHormonal",
    "femflow_enfase",
    "femflow_nivel",
    "femflow_cycleLength",
    "femflow_startDate",
    "femflow_dia_energetico",
    "femflow_dia_treino",
    "femflow_dev"
  ].forEach(k => console.log(k, "→", localStorage.getItem(k)));
  console.groupEnd();


  /* ---------------------------
     ENGINE HORMONAL FINAL
  --------------------------- */
  console.groupCollapsed("🌙 ENGINE HORMONAL FINAL");
  try {
    console.log(FEMFLOW.calcularEngineHormonal());
  } catch (e) {
    console.warn("Erro engine:", e);
  }
  console.groupEnd();


  /* ---------------------------
     FIREBASE QUERY
  --------------------------- */
  console.groupCollapsed("🔥 FIREBASE QUERY (calculada)");
  try {
    const H = FEMFLOW.calcularEngineHormonal();
    const pasta = `${localStorage.getItem("femflow_nivel")}_${localStorage.getItem("femflow_enfase")}`;
    const q = {
      pasta,
      fase: H.faseFirebase,
      diaKey: H.diaKey
    };
    console.table(q);
    console.log("URL:",
      `https://firebasestorage.googleapis.com/v0/b/femflow-firebase.appspot.com/o/`
      + encodeURIComponent(`exercicios/${pasta}/${H.faseFirebase}/${H.diaKey}.json`)
      + `?alt=media`
    );
  } catch (e) {
    console.warn("Erro:", e);
  }
  console.groupEnd();


  /* ---------------------------
     SNAPSHOT OFFLINE
  --------------------------- */
  console.groupCollapsed("📦 SNAPSHOT OFFLINE");
  try {
    const snap = JSON.parse(localStorage.getItem("femflow_offline_treino_v1"));
    console.log(snap || "Nenhum snapshot salvo.");
  } catch (e) {
    console.warn("Erro lendo snapshot:", e);
  }
  console.groupEnd();

  console.log("%c✔ INSPEÇÃO FINALIZADA",
              "font-weight:bold;color:#4ba387;font-size:16px;");
};



/* -----------------------------------------------------------
   🔍 DEBUG BACKEND — FEMFLOW.debugBackend()
----------------------------------------------------------- */
FEMFLOW.debugBackend = async function () {

  console.clear();
  console.log("%c🔍 DEBUG BACKEND — RAW GET TREINO",
              "font-size:20px;font-weight:bold;color:#cc6a5a;");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    console.error("❌ Sem ID — faça login.");
    return;
  }

  const H = FEMFLOW.calcularEngineHormonal();

  const url =
    `${FEMFLOW.SCRIPT_URL}?action=treino` +
    `&id=${id}` +
    `&fase=${H.faseFirebase}` +
    `&diaFirebase=${H.diaFirebase}` +
    `&diaKey=${H.diaKey}` +
    `&nivel=${localStorage.getItem("femflow_nivel")}` +
    `&enfase=${localStorage.getItem("femflow_enfase")}`;

  console.log("📡 URL:", url);

  try {
    const r = await fetch(url);
    const txt = await r.text();

    console.log("📦 RAW Response:", txt);

    try {
      const j = JSON.parse(txt);
      console.log("🔍 JSON Parsed:", j);
    } catch (e) {
      console.warn("⚠ JSON inválido:", e);
    }

  } catch (err) {
    console.error("❌ Falha ao acessar backend:", err);
  }
};



/* -----------------------------------------------------------
   🔍 DEBUG FIREBASE RAW — FEMFLOW.debugFirebaseRaw()
----------------------------------------------------------- */
FEMFLOW.debugFirebaseRaw = async function (pasta, fase, diaKey) {

  console.clear();
  console.log("%c🔥 DEBUG FIREBASE RAW",
              "font-size:20px;font-weight:bold;color:#cc6a5a;");

  const url =
    `https://firebasestorage.googleapis.com/v0/b/femflow-firebase.appspot.com/o/`
    + encodeURIComponent(`exercicios/${pasta}/${fase}/${diaKey}.json`)
    + `?alt=media`;

  console.log("📡 URL:", url);

  try {
    const r = await fetch(url);

    console.log("📥 HTTP Status:", r.status, r.statusText);
    const txt = await r.text();

    console.log("📦 RAW:", txt);

    try {
      console.log("🔍 JSON:", JSON.parse(txt));
    } catch (e) {
      console.warn("⚠ JSON inválido");
    }

  } catch (err) {
    console.error("❌ Falha no Firebase:", err);
  }
};



/* ===========================================================
   🔧 INIT — executado em TODAS as páginas
=========================================================== */

FEMFLOW.init = async function () {

  const p = (location.pathname.split("/").pop() || "").toLowerCase();
  this.log("Init →", p);

  const paginasComHeader = [
    "flowcenter.html",
    "treino.html",
    "respiracao.html",
    "evolucao.html"
  ];

  /* -------------------------
     HEADER E MENU
  ------------------------- */
  if (paginasComHeader.includes(p)) {
    this.inserirHeaderApp();
    this.inserirMenuLateral();
  }

  /* -------------------------
     EXECUTAR TREINO
  ------------------------- */
  if (p === "treino.html") {
    await this.executarTreinoDia();
  }

  this.log("Init concluído:", p);
};


/* ===========================================================
   🚀 AUTO-START — garante execução automática
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  window.FEMFLOW.init();
});

