// Lógica da página de treino

document.addEventListener('DOMContentLoaded', () => {
  const id = localStorage.getItem('femflow_id');
  if (!id) {
    // se não há ID, volta para ciclo
    window.location.href = 'ciclo.html';
    return;
  }
  const treino = obterTreinoAtual(id);
  if (!treino) {
    window.location.href = 'ciclo.html';
    return;
  }
  // Atualiza informações da tela
  document.getElementById('tituloTreino').innerText = `Dia ${treino.diaPrograma}`;
  document.getElementById('subTreino').innerText = `Fase ${treino.fase}`;
  const videoEl = document.getElementById('videoTreino');
  videoEl.querySelector('source').src = treino.video;
  videoEl.load();
  // PDF download
  const pdfBtn = document.getElementById('btnPdf');
  pdfBtn.href = treino.pdf;
  // PSE
  let pseSalva = false;
  document.getElementById('btnSalvarPse').addEventListener('click', () => {
    const pseVal = parseInt(document.getElementById('pseInput').value, 10);
    registrarTreino(id, pseVal);
    pseSalva = true;
    const feedback = document.getElementById('pseFeedback');
    if (pseVal <= 3) {
      feedback.style.color = 'var(--teal)';
      feedback.innerText = 'Leve e consciente. Ótimo para consolidar adaptação. 💚';
    } else if (pseVal <= 7) {
      feedback.style.color = 'var(--pessego)';
      feedback.innerText = 'Esforço ideal hoje. Consistência = resultado. 🧡';
    } else {
      feedback.style.color = 'var(--terracota)';
      feedback.innerText = 'Alto esforço. Hidrate, durma bem e reduza amanhã. ❤️';
    }
  });
  // Próximo treino
  document.getElementById('btnNext').addEventListener('click', () => {
    if (!pseSalva) {
      alert('Por favor, salve sua PSE antes de avançar para o próximo treino.');
      return;
    }
    avancarTreino(id);
    // recarrega a página para o próximo dia
    window.location.reload();
  });
});