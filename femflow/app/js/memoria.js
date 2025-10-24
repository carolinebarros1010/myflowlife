// ===== FEMFLOW MEMÓRIA =====

// Carrega memória local de cada aluna
function carregarMemoria(id) {
  const data = localStorage.getItem(`femflow_${id}`);
  return data ? JSON.parse(data) : { treinos: [] };
}

// Salva memória atualizada
function salvarMemoria(id, memoria) {
  localStorage.setItem(`femflow_${id}`, JSON.stringify(memoria));
}

// Retorna o próximo dia do programa, limitado a 30
function proximoDiaPrograma(id) {
  const memoria = carregarMemoria(id);
  if (!memoria || !memoria.treinos) return 1;

  const ultimoTreino = memoria.treinos[memoria.treinos.length - 1];
  const diaAtual = ultimoTreino ? ultimoTreino.diaPrograma : 0;

  // ✅ Garante que não ultrapasse 30 dias
  return diaAtual >= 30 ? 30 : diaAtual + 1;
}

// Registra treino com PSE e fase
function registrarTreino(id, fase, pse) {
  const memoria = carregarMemoria(id);
  if (!memoria.treinos) memoria.treinos = [];

  const diaPrograma = proximoDiaPrograma(id);

  // Impede registro acima de 30 dias
  if (diaPrograma > 30) {
    alert("✨ Você já concluiu o seu ciclo de 30 dias FemFlow!");
    return;
  }

  memoria.treinos.push({
    data: new Date().toISOString(),
    fase,
    diaPrograma,
    pse
  });

  salvarMemoria(id, memoria);

  // Alerta de conclusão no dia 30
  if (diaPrograma === 30) {
    alert("🌸 Parabéns! Você concluiu seu ciclo de 30 dias FemFlow.\nRespire, celebre e prepare-se para o próximo ciclo!");
  }
}

// Calcula progresso percentual (máx. 100%)
function calcularProgresso(id, totalDias = 30) {
  const memoria = carregarMemoria(id);
  const feitos = memoria && memoria.treinos ? memoria.treinos.length : 0;
  const progresso = Math.min((feitos / totalDias) * 100, 100);
  return Math.round(progresso);
}

// Zera memória para reiniciar programa
function resetarMemoria(id) {
  localStorage.removeItem(`femflow_${id}`);
  alert("🌀 Memória do ciclo reiniciada. Você pode começar um novo programa.");
}

// Exporta memória completa (opcional)
function exportarMemoria(id) {
  const memoria = carregarMemoria(id);
  const blob = new Blob([JSON.stringify(memoria, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `femflow_memoria_${id}.json`;
  link.click();
}

// ===== EXEMPLO DE USO =====
// registrarTreino(id, "Folicular", 6);
// const progresso = calcularProgresso(id);
