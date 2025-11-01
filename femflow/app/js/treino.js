document.addEventListener("DOMContentLoaded", initTreinoPage);

async function initTreinoPage() {
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login para continuar.");
    window.location.href = "ciclo.html";
    return;
  }

  try {
    const url = `${FEMFLOW.SCRIPT_URL}?action=treino&id=${encodeURIComponent(id)}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data || !data.boxes) {
      FEMFLOW.toast("Erro ao carregar treino.");
      return;
    }

    // Header dinâmico (fase, nível, tipoDia)
    const subHeader = document.getElementById("subHeader");
    subHeader.textContent = `Fase ${capitalize(data.fase)} • ${capitalize(data.nivel)} • Dia ${data.diaCiclo} • ${labelTipoDia(data.tipoDia)}`;

    // Badges
    const badges = document.getElementById("badges");
    badges.innerHTML = `
      <span class="pill">🔁 ${labelTipoDia(data.tipoDia)}</span>
      <span class="pill">🩸 ${capitalize(data.fase)}</span>
      <span class="pill">🎯 ${capitalize(data.nivel)}</span>
    `;

    const container = document.getElementById("containerTreino");
    container.innerHTML = "";

    // Render de cada box vindo do JSON
    data.boxes.forEach((box) => {
      const div = document.createElement("div");
      div.className = "box";
      div.innerHTML = `<h2>${box.titulo}</h2>`;

      // Texto motivacional (Box 0 / conexões)
      if (box.tipo === "texto") {
        div.innerHTML += `<p class="motivacional">${box.mensagem || ""}</p>`;
      }

      // Aquecimento / Mobilidade → timer global clicável
      if (/aquecimento|mobilidade/i.test(box.titulo)) {
        const timerGlobal = criarTimerGlobal(
          Number(box.tempo_total) || 300,
          "🕊️ Timer iniciado",
          "✨ Tempo concluído!"
        );
        div.appendChild(timerGlobal);
      }

      // Exercícios (com links e timer de descanso por exercício)
      if (box.tipo === "exercicios" && Array.isArray(box.itens)) {
        box.itens.forEach((ex, idx) => {
          const e = document.createElement("div");
          e.className = "exercicio";

          const repsTxt = formatReps(ex.reps);
          const meta = `${ex.series ? ex.series + " séries" : ""}${ex.series && repsTxt ? " × " : ""}${repsTxt}`;

          e.innerHTML = `
            <div class="row">
              <h4>${idx + 1}. <a href="${ex.link || "#"}" target="_blank" rel="noreferrer">${ex.exercicio || "Exercício"}</a></h4>
              <div class="timer-descanso" title="Toque para iniciar intervalo" data-intervalo="${safeIntervalo(data.fase, data.nivel, data.tipoDia, ex.tempo)}">${safeIntervalo(data.fase, data.nivel, data.tipoDia, ex.tempo)}</div>
            </div>
            <p class="meta">${meta}</p>
          `;

          // liga o timer de descanso
          const btn = e.querySelector(".timer-descanso");
          bindTimerDescanso(btn);

          div.appendChild(e);
        });
      }

      // HIIT
      if (box.tipo === "hiit") {
        div.innerHTML += `
          <div class="hiit">
            <b>${box.titulo}</b><br>
            ${box.descricao || ""}<br>
            <small>⏱️ ${Math.floor((box.tempo_total || 360) / 60)} min</small>
          </div>`;
      }

      // Cardio
      if (box.tipo === "cardio") {
        div.innerHTML += `<p class="motivacional">${box.descricao || box.mensagem || "Cardio leve de 10 minutos."}</p>`;
      }

      // Resfriamento + PSE + Encerrar
      if (box.tipo === "resfriamento") {
        // timer final (5min padrão)
        const timerFinal = criarTimerGlobal(Number(box.tempo_total) || 300, "🌿 Resfriamento iniciado", "✨ Resfriamento concluído");
        div.appendChild(timerFinal);

        // PSE slider
        const pseDiv = document.createElement("div");
        pseDiv.innerHTML = `
          <h3 style="margin-top:1rem;color:var(--teal)">🩶 Esforço Percebido (0–10)</h3>
          <input type="range" id="pseInput" min="0" max="10" value="5">
          <p id="pseLabel" style="font-weight:800;color:var(--terracota)">PSE: 5 — Moderado</p>
          <button id="btnEncerrar" class="btn">💾 Encerrar Treino</button>
        `;
        div.appendChild(pseDiv);

        const range = pseDiv.querySelector("#pseInput");
        const label = pseDiv.querySelector("#pseLabel");
        range.addEventListener("input", () => {
          const v = parseInt(range.value, 10);
          const cor = v <= 3 ? "var(--teal)" : v <= 7 ? "var(--pessego)" : "var(--terracota)";
          const txt = v <= 3 ? "Leve e confortável" : v <= 7 ? "Moderado e consistente" : "Alto esforço — capriche no recovery";
          label.style.color = cor;
          label.textContent = `PSE: ${v} — ${txt}`;
        });

        pseDiv.querySelector("#btnEncerrar").addEventListener("click", async () => {
          const pseVal = parseInt(range.value, 10);
          await FEMFLOW.salvarTreino({
            id,
            fase: data.fase,
            treino: `Dia ${data.diaCiclo} • ${labelTipoDia(data.tipoDia)}`,
            tipo_dia: "treino",
            pse: pseVal,
            observacao: `PSE ${pseVal} • ${label.textContent.replace(/^PSE:\s*\d+\s*—\s*/,'')}`
          });
          vibrarFim();
          FEMFLOW.toast("✅ Treino salvo!");
          setTimeout(() => (window.location.href = "flowcenter.html"), 1500);
        });
      }

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    FEMFLOW.toast("❌ Erro de conexão.");
  }
}

/* =========================
   Helpers visuais e timers
   ========================= */
function criarTimerGlobal(tempoInicial, msgStart, msgEnd) {
  const el = document.createElement("div");
  el.className = "timer-global";
  let tempo = tempoInicial;
  let ativo = false, interval;

  el.textContent = formatMMSS(tempo);
  el.addEventListener("click", () => {
    if (!ativo) {
      ativo = true; FEMFLOW.toast(msgStart);
      interval = setInterval(() => {
        tempo--; el.textContent = formatMMSS(tempo);
        if (tempo <= 0) {
          clearInterval(interval); ativo = false;
          vibrarFim(); FEMFLOW.toast(msgEnd);
          // Reinicia para permitir novo ciclo com 1 toque
          tempo = tempoInicial; el.textContent = formatMMSS(tempo);
        }
      }, 1000);
    } else {
      clearInterval(interval); ativo = false;
      tempo = tempoInicial; el.textContent = formatMMSS(tempo);
      FEMFLOW.toast("🔁 Timer reiniciado");
    }
  });
  return el;
}

function bindTimerDescanso(btn) {
  let t = Number(btn.dataset.intervalo) || 60;
  let ativo = false, interval;
  btn.textContent = t;
  btn.addEventListener("click", () => {
    if (!ativo) {
      ativo = true; btn.classList.add("ativo");
      interval = setInterval(() => {
        t--; btn.textContent = t;
        if (t <= 0) {
          clearInterval(interval); ativo = false;
          btn.classList.remove("ativo");
          vibrarFim(); FEMFLOW.toast("💨 Intervalo concluído");
          // reinicia automaticamente para próximo set
          t = Number(btn.dataset.intervalo) || 60;
          btn.textContent = t;
        }
      }, 1000);
    } else {
      clearInterval(interval); ativo = false;
      btn.classList.remove("ativo");
      t = Number(btn.dataset.intervalo) || 60;
      btn.textContent = t;
      FEMFLOW.toast("🔁 Timer reiniciado");
    }
  });
}

function vibrarFim(){ if (navigator.vibrate) navigator.vibrate([200,140,200]); }
function formatMMSS(s){ const m=Math.floor(s/60), sec=s%60; return `${m}:${String(sec).padStart(2,'0')}`; }
function capitalize(s){ return (s||"").charAt(0).toUpperCase()+ (s||"").slice(1); }

function labelTipoDia(key){
  const map = {
    enfase: "Ênfase",
    peito_triceps: "Peito + Tríceps",
    costas_biceps: "Costas + Bíceps",
    perna_sem_enfase: "Pernas (sem ênfase)",
    core: "Core / Estabilidade"
  };
  return map[key] || "Treino";
}

/**
 * Intervalo “seguro” para descanso entre séries:
 * - se o exercício já veio com tempo (planilha), usa como base (≥30)
 * - senão usa 60s e adapta levemente por fase/tipo do dia
 */
function safeIntervalo(fase, nivel, tipoDia, tempoEx){
  if (Number(tempoEx) >= 30) return Number(tempoEx);
  // fallback simples por fase/tipo (deixa fino se desejar)
  if (/ovulatoria/.test(fase)) return 60;
  if (/folicular/.test(fase)) return 60;
  if (/menstrual/.test(fase)) return 45;
  if (/lutea/.test(fase)) return 60;
  // por tipo
  if (tipoDia === "enfase") return 60;
  return 60;
}

function formatReps(r){
  if (!r) return "";
  const n = Number(r);
  if (!isNaN(n)) return `${n} rep`;
  return String(r);
}

