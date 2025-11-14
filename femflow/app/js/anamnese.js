(async () => {

  // ========= UTILITÁRIOS ==========
  const $ = (sel) => document.querySelector(sel);
  const SCRIPT_URL =
    (window.FEMFLOW && FEMFLOW.SCRIPT_URL) ||
    localStorage.getItem("femflow_script") ||
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

  // ========= ELEMENTOS ==========
  const cardCadastro = $("#cadastro");
  const cardQuiz = $("#quiz");
  const cardFinal = $("#final");

  const gif = $("#gif");
  const question = $("#question");
  const options = $("#options");
  const finalMsg = $("#final-msg");

  // ========= PERGUNTAS ==========
  const perguntas = [
    { gif:"profile_form.webp", texto:"Há quanto tempo você treina com regularidade?",
      opcoes:[
        {texto:"Nunca ou menos de 3 meses 😅",v:1},
        {texto:"Entre 3 meses e 1 ano 🧘‍♀️",v:2},
        {texto:"Mais de 1 ano 💪",v:3}
      ]},
    { gif:"routine_cycle.webp", texto:"Quantos dias por semana você costuma treinar?",
      opcoes:[
        {texto:"1 a 2 dias 💤",v:1},
        {texto:"3 a 4 dias 🍑",v:2},
        {texto:"5 dias ou mais 🔥",v:3}
      ]},
    { gif:"strength_training.webp", texto:"Com que frequência você cumpre o treino planejado?",
      opcoes:[
        {texto:"Quando dá tempo 😬",v:1},
        {texto:"Na maioria das vezes ✅",v:2},
        {texto:"Sou muito disciplinada 🧠",v:3}
      ]},
    { gif:"mobility_flow.webp", texto:"Como avalia sua consciência corporal durante o treino?",
      opcoes:[
        {texto:"Ainda me perco nos movimentos 😅",v:1},
        {texto:"Consigo corrigir às vezes 👀",v:2},
        {texto:"Domino bem os exercícios ✨",v:3}
      ]},
    { gif:"strength_training.webp", texto:"Como descreveria sua força e resistência hoje?",
      opcoes:[
        {texto:"Canso fácil ou fico dolorida 🥴",v:1},
        {texto:"Aguento treinos moderados 🌿",v:2},
        {texto:"Treinos longos e intensos são tranquilos 💪",v:3}
      ]},
    { gif:"hormonal_balance.webp", texto:"Como é sua recuperação e qualidade de sono?",
      opcoes:[
        {texto:"Durmo mal e demoro pra recuperar 😴",v:1},
        {texto:"Oscila conforme a semana ⚖️",v:2},
        {texto:"Durmo bem e me recupero rápido 🌙",v:3}
      ]},
    { gif:"menstrual_flow.webp", texto:"Você percebe variações de energia ao longo do ciclo?",
      opcoes:[
        {texto:"Nunca percebi 🤔",v:1},
        {texto:"Algumas fases me afetam 🔄",v:2},
        {texto:"Ajusto meu treino conforme o ciclo 🌸",v:3}
      ]},
    { gif:"breath_cycle.webp", texto:"Como está seu nível de estresse no dia a dia?",
      opcoes:[
        {texto:"Ando sobrecarregada 😩",v:1},
        {texto:"Oscila conforme o período 🌤️",v:2},
        {texto:"Equilibrado e sob controle 🧘‍♀️",v:3}
      ]}
  ];

  // ========= VARIÁVEIS ==========
  let index = 0;
  let score = 0;

  let nome = "";
  let email = "";
  let telefone = "";
  let senha = "";

  // =====================================================================
  // 🔹 ETAPA 1 — Receber dados da pré-anamnese vindos do anamnese.html
  // =====================================================================

  document.getElementById("btnIniciar").addEventListener("click", () => {
    // valores da página inicial
    nome = $("#nome").value.trim();
    email = $("#email").value.trim();
    telefone = $("#telefone").value.trim();
    senha = $("#senha").value.trim();

    // expõe ao FEMFLOW (opcional)
    window.FEMFLOW = window.FEMFLOW || {};
    FEMFLOW._leadCadastro = { nome, email, telefone };

    // muda de tela
    cardCadastro.classList.add("hidden");
    cardQuiz.classList.remove("hidden");

    mostrarPergunta();
  });

  // =====================================================================
  // 🔹 MOSTRAR PERGUNTAS
  // =====================================================================
  function mostrarPergunta() {
    if (index >= perguntas.length) return finalizar();

    const p = perguntas[index];
    gif.src = "./assets/gifs/" + p.gif;
    question.textContent = p.texto;

    options.innerHTML = "";
    p.opcoes.forEach( op => {
      const b = document.createElement("button");
      b.textContent = op.texto;
      b.type = "button";
      b.onclick = () => {
        score += op.v;
        index++;
        mostrarPergunta();
        navigator.vibrate?.(25);
      };
      options.appendChild(b);
    });
  }

  // =====================================================================
  // 🔹 FINALIZAÇÃO — Enviar para o Script
  // =====================================================================
  async function finalizar() {
    cardQuiz.classList.add("hidden");
    cardFinal.classList.remove("hidden");

    // define nível
    let perfil = "iniciante";
    if (score >= 20) perfil = "avançada";
    else if (score >= 14) perfil = "intermediária";

    finalMsg.textContent = "✨ Analisando seu perfil...";

    const respostas = perguntas.map((p, i) => ({
      pergunta: p.texto,
      resposta: p.opcoes.find(o => true) // estrutura simples
    }));

    FEMFLOW.toast?.("⏳ Enviando suas informações...", false);

    try {
      const qs = new URLSearchParams({
        action: "enviarcadastro",
        nome,
        email,
        telefone,
        senha,
        perfil,
        pontuacao: score,
        anamnese: JSON.stringify(respostas)
      }).toString();

      const resp = await fetch(SCRIPT_URL + "?" + qs);
      const r = await resp.json();

      if (r.status === "ok" || r.status === "created") {
        localStorage.setItem("femflow_id", r.id);
        localStorage.setItem("femflow_email", r.email);
        localStorage.setItem("femflow_cycle_configured", "yes");

        FEMFLOW.toast?.("🌸 Bem-vinda ao FemFlow!", false);
        finalMsg.textContent = `✨ Seu perfil é ${perfil.toUpperCase()}!`;

        setTimeout(() => location.href = "home.html", 3000);
      } else {
        FEMFLOW.toast?.("❌ Falha ao enviar cadastro.", true);
      }
    } catch (err) {
      console.error("Erro enviar cadastro:", err);
      FEMFLOW.toast?.("⚠️ Erro de conexão.", true);
    }
  }

})();
