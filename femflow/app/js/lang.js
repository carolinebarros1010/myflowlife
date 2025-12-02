/* ============================================================
   🌐 FEMFLOW — Sistema de Idiomas (PT + FR)
   Arquivo oficial: lang.js
   ------------------------------------------------------------
   • FEMFLOW.lang    → idioma atual
   • FEMFLOW.langs   → dicionário
   • FEMFLOW.setLang → alterar idioma
   • Dispara evento: femflow:langChange
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

/* idioma inicial */
FEMFLOW.lang = localStorage.getItem("femflow_lang") || "pt";

/* ============================================================
   🔤 DICIONÁRIO MULTILINGUE
============================================================ */
FEMFLOW.langs = {

pt: {
  nome: "Português",

  geral: {
    loading: "Carregando…",
    salvar: "Salvar",
    cancelar: "Cancelar",
    voltar: "Voltar",
    faseAtual: "sua fase hormonal",
  },

  menu: {
    fechar: "Fechar",
    idioma: "Idioma",
    ciclo: "Ajustar ciclo",
    respiracao: "Respiração",
    treinos: "Meus Treinos",
    nivel: "Alterar nível",
    tema: "Tema",
    voltar: "Voltar",
    sair: "Sair"
  },

  flowcenter: {
    titulo: "Sua fase hormonal",
    sub: "Seu corpo tem um ritmo único. Vamos acompanhar juntas.",
    menstrual: "Menstrual",
    follicular: "Folicular",
    ovulatory: "Ovulatória",
    luteal: "Lútea"
  },

  ciclo: {
    titulo: "Identifique seu momento",
    sub: "Vamos ajustar seus treinos ao seu ciclo atual 🌸",

    regular: "Regular",
    irregular: "Irregular",
    diu: "Uso DIU",
    menopausa: "Menopausa",

    qualDiu: "Qual tipo de DIU?",
    diuCobre: "DIU de Cobre",
    diuHormonal: "DIU Hormonal",

    ultimaMenstruacao: "Data da última menstruação",
    duracaoMedia: "Duração média (dias)",
    confirmar: "Confirmar",

    quizInicio: "Pronta?",
    sim: "Sim",
    nao: "Não",

    footer: "Essas informações servem apenas para adaptar seus treinos. 💫",

    /* 🔥 AGORA SIM: dentro de ciclo */
    quizCiclo: {
      irregular: [
        "Você sentiu mudanças de energia ao longo da semana?",
        "Percebeu sensibilidade nos seios, inchaço ou retenção?",
        "Você teve oscilações emocionais sem motivo claro?",
        "Sentiu cólicas, peso abdominal ou desconforto pélvico?",
        "Você se sentiu sem vontade de treinar nos últimos dias?"
      ],
      menopausa: [
        "Nos últimos dias, você sentiu sua energia mais instável do que o normal?",
        "Você teve ondas de calor ou suor noturno?",
        "Seu humor variou muito?",
        "Seu sono ficou mais leve ou interrompido?",
        "Você tem sentido baixa disposição?"
      ],
      diuHormonal: [
        "Sua motivação para treinar caiu?",
        "Você sentiu cansaço constante?",
        "Irritabilidade ou sensibilidade emocional aumentou?",
        "Inchaço ou peso no ventre?",
        "Seu corpo parece lento ou travado?"
      ]
    }
  },

  treino: {
    tituloTopo: "Treino Diário",
    diaPrograma: "Dia do Programa",
    btnSalvar: "💾 Salvar treino",
    btnDescanso: "🌿 Descanso",
    btnCancelar: "Cancelar",
    pseTitulo: "Como foi o treino?",
    pseLabel: "PSE (0 a 10)",
    pseSalvar: "Salvar",
    pseCancelar: "Cancelar"
  },

  respiracao: {
    titulo: "Respiração",
    sub: "Protocolos para foco, relaxamento e performance",
    voltarTreino: "Voltar ao treino",
    iniciar: "Iniciar",
    parar: "Parar"
  },

  evolucao: {
    titulo: "Evolução",
    sub: "Veja sua jornada de progresso",
    treino: "Treinos",
    descanso: "Dias de descanso",
    pseMedia: "PSE média",
    faseAtual: "Fase atual",
    nenhumDado: "Nenhum dado registrado ainda."
  },

  home: {
    titulo: "Bem-vinda ao FemFlow",
    iniciar: "Começar",
    meusTreinos: "Meus Treinos",
    minhaEvolucao: "Minha Evolução"
  },

  index: {
    titulo: "Entrar no FemFlow",
    placeholderID: "Seu ID FemFlow",
    entrar: "Entrar",
    lembrete: "Seu ID é enviado por e-mail após a compra."
  },

  sistema: {
    cicloConfigurado: "✨ Ciclo configurado!",
    erroCiclo: "Erro ao carregar ciclo.",
    sincronizando: "Sincronizando…",
    treinoSalvo: "Treino salvo!",
    descansoSalvo: "Descanso registrado!"
  },

  /* 🔥 ANAMNESE → fica no nível do idioma, NÃO dentro de ciclo */
  anamneseQuiz: [
    {
      gif: "profile_form.webp",
      texto: "Há quanto tempo você treina com regularidade?",
      opcoes: [
        { texto: "Nunca ou menos de 3 meses 😅", v: 1 },
        { texto: "Entre 3 meses e 1 ano 🧘‍♀️", v: 2 },
        { texto: "Mais de 1 ano 💪", v: 3 }
      ]
    },
    {
      gif: "routine_cycle.webp",
      texto: "Quantos dias por semana você costuma treinar?",
      opcoes: [
        { texto: "1 a 2 dias 💤", v: 1 },
        { texto: "3 a 4 dias 🍑", v: 2 },
        { texto: "5 dias ou mais 🔥", v: 3 }
      ]
    },
    {
      gif: "strength_training.webp",
      texto: "Com que frequência você cumpre o treino planejado?",
      opcoes: [
        { texto: "Quando dá tempo 😬", v: 1 },
        { texto: "Na maioria das vezes ✅", v: 2 },
        { texto: "Sou muito disciplinada 🧠", v: 3 }
      ]
    },
    {
      gif: "mobility_flow.webp",
      texto: "Como avalia sua consciência corporal durante o treino?",
      opcoes: [
        { texto: "Ainda me perco nos movimentos 😅", v: 1 },
        { texto: "Consigo corrigir às vezes 👀", v: 2 },
        { texto: "Domino bem os exercícios ✨", v: 3 }
      ]
    },
    {
      gif: "strength_training.webp",
      texto: "Como descreveria sua força e resistência hoje?",
      opcoes: [
        { texto: "Canso fácil ou fico dolorida 🥴", v: 1 },
        { texto: "Aguento treinos moderados 🌿", v: 2 },
        { texto: "Treinos longos e intensos são tranquilos 💪", v: 3 }
      ]
    },
    {
      gif: "hormonal_balance.webp",
      texto: "Como é sua recuperação e qualidade de sono?",
      opcoes: [
        { texto: "Durmo mal e demoro pra recuperar 😴", v: 1 },
        { texto: "Oscila conforme a semana ⚖️", v: 2 },
        { texto: "Durmo bem e me recupero rápido 🌙", v: 3 }
      ]
    },
    {
      gif: "menstrual_flow.webp",
      texto: "Você percebe variações de energia ao longo do ciclo?",
      opcoes: [
        { texto: "Nunca percebi 🤔", v: 1 },
        { texto: "Algumas fases me afetam 🔄", v: 2 },
        { texto: "Ajusto meu treino conforme o ciclo 🌸", v: 3 }
      ]
    },
    {
      gif: "breath_cycle.webp",
      texto: "Como está seu nível de estresse no dia a dia?",
      opcoes: [
        { texto: "Ando sobrecarregada 😩", v: 1 },
        { texto: "Oscila conforme o período 🌤️", v: 2 },
        { texto: "Equilibrado e sob controle 🧘‍♀️", v: 3 }
      ]
    }
  ]
},


 /* ============================================================
   🇺🇸 ENGLISH
============================================================ */
en: {
  nome: "English",

  geral: {
    loading: "Loading…",
    salvar: "Save",
    cancelar: "Cancel",
    voltar: "Back",
    faseAtual: "your hormonal phase",
  },

  menu: {
    fechar: "Close",
    idioma: "Language",
    ciclo: "Adjust cycle",
    respiracao: "Breathing",
    treinos: "My Workouts",
    nivel: "Change level",
    tema: "Theme",
    voltar: "Back",
    sair: "Logout"
  },

  flowcenter: {
    titulo: "Your hormonal phase",
    sub: "Your body has its own rhythm. Let’s follow it together.",
    menstrual: "Menstrual",
    follicular: "Follicular",
    ovulatory: "Ovulatory",
    luteal: "Luteal",
    atual: "Current phase:"
  },

  ciclo: {
    titulo: "Identify your moment",
    sub: "Let’s align your training with your current cycle 🌸",

    regular: "Regular",
    irregular: "Irregular",
    diu: "IUD",
    menopausa: "Menopause",

    qualDiu: "Which IUD type?",
    diuCobre: "Copper IUD",
    diuHormonal: "Hormonal IUD",

    ultimaMenstruacao: "Last menstruation date",
    duracaoMedia: "Average length (days)",
    confirmar: "Confirm",

    quizInicio: "Ready?",
    sim: "Yes",
    nao: "No",

    footer: "These inputs are used only to adapt your workouts. 💫",

    /* 🔥 QUIZ DO CICLO — DENTRO do bloco ciclo */
    quizCiclo: {
      irregular: [
        "Did you feel energy changes throughout the week?",
        "Did you notice breast sensitivity, bloating, or water retention?",
        "Did your emotions fluctuate without a clear reason?",
        "Did you feel cramps, abdominal heaviness, or pelvic discomfort?",
        "Did you feel unmotivated to train in recent days?"
      ],
      menopausa: [
        "In recent days, has your energy been more unstable than usual?",
        "Have you experienced hot flashes or night sweats?",
        "Has your mood varied a lot?",
        "Has your sleep been lighter or interrupted?",
        "Have you been feeling low energy?"
      ],
      diuHormonal: [
        "Has your motivation to train dropped?",
        "Have you felt persistent fatigue?",
        "Has irritability or emotional sensitivity increased?",
        "Have you felt bloating or abdominal heaviness?",
        "Does your body feel slow or sluggish?"
      ]
    }
  },

  treino: {
    tituloTopo: "Daily Workout",
    diaPrograma: "Program Day",
    btnSalvar: "💾 Save workout",
    btnDescanso: "🌿 Rest",
    btnCancelar: "Cancel",
    pseTitulo: "How was the workout?",
    pseLabel: "RPE (0 to 10)",
    pseSalvar: "Save",
    pseCancelar: "Cancel"
  },

  respiracao: {
    titulo: "Breathing",
    sub: "Choose the protocol based on your moment 🌿",
    voltarTreino: "← back to workout",
    iniciar: "Start breathing",
    parar: "Stop",
    prepare: "Prepare...",
    inspire: "Inhale",
    expire: "Exhale",
    segure: "Hold",
    finalizado: "Finished 🌸"
  },

  evolucao: {
    titulo: "My Evolution",
    subtitulo: "Track how your body responds to training",
    progressoTitulo: "🌿 Your program progress",
    progressoTexto: p => `You have completed ${p}% of the program`,
    pseTitulo: "📈 Perceived Effort Evolution (RPE)",
    legenda: "🩵 Easy • 🍑 Moderate • ❤️ Intense",
    mensagemFinal:
      "✨ Congratulations! You completed your 30-day FemFlow cycle.<br>Breathe, celebrate and rest.",
    novoCiclo: "🔄 Start new cycle",
    voltar: "← Back to Flow Center",
    semDados: "No workouts recorded yet."
  },

  sistema: {
    cicloConfigurado: "✨ Cycle configured!",
    erroCiclo: "Error loading cycle.",
    sincronizando: "Synchronizing…",
    treinoSalvo: "Workout saved!",
    descansoSalvo: "Rest day registered!",
    erroSalvar: "Error saving data.",
    erroDescanso: "Error registering rest day."
  },

  /* 🔥 ANAMNESE QUIZ — NO NÍVEL DO IDIOMA */
  anamneseQuiz: [
    {
      gif: "profile_form.webp",
      texto: "How long have you been training consistently?",
      opcoes: [
        { texto: "Never or less than 3 months 😅", v: 1 },
        { texto: "Between 3 months and 1 year 🧘‍♀️", v: 2 },
        { texto: "More than 1 year 💪", v: 3 }
      ]
    },
    {
      gif: "routine_cycle.webp",
      texto: "How many days per week do you usually train?",
      opcoes: [
        { texto: "1 to 2 days 💤", v: 1 },
        { texto: "3 to 4 days 🍑", v: 2 },
        { texto: "5 days or more 🔥", v: 3 }
      ]
    },
    {
      gif: "strength_training.webp",
      texto: "How often do you complete the planned workout?",
      opcoes: [
        { texto: "When I can 😬", v: 1 },
        { texto: "Most of the time ✅", v: 2 },
        { texto: "I’m very disciplined 🧠", v: 3 }
      ]
    },
    {
      gif: "mobility_flow.webp",
      texto: "How do you evaluate your body awareness during training?",
      opcoes: [
        { texto: "Still get lost in movements 😅", v: 1 },
        { texto: "I correct myself sometimes 👀", v: 2 },
        { texto: "I master exercises well ✨", v: 3 }
      ]
    },
    {
      gif: "strength_training.webp",
      texto: "How would you describe your strength and endurance today?",
      opcoes: [
        { texto: "I get tired easily 🥴", v: 1 },
        { texto: "Handle moderate training 🌿", v: 2 },
        { texto: "Long/intense sessions are fine 💪", v: 3 }
      ]
    },
    {
      gif: "hormonal_balance.webp",
      texto: "How is your recovery and sleep quality?",
      opcoes: [
        { texto: "Poor sleep, slow recovery 😴", v: 1 },
        { texto: "Varies through the week ⚖️", v: 2 },
        { texto: "Sleep well, recover fast 🌙", v: 3 }
      ]
    },
    {
      gif: "menstrual_flow.webp",
      texto: "Do you notice energy variations throughout your cycle?",
      opcoes: [
        { texto: "Never noticed 🤔", v: 1 },
        { texto: "Some phases affect me 🔄", v: 2 },
        { texto: "Adjust my training by cycle 🌸", v: 3 }
      ]
    },
    {
      gif: "breath_cycle.webp",
      texto: "How is your stress level daily?",
      opcoes: [
        { texto: "Feeling overwhelmed 😩", v: 1 },
        { texto: "Varies with the week 🌤️", v: 2 },
        { texto: "Balanced and under control 🧘‍♀️", v: 3 }
      ]
    }
  ]
},

  /* ============================================================
   🇫🇷 FRANCÊS
============================================================ */
fr: {
  nome: "Français",

  geral: {
    loading: "Chargement…",
    salvar: "Enregistrer",
    cancelar: "Annuler",
    voltar: "Retour",
    faseAtual: "votre phase hormonale",
  },

  menu: {
    fechar: "Fermer",
    idioma: "Langue",
    ciclo: "Ajuster le cycle",
    respiracao: "Respiration",
    treinos: "Mes Entraînements",
    nivel: "Changer de niveau",
    tema: "Thème",
    voltar: "Retour",
    sair: "Déconnexion"
  },

  flowcenter: {
    titulo: "Votre phase hormonale",
    sub: "Votre corps a son propre rythme. Suivons-le ensemble.",
    menstrual: "Menstruelle",
    follicular: "Folliculaire",
    ovulatory: "Ovulatoire",
    luteal: "Lutéale"
  },

  ciclo: {
    titulo: "Identifiez votre moment",
    sub: "Ajustons vos entraînements à votre cycle 🌸",

    regular: "Régulier",
    irregular: "Irrégulier",
    diu: "DIU",
    menopausa: "Ménopause",

    qualDiu: "Quel type de DIU ?",
    diuCobre: "DIU au cuivre",
    diuHormonal: "DIU hormonal",

    ultimaMenstruacao: "Date des dernières règles",
    duracaoMedia: "Durée moyenne (jours)",
    confirmar: "Confirmer",

    quizInicio: "Prête ?",
    sim: "Oui",
    nao: "Non",

    footer: "Ces informations servent uniquement à adapter vos entraînements. 💫",

    /* 🔥 QUIZ DO CICLO — DENTRO do ciclo */
    quizCiclo: {
      irregular: [
        "Avez-vous ressenti des variations d'énergie cette semaine ?",
        "Avez-vous remarqué une sensibilité des seins, un gonflement ou une rétention d'eau ?",
        "Vos émotions ont-elles fluctué sans raison claire ?",
        "Avez-vous ressenti des crampes ou un poids abdominal ou pelvien ?",
        "Vous êtes-vous sentie sans motivation pour vous entraîner ces derniers jours ?"
      ],
      menopausa: [
        "Ces derniers jours, votre énergie a-t-elle été plus instable que d'habitude ?",
        "Avez-vous eu des bouffées de chaleur ou des sueurs nocturnes ?",
        "Votre humeur a-t-elle beaucoup varié ?",
        "Votre sommeil a-t-il été léger ou interrompu ?",
        "Avez-vous ressenti une faible disposition ?"
      ],
      diuHormonal: [
        "Votre motivation à vous entraîner a-t-elle diminué ?",
        "Avez-vous ressenti une fatigue constante ?",
        "L'irritabilité ou la sensibilité émotionnelle a-t-elle augmenté ?",
        "Avez-vous ressenti un gonflement ou un poids abdominal ?",
        "Votre corps semble-t-il lent ou bloqué ?"
      ]
    }
  },

  treino: {
    tituloTopo: "Entraînement du jour",
    diaPrograma: "Jour du programme",

    btnSalvar: "💾 Enregistrer l’entraînement",
    btnDescanso: "🌿 Repos",
    btnCancelar: "Annuler",

    pseTitulo: "Comment était l'entraînement ?",
    pseLabel: "PSE (0 à 10)",
    pseSalvar: "Enregistrer",
    pseCancelar: "Annuler"
  },

  respiracao: {
    titulo: "Respiration",
    sub: "Protocoles pour le focus, la relaxation et la performance",
    voltarTreino: "Retour à l'entraînement",
    iniciar: "Démarrer",
    parar: "Arrêter"
  },

  evolucao: {
    titulo: "Évolution",
    sub: "Suivez votre progression",
    treino: "Entraînements",
    descanso: "Jours de repos",
    pseMedia: "PSE moyen",
    faseAtual: "Phase actuelle",
    nenhumDado: "Aucune donnée enregistrée."
  },

  home: {
    titulo: "Bienvenue sur FemFlow",
    iniciar: "Commencer",
    meusTreinos: "Mes Entraînements",
    minhaEvolucao: "Mon Évolution"
  },

  index: {
    titulo: "Connexion à FemFlow",
    placeholderID: "Votre ID FemFlow",
    entrar: "Entrer",
    lembrete: "Votre ID est envoyé par e-mail après l’achat."
  },

  sistema: {
    cicloConfigurado: "✨ Cycle configuré !",
    erroCiclo: "Erreur lors du chargement du cycle.",
    sincronizando: "Synchronisation…",
    treinoSalvo: "Entraînement enregistré !",
    descansoSalvo: "Repos enregistré !"
  },

  /* 🔥 ANAMNESE DELUXE — NO NÍVEL DO IDIOMA */
  anamneseQuiz: [
    {
      gif: "profile_form.webp",
      texto: "Depuis combien de temps t’entraînes-tu régulièrement ?",
      opcoes: [
        { texto: "Jamais ou moins de 3 mois 😅", v: 1 },
        { texto: "Entre 3 mois et 1 an 🧘‍♀️", v: 2 },
        { texto: "Plus d’un an 💪", v: 3 }
      ]
    },
    {
      gif: "routine_cycle.webp",
      texto: "Combien de jours par semaine t’entraînes-tu en général ?",
      opcoes: [
        { texto: "1 à 2 jours 💤", v: 1 },
        { texto: "3 à 4 jours 🍑", v: 2 },
        { texto: "5 jours ou plus 🔥", v: 3 }
      ]
    },
    {
      gif: "strength_training.webp",
      texto: "À quelle fréquence suis-tu ton entraînement prévu ?",
      opcoes: [
        { texto: "Quand j’ai le temps 😬", v: 1 },
        { texto: "La plupart du temps ✅", v: 2 },
        { texto: "Très disciplinée 🧠", v: 3 }
      ]
    },
    {
      gif: "mobility_flow.webp",
      texto: "Comment évalues-tu ta conscience corporelle pendant l’entraînement ?",
      opcoes: [
        { texto: "Je me perds encore dans les mouvements 😅", v: 1 },
        { texto: "Je corrige parfois 👀", v: 2 },
        { texto: "Je maîtrise bien les exercices ✨", v: 3 }
      ]
    },
    {
      gif: "strength_training.webp",
      texto: "Comment décrirais-tu ta force et ton endurance aujourd’hui ?",
      opcoes: [
        { texto: "Je fatigue facilement 🥴", v: 1 },
        { texto: "Je gère les séances modérées 🌿", v: 2 },
        { texto: "Les séances longues/intenses sont ok 💪", v: 3 }
      ]
    },
    {
      gif: "hormonal_balance.webp",
      texto: "Comment sont ta récupération et ton sommeil ?",
      opcoes: [
        { texto: "Je dors mal et récupère lentement 😴", v: 1 },
        { texto: "Ça varie selon les jours ⚖️", v: 2 },
        { texto: "Je dors bien et récupère vite 🌙", v: 3 }
      ]
    },
    {
      gif: "menstrual_flow.webp",
      texto: "Ressens-tu des variations d’énergie selon ton cycle ?",
      opcoes: [
        { texto: "Jamais remarqué 🤔", v: 1 },
        { texto: "Certaines phases m’affectent 🔄", v: 2 },
        { texto: "J’adapte mon entraînement au cycle 🌸", v: 3 }
      ]
    },
    {
      gif: "breath_cycle.webp",
      texto: "Comment est ton niveau de stress au quotidien ?",
      opcoes: [
        { texto: "Je me sens débordée 😩", v: 1 },
        { texto: "Ça fluctue selon la période 🌤️", v: 2 },
        { texto: "Équilibré et sous contrôle 🧘‍♀️", v: 3 }
      ]
    }
  ]
},


/* ============================================================
   🔄 ALTERAR IDIOMA
============================================================ */
FEMFLOW.setLang = function (code) {
  if (!FEMFLOW.langs[code]) return;

  FEMFLOW.lang = code;
  localStorage.setItem("femflow_lang", code);

  document.dispatchEvent(new CustomEvent("femflow:langChange"));
};
