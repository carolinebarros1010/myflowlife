// js/anamnese.js — FemFlow Anamnese Deluxe (versão estável)
// Pré-carrega todos os GIFs
["profile_form.webp", "routine_cycle.webp", "strength_training.webp",
 "mobility_flow.webp", "hormonal_balance.webp", 
 "menstrual_flow.webp", "breath_cycle.webp", "success_flow.webp"
].forEach(g => {
  const img = new Image();
  img.src = "./assets/gifs/" + g;
});

(function () {
  // Protege botões no mobile (evita submit acidental)
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest("button");
      if (el && !el.getAttribute("type")) el.setAttribute("type", "button");
    },
    { capture: true, passive: true }
  );

  const $ = (sel) => document.querySelector(sel);

  // Usa o mesmo SCRIPT_URL do HTML (worker / GAS)
  const SCRIPT_URL =
    (window.FEMFLOW && FEMFLOW.SCRIPT_URL) ||
    localStorage.getItem("femflow_script") ||
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

  // ========= ELEMENTOS DA TELA =========
  const cardCadastro = $("#cadastro");
  const cardQuiz = $("#quiz");
  const cardFinal = $("#final");
  const gifEl = $("#gif");
  const questionEl = $("#question");
  const optionsEl = $("#options");
  const finalMsgEl = $("#final-msg");

  // ========= PERGUNTAS =========
  const perguntas = [
    {
      gif: "profile_form.webp",
      texto: "Há quanto tempo você treina com regularidade?",
      opcoes: [
        { texto: "Nunca ou menos de 3 meses 😅", v: 1 },
        { texto: "Entre 3 meses e 1 ano 🧘‍♀️", v: 2 },
        { texto: "Mais de 1 ano 💪", v: 3 },
      ],
    },
    {
      gif: "routine_cycle.webp",
      texto: "Quantos dias por semana você costuma treinar?",
      opcoes: [
        { texto: "1 a 2 dias 💤", v: 1 },
        { texto: "3 a 4 dias 🍑", v: 2 },
        { texto: "5 dias ou mais 🔥", v: 3 },
      ],
    },
    {
      gif: "strength_training.webp",
      texto: "Com que frequência você cumpre o treino planejado?",
      opcoes: [
        { texto: "Quando dá tempo 😬", v: 1 },
        { texto: "Na maioria das vezes ✅", v: 2 },
        { texto: "Sou muito disciplinada 🧠", v: 3 },
      ],
    },
    {
      gif: "mobility_flow.webp",
      texto: "Como avalia sua consciência corporal durante o treino?",
      opcoes: [
        { texto: "Ainda me perco nos movimentos 😅", v: 1 },
        { texto: "Consigo corrigir às vezes 👀", v: 2 },
        { texto: "Domino bem os exercícios ✨", v: 3 },
      ],
    },
    {
      gif: "strength_training.webp",
      texto: "Como descreveria sua força e resistência hoje?",
      opcoes: [
        { texto: "Canso fácil ou fico dolorida 🥴", v: 1 },
        { texto: "Aguento treinos moderados 🌿", v: 2 },
        { texto: "Treinos longos e intensos são tranquilos 💪", v: 3 },
      ],
    },
    {
      gif: "hormonal_balance.webp",
      texto: "Como é sua recuperação e qualidade de sono?",
      opcoes: [
        { texto: "Durmo mal e demoro pra recuperar 😴", v: 1 },
        { texto: "Oscila conforme a semana ⚖️", v: 2 },
        { texto: "Durmo bem e me recupero rápido 🌙", v: 3 },
      ],
    },
    {
      gif: "menstrual_flow.webp",
      texto: "Você percebe variações de energia ao longo do ciclo?",
      opcoes: [
        { texto: "Nunca percebi 🤔", v: 1 },
        { texto: "Algumas fases me afetam 🔄", v: 2 },
        { texto: "Ajusto meu treino conforme o ciclo 🌸", v: 3 },
      ],
    },
    {
      gif: "breath_cycle.webp",
      texto: "Como está seu nível de estresse no dia a dia?",
      opcoes: [
        { texto: "Ando sobrecarregada 😩", v: 1 },
        { texto: "Oscila conforme o período 🌤️", v: 2 },
        { texto: "Equilibrado e sob controle 🧘‍♀️", v: 3 },
      ],
    },
  ];

  // ========= ESTADO DO QUIZ =========
  let idx = 0;
  let score = 0;

  // Dados da aluna (vêm do HTML/primeira etapa)
  function pegarDadosLead() {
    const lead = (window.FEMFLOW && FEMFLOW._leadCadastro) || {};
    const nome =
      lead.nome || localStorage.getItem("lead_nome") || $("#nome")?.value || "";
    const email =
      lead.email ||
      localStorage.getItem("lead_email") ||
      $("#email")?.value ||
      "";
    const telefone =
      lead.telefone ||
      localStorage.getItem("lead_telefone") ||
      $("#telefone")?.value ||
      "";
    const senha = $("#senha")?.value || ""; // mesma senha da etapa 1

    return { nome, email, telefone, senha };
  }

  // ========= CONTROLE DE PERGUNTAS =========
  function mostrarPergunta() {
    if (idx >= perguntas.length) {
      finalizar();
      return;
    }

    const p = perguntas[idx];
    gifEl.src = "./assets/gifs/" + p.gif;
    questionEl.textContent = p.texto;
    optionsEl.innerHTML = "";

    p.opcoes.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opt.texto;
      b.className = "btn-opcao";

      b.onclick = () => {
        score += opt.v;
        idx++;
        mostrarPergunta();
        navigator.vibrate?.(25);
      };

      optionsEl.appendChild(b);
    });
  }

  // ========= FINALIZAÇÃO =========
  async function finalizar() {
    cardQuiz.classList.add("hidden");
    cardFinal.classList.remove("hidden");

    // Classificação de nível
    let perfil = "iniciante";
    if (score >= 20) perfil = "avançada";
    else if (score >= 14) perfil = "intermediária";

    finalMsgEl.textContent = "✨ Analisando seu perfil...";

    const respostas = perguntas.map((p, i) => ({
      ordem: i + 1,
      pergunta: p.texto,
      // aqui você pode salvar a resposta escolhida depois, se quiser evoluir
    }));

    const { nome, email, telefone, senha } = pegarDadosLead();

    if (!nome || !email || !senha) {
      window.FEMFLOW?.toast?.(
        "⚠️ Erro ao recuperar seus dados. Volte e preencha novamente.",
        true
      );
      return;
    }

    window.FEMFLOW?.toast?.("⏳ Enviando suas informações...", false);

    try {
      let r;

      // Preferencialmente usa o core
      if (window.FEMFLOW && typeof FEMFLOW.enviarCadastro === "function") {
        r = await FEMFLOW.enviarCadastro({
          nome,
          email,
          telefone,
          senha,
          perfil,
          pontuacao: score,
          anamnese: JSON.stringify(respostas),
        });
      } else {
        // Fallback direto via fetch (JSON → Worker/GAS)
        const resp = await fetch(SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "enviarcadastro",
            nome,
            email,
            telefone,
            senha,
            perfil,
            pontuacao: score,
            anamnese: JSON.stringify(respostas),
          }),
        });
        r = await resp.json();
      }

      if (r && (r.status === "ok" || r.status === "created")) {
        if (r.id) localStorage.setItem("femflow_id", r.id);
        if (r.email) localStorage.setItem("femflow_email", r.email);
        localStorage.setItem("femflow_cycle_configured", "yes");

        // limpa lead temporário
        localStorage.removeItem("lead_nome");
        localStorage.removeItem("lead_email");
        localStorage.removeItem("lead_telefone");

        window.FEMFLOW?.toast?.("🌸 Bem-vinda ao FemFlow!", false);
        finalMsgEl.textContent = `✨ Seu perfil é ${perfil.toUpperCase()}! Bem-vinda ao seu ciclo 🌸`;

        setTimeout(() => {
          location.href = "home.html";
        }, 3500);
      } else {
        console.error("Resposta inesperada ao enviar cadastro:", r);
        window.FEMFLOW?.toast?.("❌ Falha ao enviar cadastro.", true);
        finalMsgEl.textContent =
          "⚠️ Tivemos um problema ao salvar seus dados. Tente novamente.";
      }
    } catch (err) {
      console.error("Erro enviarCadastro:", err);
      window.FEMFLOW?.toast?.("⚠️ Erro de conexão. Tente novamente.", true);
      finalMsgEl.textContent =
        "⚠️ Erro de conexão ao finalizar sua anamnese. Tente novamente.";
    }
  }

  // ========= INÍCIO DO QUIZ =========
  document.addEventListener("DOMContentLoaded", () => {
    // O HTML já troca de card quando clica em "Iniciar Anamnese".
    // Aqui só garantimos que o quiz começa a funcionar assim que visível.
    if (!cardQuiz.classList.contains("hidden")) {
      mostrarPergunta();
    }

    // Se preferir já deixar carregado, pode iniciar mesmo oculto:
    // mostrarPergunta();
    window.iniciarQuizFemFlow = function () {
  idx = 0;
  score = 0;
  mostrarPergunta();
};

  });
})();
