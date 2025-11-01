document.addEventListener("DOMContentLoaded", async () => {
  const id = localStorage.getItem("femflow_id");
  if (!id) return (window.location.href = "ciclo.html");

  const url = `${FEMFLOW.SCRIPT_URL}?action=treino&id=${encodeURIComponent(id)}`;
  const resp = await fetch(url);
  const data = await resp.json();

  if (!data || !data.boxes) {
    FEMFLOW.toast("Erro ao carregar treino.");
    return;
  }

  const container = document.querySelector(".container");
  container.innerHTML = "";

  // Cabeçalho
  const header = document.createElement("h2");
  header.innerHTML = `🌸 ${data.fase.toUpperCase()} • ${data.nivel}`;
  container.appendChild(header);

  // Renderiza boxes
  data.boxes.forEach((box) => {
    const div = document.createElement("div");
    div.className = "box";

    if (box.tipo === "texto") {
      div.innerHTML = `<h3>${box.titulo}</h3><p>${box.mensagem}</p>`;
    }

    if (box.tipo === "exercicios") {
      div.innerHTML = `<h3>${box.titulo}</h3>`;
      box.itens.forEach((ex) => {
        const item = document.createElement("div");
        item.className = "exercicio";
        item.innerHTML = `
          <a href="${ex.link}" target="_blank">${ex.exercicio}</a><br>
          <small>${ex.series}x${ex.reps} • ${ex.tempo}s</small>
          <button class="timer-btn" data-time="${ex.tempo}">▶️ Timer</button>
        `;
        div.appendChild(item);
      });
    }

    if (box.tipo === "hiit" || box.tipo === "cardio") {
      div.innerHTML = `<h3>${box.titulo}</h3><p>${box.descricao}</p><button class="timer-btn" data-time="${box.tempo_total}">🔥 Iniciar</button>`;
    }

    if (box.tipo === "resfriamento") {
      div.innerHTML = `<h3>${box.titulo}</h3><p>${box.mensagem}</p><button class="timer-btn" data-time="300">🕊️ Iniciar 5 min</button>`;
    }

    container.appendChild(div);
  });

  // Botão PSE
  const pseDiv = document.createElement("div");
  pseDiv.innerHTML = `
    <h3>Como foi seu esforço hoje?</h3>
    <input type="range" min="0" max="10" value="5" id="pseRange" />
    <p>PSE: <span id="pseValor">5</span></p>
    <button id="btnSalvar">💾 Salvar Treino</button>
  `;
  container.appendChild(pseDiv);

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
    FEMFLOW.toast("Treino salvo! 🌸");
    localStorage.setItem("dia_ciclo", data.diaCiclo + 1);
    setTimeout(() => (window.location.href = "flowcenter.html"), 2000);
  });

  // 🎵 Timer com vibração curta ao final
  container.addEventListener("click", (e) => {
    if (!e.target.classList.contains("timer-btn")) return;
    const tempo = Number(e.target.dataset.time);
    let restante = tempo;
    const btn = e.target;
    btn.disabled = true;

    const int = setInterval(() => {
      btn.textContent = `⏳ ${restante}s`;
      restante--;
      if (restante < 0) {
        clearInterval(int);
        btn.textContent = "✅ Finalizado";
        btn.disabled = false;
        navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  });
});

