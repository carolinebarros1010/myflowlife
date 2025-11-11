(async () => {
  // 🔹 Protege botões no mobile
  document.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (el && !el.getAttribute("type")) el.setAttribute("type", "button");
  }, { capture: true, passive: true });

  // 🔹 Perguntas com GIFs corretos
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

  const cadastro = document.getElementById("cadastro");
  const quiz = document.getElementById("quiz");
  const final = document.getElementById("final");
  const gif = document.getElementById("gif");
  const q = document.getElementById("question");
  const opts = document.getElementById("options");
  const msg = document.getElementById("final-msg");

  let i = 0, score = 0, nome = "", email = "", telefone = "", senha = "";

  // 🔹 Botão principal
  document.getElementById("btnIniciar").onclick = async () => {
    nome = document.getElementById("nome").value.trim();
    email = document.getElementById("email").value.trim();
    telefone = document.getElementById("telefone").value.trim();
    senha = document.getElementById("senha").value.trim();
    const confirma = document.getElementById("confirma").value.trim();

    // Validações
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nome || !email || !senha)
      return FEMFLOW.toast("⚠️ Preencha todos os campos obrigatórios.", true);
    if (!emailValido)
      return FEMFLOW.toast("📧 Digite um e-mail válido.", true);
    if (senha.length < 6)
      return FEMFLOW.toast("🔐 A senha deve ter pelo menos 6 caracteres.", true);
    if (senha !== confirma)
      return FEMFLOW.toast("❌ As senhas não coincidem.", true);

    // Salva lead local
    localStorage.setItem("lead_nome", nome);
    localStorage.setItem("lead_email", email);
    localStorage.setItem("lead_telefone", telefone);

    // Envia lead parcial
    try {
      const params = new URLSearchParams(location.search);
      const utm_source = params.get("utm") || params.get("utm_source") || "orgânico";
      await fetch(FEMFLOW.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "leadParcial",
          nome, email, telefone, utm_source,
          origem: "Anamnese Deluxe FemFlow"
        }),
      });
    } catch {}

    cadastro.classList.add("hidden");
    quiz.classList.remove("hidden");
    mostrarPergunta();
  };

  // 🔹 Controle de perguntas
  function mostrarPergunta() {
    if (i >= perguntas.length) return finalizar();
    const p = perguntas[i];
    gif.src = "./assets/gifs/" + p.gif;
    q.textContent = p.texto;
    opts.innerHTML = "";

    p.opcoes.forEach(o => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = o.texto;
      b.className = "btn-opcao";
      b.onclick = () => {
        score += o.v;
        i++;
        mostrarPergunta();
        navigator.vibrate?.(25);
      };
      opts.appendChild(b);
    });
  }

  // 🔹 Finalização da anamnese
  async function finalizar() {
    quiz.classList.add("hidden");
    final.classList.remove("hidden");

    let nivel = "iniciante";
    if (score >= 20) nivel = "avançada";
    else if (score >= 14) nivel = "intermediária";

    const respostas = perguntas.map((p, idx) => `Q${idx + 1}: ${p.texto}`);

    FEMFLOW.toast("⏳ Enviando suas respostas...", false);

    try {
      const r = await FEMFLOW.enviarCadastro({
        nome, email, telefone, senha,
        perfil: nivel, pontuacao: score,
        anamnese: JSON.stringify(respostas)
      });

      if (r && r.status) {
        localStorage.setItem("femflow_id", r.id);
        localStorage.setItem("femflow_email", r.email);
        localStorage.setItem("femflow_cycle_configured", "yes");
        localStorage.removeItem("lead_nome");
        localStorage.removeItem("lead_email");
        localStorage.removeItem("lead_telefone");
        FEMFLOW.toast("🌸 Bem-vinda ao FemFlow!");
        msg.textContent = `✨ Seu perfil é ${nivel.toUpperCase()}! Bem-vinda ao seu ciclo 🌸`;
setTimeout(() => (location.href = "home.html"), 3500);
      } else {
        FEMFLOW.toast("❌ Falha ao enviar cadastro.", true);
      }
    } catch {
      FEMFLOW.toast("⚠️ Erro de conexão. Tente novamente.", true);
    }
  }
})();

