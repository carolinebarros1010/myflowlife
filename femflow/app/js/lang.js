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
home: {
      bemvinda: "Bem-vinda",
      videoTitulo: "Como funciona o FemFlow",
      videoSub:   "Assista ao vídeo rápido antes de começar.",
      videoUrl:   "https://www.youtube.com/embed/SEU_VIDEO_PT",

      tituloPersonal:  "Personal",
      tituloFollowMe:  "Treine junto por 30 dias",
      tituloMuscular:  "Treinos por ênfase",
      tituloEsportes:  "Esportes",
      tituloCasa:      "Treinar em casa"
    },
  flowcenter: {
  // TÍTULOS
  titulo: "Sua fase hormonal",
  faseAtual: "Sua fase hormonal",
  sub: "Seu corpo tem um ritmo único. Vamos acompanhar juntas.",

  // FASES
  menstrual: "Menstrual",
  follicular: "Folicular",
  ovulatory: "Ovulatória",
  luteal: "Lútea",

  // BOTÕES
  treino: "Treino",
  evolucao: "Evolução",
  respiracao: "Respiração",
  endurance: "Endurance"
}
,

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
     diaProgramaLabel: "Dia {{dia}}",
    btnSalvar: "💾 Salvar treino",
    btnDescanso: "🌿 Descanso",
    btnCancelar: "Cancelar",
    pseTitulo: "Como foi o treino?",
    pseLabel: "PSE (0 a 10)",
    pseSalvar: "Salvar",
    pseCancelar: "Cancelar",
     hiit: {
    protocolo: "Protocolo {forte} / {leve}",
    descricao:
      "Execute {forte}s em alta intensidade e depois {leve}s de recuperação.",
    ciclos:
      "Repita por {ciclos} ciclos seguindo o timer abaixo.",
    exemplosAcademia:
      "Academia: esteira, bike, escada, remo, air bike",
    exemplosCasa:
      "Em casa: polichinelo, corrida parada, burpee, corda, salto no lugar",
    iniciar: "Toque para iniciar"
  },
     aquecimento: {
    sugestao: "💨 Sugestão: prepare seu corpo com uma respiração consciente antes de começar.",
    btn: "🌬️ Abrir protocolos de respiração"
  },

  resfriamento: {
    sugestao: "🌬️ Sugestão: finalize seu treino desacelerando com respiração suave.",
    btn: "💗 Fazer respiração de fechamento"
  }
  },
resp: {
  /* Títulos */
  titulo1: "Respiração",
  titulo2: "Protocolos para foco, relaxamento e energia",
  sub: "Respire com intenção. Modifique seu estado interno.",

  /* Grupos */
  grupoCiclo: "Do Ciclo",
  grupoTreino: "Durante o Treino",
  grupoUniversal: "Protocolos Universais",

  /* Protocolos — Grupo Ciclo */
  raiz: "Respiração Raiz",
  clareza: "Clareza Mental",
  brilho: "Brilho Interno",
  sereno: "Serenidade",

  /* Protocolos — Grupo Treino */
  wake: "Acordar",
  charge: "Carregar Energia",
  release: "Descarregar",
  restore: "Restaurar",

  /* Protocolos — Universais */
  equilibrio: "Equilíbrio",
  transparencia: "Transparência",

  /* Controles */
  preparar: "Prepare-se",
  iniciar: "Iniciar",
  parar: "Parar",
  voltarTreino: "Voltar ao treino",

  /* Footer */
  footer: "FemFlow • Respiração Consciente"
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
   sistema: {
    cicloConfigurado: "✨ Ciclo configurado!",
    erroCiclo: "Erro ao carregar o ciclo.",
    sincronizando: "Sincronizando…",
    treinoSalvo: "Treino salvo!",
    descansoSalvo: "Descanso registrado!"
},
series: {
  T: {
    titulo: "🔗 Triset",
    texto: "Três exercícios combinados. Execute todos em sequência e descanse apenas ao final."
  },
  B: {
    titulo: "🔗 Biset",
    texto: "Dois exercícios combinados. Execute ambos em sequência e descanse apenas ao final."
  },
  Q: {
    titulo: "🔗 Quadriset",
    texto: "Quatro exercícios combinados. Execute todos em sequência e descanse apenas ao final."
  },
  C: {
    titulo: "⏱️ Cluster",
    texto: "Cada série é dividida em 4 mini-séries com pausas de 10 segundos entre elas."
  },
  I: {
    titulo: "🧊 Isometria",
    texto: "Segure a contração máxima por 3 segundos em cada repetição."
  },
  CC: {
    titulo: "🐢 Cadência Controlada",
    texto: "Controle a fase excêntrica do movimento de forma lenta e consciente."
  },
  D: {
    titulo: "🔥 Dropset",
    texto: "Ao atingir a falha, reduza a carga 3 vezes consecutivas sem descanso."
  },
  RP: {
    titulo: "⚡ Rest-Pause",
    texto: "Na última série, após a falha, reduza 50% da carga e execute 20 repetições."
  },
  AE: {
    titulo: "👑 Advanced Elite",
    texto: "Execução livre, técnica avançada e estímulo máximo."
  }
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
home: {
      bemvinda: "Welcome",
      videoTitulo: "How FemFlow works",
      videoSub:   "Watch this quick video before you start.",
      videoUrl:   "https://www.youtube.com/embed/SEU_VIDEO_EN",

      tituloPersonal:  "Personal Training",
      tituloFollowMe:  "Train together for 30 days",
      tituloMuscular:  "Muscle focus training",
      tituloEsportes:  "Sports",
      tituloCasa:      "Home training"
    },
 flowcenter: {
  titulo: "Your hormonal phase",
  faseAtual: "Your hormonal phase",
  sub: "Your body has its own rhythm. Let's follow it together.",

  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",

  treino: "Training",
  evolucao: "Progress",
  respiracao: "Breathing",
  endurance: "Endurance"
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
   diaProgramaLabel: "Jour {{dia}}",
    btnSalvar: "💾 Save workout",
    btnDescanso: "🌿 Rest",
    btnCancelar: "Cancel",
    pseTitulo: "How was the workout?",
    pseLabel: "RPE (0 to 10)",
    pseSalvar: "Save",
    pseCancelar: "Cancel",
     hiit: {
  protocolo: "{forte} / {leve} Protocol",
  descricao:
    "Perform {forte}s at high intensity followed by {leve}s of recovery.",
  ciclos:
    "Repeat for {ciclos} cycles using the timer below.",
  exemplosAcademia:
    "Gym: treadmill, bike, stairs, rower, air bike",
  exemplosCasa:
    "At home: jumping jacks, running in place, burpees, rope, jumps",
  iniciar: "Tap to start"
},
  aquecimento: {
    sugestao: "💨 Tip: prepare your body with conscious breathing before you start.",
    btn: "🌬️ Open breathing protocols"
  },

  resfriamento: {
    sugestao: "🌬️ Tip: finish your workout by slowing down with gentle breathing.",
    btn: "💗 Do a closing breathing"
  }   
  },
resp: {
  /* Titles */
  titulo1: "Breathing",
  titulo2: "Choose your protocol",
  sub: "Regulate your internal state through intentional breathing.",

  /* Groups */
  grupoCiclo: "Cycle-Based",
  grupoTreino: "Training-Based",
  grupoUniversal: "Universal Protocols",

  /* Cycle Protocols */
  raiz: "Root Breath",
  clareza: "Mental Clarity",
  brilho: "Inner Shine",
  sereno: "Serenity",

  /* Training Protocols */
  wake: "Wake Up",
  charge: "Charge",
  release: "Release",
  restore: "Restore",

  /* Universal */
  equilibrio: "Balance",
  transparencia: "Transparency",

  /* Controls */
  preparar: "Get Ready",
  iniciar: "Start",
  parar: "Stop",
  voltarTreino: "Back to Workout",

  /* Footer */
  footer: "FemFlow • Conscious Breathing"
},

   evolucao: {
  titulo: "Evolution",
  sub: "Track your progress journey",
  treino: "Workouts",
  descanso: "Rest days",
  pseMedia: "Average RPE",
  faseAtual: "Current phase",
  nenhumDado: "No data recorded yet."
},

  sistema: {
    cicloConfigurado: "✨ Cycle configured!",
    erroCiclo: "Error loading cycle.",
    sincronizando: "Synchronizing…",
    treinoSalvo: "Workout saved!",
    descansoSalvo: "Rest day registered!"
  },
series: {
  T: {
    titulo: "🔗 Triset",
    texto: "Three exercises performed in sequence. Rest only after completing all."
  },
  B: {
    titulo: "🔗 Biset",
    texto: "Two exercises performed in sequence. Rest only at the end."
  },
  Q: {
    titulo: "🔗 Quadriset",
    texto: "Four exercises performed in sequence. Rest only after completing all."
  },
  C: {
    titulo: "⏱️ Cluster",
    texto: "Each set is divided into 4 mini-sets with 10-second pauses."
  },
  I: {
    titulo: "🧊 Isometric",
    texto: "Hold maximum contraction for 3 seconds on each repetition."
  },
  CC: {
    titulo: "🐢 Controlled Tempo",
    texto: "Slow and controlled eccentric phase."
  },
  D: {
    titulo: "🔥 Dropset",
    texto: "After failure, reduce load 3 consecutive times without rest."
  },
  RP: {
    titulo: "⚡ Rest-Pause",
    texto: "On the last set, after failure, reduce load by 50% and perform 20 reps."
  },
  AE: {
    titulo: "👑 Advanced Elite",
    texto: "Free execution, advanced technique and maximum stimulus."
  }
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
 home: {
      bemvinda: "Bienvenue",
      videoTitulo: "Comment fonctionne FemFlow",
      videoSub:   "Regardez cette vidéo avant de commencer.",
      videoUrl:   "https://www.youtube.com/embed/SEU_VIDEO_FR",

      tituloPersonal:  "Personal",
      tituloFollowMe:  "Entraînez-vous pendant 30 jours",
      tituloMuscular:  "Entraînements par groupe musculaire",
      tituloEsportes:  "Sports",
      tituloCasa:      "S'entraîner à la maison"
    },
  flowcenter: {
  titulo: "Votre phase hormonale",
  faseAtual: "Votre phase hormonale",
  sub: "Votre corps a son propre rythme. Suivons-le ensemble.",

  menstrual: "Menstruelle",
  follicular: "Folliculaire",
  ovulatory: "Ovulatoire",
  luteal: "Lutéale",

  treino: "Entraînement",
  evolucao: "Évolution",
  respiracao: "Respiration",
  endurance: "Endurance"
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
     diaProgramaLabel: "Day {{dia}}",
    btnSalvar: "💾 Enregistrer l’entraînement",
    btnDescanso: "🌿 Repos",
    btnCancelar: "Annuler",
    pseTitulo: "Comment était l'entraînement ?",
    pseLabel: "PSE (0 à 10)",
    pseSalvar: "Enregistrer",
    pseCancelar: "Annuler",
    hiit: {
  protocolo: "Protocole {forte} / {leve}",
  descricao:
    "Effectuez {forte}s à haute intensité puis {leve}s de récupération.",
  ciclos:
    "Répétez pendant {ciclos} cycles en suivant le minuteur ci-dessous.",
  exemplosAcademia:
    "Salle: tapis, vélo, escaliers, rameur, air bike",
  exemplosCasa:
    "À la maison: jumping jacks, course sur place, burpees, corde, sauts",
  iniciar: "Touchez pour commencer"
},
   aquecimento: {
    sugestao: "💨 Astuce : prépare ton corps avec une respiration consciente avant de commencer.",
    btn: "🌬️ Ouvrir les protocoles de respiration"
  },

  resfriamento: {
    sugestao: "🌬️ Astuce : termine ton entraînement en ralentissant avec une respiration douce.",
    btn: "💗 Faire une respiration de fin"
  }   
 
  },
resp: {
  /* Titres */
  titulo1: "Respiration",
  titulo2: "Choisissez votre protocole",
  sub: "Régulez votre état interne grâce à la respiration consciente.",

  /* Groupes */
  grupoCiclo: "Selon le cycle",
  grupoTreino: "Pour l'entraînement",
  grupoUniversal: "Protocoles universels",

  /* Protocoles – Cycle */
  raiz: "Respiration Racine",
  clareza: "Clarté Mentale",
  brilho: "Éclat Intérieur",
  sereno: "Sérénité",

  /* Protocoles – Entraînement */
  wake: "Réveil",
  charge: "Charger l'énergie",
  release: "Relâcher",
  restore: "Restaurer",

  /* Protocoles universels */
  equilibrio: "Équilibre",
  transparencia: "Transparence",

  /* Contrôles */
  preparar: "Préparez-vous",
  iniciar: "Démarrer",
  parar: "Arrêter",
  voltarTreino: "Retour à l'entraînement",

  /* Footer */
  footer: "FemFlow • Respiration Consciente"
},

 evolucao: {
  titulo: "Évolution",
  sub: "Suivez votre parcours de progression",
  treino: "Entraînements",
  descanso: "Jours de repos",
  pseMedia: "PSE moyen",
  faseAtual: "Phase actuelle",
  nenhumDado: "Aucune donnée enregistrée."
},
  sistema: {
    cicloConfigurado: "✨ Cycle configuré !",
    erroCiclo: "Erreur lors du chargement du cycle.",
    sincronizando: "Synchronisation…",
    treinoSalvo: "Entraînement enregistré !",
    descansoSalvo: "Repos enregistré !"
  },
  series: {
  T: {
    titulo: "🔗 Triset",
    texto: "Trois exercices enchaînés. Repos uniquement à la fin."
  },
  B: {
    titulo: "🔗 Biset",
    texto: "Deux exercices enchaînés. Repos uniquement à la fin."
  },
  Q: {
    titulo: "🔗 Quadriset",
    texto: "Quatre exercices enchaînés. Repos uniquement à la fin."
  },
  C: {
    titulo: "⏱️ Cluster",
    texto: "Chaque série est divisée en 4 mini-séries avec 10 secondes de pause."
  },
  I: {
    titulo: "🧊 Isométrie",
    texto: "Maintenez la contraction maximale pendant 3 secondes à chaque répétition."
  },
  CC: {
    titulo: "🐢 Cadence contrôlée",
    texto: "Phase excentrique lente et contrôlée."
  },
  D: {
    titulo: "🔥 Dropset",
    texto: "Après l’échec, réduisez la charge 3 fois sans repos."
  },
  RP: {
    titulo: "⚡ Rest-Pause",
    texto: "À la dernière série, après l’échec, réduisez la charge de 50 % et effectuez 20 répétitions."
  },
  AE: {
    titulo: "👑 Advanced Elite",
    texto: "Exécution libre, technique avancée et stimulus maximal."
  }
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
// Disparar após garantir carregamento completo
window.addEventListener("DOMContentLoaded", () => {
    document.dispatchEvent(new CustomEvent("femflow:langReady"));
});


