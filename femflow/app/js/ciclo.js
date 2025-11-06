// 🌸 FemFlow - Lógica de Identificação de Ciclo, Validação de ID e PWA
document.addEventListener('DOMContentLoaded', () => {
  const btnIniciar = document.getElementById('btnIniciar');
  const btnValidar = document.getElementById('btnValidar');
  const cicloSection = document.getElementById('cicloSection');
  const idSection = document.getElementById('idSection');
  const btnInstall = document.getElementById('btnInstall');

  // 🔹 Verifica se já existe um ID salvo localmente
  const storedId = localStorage.getItem('femflow_id');
  if (storedId) {
    const mem = typeof carregarMemoria === "function" ? carregarMemoria(storedId) : null;
    if (mem) {
      cicloSection.style.display = 'none'; // já tem ciclo configurado
    }
  }

// 🌀 Iniciar novo programa
btnIniciar?.addEventListener('click', () => {
  const dataUltima = document.getElementById('dataUltima').value;
  const dur = document.getElementById('duracao').value;
  if (!dataUltima || !dur) {
    FEMFLOW?.toast?.('⚠️ Preencha a data e a duração do ciclo.') || alert('Preencha a data e a duração do ciclo.');
    return;
  }

  // Gera ou resgata ID
  let id = localStorage.getItem('femflow_id');
  if (!id) id = `FF-${Date.now().toString(36).toUpperCase()}`;
  localStorage.setItem('femflow_id', id);

  // 🔹 Salva ciclo no localStorage
  localStorage.setItem('femflow_startDate', dataUltima);
  localStorage.setItem('femflow_cycleLength', dur);
  localStorage.setItem('femflow_cycle_configured', 'yes');

  // 🔹 Feedback ao usuário
  FEMFLOW?.toast?.('🌸 Ciclo configurado com sucesso!') || alert('Ciclo configurado com sucesso!');

  // 🔹 Redireciona para HOME (não treino)
  setTimeout(() => {
    window.location.href = 'home.html';
  }, 1200);
});

  // 🔑 Validação de ID existente
  btnValidar?.addEventListener('click', () => {
    const id = document.getElementById('inputID').value.trim();
    if (!id) {
      alert('Digite seu ID');
      return;
    }

    if (typeof validarID === "function") {
      validarID(id).then(valid => {
        if (valid) {
          localStorage.setItem('femflow_id', id);
          const mem = typeof carregarMemoria === "function" ? carregarMemoria(id) : null;
          if (!mem) {
            alert('ID validado! Configure seu ciclo para iniciar seu programa.');
            cicloSection.style.display = 'block';
          } else {
            window.location.href = 'treino.html';
          }
        } else {
          alert('ID inválido ou licença expirada.');
        }
      });
    } else {
      console.warn("⚠️ Função validarID não disponível.");
    }
  });

  // === 🌺 INSTALAÇÃO PWA ===
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstall) btnInstall.style.display = 'inline-block';
  });

  btnInstall?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`📲 Resultado da instalação: ${outcome}`);
      deferredPrompt = null;
      btnInstall.style.display = 'none';
    }
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ FemFlow foi instalado como PWA!');
    if (btnInstall) btnInstall.style.display = 'none';
  });
});

// === 🌿 QUIZ HORMONAL ===
let perguntas = [];
let indicePergunta = 0;
let pontuacao = 0;

function abrirQuiz(tipo) {
  const quizModal = document.getElementById("quizModal");
  const respostasDiv = document.getElementById("quizRespostas");
  const perguntaEl = document.getElementById("quizPergunta");

  if (!quizModal || !respostasDiv || !perguntaEl) return;

  quizModal.style.display = "flex";
  indicePergunta = 0;
  pontuacao = 0;

  // Define perguntas por tipo
  switch (tipo) {
    case "irregular":
      perguntas = [
        { q: "Você tem sensações de inchaço e retenção de líquidos frequentes?", p: 1 },
        { q: "Seu humor oscila com frequência sem motivo claro?", p: 2 },
        { q: "Sente mais energia em certos dias do mês?", p: 3 },
        { q: "Tem variação de temperatura corporal ou sono?", p: 4 },
        { q: "Tem menstruação, mas sem padrão previsível?", p: 5 }
      ];
      break;
    case "diu":
      perguntas = [
        { q: "Sente cólicas ou leve sangramento mensal?", p: 1 },
        { q: "Percebe mudanças sutis de energia ou disposição?", p: 2 },
        { q: "Tem sensibilidade nos seios ou irritabilidade?", p: 3 },
        { q: "Seu sono varia durante o mês?", p: 4 },
        { q: "Nota dias com mais foco e produtividade?", p: 5 }
      ];
      break;
    case "menopausa":
      perguntas = [
        { q: "Tem ondas de calor ou suor noturno?", p: 1 },
        { q: "Percebe queda de energia ou fadiga crônica?", p: 2 },
        { q: "Seu sono está mais leve ou irregular?", p: 3 },
        { q: "Sente ansiedade ou irritabilidade aumentada?", p: 4 },
        { q: "Tem ressecamento corporal ou da pele?", p: 5 }
      ];
      break;
    default:
      perguntas = [];
  }

  mostrarPergunta();
}

function mostrarPergunta() {
  const atual = perguntas[indicePergunta];
  const perguntaEl = document.getElementById("quizPergunta");
  const respostasDiv = document.getElementById("quizRespostas");
  if (!atual || !perguntaEl || !respostasDiv) return;

  perguntaEl.innerText = atual.q;
  respostasDiv.innerHTML = `
    <button onclick="responder(1)">Sim</button>
    <button onclick="responder(0)">Não</button>
  `;
}

function responder(valor) {
  pontuacao += valor;
  indicePergunta++;
  if (indicePergunta < perguntas.length) {
    mostrarPergunta();
  } else {
    concluirQuiz();
  }
}

function concluirQuiz() {
  const quizModal = document.getElementById("quizModal");
  if (quizModal) quizModal.style.display = "none";

  let fase = "";
  if (pontuacao <= 2) fase = "Folicular";
  else if (pontuacao <= 3) fase = "Ovulatória";
else if (pontuacao <= 4) fase = "Lútea";
  else fase = "Menstrual";

  // Guarda a fase no localStorage
  localStorage.setItem("fase_sugerida", fase);

  // Mensagem de feedback
  alert(`Pelo seu perfil, seu corpo está mais próximo da fase ${fase}. 🌸`);

  // Redireciona para cadastro (com a fase como parâmetro)
  window.location.href = `cadastro.html?fase=${encodeURIComponent(fase)}`;
}


