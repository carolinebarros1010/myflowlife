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

// 🔹 Salva um treino no histórico local e envia ao servidor
function salvarTreino(id, data, fase, diaPrograma, pse) {
  if (!id) return console.error("ID inválido para salvar treino.");

  const chave = `femflow_memoria_${id}`;
  let memoria = carregarMemoria(id);

  // garante inicialização
  if (!memoria) {
    memoria = { treinos: [], ultimoTreino: 1 };
  }

  // adiciona o novo treino
  memoria.treinos.push({
    data,
    fase,
    diaPrograma,
    pse
  });

  // atualiza último treino
  memoria.ultimoTreino = diaPrograma;
  localStorage.setItem(chave, JSON.stringify(memoria));

  console.log(`💾 Treino salvo localmente (${memoria.treinos.length} registrados)`);

  // 🔹 Envia dados ao Google Sheets (Apps Script)
  fetch('https://script.google.com/macros/s/AKfycbyCmJdo7UL3YcizKDA41PRz4_dyVFnAkdZuR-d3QXUsPbA5GA3hq13d0U8v0ldav9i3Fw/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, data, fase, diaPrograma, pse })
  })
  .then(res => {
    if (!res.ok && res.type !== 'opaque') {
      throw new Error(`Erro HTTP ${res.status}`);
    }
    console.log("✅ Sincronizado com servidor.");
  })
  .catch(err => {
    console.warn("⚠️ Falha ao sincronizar com servidor:", err);
  });
}

// 🔹 Reseta memória (caso necessário futuramente)
function limparMemoria(id) {
  const chave = `femflow_memoria_${id}`;
  localStorage.removeItem(chave);
  console.log(`🧹 Memória apagada para ID: ${id}`);
}

// 🔹 Retorna percentual de progresso (para evolução.html)
function calcularProgresso(id, totalTreinos = 30) {
  const memoria = carregarMemoria(id);
  if (!memoria || !memoria.treinos) return 0;
  const concluido = memoria.treinos.length;
  return Math.min(Math.round((concluido / totalTreinos) * 100), 100);
}
