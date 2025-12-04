// js/anamnese.js — FemFlow Anamnese Deluxe (versão multilíngue 2025)

// ============ PRÉ-CARREGAR GIFS ============
[
 "profile_form.webp", "routine_cycle.webp", "strength_training.webp",
 "mobility_flow.webp", "hormonal_balance.webp",
 "menstrual_flow.webp", "breath_cycle.webp", "success_flow.webp"
].forEach(g => {
  const img = new Image();
  img.src = "./assets/gifs/" + g;
});

// ============================================================
//      SISTEMA DE PERGUNTAS TRADUZÍVEIS
// ============================================================
function getPerguntasTraduzidas() {
  const lang = FEMFLOW?.lang || "pt";

  const L =
    FEMFLOW?.anamneseLang?.[lang]?.perguntas ||
    FEMFLOW.anamneseLang.pt.perguntas;

  return JSON.parse(JSON.stringify(L)); // clone seguro
}


(function () {

  // Prevenção de submit no mobile
  document.addEventListener("click", e => {
    const el = e.target.closest("button");
    if (el && !el.getAttribute("type")) el.setAttribute("type", "button");
  }, { capture: true, passive: true });

  const $ = sel => document.querySelector(sel);

  const SCRIPT_URL =
    FEMFLOW?.SCRIPT_URL ||
    localStorage.getItem("femflow_script") ||
    "https://api-myflowlife.falling-wildflower-a8c0.workers.dev";

  // ========== ELEMENTOS ==========
  const cardCadastro = $("#cadastro");
  const cardQuiz = $("#quiz");
  const cardFinal = $("#final");
  const gifEl = $("#gif");
  const questionEl = $("#question");
  const optionsEl = $("#options");
  const finalMsgEl = $("#final-msg");

  // ========== ESTADO ==========
  let perguntas = getPerguntasTraduzidas(); // ← TRADUZIDAS
  let idx = 0;
  let score = 0;

  // ========== DADOS DO LEAD ==========
  function pegarDadosLead() {
    const lead = FEMFLOW?._leadCadastro || {};
    return {
      nome:     lead.nome     || localStorage.getItem("lead_nome")     || $("#nome")?.value || "",
      email:    lead.email    || localStorage.getItem("lead_email")    || $("#email")?.value || "",
      telefone: lead.telefone || localStorage.getItem("lead_telefone") || $("#telefone")?.value || "",
      senha:    $("#senha")?.value || ""
    };
  }

  // ============================================================
  //      MOSTRAR PERGUNTA (TRADUZIDA)
  // ============================================================
  function mostrarPergunta() {
    if (idx >= perguntas.length) return finalizar();

    const p = perguntas[idx];

    gifEl.src = "./assets/gifs/" + p.gif;
    questionEl.textContent = p.texto;
    optionsEl.innerHTML = "";

    p.opcoes.forEach(opt => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opt.texto;
      b.className = "btn-opcao";

     b.onclick = () => {
  p.escolha = opt.v;
  score += opt.v;
  idx++;
  mostrarPergunta();
};

      optionsEl.appendChild(b);
    });
  }

  // ============================================================
  //      FINALIZAR ANAMNESE (TRADUÇÃO INTEGRADA)
  // ============================================================
  async function finalizar() {

  const lang = FEMFLOW?.lang || "pt";

  // Textos do sistema (vem do lang.js)
 const Tsys =
  FEMFLOW?.langs?.[lang]?.sistema ||
  FEMFLOW?.langs?.pt?.sistema ||
  {
    erroCiclo: "Erro ao finalizar.",
    sincronizando: "Sincronizando…",
    cicloConfigurado: "Perfil configurado!"
  };

  // Textos da etapa final da Anamnese
  const T = {
    analisando: {
      pt: "Analisando seu perfil…",
      en: "Analyzing your profile…",
      fr: "Analyse de ton profil…"
    }[lang],

    perfilFinal: {
      pt: "Seu nível é:",
      en: "Your level is:",
      fr: "Ton niveau est :"
    }[lang],

    erroFinal: {
      pt: "Não foi possível concluir a anamnese.",
      en: "Could not complete the questionnaire.",
      fr: "Impossible de terminer le questionnaire."
    }[lang],

    erroConexao: {
      pt: "Erro de conexão.",
      en: "Connection error.",
      fr: "Erreur de connexion."
    }[lang]
  };

  // Telas
  cardQuiz.classList.add("hidden");
  cardFinal.classList.remove("hidden");

  finalMsgEl.textContent = T.analisando;

  // Classificação
  let perfil = "iniciante";
  if (score >= 20) perfil = "avançada";
  else if (score >= 14) perfil = "intermediária";

const respostas = {};
perguntas.forEach((p, i) => {
  respostas["q" + (i + 1)] = p.escolha || 0;
});

  // Dados
  const { nome, email, telefone, senha } = pegarDadosLead();

  if (!nome || !email || !senha) {
    FEMFLOW.toast(Tsys.erroCiclo, true);
    return;
  }

  FEMFLOW.toast(Tsys.sincronizando);

  try {
    let r;

    if (typeof FEMFLOW.enviarCadastro === "function") {
      r = await FEMFLOW.enviarCadastro({
        nome, email, telefone, senha, perfil,
        pontuacao: score,
        anamnese: JSON.stringify(respostas),
        cicloDuracao: 28,             // padrão inicial
    dataInicio: new Date().toISOString()
});
      } else {
      const resp = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enviarcadastro",
          nome, email, telefone, senha,
          perfil,
          pontuacao: score,
          anamnese: JSON.stringify(respostas)
        })
      });
      r = await resp.json();
    }

    if (r && (r.status === "ok" || r.status === "created")) {

      if (r.id) localStorage.setItem("femflow_id", r.id);
      if (r.email) localStorage.setItem("femflow_email", r.email);

      localStorage.removeItem("lead_nome");
      localStorage.removeItem("lead_email");
      localStorage.removeItem("lead_telefone");

      FEMFLOW.toast(Tsys.cicloConfigurado);

      finalMsgEl.textContent = `${T.perfilFinal} ${perfil.toUpperCase()}!`;

      setTimeout(() => location.href = "ciclo.html", 3000);

    } else {
      FEMFLOW.toast(Tsys.erroCiclo, true);
      finalMsgEl.textContent = T.erroFinal;
    }

  } catch (err) {
    console.error("Erro enviarCadastro:", err);
    FEMFLOW.toast(Tsys.erroCiclo, true);
    finalMsgEl.textContent = T.erroConexao;
  }
}


  // ============================================================
  //      INICIALIZAR QUIZ
  // ============================================================
  document.addEventListener("DOMContentLoaded", () => {

    // carregar perguntas traduzidas quando entrar
    perguntas = getPerguntasTraduzidas();

    window.iniciarQuizFemFlow = function () {
      idx = 0;
      score = 0;
      perguntas = getPerguntasTraduzidas(); // ← troca idioma no meio
      mostrarPergunta();
    };

    if (!cardQuiz.classList.contains("hidden")) {
      mostrarPergunta();
    }

    // Atualizar perguntas ao mudar idioma
    document.addEventListener("femflow:langChange", () => {
      perguntas = getPerguntasTraduzidas();
      if (!cardQuiz.classList.contains("hidden")) mostrarPergunta();
    });
  });

})();
