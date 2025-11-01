// =====================================================
// 🌸 FEMFLOW TREINO JS v2.0
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
  const id = localStorage.getItem('femflow_id');
  if (!id) return (window.location.href = 'ciclo.html');

  const treino = await carregarTreinoDoServidor(id);
  if (!treino) return (window.location.href = 'ciclo.html');

  // Atualiza cabeçalho
  document.getElementById('tituloTreino').innerText = `Dia ${treino.diaCiclo}`;
  document.getElementById('subTreino').innerText = `Fase ${treino.fase}`;

  // Renderiza boxes dinamicamente
  const container = document.getElementById('containerTreino');
  treino.boxes.forEach(box => {
    if (box.tipo === 'aquecimento') renderizarBoxAquecimento(container, box);
    if (box.tipo === 'exercicios') renderizarBoxExercicio(container, box);
    if (box.tipo === 'resfriamento') renderizarBoxResfriamento(container, box);
  });

  // PSE (já integrado com FEMFLOW)
  configurarPSE(id, treino.fase);
});

/* =====================================================
   🔹 BUSCA TREINO NO SERVIDOR
===================================================== */
async function carregarTreinoDoServidor(id) {
  try {
    const resp = await fetch(`${FEMFLOW.SCRIPT_URL}?action=getTreino&id=${id}`);
    const data = await resp.json();
    console.log("🎯 Dados recebidos:", data);
    return data;
  } catch (err) {
    console.error("Erro ao buscar treino:", err);
    FEMFLOW.toast("❌ Falha ao carregar treino.");
    return null;
  }
}

/* =====================================================
   🔹 RENDERIZAR BOX AQUECIMENTO
===================================================== */
function renderizarBoxAquecimento(container, box) {
  const div = document.createElement('div');
  div.className = 'box aquecimento';
  div.innerHTML = `
    <h3>🔥 ${box.titulo}</h3>
    <div class="tip">
      🌿 ${box.texto || "Use este momento para respirar e preparar o corpo. Concentre-se no movimento."}
    </div>
    <div class="ex-lista">
      ${box.itens.map(ex => `
        <div class="ex">
          <div class="ex-head">
            <span>${ex.exercicio}</span>
            <a href="${ex.link}" target="_blank">🎥</a>
          </div>
          <div class="ex-grid">
            <label>Séries</label><input type="number" value="${ex.series}">
            <label>Reps</label><input type="number" value="${ex.reps}">
          </div>
        </div>
      `).join('')}
    </div>
    <div class="timer-box">
      <p>⏳ Tempo total: <span id="tempoRestante">05:00</span></p>
    </div>
  `;
  container.appendChild(div);
  iniciarTimer(300);
}

/* =====================================================
   🔹 TIMER REGRESSIVO 5 MIN
===================================================== */
function iniciarTimer(segundos) {
  const display = document.getElementById("tempoRestante");
  let tempo = segundos;
  const intervalo = setInterval(() => {
    const min = String(Math.floor(tempo / 60)).padStart(2, "0");
    const sec = String(tempo % 60).padStart(2, "0");
    display.textContent = `${min}:${sec}`;
    if (tempo <= 0) {
      clearInterval(intervalo);
      display.textContent = "✅ Concluído!";
      FEMFLOW.toast("🌿 Aquecimento finalizado, siga para o próximo box.");
    }
    tempo--;
  }, 1000);
}

/* =====================================================
   🔹 RENDERIZAR BOX PRINCIPAL
===================================================== */
function renderizarBoxExercicio(container, box) {
  const div = document.createElement('div');
  div.className = 'box treino';
  div.innerHTML = `
    <h3>${box.titulo}</h3>
    ${box.itens.map(ex => `
      <div class="ex">
        <div class="ex-head">
          <span>${ex.exercicio}</span>
          <a href="${ex.link}" target="_blank">🎥</a>
        </div>
        <div class="ex-grid">
          <label>Séries</label><input type="number" value="${ex.series}">
          <label>Reps</label><input type="number" value="${ex.reps}">
        </div>
      </div>
    `).join('')}
  `;
  container.appendChild(div);
}

/* =====================================================
   🔹 RENDERIZAR BOX FINAL
===================================================== */
function renderizarBoxResfriamento(container, box) {
  const div = document.createElement('div');
  div.className = 'box resfriamento';
  div.innerHTML = `
    <h3>${box.titulo}</h3>
    <p>${box.texto || "Respire e alongue-se. Seu corpo agradece. 🧘"}</p>
    <button id="btnSalvarPse">💾 Salvar Treino</button>
  `;
  container.appendChild(div);
}

/* =====================================================
   🔹 CONFIGURAÇÃO DE PSE
===================================================== */
function configurarPSE(id, fase) {
  const btn = document.getElementById('btnSalvarPse');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const pse = parseInt(prompt("Qual foi seu esforço hoje (0–10)?"));
    if (isNaN(pse)) return;
    await FEMFLOW.salvarTreino({ id, fase, tipo_dia: "treino", pse });
    FEMFLOW.toast("✅ Treino salvo!");
  });
}
