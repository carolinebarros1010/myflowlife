/* ===========================================================
   🌸 FEMFLOW CORE — V4 (2025)
   BLOCO 1/5 — Configuração, Logs, Toast, Router, Header, Menu
=========================================================== */

window.FEMFLOW = {

  /* -----------------------------------------------------------
     ✓ CONFIG BASE
  ----------------------------------------------------------- */
  SCRIPT_URL: "https://api-myflowlife.falling-wildflower-a8c0.workers.dev",

  /* -----------------------------------------------------------
     ✓ LOG SYSTEM (Modo DEV — ativar com: localStorage.setItem("femflow_dev","on"))
  ----------------------------------------------------------- */
  dev() { 
    return localStorage.getItem("femflow_dev") === "on"; 
  },

  log(...args) {
    if (!this.dev()) return;
    console.log("%c[FEMFLOW]", "color:#cc6a5a;font-weight:bold;", ...args);
  },

  warn(...args) {
    if (!this.dev()) return;
    console.warn("%c[FEMFLOW ⚠]", "color:#e07f67;font-weight:bold;", ...args);
  },

  error(...args) {
    if (!this.dev()) return;
    console.error("%c[FEMFLOW ❌]", "color:#b74333;font-weight:bold;", ...args);
  },


  /* -----------------------------------------------------------
     ✓ TOAST UNIVERSAL
  ----------------------------------------------------------- */
  toast(msg, error = false, offline = false) {
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
  },


  /* -----------------------------------------------------------
     ✓ ROUTER
  ----------------------------------------------------------- */
  router(pagina) {
    const destino = pagina.endsWith(".html") ? pagina : pagina + ".html";
    this.log("Router →", destino);
    location.href = destino;
  },


  /* ===========================================================
     🌸 HEADER + MENU — FEMFLOW 2025
  ============================================================ */

  /* -----------------------------------------------------------
     ✓ INSERIR HEADER FIXO
  ----------------------------------------------------------- */
  inserirHeaderApp() {
    if (document.querySelector("#femflowHeader")) return;

    const h = document.createElement("header");
    h.id = "femflowHeader";

    h.innerHTML = `
      <img src="./assets/logofemflowterracotasf.png" class="ff-logo" alt="FemFlow">
      <button id="ffMenuBtn" class="ff-menu-btn">&#9776;</button>
    `;

    document.body.prepend(h);

    // Botão hamburger abre o menu lateral
    h.querySelector("#ffMenuBtn").onclick = () => {
      document.querySelector(".ff-menu-modal")?.classList.add("active");
    };
  },


  /* -----------------------------------------------------------
     ✓ CRIAR MENU LATERAL
  ----------------------------------------------------------- */
  inserirMenuLateral() {
    if (document.querySelector(".ff-menu-modal")) return;

    const modal = document.createElement("div");
    modal.className = "ff-menu-modal";

    modal.innerHTML = `
      <div class="ff-menu-box">
        <h2 class="ff-menu-title">Menu</h2>

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

    // Fecha tocando fora
    modal.onclick = e => {
      if (e.target.classList.contains("ff-menu-modal")) {
        modal.classList.remove("active");
      }
    };

    // Ações
    modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn => {
      btn.onclick = () => this._acaoMenu(btn.dataset.go);
    });
  },


  /* -----------------------------------------------------------
     ✓ AÇÕES DO MENU LATERAL
  ----------------------------------------------------------- */
  _acaoMenu(op) {

    const modal = document.querySelector(".ff-menu-modal");
    modal?.classList.remove("active");

    switch(op){

      case "fechar":
        modal?.classList.remove("active");
        break;

      case "idioma":
        this._alternarIdioma?.();
        break;

      case "ciclo":
        this.router("ciclo.html");
        break;

      case "respiracao":
        this.router("respiracao.html");
        break;

      case "treinos":
        this.router("evolucao.html");
        break;

      case "tema":
        document.body.classList.toggle("dark");
        localStorage.setItem(
          "femflow_theme",
          document.body.classList.contains("dark") ? "dark" : "light"
        );
        break;

      case "logout":
        localStorage.clear();
        this.router("index.html");
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
        this.router(rota[atual] || "home.html");
        break;
    }
  },


  /* -----------------------------------------------------------
     ✓ ALTERNAR IDIOMA (placeholder)
  ----------------------------------------------------------- */
  _alternarIdioma() {
    this.toast("🌐 Alternar idioma — em desenvolvimento");
  },

};
/* FIM DO BLOCO 1/5 — Continua no Bloco 2 */
/* ===========================================================
   🌸 FEMFLOW CORE — V4 (2025)
   BLOCO 2/5 — PSE, Salvar Treino, Salvar Descanso, Perfil
=========================================================== */

/* -----------------------------------------------------------
   ✓ MODAL PSE — compatível com treino.js v06
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
   🌿 SALVAR DESCANSO (compatível treino.js)
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
   Atualiza: fase, enfase, diaCiclo, nivel
   backend controla tudo!
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

console.log("🔄 GET.VALIDAR.DEBUG → Campos importantes:");
console.log({
  fase: j.fase,
  diaCiclo: j.diaCiclo,
  nivel: j.nivel,
  enfase: j.enfase,
  produto: j.produto
});

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
   console.log("📌 FRONT.USING → fase:", j.fase);
console.log("📌 FRONT.USING → diaCiclo:", j.diaCiclo);
console.log("📌 FRONT.USING → perfilHormonal:", localStorage.getItem("femflow_perfilHormonal"));

};
/* ===========================================================
   🌙 BLOCO 3 — PERFIL HORMONAL / ENERGÉTICO + ENGINE FINAL
   Front-End sincronizado 100% com Backend
   Fluxo Final 2025 — Compatível com treino.js v06
=========================================================== */


/* -----------------------------------------------------------
   ✓ SALVAR PERFIL DO CICLO NO BACKEND
   Usado no ciclo.html — envia tudo para o GAS
----------------------------------------------------------- */
FEMFLOW.salvarCicloBackend = async function ({ perfil, dia, fase, dataInicio }) {

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    this.error("Tentativa de salvar ciclo sem ID.");
    return;
  }

  this.log("⬆ Enviando ciclo ao backend:", {
    perfil,
    dia,
    fase,
    dataInicio
  });

  /* 1) Perfil Hormonal / Energético */
  await fetch(this.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "setperfilhormonal",
      id,
      perfil
    })
  });

  /* 2) Fase */
  await fetch(this.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "setfase",
      id,
      fase
    })
  });

  /* 3) Dia do Ciclo */
  await fetch(this.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "setdiaciclo",
      id,
      dia
    })
  });

  /* 4) Data de início — somente perfis hormonais */
  if (dataInicio) {
    await fetch(this.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setdatainicio",
        id,
        dataInicio
      })
    });
  }

  this.toast("✨ Ciclo salvo!");
};



/* -----------------------------------------------------------
   ✓ CARREGAR CICLO (GET validar)
   Atualiza:
   - fase  
   - diaCiclo  
   - ciclo_duracao  
   - perfil Hormonal/Energético  
----------------------------------------------------------- */
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
   🔥 ENGINE HORMONAL FINAL (NÃO CALCULA MAIS)
   Backend fornece:
   - fase
   - diaCiclo
   - perfilHormonal

   Front apenas interpreta para montar FirebaseQuery
=========================================================== */
FEMFLOW.calcularEngineHormonal = function () {

  this.log("⚙ Engine Hormonal Final executando…");

  const perfil   = (localStorage.getItem("femflow_perfilHormonal") || "regular").toLowerCase();
  const fase     = (localStorage.getItem("femflow_fase") || "follicular").toLowerCase();
  const diaCiclo = Number(localStorage.getItem("femflow_diaCiclo") || 1);
  const nivel    = (localStorage.getItem("femflow_nivel") || "iniciante").toLowerCase();


  /* -----------------------------------------------------------
     CASO 1 — PERFIS HORMONAIS REAIS
     regular, irregular, diu cobre, diu
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
     CASO 2 — PERFIS ENERGÉTICOS
     menopausa, diu hormonal, técnica, energético
     → cálculo em ciclos fixos 23 + key
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
     FALLBACK — nunca deve ocorrer
----------------------------------------------------------- */
  return {
    modo: "fallback",
    faseFirebase: "follicular",
    diaFirebase: 1,
    diaKey: "dia_01"
  };
};



/* -----------------------------------------------------------
   ✓ TRADUTOR: Número → Fase
   Necessário apenas para perfis energéticos
----------------------------------------------------------- */
FEMFLOW._faseDoNumero = function (n) {
  if (n <= 5) return "menstrual";
  if (n <= 13) return "follicular";
  if (n <= 17) return "ovulatory";
  return "luteal";
};

/* ===========================================================
   🌸 BLOCO 4 — EXECUTAR TREINO DO DIA
   Integração completa:
   - Backend GAS 2025 (GET treino)
   - Engine hormonal final (bloco 3)
   - Firebase (exercícios por pasta/fase/dia)
   - Carrossel front-end
=========================================================== */


/* -----------------------------------------------------------
   1) EXECUTAR TREINO DO DIA
   → Chama backend
   → Usa engine hormonal FINAL
   → Monta UI automaticamente
----------------------------------------------------------- */
FEMFLOW.executarTreinoDia = async function () {

  this.log("🚀 Iniciando execução do treino (Front → Backend)…");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    this.error("Sem ID — redirecionando para login.");
    this.router("index.html");
    return;
  }

  // Engine final (fase e diaCiclo 100% backend)
  const H = this.calcularEngineHormonal();
  this.log("⚙ Engine Final utilizada:", H);

  const nivel = localStorage.getItem("femflow_nivel") || "";
  const enfase = localStorage.getItem("femflow_enfase") || "";

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

    this.log("📦 Resposta RAW do backend:", txt);

    try {
      dadosTreino = JSON.parse(txt);
    } catch (e) {
      this.error("❌ Backend retornou JSON inválido:", e);
      this.toast("Erro ao interpretar treino.");
      return;
    }

  } catch (err) {
    this.error("❌ Erro ao consultar backend:", err);
    this.toast("Falha na conexão.");
    return;
  }

  if (!dadosTreino || dadosTreino.status !== "ok") {
    this.error("Backend retornou erro ao carregar treino:", dadosTreino);
    this.toast("Erro ao carregar treino.", true);
    return;
  }

  this.log("🔥 Treino recebido do backend:", dadosTreino);

  // Agora monta a UI do treino
  await this._montarTreinoUI(dadosTreino);
};




/* -----------------------------------------------------------
   2) CARREGAR EXERCÍCIOS DO FIREBASE
----------------------------------------------------------- */
FEMFLOW._buscarExerciciosTreino = async function (firebaseQuery) {

  if (!firebaseQuery) {
    this.warn("FirebaseQuery ausente, backend não enviou.");
    return [];
  }

  const pasta = `${firebaseQuery.nivel || firebaseQuery.pasta || ""}_${firebaseQuery.enfase || ""}`
    .replace("__", "_")
    .trim();

  const fase = firebaseQuery.fase;
  const diaKey = firebaseQuery.diaKey;

  this.log("📁 Pasta Firebase:", pasta);

  const lista = await this.buscarExerciciosFirebase(pasta, fase, diaKey);

  if (!lista || !Array.isArray(lista)) {
    this.warn("⚠ Firebase retornou vazio para:", firebaseQuery);
    return [];
  }

  return lista;
};




/* -----------------------------------------------------------
   3) MONTAR TELA DO TREINO (Carrossel)
----------------------------------------------------------- */
FEMFLOW._montarTreinoUI = async function (j) {

  const track = document.querySelector("#carouselTrack");
  if (!track) {
    this.error("❌ DOM Error: #carouselTrack não encontrado.");
    return;
  }

  track.innerHTML = ""; // limpa

  /* -----------------------------------------------------------
     1) BOX 0 — Introdução
  ----------------------------------------------------------- */
  const boxIntro = this._criarBoxTexto(j.boxes[0]);
  track.appendChild(boxIntro);

  /* -----------------------------------------------------------
     2) BOXES do FIREBASE
  ----------------------------------------------------------- */
  const exList = await this._buscarExerciciosTreino(j.firebaseQuery);

  exList.forEach(ex => {
    const box = this._criarBoxExercicio(ex);
    track.appendChild(box);
  });

  /* -----------------------------------------------------------
     3) BOX FINAL — encerramento
  ----------------------------------------------------------- */
  const boxFinal = this._criarBoxTexto(j.boxes[j.boxes.length - 1]);
  track.appendChild(boxFinal);

  /* -----------------------------------------------------------
     4) SALVAR SNAPSHOT OFFLINE
  ----------------------------------------------------------- */
  this._salvarSnapshotTreino(j, exList);

  this.toast("Treino carregado! 🌸💪");
};




/* -----------------------------------------------------------
   4) Criar BOX texto (Intro / Final)
----------------------------------------------------------- */
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



/* -----------------------------------------------------------
   5) Criar BOX de Exercício (Firebase)
----------------------------------------------------------- */
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



/* -----------------------------------------------------------
   6) Snapshot Offline — salva treino localmente
----------------------------------------------------------- */
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



/* -----------------------------------------------------------
   7) DEBUG Firebase Query
----------------------------------------------------------- */
window.FEMFLOW_DEBUG_TREINO = {
  printFirebaseQuery({ pasta, fase, diaKey }) {
    console.log("🔥 Firebase Query:", {
      pasta,
      fase,
      diaKey,
      url:
        `https://firebasestorage.googleapis.com/v0/b/femflow-firebase.appspot.com/o/`
        + encodeURIComponent(`exercicios/${pasta}/${fase}/${diaKey}.json`)
        + `?alt=media`
    });
  }
};
/* ===========================================================
   🌸 BLOCO 5 — DEBUG, INSPECTOR, INIT, AUTO-START
   Parte final do FemFlow Core v4
=========================================================== */


/* -----------------------------------------------------------
   🔍 INSPECTOR — Console: FEMFLOW.inspect()
----------------------------------------------------------- */
FEMFLOW.inspect = function () {

  console.clear();
  console.log("%c🔍 FEMFLOW INSPECTOR — 2025", "font-size:18px;font-weight:bold;color:#cc6a5a;");

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
    "femflow_dev"
  ].forEach(k => console.log(k, "→", localStorage.getItem(k)));
  console.groupEnd();


  /* ---------------------------
     ENGINE HORMONAL
  --------------------------- */
  console.groupCollapsed("🌙 ENGINE HORMONAL FINAL");
  try {
    console.log(this.calcularEngineHormonal());
  } catch (e) {
    console.warn("Erro engine:", e);
  }
  console.groupEnd();


  /* ---------------------------
     FIREBASE QUERY
  --------------------------- */
  console.groupCollapsed("🔥 FIREBASE QUERY (calculada)");
  try {
    const H = this.calcularEngineHormonal();
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

  console.log("%c✔ INSPEÇÃO FINALIZADA", "font-weight:bold;color:#4ba387;font-size:16px;");
};




/* -----------------------------------------------------------
   🔍 DEBUG BACKEND RAW — FEMFLOW.debugBackend()
----------------------------------------------------------- */
FEMFLOW.debugBackend = async function () {

  console.clear();
  console.log("%c🔍 DEBUG BACKEND — RAW GET TREINO", "font-size:20px;font-weight:bold;color:#cc6a5a;");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    console.error("❌ Sem ID — faça login.");
    return;
  }

  const H = this.calcularEngineHormonal();

  const url =
    `${this.SCRIPT_URL}?action=treino` +
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
   🔍 DEBUG FIREBASE (RAW)
----------------------------------------------------------- */
FEMFLOW.debugFirebaseRaw = async function (pasta, fase, diaKey) {

  console.clear();
  console.log("%c🔥 DEBUG FIREBASE RAW", "font-size:20px;font-weight:bold;color:#cc6a5a;");

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

  if (paginasComHeader.includes(p)) {
    this.inserirHeaderApp();
    this.inserirMenuLateral();
  }

  // Se estiver no treino.html, executa treino
  if (p === "treino.html") {
    await this.executarTreinoDia();
  }

  this.log("Init concluído:", p);
};




/* ===========================================================
   🚀 AUTO-START
=========================================================== */
document.addEventListener("DOMContentLoaded", () => {
  window.FEMFLOW.init();
});

