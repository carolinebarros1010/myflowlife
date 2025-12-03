/* ============================================================
   🌐 FEMFLOW — Sistema de Idiomas (PT + EN + FR)
   Arquivo oficial: lang.js — versão corrigida 2025
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

/* idioma inicial */
FEMFLOW.lang = localStorage.getItem("femflow_lang") || "pt";

/* ============================================================
   🔤 DICIONÁRIO MULTILINGUE
============================================================ */
FEMFLOW.langs = {

/* ============================================================
   🇧🇷 PORTUGUÊS
============================================================ */
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

    /* 🔥 QUIZ DO CICLO */
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
    }, // ← vírgula importante!
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
  }
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
    luteal: "Luteal"
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

    quizCiclo: {
      irregular: [
        "Did you feel energy changes throughout the week?",
        "Did you notice breast sensitivity, bloating, or water retention?",
        "Did your emotions fluctuate without a clear reason?",
        "Did you feel cramps or pelvic discomfort?",
        "Did you feel unmotivated to train recently?"
      ],
      menopausa: [
        "Has your energy been unstable recently?",
        "Any hot flashes or night sweats?",
        "Was your mood unstable?",
        "Has your sleep been lighter or interrupted?",
        "Have you felt low disposition?"
      ],
      diuHormonal: [
        "Has your motivation to train dropped?",
        "Have you felt persistent fatigue?",
        "Has irritability increased?",
        "Have you felt bloating or abdominal heaviness?",
        "Does your body feel slow?"
      ]
    }, // ← vírgula CORRIGIDA
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
  },

  evolucao: {
    titulo: "My Evolution",
    sub: "Track how your body responds to training",
    treino: "Workouts",
    descanso: "Rest days",
    pseMedia: "Average RPE",
    faseAtual: "Current phase",
    nenhumDado: "No workouts recorded yet."
  },

  home: {
    titulo: "Welcome to FemFlow",
    iniciar: "Start",
    meusTreinos: "My Workouts",
    minhaEvolucao: "My Evolution"
  },

  index: {
    titulo: "Login to FemFlow",
    placeholderID: "Your FemFlow ID",
    entrar: "Enter",
    lembrete: "Your ID is sent by email after purchase."
  },

  sistema: {
    cicloConfigurado: "✨ Cycle configured!",
    erroCiclo: "Error loading cycle.",
    sincronizando: "Synchronizing…",
    treinoSalvo: "Workout saved!",
    descansoSalvo: "Rest day registered!"
  }
},

/* ============================================================
   🇫🇷 FRANÇAIS
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

    quizCiclo: {
      irregular: [
        "Avez-vous ressenti des variations d'énergie cette semaine ?",
        "Avez-vous remarqué une sensibilité des seins ou une rétention d'eau ?",
        "Vos émotions ont-elles fluctué sans raison ?",
        "Avez-vous ressenti des crampes ou un inconfort pelvien ?",
        "Vous êtes-vous sentie démotivée à vous entraîner ?"
      ],
      menopausa: [
        "Votre énergie a-t-elle été instable ?",
        "Avez-vous eu des bouffées de chaleur ?",
        "Votre humeur était-elle instable ?",
        "Votre sommeil a-t-il été perturbé ?",
        "Avez-vous ressenti une faible disposition ?"
      ],
      diuHormonal: [
        "Votre motivation a-t-elle diminué ?",
        "Avez-vous ressenti une fatigue constante ?",
        "Votre sensibilité émotionnelle a-t-elle augmenté ?",
        "Avez-vous ressenti un gonflement abdominal ?",
        "Votre corps semble-t-il lent ?"
      ]
    }, // ← vírgula corrigida!
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
    descanso: "Repos",
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
    lembrete: "Votre ID est envoyé par e-mail après l'achat."
  },

  sistema: {
    cicloConfigurado: "✨ Cycle configuré !",
    erroCiclo: "Erreur lors du chargement du cycle.",
    sincronizando: "Synchronisation…",
    treinoSalvo: "Entraînement enregistré !",
    descansoSalvo: "Repos enregistré !"
  }
}

};

/* ============================================================
   🔄 ALTERAR IDIOMA
============================================================ */
FEMFLOW.setLang = function (code) {
  if (!FEMFLOW.langs[code]) return;

  FEMFLOW.lang = code;
  localStorage.setItem("femflow_lang", code);

  document.dispatchEvent(new CustomEvent("femflow:langChange"));
};

/* ============================================================
   🔔 SINALIZAR QUE OS IDIOMAS ESTÃO PRONTOS
============================================================ */
document.dispatchEvent(new CustomEvent("femflow:langReady"));

