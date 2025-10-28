// ===============================
// FemFlow - Memória Local & Sincronização
// ===============================

// 🔹 Salva dados gerais da aluna no localStorage
function salvarMemoria(id, dados) {
  const chave = `femflow_memoria_${id}`;
  let memoria = carregarMemoria(id) || {};
  Object.assign(memoria, dados);
  localStorage.setItem(chave, JSON.stringify(memoria));
}

// 🔹 Carrega memória da aluna
function carregarMemoria(id) {
  const chave = `femflow_memoria_${id}`;
  const memoria = localStorage.getItem(chave);
  return memoria ? JSON.parse(memoria) : null;
}

// 🔹 Salva um treino simples (modo atual - PSE)
function salvarTreino(id, data, fase, diaPrograma, pse) {
  if (!id) {
    console.error("ID inválido para salvar treino.");
    return;
  }

  const chave = `femflow_memoria_${id}`;
  let memoria = carregarMemoria(id);

  // garante inicialização
  if (!memoria) memoria = { treinos: [], ultimoTreino: 1 };
  if (!memoria.treinos) memoria.treinos = [];

  // 🔸 Impede registro acima de 30 dias
  if (diaPrograma > 30) {
    alert("✨ Você já concluiu o seu ciclo de 30 dias FemFlow!");
    verificarAutoReinicio(id, memoria);
    return;
  }

  // adiciona o novo treino
  memoria.treinos.push({ data, fase, diaPrograma, pse });
  memoria.ultimoTreino = diaPrograma;
  memoria.dataUltimoTreino = new Date().toISOString();
  localStorage.setItem(chave, JSON.stringify(memoria));

  console.log(`💾 Treino salvo localmente (${memoria.treinos.length} registrados)`);

  // 🔹 Mensagem de conclusão no dia 30
  if (diaPrograma === 30) {
    alert("🌸 Parabéns! Você concluiu seu ciclo de 30 dias FemFlow.\nRespire, celebre e prepare-se para o próximo ciclo!");
    memoria.dataConclusao = new Date().toISOString();
    salvarMemoria(id, memoria);
  }

  // 🔹 Envia dados ao Google Sheets (Apps Script)
  fetch('https://script.google.com/macros/s/AKfycbyovJHpMBqGhKmGFSePjHk-v5xAk8XB9NEfBG735nZjSz08f-jMfKE3OMkPVIZHObb0/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, data, fase, diaPrograma, pse })
  })
  .then(res => {
    if (!res.ok && res.type !== 'opaque') {
      throw new Error(`Erro HTTP ${res.status}`);
    }
    console.log("✅ Sincronizado com servidor (modo simples).");
  })
  .catch(err => {
    console.warn("⚠️ Falha ao sincronizar com servidor:", err);
  });
}

// 🔹 Salva treino detalhado (com lista de exercícios, séries, peso, PSE)
function salvarTreinoDetalhado(id, fase, apelido, pse) {
  if (!id) {
    alert("ID inválido. Faça login novamente.");
    return;
  }

  const dataISO = new Date().toISOString();
  const boxes = document.querySelectorAll(".box");
  const exercicios = [];

  boxes.forEach((box, idx) => {
    box.querySelectorAll(".ex").forEach(ex => {
      const linkEl = ex.querySelector("a");
      if (!linkEl) return;
      const nome = linkEl.textContent.trim();
      const link = linkEl.href;
      const texto = ex.textContent;
      const match = texto.match(/(\d+)\s*[x×]\s*(\d+|[\d]+s)/i);
      const series = match ? match[1] : "";
      const reps = match ? match[2] : "";
      const peso = ex.querySelector(".peso")?.value?.trim() || "";
      exercicios.push({ box: idx + 1, nome, link, series, reps, peso });
    });
  });

  if (!exercicios.length) {
    alert("Nenhum exercício encontrado para salvar.");
    return;
  }

  // salva localmente
  salvarTreino(id, dataISO, fase, "dia", pse);

  // envia ao servidor com action: treino_detalhado
  fetch('https://script.google.com/macros/s/AKfycbyovJHpMBqGhKmGFSePjHk-v5xAk8XB9NEfBG735nZjSz08f-jMfKE3OMkPVIZHObb0/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: "treino_detalhado",
      id,
      data: dataISO,
      fase,
      apelido,
      pse,
      exercicios
    })
  })
  .then(res => {
    if (!res.ok && res.type !== 'opaque') throw new Error(`HTTP ${res.status}`);
    alert("✅ Treino detalhado salvo com sucesso!");
  })
  .catch(err => {
    console.warn("⚠️ Erro ao enviar treino detalhado:", err);
    alert("Falha ao sincronizar com o servidor. Tente novamente.");
  });
}

// 🔹 Sincroniza pesos antigos (preenche inputs automaticamente)
async function sincronizarPesos(id) {
  if (!id) return;
  try {
    const resp = await fetch(`https://script.google.com/macros/s/AKfycbyovJHpMBqGhKmGFSePjHk-v5xAk8XB9NEfBG735nZjSz08f-jMfKE3OMkPVIZHObb0/exec?action=evolucao&id=${id}`);
    if (!resp.ok && resp.type !== "opaque") throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const ultimos = data.ultimo || {};

    document.querySelectorAll(".ex").forEach(ex => {
      const nome = ex.textContent.split("—")[0].trim();
      const pesoInput = ex.querySelector(".peso");
      if (ultimos[nome] && pesoInput) {
        pesoInput.value = ultimos[nome].peso || "";
      }
    });

    console.log("📈 Pesos sincronizados com sucesso.");
  } catch (err) {
    console.warn("⚠️ Erro ao sincronizar pesos:", err);
  }
}

// 🔹 Auto-reinício inteligente de ciclo (3 dias após o último treino)
function verificarAutoReinicio(id, memoria) {
  if (!memoria || !memoria.dataConclusao) return;

  const dataConclusao = new Date(memoria.dataConclusao);
  const hoje = new Date();
  const diasPassados = Math.floor((hoje - dataConclusao) / (1000 * 60 * 60 * 24));

  if (diasPassados >= 3) {
    alert("🌀 Novo ciclo disponível!\nO aplicativo detectou que seu último ciclo terminou há 3 dias.\nSeu programa foi reiniciado automaticamente.");
    limparMemoria(id);
    localStorage.setItem(`femflow_reiniciado_${id}`, new Date().toISOString());
  } else {
    const restantes = 3 - diasPassados;
    console.log(`⏳ O próximo ciclo será reiniciado automaticamente em ${restantes} dia(s).`);
  }
}

// 🔹 Retorna percentual de progresso (para evolução.html)
function calcularProgresso(id, totalTreinos = 30) {
  const memoria = carregarMemoria(id);
  if (!memoria || !memoria.treinos) return 0;
  const concluido = memoria.treinos.length;
  return Math.min(Math.round((concluido / totalTreinos) * 100), 100);
}

// 🔹 Reseta memória (manual)
function limparMemoria(id) {
  const chave = `femflow_memoria_${id}`;
  localStorage.removeItem(chave);
  console.log(`🧹 Memória apagada para ID: ${id}`);
  alert("🌀 Memória do ciclo reiniciada. Você pode começar um novo programa.");
}

// 🔹 Exporta memória em arquivo JSON (backup opcional)
function exportarMemoria(id) {
  const memoria = carregarMemoria(id);
  if (!memoria) {
    alert("Nenhuma memória encontrada para exportar.");
    return;
  }
  const blob = new Blob([JSON.stringify(memoria, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `femflow_memoria_${id}.json`;
  link.click();
  console.log("📦 Memória exportada com sucesso.");
}

