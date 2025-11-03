// scripts/treino.js
document.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.");
    location.href = "ciclo.html";
    return;
  }

  try {
    // 🔹 Dados de referência local
    const fase = localStorage.getItem("fase_atual") || "folicular";
    const nivel = localStorage.getItem("nivel_atual") || "iniciante";
    const diaCiclo = Number(localStorage.getItem("dia_ciclo") || 1);
    const diaKey = `dia_${diaCiclo}`;

    // 🔹 Busca exercícios no Firestore
    const exercicios = await FEMFLOW.buscarExerciciosFirebase(nivel, fase, diaKey);
    if (!exercicios.length) {
      FEMFLOW.toast("⚠️ Nenhum exercício encontrado para hoje.", true);
      return;
    }

    // 🔹 Monta estrutura simulando payload padrão do Apps Script
    const data = {
      fase,
      nivel,
      diaCiclo,
      regras: { foco: "auto", intervalo: 60 },
      boxes: [
        { tipo: "texto", titulo: "🌿 Boas-vindas", mensagem: "Sinta o corpo, mantenha a respiração nasal e entre no seu flow." },
        { tipo: "exercicios", titulo: "Treino do Dia", itens: exercicios },
        { tipo: "resfriamento", titulo: "Box Final — Resfriamento e PSE", tempo_total: 180 }
      ]
    };

    const container = document.getElementById("containerTreino");
    container.innerHTML = "";

    // 🔹 Cabeçalho
    const head = document.createElement("div");
    head.className = "box";
    head.innerHTML = `
      <h2>🌸 ${data.fase.toUpperCase()} • ${data.nivel}</h2>
      <p class="motivacional">Dia ${data.diaCiclo} — foco: ${data.regras.foco}</p>`;
    container.appendChild(head);

    // 🔹 Render boxes
    data.boxes.forEach(box => {
      const div = document.createElement("div");
      div.className = "box";
      div.innerHTML = `<h2>${box.titulo}</h2>`;

      if (box.tipo === "texto") {
        div.innerHTML += `<p class="motivacional">${box.mensagem}</p>`;
      }

      if (/aquecimento|mobilidade|resfriamento/i.test(box.titulo) && (box.tempo_total || 0) > 0) {
        div.appendChild(criarTimerGlobal(box.tempo_total, "⏱️ Timer iniciado", "✨ Concluído"));
      }

      if (box.tipo === "exercicios" && Array.isArray(box.itens)) {
        box.itens.forEach((ex, i) => {
          const item = document.createElement("div");
          item.className = "exercicio";
          item.innerHTML = `
            <h4>${i + 1}. <a href="${ex.link || "#"}" target="_blank" rel="noopener">${ex.exercicio || ex.nome}</a></h4>
            <p>🔁 ${ex.series || 3} séries × ${ex.reps || 12} reps</p>
          `;
          item.appendChild(criarTimerDescanso(ex.tempo || data.regras.intervalo || 60));
          div.appendChild(item);
        });
      }

      // 🔹 Box Final (PSE)
      if (box.tipo === "resfriamento") {
        const pseWrap = document.createElement("div");
        pseWrap.innerHTML = `
          <h3 style="margin-top:1.1rem;color:var(--teal)">🩶 Esforço Percebido (0–10)</h3>
          <input type="range" id="pseInput" min="0" max="10" value="5" style="width:100%;accent-color:var(--terracota)">
          <p id="pseLabel" style="font-weight:700;color:var(--pessego)">PSE: 5 — Moderado</p>
        `;
        div.appendChild(pseWrap);

        const range = pseWrap.querySelector("#pseInput");
        const label = pseWrap.querySelector("#pseLabel");
        range.addEventListener("input", () => {
          const v = parseInt(range.value, 10);
          const cor = v <= 3 ? "var(--teal)" : v <= 7 ? "var(--pessego)" : "var(--terracota)";
          const txt = v <= 3 ? "Leve e confortável" : v <= 7 ? "Moderado e consistente" : "Alto esforço — recupere bem";
          label.style.color = cor;
          label.textContent = `PSE: ${v} — ${txt}`;
        });

        const salvar = document.createElement("button");
        salvar.className = "btn";
        salvar.textContent = "💾 Encerrar Treino";
        salvar.addEventListener("click", async () => {
          const pseVal = parseInt(range.value, 10);
          await FEMFLOW.salvarTreino({
            id,
            fase: data.fase,
            treino: `Dia ${data.diaCiclo} - ${data.fase}`,
            tipo_dia: "treino",
            pse: pseVal,
            observacao: `PSE ${pseVal} (${label.textContent.split("—")[1]?.trim() || ""})`
          });
          FEMFLOW.toast("✅ Treino salvo!");
          vibrarFim();
          setTimeout(() => (location.href = "flowcenter.html"), 1500);
        });
        div.appendChild(salvar);
      }

      container.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar treino:", err);
    FEMFLOW.toast("❌ Erro de conexão.");
  }

  /* ---------- Helpers ---------- */
  function criarTimerGlobal(tempoInicial, msgStart, msgEnd) {
    const wrap = document.createElement("div");
    wrap.className = "timer-global";
    let t = tempoInicial,
      ativo = false,
      int = null;
    wrap.textContent = formatar(t);
    wrap.addEventListener("click", () => {
      if (!ativo) {
        ativo = true;
        FEMFLOW.toast(msgStart);
        int = setInterval(() => {
          t--;
          wrap.textContent = formatar(t);
          if (t <= 0) {
            clearInterval(int);
            ativo = false;
            vibrarFim();
            FEMFLOW.toast(msgEnd);
          }
        }, 1000);
      } else {
        clearInterval(int);
        ativo = false;
        t = tempoInicial;
        wrap.textContent = formatar(t);
        FEMFLOW.toast("🔁 Timer reiniciado");
      }
    });
    return wrap;
  }

  function criarTimerDescanso(seg = 60) {
    const btn = document.createElement("div");
    btn.className = "timer-descanso";
    let t = seg,
      ativo = false,
      int = null;
    btn.textContent = t;
    btn.addEventListener("click", () => {
      if (!ativo) {
        ativo = true;
        btn.classList.add("ativo");
        int = setInterval(() => {
          t--;
          btn.textContent = t;
          if (t <= 0) {
            clearInterval(int);
            ativo = false;
            btn.classList.remove("ativo");
            t = seg;
            btn.textContent = t;
            vibrarFim();
            FEMFLOW.toast("💨 Intervalo concluído");
          }
        }, 1000);
      } else {
        clearInterval(int);
        ativo = false;
        btn.classList.remove("ativo");
        t = seg;
        btn.textContent = t;
        FEMFLOW.toast("🔁 Timer reiniciado");
      }
    });
    return btn;
  }

  function formatar(s) {
    const m = Math.floor(s / 60),
      ss = s % 60;
    return `${m}:${String(ss).padStart(2, "0")}`;
  }

  function vibrarFim() {
    if (navigator.vibrate) {
      navigator.vibrate([200, 150, 200]);
    }
  }
});
