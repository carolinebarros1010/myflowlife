// ============================================================
// 🌸 FemFlow — Treino Diário Inteligente (v2025)
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("femflow_id");
  if (!id) return (window.location.href = "ciclo.html");

  const url = `${FEMFLOW.SCRIPT_URL}?action=treino&id=${encodeURIComponent(id)}`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (!data || !data.boxes) {
    FEMFLOW.toast("❌ Erro ao carregar treino. Tente novamente.");
    return;
  }

  const container = document.querySelector(".container");
  container.innerHTML = "";

  // Cabeçalho do treino
  const titulo = document.createElement("h2");
  titulo.innerHTML = `🌿 Fase ${data.fase.toUpperCase()} • ${data.nivel}`;
  container.appendChild(titulo);

  // Renderiza os boxes vindos do App Script
  data.boxes.forEach((box) => {
    const div = document.createElement("div");
    div.className = "box";

    if (box.tipo === "texto") {
      div.innerHTML = `<h3>${box.titulo}</h3><p>${box.mensagem}</p>`;
    }

    if (box.tipo === "exercicios") {
      div.innerHTML = `<h3>${box.titulo}</h3>`;
      box.itens.forEach((ex) => {
        const exDiv = document.createElement("div");
        exDiv.className = "exercicio";
        exDiv.innerHTML = `
          <a href="${ex.link}" target="_blank">${ex.exercicio}</a>
          <small>${ex.series} séries × ${ex.reps} repetições • ${ex.tempo}s</small>
          <button class="timer-btn" data-time="${ex.tempo}">▶️ Iniciar</button>
        `;
        div.appendChild(exDiv);
      });
    }

    if (box.tipo === "hiit" || box.tipo === "cardio") {
      div.innerHTML = `<h3>${box.titulo}</h3><p>${box.descricao}</p>
      <button class="timer-btn" data-time="${box.tempo_total}">🔥 Iniciar</button>`;
    }

    if (box.tipo === "resfriamento") {
      div.innerHTML = `<h3>${box.titulo}</h3>
      <p>${box.mensagem || "Respire fundo e caminhe por 5 minutos."}</p>
      <button class="timer-btn" data-time="300">🕊️ Iniciar 5 min</button>`;
    }

    container.appendChild(div);
  });

  // ------------------------------------------------------------
  // 🔹 BLOCO DE PSE E FINALIZAÇÃO
  // ------------------------------------------------------------
  const pseBox = document.createElement("div");
  pseBox.className = "pse-box";
  pseBox.innerHTML = `
    <h3>Como foi seu esforço hoje?</h3>
    <input type="range" min="0" max="10" value="5" id="pseRange" />
    <p>PSE: <span id="pseValor">5</span></p>
    <button id="btnSalvar">💾 Salvar Treino</button>
  `;
  container.appendChild(pseBox);

  document.getElementById("pseRange").addEventListener("input", (e) => {
    document.getElementById("pseValor").innerText = e.target.value;
  });

  document.getElementById("btnSalvar").addEventListener("click", async () => {
    const pse = document.getElementById("pseRange").value;
    await FEMFLOW.salvarTreino({
      id,
      fase: data.fase,
      tipo_dia: "treino",
      pse
    });
    FEMFLOW.toast("✔️ Treino salvo com sucesso!");
    setTimeout(() => (window.location.href = "flowcenter.html"), 2000);
  });

  // ------------------------------------------------------------
  // 🔹 TIMER COM VIBRAÇÃO SUAVE (intervalos e resfriamento)
  // ------------------------------------------------------------
  container.addEventListener("click", (e) => {
    if (!e.target.classList.contains("timer-btn")) return;
    const tempo = Number(e.target.dataset.time);
    let restante = tempo;
    const btn = e.target;
    btn.disabled = true;

    const int = setInterval(() => {
      btn.textContent = `⏳ ${restante}s`;
      restante--;
      if (restante <= 0) {
        clearInterval(int);
        btn.textContent = "✅ Finalizado";
        btn.disabled = false;
        // vibração curta
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  });
});


