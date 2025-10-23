// Lógica da página de identificação de ciclo e validação de ID

document.addEventListener('DOMContentLoaded', () => {
  const btnIniciar = document.getElementById('btnIniciar');
  const btnValidar = document.getElementById('btnValidar');
  const cicloSection = document.getElementById('cicloSection');
  const idSection = document.getElementById('idSection');

  // Por padrão, se já houver memória para o ID salvo, esconder a configuração de ciclo
  const storedId = localStorage.getItem('femflow_id');
  if (storedId) {
    const mem = carregarMemoria(storedId);
    if (mem) {
      // Usuária já possui ciclo configurado; mostrar apenas campo de ID para continuar
      cicloSection.style.display = 'none';
    }
  }

  // Ação para iniciar programa novo
  btnIniciar.addEventListener('click', () => {
    const dataUltima = document.getElementById('dataUltima').value;
    const dur = document.getElementById('duracao').value;
    if (!dataUltima || !dur) {
      alert('Preencha a data da última menstruação e duração do ciclo.');
      return;
    }
    // Se usuário não tem ID ainda, gera ID temporário (para demonstração)
    let id = localStorage.getItem('femflow_id');
    if (!id) {
      id = 'FF-' + Date.now().toString(36).toUpperCase();
    }
    iniciarPrograma(id, dataUltima, dur);
    // Redireciona para treino
    window.location.href = 'treino.html';
  });

  // Ação para validar ID existente
  btnValidar.addEventListener('click', () => {
    const id = document.getElementById('inputID').value.trim();
    if (!id) {
      alert('Digite seu ID');
      return;
    }
    validarID(id).then(valid => {
      if (valid) {
        localStorage.setItem('femflow_id', id);
        const mem = carregarMemoria(id);
        if (!mem) {
          // primeira vez usando o ID, precisa configurar ciclo
          alert('ID validado! Configure seu ciclo para iniciar seu programa.');
          cicloSection.style.display = 'block';
        } else {
          // Se já tem memória, segue para o treino atual
          window.location.href = 'treino.html';
        }
      } else {
        alert('ID inválido ou licença expirou.');
      }
    });
  });
});
let perguntas = [];
let indicePergunta = 0;
let pontuacao = 0;

function abrirQuiz(tipo) {
  document.getElementById("quizModal").style.display = "flex";
  indicePergunta = 0;
  pontuacao = 0;

  // define as perguntas por tipo
  if (tipo === "irregular") {
    perguntas = [
      { q: "Você tem sensações de inchaço e retenção de líquidos frequentes?", p: 1 },
      { q: "Seu humor oscila com frequência sem motivo claro?", p: 2 },
      { q: "Sente mais energia em certos dias do mês?", p: 3 },
      { q: "Tem variação de temperatura corporal ou sono?", p: 4 },
      { q: "Tem menstruação, mas sem padrão previsível?", p: 5 }
    ];
  } else if (tipo === "diu") {
    perguntas = [
      { q: "Sente cólicas ou leve sangramento mensal?", p: 1 },
      { q: "Percebe mudanças sutis de energia ou disposição?", p: 2 },
      { q: "Tem sensibilidade nos seios ou irritabilidade?", p: 3 },
      { q: "Seu sono varia durante o mês?", p: 4 },
      { q: "Nota dias com mais foco e produtividade?", p: 5 }
    ];
  } else if (tipo === "menopausa") {
    perguntas = [
      { q: "Tem ondas de calor ou suor noturno?", p: 1 },
      { q: "Percebe queda de energia ou fadiga crônica?", p: 2 },
      { q: "Seu sono está mais leve ou irregular?", p: 3 },
      { q: "Sente ansiedade ou irritabilidade aumentada?", p: 4 },
      { q: "Tem ressecamento corporal ou da pele?", p: 5 }
    ];
  }

  mostrarPergunta();
}

function mostrarPergunta() {
  const atual = perguntas[indicePergunta];
  document.getElementById("quizPergunta").innerText = atual.q;
  const respostasDiv = document.getElementById("quizRespostas");
  respostasDiv.innerHTML = `
    <button onclick="responder(1)">Sim</button>
    <button onclick="responder(0)">Não</button>
  `;
}

function responder(valor) {
  pontuacao += valor;
  proximaPergunta();
}

function proximaPergunta() {
  indicePergunta++;
  if (indicePergunta < perguntas.length) {
    mostrarPergunta();
  } else {
    concluirQuiz();
  }
}
function concluirQuiz() {
  document.getElementById("quizModal").style.display = "none";

  // Determina a fase com base na pontuação
  let fase = "";
  if (pontuacao <= 2) fase = "Folicular";
  else if (pontuacao <= 3) fase = "Ovulatória";
  else if (pontuacao <= 4) fase = "Lútea";
  else fase = "Menstrual";

  // Guarda a fase no localStorage
  localStorage.setItem("fase_sugerida", fase);

  // Feedback visual rápido
  const msg = `Pelo seu perfil, seu corpo está mais próximo da fase ${fase}. 🌸`;
  alert(msg);

  // Redireciona para a tela de ID (cadastro) já com a fase
  window.location.href = `cadastro.html?fase=${encodeURIComponent(fase)}`;
}

