/* ============================================================
   FEMFLOW — treino.js v3.6 (Modelo B FINAL)
   ------------------------------------------------------------
   - Render cards compactos (Box B)
   - Séries / Reps / Descanso em linha (ff-info-line)
   - Botão "Iniciar descanso" / "Iniciar cardio"
   - HIIT em bolha estilo respiração (play/pause no círculo)
   - Menu HIIT: Academia / Casa (toggle)
   - Modal Respiração sheet iOS, com play/pause
   - Footer fixo sem cobrir o card (usa padding-bottom no CSS)
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  FEMFLOW.log("🚀 treino.js v3.6 iniciado!");

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.", true);
    location.href = "index.html";
    return;
  }

  /* ---------- ELEMENTOS FIXOS DA PÁGINA ---------- */
  const track           = document.querySelector("#carouselTrack");
  const tituloDia       = document.querySelector("#tituloDiaTreino");
  const footer          = document.querySelector(".fix-footer");

  const btnSalvar       = document.getElementById("salvarTreinoBtn");
  const btnDescanso     = document.getElementById("descansoBtn");
  const btnCancelar     = document.getElementById("cancelarTreinoBtn");

  const modalPSE        = document.getElementById("modalPSE");
  const pseInput        = document.getElementById("pseInput");
  const btnConfirmarPSE = document.getElementById("btnConfirmarPSE");
  const btnCancelarPSE  = document.getElementById("btnCancelarPSE");

  const breathBackdrop  = document.getElementById("breathBackdrop");
  const breathSheet     = document.getElementById("breathModal");
  const breathStartBtn  = document.getElementById("btnStart");
  const breathCloseBtn  = document.getElementById("btnRespClose");
  const breathCircle    = document.getElementById("breathCircle");
  const breathPhaseLbl  = document.getElementById("faseLabel");

  if (!track) {
    FEMFLOW.error("❌ #carouselTrack não encontrado em treino.html");
    return;
  }

  /* ============================================================
     1. ESPERA O BACKEND TERMINAR (femflow:ready)
  ============================================================ */
  window.addEventListener("femflow:ready", async (ev) => {
    const perfil = ev.detail;

    if (!perfil) {
      FEMFLOW.toast("Erro ao carregar perfil", true);
      return;
    }

    const fase     = perfil.fase;
    const enfase   = perfil.enfase;
    const nivel    = perfil.nivel;
    const diaCiclo = perfil.diaCiclo;

    const diaPrograma = FEMFLOW.calcularDiaPrograma();
    if (tituloDia) tituloDia.textContent = `Dia ${diaPrograma}`;

    if (!FEMFLOW.engineTreino || !FEMFLOW.engineTreino.montarTreino) {
      FEMFLOW.error("FEMFLOW.engineTreino.montarTreino não está definido.");
      FEMFLOW.toast("Erro interno do treino (engine).", true);
      return;
    }

    const lista = await FEMFLOW.engineTreino.montarTreino({
      nivel,
      enfase,
      fase,
      diaCiclo
    });

    renderTreino(lista);
  });

  /* ============================================================
     2. RENDERIZAÇÃO COMPLETA DOS BOXES
  ============================================================ */

  function fmtTime(seg) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function renderTreino(lista) {
    track.innerHTML = "";

    if (!lista || !lista.length) {
      track.innerHTML = `
        <div class="carousel-item">
          <p>Nenhum treino disponível para hoje.</p>
        </div>
      `;
      return;
    }

    lista.forEach((box) => {
      let html = `<div class="carousel-item">`;

      switch (box.tipo) {

        /* ================== AQUECIMENTO ================== */
        case "aquecimentoPremium":
          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">${box.descricao}</p>
            <ul class="ff-passos">
              ${
                box.passos
                  .map(p => `
                    <li data-desc="${p.desc || ""}">${p.nome}</li>
                  `)
                  .join("")
              }
            </ul>
            <button class="ff-btn-protocolo ff-resp-btn"
        data-proto="wake" data-origem="aquecimento">
  <span class="icon">💨</span>
  <span>Respiração Wake</span>
</button>
          `;
        break;

        /* ================== TREINO (BOXES DO FIREBASE) ================== */
        case "treino":
          html += `<h2 class="ff-ex-titulo">Box ${box.box}</h2>`;

          box.exercicios.forEach(ex => {
            const titulo  = ex.titulo || ex.nome || "Exercício";
            const youtube = ex.youtube || ex.link || "#";

            const intervalSeg = Number(ex.intervalo) || 60;

            html += `
              <div class="ff-ex-item">
                <div class="ff-ex-top">
                  <div class="ff-ex-nome">
                    <a href="${youtube}" ${youtube !== "#" ? 'target="_blank" rel="noopener"' : ""}>
                      ${titulo}
                    </a>
                  </div>

                  <input class="ff-ex-peso"
                         type="number"
                         placeholder="kg"
                         data-ex="${titulo}">
                </div>

                <div class="ff-info-line">
                  <span>🌀 <b>${ex.series}</b>x</span>
                  <span>🔁 <b>${ex.reps}</b></span>
                  <span>⏱️ <b>${intervalSeg}s</b></span>
                </div>

                <div class="ff-descanso-wrap">
                  <button class="ff-descanso-btn">
                    ▶️ Iniciar descanso
                  </button>
                  <span class="ff-timer-count">${fmtTime(intervalSeg)}</span>
                  <div class="ff-timer-bar" data-timer="${intervalSeg}">
                    <div class="ff-timer-fill"></div>
                  </div>
                </div>
              </div>
            `;
          });
        break;

        /* ================== HIIT PREMIUM ================== */
        case "hiitPremium": {
          const est  = Number(box.estimulo) || 40;
          const rec  = Number(box.descanso) || 20;
          const cyc  = Number(box.ciclos)   || 6;

          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">
              ${box.descricao || `Ciclo: ${est}s forte + ${rec}s leve.`}
            </p>

            <div class="hiit-bubble">
              <div class="breath-circle hiit-circle"
                   data-estimulo="${est}"
                   data-descanso="${rec}"
                   data-ciclos="${cyc}">
                ▶
              </div>
              <div class="breath-phase hiit-phase">
                Toque no círculo para iniciar
              </div>
            </div>

            <button class="ff-descanso-btn hiit-opcoes-btn">
              ⚙️ Opções de exercício
            </button>

            <div class="hiit-opcoes hidden">
              <p><b>Academia</b></p>
              ${
                (box.cardsAcademia || [])
                  .map(c => `
                    <div class="hiit-card">
                      <span class="hiit-card-icon">${c.icon || "🏃‍♀️"}</span>
                      <span>${c.nome}</span>
                    </div>
                  `)
                  .join("")
              }
              <p style="margin-top:10px;"><b>Casa</b></p>
              ${
                (box.cardsCasa || [])
                  .map(c => `
                    <div class="hiit-card">
                      <span class="hiit-card-icon">${c.icon || "⭐"}</span>
                      <span>${c.nome}</span>
                    </div>
                  `)
                  .join("")
              }
            </div>
          `;
        }
        break;

        /* ================== CARDIO ================== */
        case "cardio": {
          const total = Number(box.tempo_total) || 600;

          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">${box.descricao}</p>

            <div class="ff-descanso-wrap">
              <button class="ff-descanso-btn">
                ▶️ Iniciar cardio
              </button>
              <span class="ff-timer-count">${fmtTime(total)}</span>
              <div class="ff-timer-bar" data-timer="${total}">
                <div class="ff-timer-fill"></div>
              </div>
            </div>
          `;
        }
        break;

        /* ================== RESFRIAMENTO ================== */
        case "resfriamentoPremium":
          html += `
            <h2 class="ff-ex-titulo">${box.titulo}</h2>
            <p class="ff-ex-sub">${box.descricao}</p>

            <ul class="ff-passos">
              ${
                box.passos
                  .map(p => `
                    <li data-desc="${p.desc || ""}">${p.nome}</li>
                  `)
                  .join("")
              }
            </ul>

           <button class="ff-btn-protocolo ff-resp-btn"
        data-proto="release" data-origem="resfriamento">
  <span class="icon">🌬️</span>
  <span>Respiração Release</span>
</button>

          `;
        break;
      }

      html += `</div>`;
      track.insertAdjacentHTML("beforeend", html);
    });

    initTimers();
    initHIIT();
    initBreathing();
    initPeso();
  }

  /* ============================================================
     3. TIMERS — DESCANSO / CARDIO
  ============================================================ */
  function initTimers() {
    document.querySelectorAll(".ff-descanso-wrap").forEach(wrap => {
      const btn   = wrap.querySelector(".ff-descanso-btn");
      const bar   = wrap.querySelector(".ff-timer-bar");
      const fill  = bar?.querySelector(".ff-timer-fill");
      const label = wrap.querySelector(".ff-timer-count");

      if (!btn || !bar || !fill || !label) return;

      const total = Number(bar.dataset.timer) || 60;
      let restante = total;
      let rodando  = false;
      let intv     = null;

      label.textContent = fmtTime(restante);
      fill.style.width  = "100%";

      btn.onclick = () => {
        if (rodando) {
          // pausa
          rodando = false;
          btn.textContent = "▶️ Retomar";
          clearInterval(intv);
          return;
        }

        // iniciar / retomar
        rodando = true;
        btn.textContent = "⏸️ Pausar";

        if (restante <= 0) {
          // se já terminou antes, reinicia
          restante = total;
        }

        clearInterval(intv);
        intv = setInterval(() => {
          if (!rodando) return;

          restante--;
          if (restante < 0) restante = 0;

          label.textContent = fmtTime(restante);
          fill.style.width  = `${(restante / total) * 100}%`;

          if (restante <= 0) {
            clearInterval(intv);
            rodando = false;
            btn.textContent = "✔️ Finalizado";
          }
        }, 1000);
      };
    });
  }

  /* ============================================================
     4. HIIT — BOLHA COM PLAY/PAUSE NO CÍRCULO
  ============================================================ */
  function initHIIT() {
    // Mostrar / ocultar menu de opções
    document.querySelectorAll(".hiit-opcoes-btn").forEach(btn => {
      btn.onclick = () => {
        const card = btn.closest(".carousel-item");
        const box  = card?.querySelector(".hiit-opcoes");
        if (box) box.classList.toggle("hidden");
      };
    });

    // Círculo principal (play/pause)
    document.querySelectorAll(".hiit-circle").forEach(circle => {
      const card  = circle.closest(".carousel-item");
      const phase = card?.querySelector(".hiit-phase");
      if (!phase) return;

      const forteBase = Number(circle.dataset.estimulo) || 40;
      const leveBase  = Number(circle.dataset.descanso) || 20;
      const ciclosMax = Number(circle.dataset.ciclos)   || 6;

      let forte   = forteBase;
      let leve    = leveBase;
      let tempo   = forte;
      let modo    = "forte";       // "forte" ou "leve"
      let ciclo   = 1;
      let rodando = false;
      let intv    = null;

      circle.textContent = "▶";
      phase.textContent  = "Toque para iniciar";

      function atualizarLabel() {
        if (modo === "forte") {
          phase.textContent = `Força (${ciclo}/${ciclosMax})`;
        } else {
          phase.textContent = `Recuperar (${ciclo}/${ciclosMax})`;
        }
      }

      function pararIntervalo() {
        if (intv) clearInterval(intv);
        intv = null;
      }

      function iniciar() {
        if (rodando) return;

        rodando = true;
        circle.classList.remove("paused");
        if (tempo <= 0) tempo = modo === "forte" ? forte : leve;

        atualizarLabel();
        circle.textContent = tempo;

        pararIntervalo();
        intv = setInterval(() => {
          if (!rodando) return;

          tempo--;
          circle.textContent = tempo;

          if (tempo <= 0) {
            if (modo === "forte") {
              modo  = "leve";
              tempo = leve;
              atualizarLabel();
            } else {
              // terminou o leve → próximo ciclo
              ciclo++;
              if (ciclo > ciclosMax) {
                // terminou tudo
                pararIntervalo();
                rodando = false;
                circle.textContent = "✔";
                phase.textContent  = "HIIT concluído";
                circle.classList.add("paused");
                return;
              }
              modo  = "forte";
              tempo = forte;
              atualizarLabel();
            }
          }
        }, 1000);
      }

      function pausar() {
        rodando = false;
        circle.classList.add("paused");
        phase.textContent = "Pausado — toque para retomar";
        pararIntervalo();
      }

      circle.onclick = () => {
        // Se acabou tudo e a usuária tocar de novo → reinicia HIIT
        if (!rodando && ciclo > ciclosMax) {
          ciclo = 1;
          modo  = "forte";
          tempo = forteBase;
          circle.textContent = "▶";
          phase.textContent  = "Toque para iniciar";
          circle.classList.remove("paused");
          return;
        }

        if (!rodando && tempo === forteBase && ciclo === 1 && modo === "forte") {
          // Início pela primeira vez
          iniciar();
          return;
        }

        if (rodando) {
          pausar();
        } else {
          iniciar();
        }
      };
    });
  }

  /* ============================================================
     5. RESPIRAÇÃO — MODAL SHEET iOS
  ============================================================ */
  function initBreathing() {
    // Botões dentro dos cards (aquecimento / resfriamento)
    document.querySelectorAll("[data-proto]").forEach(btn => {
      btn.onclick = () => abrirBreathing(btn.dataset.proto || "wake");
    });

    if (!breathBackdrop || !breathSheet || !breathStartBtn ||
        !breathCloseBtn || !breathCircle || !breathPhaseLbl) {
      FEMFLOW.warn("Modal de respiração não encontrado em treino.html");
      return;
    }

    let intv  = null;
    let state = "stopped"; // "stopped" | "running" | "paused"
    let tempo = 0;

    function abrirBreathing(proto) {
      if (footer) footer.style.display = "none";

      breathBackdrop.classList.remove("hidden");
      breathSheet.classList.remove("hidden");
      setTimeout(() => breathSheet.classList.add("visible"), 10);

      if (proto === "wake") {
        tempo = 4;
        breathPhaseLbl.textContent = "Inspirar";
      } else {
        tempo = 6;
        breathPhaseLbl.textContent = "Soltar o ar";
      }

      breathCircle.textContent = tempo;
      state = "stopped";
      breathStartBtn.textContent = "Iniciar";
    }

    function iniciarCiclo() {
      clearInterval(intv);

      intv = setInterval(() => {
        if (state !== "running") return;

        tempo--;
        breathCircle.textContent = tempo;

        if (tempo <= 0) {
          if (breathPhaseLbl.textContent === "Inspirar") {
            tempo = 2;
            breathPhaseLbl.textContent = "Segurar";
          } else if (breathPhaseLbl.textContent === "Segurar") {
            tempo = 4;
            breathPhaseLbl.textContent = "Soltar";
          } else {
            tempo = 4;
            breathPhaseLbl.textContent = "Inspirar";
          }
          breathCircle.textContent = tempo;
        }
      }, 1000);
    }

    breathStartBtn.onclick = () => {
      if (state === "running") {
        state = "paused";
        breathStartBtn.textContent = "Retomar";
        clearInterval(intv);
        return;
      }

      if (state === "paused") {
        state = "running";
        breathStartBtn.textContent = "Pausar";
        iniciarCiclo();
        return;
      }

      state = "running";
      breathStartBtn.textContent = "Pausar";
      iniciarCiclo();
    };

    breathCloseBtn.onclick = () => {
      clearInterval(intv);
      state = "stopped";
      breathSheet.classList.remove("visible");
      breathBackdrop.classList.add("hidden");
      setTimeout(() => {
        breathSheet.classList.add("hidden");
        if (footer) footer.style.display = "flex";
      }, 250);
    };
  }

  /* ============================================================
     6. SALVAR PESO POR EXERCÍCIO (stub)
  ============================================================ */
  function initPeso() {
    document.querySelectorAll(".ff-ex-peso").forEach(inp => {
      inp.addEventListener("change", () => {
        FEMFLOW.log("Peso alterado:", inp.dataset.ex, inp.value);
        // futuro: mandar pro Firestore / backend
      });
    });
  }

 /* ============================================================
     7. SALVAR TREINO — integração com GAS salvarTreino_
  ============================================================ */
  if (btnSalvar && modalPSE) {
    btnSalvar.onclick = () => {
      modalPSE.classList.remove("hidden");
    };
  }

  if (btnCancelarPSE && modalPSE) {
    btnCancelarPSE.onclick = () => modalPSE.classList.add("hidden");
  }

  if (btnConfirmarPSE && modalPSE && pseInput) {
    btnConfirmarPSE.onclick = async () => {

      const id   = localStorage.getItem("femflow_id");
      const fase = localStorage.getItem("femflow_fase");
      const diaFirebase = Number(localStorage.getItem("femflow_diaCiclo") || 1);
      const pse  = Number(pseInput.value || 0);

      if (!id) {
        FEMFLOW.toast("Erro: sem ID.", true);
        return;
      }

      try {
        const resposta = await fetch(FEMFLOW.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "salvarTreino",
            id,
            fase,
            diaFirebase,
            pse,
            treino: "",
            obs: ""
          })
        }).then(r => r.json());

        FEMFLOW.log("📌 Resposta salvarTreino:", resposta);

        if (resposta.status === "ok") {

          if (resposta.novaFase) {
            localStorage.setItem("femflow_fase", resposta.novaFase);
          }

          if (resposta.novoDiaCiclo) {
            localStorage.setItem("femflow_diaCiclo", resposta.novoDiaCiclo);
          }

          FEMFLOW.toast("Treino salvo com sucesso!");
        } else {
          FEMFLOW.toast("Erro ao salvar treino.", true);
        }

      } catch (e) {
        FEMFLOW.error("Erro salvar treino:", e);
        FEMFLOW.toast("Erro de conexão.", true);
      }

      modalPSE.classList.add("hidden");
    };
  }

  if (btnDescanso) {
    btnDescanso.onclick = async () => {

      const id = localStorage.getItem("femflow_id");

      if (!id) {
        FEMFLOW.toast("Erro: sem ID.", true);
        return;
      }

      try {
        const resposta = await fetch(FEMFLOW.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "salvarDescanso",
            id
          })
        }).then(r => r.json());

        FEMFLOW.log("📌 Resposta descanso:", resposta);
        FEMFLOW.toast("Descanso registrado!");

      } catch (e) {
        FEMFLOW.error("Erro descanso:", e);
        FEMFLOW.toast("Erro ao salvar descanso.", true);
      }
    };
  }

}); // ← FECHAMENTO DO DOMContentLoaded
