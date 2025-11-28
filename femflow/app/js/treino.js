/* =======================================================================
   FemFlow v06 — Treino Diário 2025
   ENGINE CENTRALIZADA NO BACKEND + CORE V3
   FIREBASE • TURNOVER • SNAPSHOT OFFLINE • PSE • DESCANSO
======================================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.log("🚀 treino.js v06 carregado!");

  const OFFLINE_KEY = "femflow_offline_treino_v1";

  /* -----------------------------------------------------------
   * 1. LOGIN + PERFIL
   * ----------------------------------------------------------- */
  const id = localStorage.getItem("femflow_id");

  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    return location.href = "index.html?ret=treino.html";
  }

  /* -----------------------------------------------------------
   * 2. CHECK CICLO CONFIGURADO
   * ----------------------------------------------------------- */
  const cicloOK =
    localStorage.getItem("femflow_cycle_configured") === "yes";

  if (!cicloOK) {
    FEMFLOW.toast("⚠️ Configure seu ciclo.");
    return location.href = "ciclo.html";
  }

  /* -----------------------------------------------------------
   * 3. ELEMENTOS DO TREINO.HTML
   * ----------------------------------------------------------- */
  const track  = document.querySelector("#carouselTrack");
  const bar    = document.querySelector("#progressBar");
  const titulo = document.querySelector("#tituloDiaTreino");
  const btnRest = document.querySelector("#btnDescansar");

  if (!track || !bar) {
    FEMFLOW.error("❌ Estrutura interna ausente no DOM.");
    return;
  }

  /* -----------------------------------------------------------
   * 4. ESTADO BASE
   * ----------------------------------------------------------- */
  let boxes = [];
  let current = 0;
  const diaPrograma = Number(localStorage.getItem("femflow_dia_treino") || 1);

  if (titulo) titulo.textContent = `Dia ${diaPrograma} do Programa`;

  /* ============================================================
   * 5. CARROSSEL (SWIPE + PROGRESS)
   * ============================================================ */
  function moveTo(dir) {

    const total = boxes.length;

    if (dir === "next" && current < total - 1) {
      current++;
      navigator.vibrate?.([25]);
    } else if (dir === "prev" && current > 0) {
      current--;
      navigator.vibrate?.([20]);
    }

    const item = track.children[current];
    if (!item) return;

    track.scrollTo({
      left: item.offsetLeft - 16,
      behavior: "smooth"
    });

    bar.style.width = `${((current + 1) / total) * 100}%`;
  }

  let startX = 0;
  track.addEventListener("touchstart", e => startX = e.touches[0].clientX);
  track.addEventListener("touchend", e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) moveTo(delta < 0 ? "next" : "prev");
  });

  /* ============================================================
   * 6. TIMERS (HIIT / INTERVALOS)
   * ============================================================ */
  const intervals = new WeakMap();
  const fmt = s => `00:${String(s).padStart(2, "0")}`;

  function parseTempo(raw) {
    const n = Number(String(raw).replace(/[^\d]/g, ""));
    return n > 0 ? n : 45;
  }

  function bindTimers(root) {
    root.querySelectorAll(".ff-timer-bar").forEach(el => {

      const total = parseTempo(el.dataset.total);
      const fill  = el.querySelector(".ff-timer-fill");
      const label = el.querySelector(".ff-timer-count");

      el.dataset.total = total;
      let remain = total;

      const start = () => {
        clearInterval(intervals.get(el));
        el.classList.add("running");

        const int = setInterval(() => {
          remain--;
          fill.style.width = `${(remain / total) * 100}%`;
          label.textContent = fmt(remain);

          if (remain <= 0) {
            clearInterval(int);
            el.classList.remove("running");
            el.classList.add("done");
          }
        }, 1000);

        intervals.set(el, int);
      };

      el.addEventListener("click", () => {
        if (el.classList.contains("running")) {
          clearInterval(intervals.get(el));
          el.classList.remove("running");
        } else {
          start();
        }
      });
    });
  }

 /* ============================================================
 * 7. RENDERIZAR BOXES DO TREINO
 * ============================================================ */
function renderBoxes(lista, meta = {}) {

  console.log("🔥 TREINO.RENDER.DEBUG ================================");
  console.log("TOTAL BOXES:", Array.isArray(lista) ? lista.length : 0);
  console.log("META:", meta);
  console.log("LISTA (primeiros 3):", (lista || []).slice(0, 3));
  console.log("=======================================================");

  track.innerHTML = "";
  boxes = lista || [];

  boxes.forEach(box => {
    const div = document.createElement("div");
    div.className = "carousel-item";

    div.innerHTML = `
      <h3 class="ff-ex-titulo">${box.titulo || ""}</h3>
      <p class="ff-ex-sub">${box.subtitulo || box.mensagem || box.descricao || ""}</p>

      ${box.video ? `
        <div class="ff-video">
          <iframe src="${box.video}" frameborder="0"
            allowfullscreen></iframe>
        </div>` : ""}

      ${box.timer || box.tempo_total ? `
        <div class="ff-timer-bar"
             data-total="${box.timer || box.tempo_total}">
          <div class="ff-timer-fill"></div>
          <span class="ff-timer-count">
            00:${String(parseTempo(box.timer || box.tempo_total)).padStart(2, "0")}
          </span>
        </div>` : ""}

      ${Array.isArray(box.series) ? `
        <div class="ff-series">
          ${box.series.map(s => `
            <div class="ff-serie-item">
              <span>${s}</span>
            </div>
          `).join("")}
        </div>` : ""}
    `;

    track.appendChild(div);
  });

  bindTimers(track);
  moveTo("reset");
}


  /* ============================================================
   * 8. SNAPSHOT OFFLINE
   * ============================================================ */
  function salvarSnapshot(meta, lista) {
    const snap = {
      meta,
      lista,
      salvoEm: Date.now()
    };
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(snap));
  }

  function carregarSnapshot() {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /* ============================================================
 * 9. USAR SNAPSHOT SE ESTIVER SEM INTERNET
 * ============================================================ */
if (!navigator.onLine) {
  FEMFLOW.warn("📵 Offline: carregando snapshot...");
  const snap = carregarSnapshot();
  if (snap?.lista) {
    renderBoxes(snap.lista, snap.meta || {});
    FEMFLOW.toast("Modo offline ⚡", false, true);
    return;
  }
}


  /* ============================================================
   * 10. BOTÃO DESCANSAR
   * ============================================================ */
  if (btnRest) {
    btnRest.addEventListener("click", async () => {
      if (!confirm("Deseja registrar descanso hoje?")) return;

      const fase = localStorage.getItem("femflow_fase") || "folicular";

      await FEMFLOW.salvarDescanso(fase);
      FEMFLOW.toast("Descanso registrado 🌿");
      
      setTimeout(() => {
        location.href = "flowcenter.html";
      }, 900);
    });
  }

   /* ============================================================
   🔍 TREINO INSPECTOR — Console Debug Pro 2025
   ============================================================ */
FEMFLOW.debugTreino = function () {

  console.log("%c📟 TREINO INSPECTOR — 2025", 
              "background:#333;color:#00e6b8;padding:6px;font-size:14px;border-radius:6px;");

  /* -------------------------------
   * A) LOCALSTORAGE
   * ------------------------------- */
  console.log("📦 LOCALSTORAGE");
  const keys = [
    "femflow_id",
    "femflow_email",
    "femflow_fase",
    "femflow_diaCiclo",
    "femflow_perfilHormonal",
    "femflow_enfase",
    "femflow_nivel",
    "femflow_cycleLength",
    "femflow_startDate",
    "femflow_diaciclo",
    "femflow_dia_treino",
    "femflow_faseAlta"
  ];

  keys.forEach(k => {
    console.log(`   ${k} →`, localStorage.getItem(k));
  });

  /* -------------------------------
   * B) ENGINE HORMONAL (front)
   * ------------------------------- */
  console.log("\n⚙ ENGINE FRONT");
  const fase = localStorage.getItem("femflow_fase");
  const diaCiclo = localStorage.getItem("femflow_diaCiclo");
  const nivel = localStorage.getItem("femflow_nivel");
  const enfase = localStorage.getItem("femflow_enfase");

  console.log({
    fase,
    diaCiclo,
    nivel,
    enfase
  });

  /* -------------------------------
   * C) FIREBASE QUERY CALCULADA
   * ------------------------------- */
  const pasta = `${nivel}_${enfase}`;
  const diaKey = "dia_" + diaCiclo;

  console.log("\n🔥 FIREBASE QUERY CALCULADA");
  console.table({
    pasta,
    fase,
    diaKey
  });

  const urlFire = `https://firestore.googleapis.com/v1/projects/YOUR_FIREBASE_ID/databases/(default)/documents/${pasta}/${fase}/${diaKey}`;
  console.log("URL suposta →", urlFire);

  /* -------------------------------
   * D) SNAPSHOT OFFLINE
   * ------------------------------- */
  console.log("\n📁 SNAPSHOT OFFLINE");
  const snapRaw = localStorage.getItem("femflow_offline_treino_v1");

  if (!snapRaw) {
    console.log("   Nenhum snapshot salvo.");
  } else {
    try {
      const snap = JSON.parse(snapRaw);
      console.log("   snapshot.meta:", snap.meta);
      console.log("   snapshot.lista:", snap.lista);
    } catch (e) {
      console.log("   Erro ao ler snapshot:", e);
    }
  }

  console.log("\n✔ INSPEÇÃO FINALIZADA");
};

   /* ============================================================
   * 11. EXECUTAR TREINO DO DIA — GET BACKEND
   * ============================================================ */
  async function executarTreinoDia() {

    const id = localStorage.getItem("femflow_id");
    if (!id) {
      FEMFLOW.error("❌ Sem ID. Faça login novamente.");
      FEMFLOW.toast("Erro: sem ID.", true);
      return;
    }

    FEMFLOW.log("🚀 executando treino do dia…");

    /* ------------------------- ENGINE DO BACKEND ------------------------- */
    const fase = localStorage.getItem("femflow_fase") || "";
    const diaCiclo = localStorage.getItem("femflow_diaCiclo") || "";
    const nivel = localStorage.getItem("femflow_nivel") || "";
    const enfase = localStorage.getItem("femflow_enfase") || "";

    FEMFLOW.log("📡 Engine hormonal:", { fase, diaCiclo, nivel, enfase });

    /* ----------------------------- URL GET ------------------------------- */
    const url =
      `${FEMFLOW.SCRIPT_URL}?` +
      `action=treino&id=${encodeURIComponent(id)}` +
      `&fase=${encodeURIComponent(fase)}` +
      `&diaCiclo=${encodeURIComponent(diaCiclo)}` +
      `&nivel=${encodeURIComponent(nivel)}` +
      `&enfase=${encodeURIComponent(enfase)}`;

    FEMFLOW.log("🔗 URL GET:", url);

    let json = null;

    try {
      const r = await fetch(url);
      const raw = await r.text();
      FEMFLOW.log("📦 RAW BACKEND:", raw);

      json = JSON.parse(raw);
    } catch (err) {
      FEMFLOW.error("❌ Erro ao carregar backend:", err);
      FEMFLOW.toast("Erro no servidor.", true);
      return;
    }

    if (!json || json.status !== "ok") {
      FEMFLOW.error("❌ Backend retornou erro:", json);
      FEMFLOW.toast("Erro ao montar treino.", true);
      return;
    }

    FEMFLOW.log("🧩 BACKEND OK:", json);

    /* ----------------- SALVAR ENGINE NO LOCALSTORAGE --------------------- */
    if (json.fase) localStorage.setItem("femflow_fase", json.fase);
    if (json.diaCiclo) localStorage.setItem("femflow_diaCiclo", json.diaCiclo);

    /* --------------------------- FIREBASE ------------------------------- */
    const pasta = `${nivel}_${enfase}`;
    const faseFirebase = json.fase;
    const diaKey = json.diaKey || `dia_${json.diaCiclo}`;

    FEMFLOW.log("🔥 Firebase Query:", { pasta, faseFirebase, diaKey });

    let listaFirebase = null;
    try {
      listaFirebase = await FEMFLOW._buscarExerciciosTreino(pasta, faseFirebase, diaKey);
    } catch (e) {
      console.error("❌ Firebase erro:", e);
    }

    /* -------------------------- LISTA FINAL ------------------------------ */
    const listaFinal = [];

    if (Array.isArray(json.boxes)) json.boxes.forEach(b => listaFinal.push(b));
    if (Array.isArray(listaFirebase)) listaFirebase.forEach(ex => listaFinal.push(ex));
    if (Array.isArray(json.hiitCardio)) json.hiitCardio.forEach(h => listaFinal.push(h));

    FEMFLOW.log("📦 LISTA FINAL:", listaFinal);

    /* ------------------------ SNAPSHOT OFFLINE --------------------------- */
    salvarSnapshot(
      {
        fase: json.fase,
        diaCiclo: json.diaCiclo,
        diaKey,
        pasta,
        tipo_dia: json.tipo_dia,
        regras: json.regras,
        boxConfig: json.boxConfig
      },
      listaFinal
    );

    /* ------------------------- RENDERIZAR ------------------------------- */
    renderBoxes(listaFinal, {
      fase: json.fase,
      diaCiclo: json.diaCiclo,
      diaKey,
      nivel,
      enfase,
      tipo_dia: json.tipo_dia,
      regras: json.regras,
      boxConfig: json.boxConfig
    });
  }

  /* ============================================================
   * 12. INICIAR TREINO AO CARREGAR A PÁGINA
   * ============================================================ */
  executarTreinoDia();

}); // ← FIM DOMContentLoaded


