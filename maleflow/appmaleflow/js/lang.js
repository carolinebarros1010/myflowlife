/* ============================================================
   🌐 FEMFLOW — Sistema de Idiomas (PT + EN + FR)
   Arquivo oficial: lang.js — versão corrigida 2025
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

/* idioma inicial */
FEMFLOW.lang = localStorage.getItem("maleflow_lang") || "pt";

/* ============================================================
   🔤 DICIONÁRIO CORE (MENU + SAC)
============================================================ */
window.FEMFLOW_LANG = {
  pt: {
    menu: {
      title: "Menu",
      fechar: "Fechar",
      idioma: "Idioma",
      ciclo: "Ciclo de treino",
      respiracao: "Respiração",
      treinos: "Meus Treinos",
      nivel: "Alterar nível",
      tema: "Tema",
      voltar: "Voltar",
      sair: "Sair",
      sac: "Preciso de ajuda"
    },
    nivelModal: {
      title: "Selecione seu nível",
      iniciante: "Iniciante",
      intermediaria: "Intermediária",
      avancada: "Avançada",
      confirmar: "Confirmar nível",
      fechar: "Fechar",
      selecione: "Selecione um nível"
    },

    sac: {
      title: "Preciso de ajuda",
      subtitle: "O que está acontecendo?",
      options: {
        treino: "Meu treino não está certo",
        ciclo: "Meu ciclo de treino parece errado",
        registro: "Não consegui registrar treino",
        acesso: "Problema de acesso",
        outro: "Outro problema"
      },
      placeholder: "Explique com suas palavras (opcional)",
      enviar: "Enviar",
      cancelar: "Cancelar",
      sucesso: "Mensagem enviada com sucesso 💖",
      erro: "Erro ao enviar. Tente novamente.",
      selecione: "Selecione uma opção",
      enviando: "Enviando…"
    },

    respiracao: {
      titulo1: "Respirações",
      titulo2: "FemFlow",
      sub: "Escolha o protocolo conforme seu momento 🌿",
      preparar: "Preparar...",
      footer: "Inspire equilíbrio. Expire leveza.",
      tituloModal: "Respiração",
      grupos: {
        ciclo: "Respirações do Ciclo",
        treino: "Respirações para Treinar",
        universal: "Respirações Universais"
      },
      botoes: {
        iniciar: "Iniciar Respiração",
        voltarRespiracoes: "← voltar às respirações",
        voltarTreino: "← voltar ao treino"
      },
      fases: {
        inspire: "Inspire",
        segure: "Segure",
        expire: "Expire"
      },
      protocolos: {
        raiz: "Respiração Força",
        clareza: "Respiração Foco",
        brilho: "Respiração Potência",
        sereno: "Respiração Controle",
        wake: "Wake Flow",
        charge: "Charge Flow",
        release: "Release Flow",
        restore: "Restore Flow",
        equilibrio: "Respiração Resistência",
        transparencia: "Respiração Disciplina"
      },
      descricoes: {
        raiz: "Acalma o corpo, reduz tensões e ajuda você a retornar ao eixo interno.",
        clareza: "Traz foco, leveza mental e sensação de reorganização.",
        brilho: "Eleva sua energia e presença durante fases mais fortes do ciclo.",
        sereno: "Suaviza irritabilidade, oscilações emocionais e TPM.",
        wake: "Ativa o corpo sem acelerar demais.",
        charge: "Energia imediata para treinos fortes.",
        release: "Dissolve tensões e acalma pós-treino.",
        restore: "Recupera o sistema nervoso profundamente.",
        equilibrio: "Centraliza sua mente e emoções.",
        transparencia: "Traz clareza emocional instantânea."
      }
    }
  },

  en: {
    menu: {
      title: "Menu",
      fechar: "Close",
      idioma: "Language",
      ciclo: "Training cycle",
      respiracao: "Breathing",
      treinos: "My Workouts",
      nivel: "Change level",
      tema: "Theme",
      voltar: "Back",
      sair: "Logout",
      sac: "I need help"
    },
    nivelModal: {
      title: "Select your level",
      iniciante: "Beginner",
      intermediaria: "Intermediate",
      avancada: "Advanced",
      confirmar: "Confirm level",
      fechar: "Close",
      selecione: "Select a level"
    },

    sac: {
      title: "I need help",
      subtitle: "What is happening?",
      options: {
        treino: "My workout seems wrong",
        ciclo: "My training cycle seems incorrect",
        registro: "I couldn't log my workout",
        acesso: "Access or login problem",
        outro: "Other issue"
      },
      placeholder: "Explain in your own words (optional)",
      enviar: "Send",
      cancelar: "Cancel",
      sucesso: "Message sent successfully 💖",
      erro: "Error sending message. Please try again.",
      selecione: "Select an option",
      enviando: "Sending…"
    },

    respiracao: {
      titulo1: "Breathing",
      titulo2: "FemFlow",
      sub: "Choose the protocol for your moment 🌿",
      preparar: "Get ready...",
      footer: "Inhale balance. Exhale lightness.",
      tituloModal: "Breathing",
      grupos: {
        ciclo: "Cycle Breathing",
        treino: "Training Breathing",
        universal: "Universal Breathing"
      },
      botoes: {
        iniciar: "Start Breathing",
        voltarRespiracoes: "← back to breathing",
        voltarTreino: "← back to training"
      },
      fases: {
        inspire: "Inhale",
        segure: "Hold",
        expire: "Exhale"
      },
      protocolos: {
        raiz: "Strength Breathing",
        clareza: "Focus Breathing",
        brilho: "Power Breathing",
        sereno: "Control Breathing",
        wake: "Wake Flow",
        charge: "Charge Flow",
        release: "Release Flow",
        restore: "Restore Flow",
        equilibrio: "Endurance Breathing",
        transparencia: "Discipline Breathing"
      },
      descricoes: {
        raiz: "Calms the body, reduces tension, and helps you return to your inner center.",
        clareza: "Brings focus, mental lightness, and a sense of reorganization.",
        brilho: "Boosts your energy and presence during stronger phases of the cycle.",
        sereno: "Softens irritability, emotional swings, and PMS.",
        wake: "Energizes the body without over-accelerating.",
        charge: "Immediate energy for intense training sessions.",
        release: "Dissolves tension and calms the body after training.",
        restore: "Deeply restores the nervous system.",
        equilibrio: "Centers your mind and emotions.",
        transparencia: "Brings instant emotional clarity."
      }
    }
  },

  fr: {
    menu: {
      title: "Menu",
      fechar: "Fermer",
      idioma: "Langue",
      ciclo: "Cycle d'entraînement",
      respiracao: "Respiration",
      treinos: "Mes entraînements",
      nivel: "Changer de niveau",
      tema: "Thème",
      voltar: "Retour",
      sair: "Déconnexion",
      sac: "J’ai besoin d’aide"
    },
    nivelModal: {
      title: "Sélectionnez votre niveau",
      iniciante: "Débutante",
      intermediaria: "Intermédiaire",
      avancada: "Avancée",
      confirmar: "Confirmer le niveau",
      fechar: "Fermer",
      selecione: "Sélectionnez un niveau"
    },

    sac: {
      title: "J’ai besoin d’aide",
      subtitle: "Que se passe-t-il ?",
      options: {
        treino: "Mon entraînement ne semble pas correct",
        ciclo: "Mon cycle d'entraînement semble incorrect",
        registro: "Je n’ai pas pu enregistrer l’entraînement",
        acesso: "Problème d’accès",
        outro: "Autre problème"
      },
      placeholder: "Expliquez avec vos mots (facultatif)",
      enviar: "Envoyer",
      cancelar: "Annuler",
      sucesso: "Message envoyé avec succès 💖",
      erro: "Erreur lors de l’envoi. Réessayez.",
      selecione: "Sélectionnez une option",
      enviando: "Envoi…"
    },

    respiracao: {
      titulo1: "Respirations",
      titulo2: "FemFlow",
      sub: "Choisissez le protocole selon votre moment 🌿",
      preparar: "Préparez-vous...",
      footer: "Inspirez l'équilibre. Expirez la légèreté.",
      tituloModal: "Respiration",
      grupos: {
        ciclo: "Respirations du cycle",
        treino: "Respirations pour s'entraîner",
        universal: "Respirations universelles"
      },
      botoes: {
        iniciar: "Démarrer la respiration",
        voltarRespiracoes: "← revenir aux respirations",
        voltarTreino: "← revenir à l'entraînement"
      },
      fases: {
        inspire: "Inspirez",
        segure: "Retenez",
        expire: "Expirez"
      },
      protocolos: {
        raiz: "Respiration Force",
        clareza: "Respiration Focus",
        brilho: "Respiration Puissance",
        sereno: "Respiration Contrôle",
        wake: "Wake Flow",
        charge: "Charge Flow",
        release: "Release Flow",
        restore: "Restore Flow",
        equilibrio: "Respiration Endurance",
        transparencia: "Respiration Discipline"
      },
      descricoes: {
        raiz: "Apaise le corps, réduit les tensions et vous aide à revenir à votre axe intérieur.",
        clareza: "Apporte concentration, légèreté mentale et sensation de réorganisation.",
        brilho: "Renforce votre énergie et votre présence pendant les phases plus fortes du cycle.",
        sereno: "Adoucit l'irritabilité, les variations émotionnelles et le SPM.",
        wake: "Active le corps sans l'accélérer excessivement.",
        charge: "Énergie immédiate pour les entraînements intenses.",
        release: "Dissout les tensions et calme le corps après l'entraînement.",
        restore: "Restaure profondément le système nerveux.",
        equilibrio: "Recentre votre esprit et vos émotions.",
        transparencia: "Apporte une clarté émotionnelle instantanée."
      }
    }
  }
};

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
    faseAtual: "seu ciclo de treino",
  },

  menu: {
    title: "Menu",
    fechar: "Fechar",
    idioma: "Idioma",
    sac: "Preciso de ajuda",
    ciclo: "Ciclo de treino",
    respiracao: "Respiração",
    treinos: "Meus Treinos",
    nivel: "Alterar nível",
    tema: "Tema",
    voltar: "Voltar",
    sair: "Sair"
  },
home: {
      bemvinda: "Bem-vindo",
      videoTitulo: "Como funciona o FemFlow",
      videoSub:   "Assista ao vídeo rápido antes de começar.",
      videoUrl:   "https://www.youtube.com/embed/pAifTtNF9sQ",

      botaoFlowcenter: "Continue seu treino",
      tituloPersonal:  "Personal",
      tituloFollowMe:  "Treine junto por 30 dias",
      tituloMuscular:  "Treinos por ênfase",
      tituloEsportes:  "Esportes",
      tituloCasa:      "Treinar em casa",
      cards: {
        forcaabc: "Força",
        quadriceps: "Quadríceps",
        gluteos: "Glúteos",
        corrida_longa: "Corrida longa",
        casa_core_gluteo: "Glúteo e Core",
        casa_queima_gordura: "Queima de Gordura",
        casa_mobilidade: "Mobilidade",
        casa_fullbody_praia: "Fullbody Praia",
        costas: "Costas",
        ombro: "Ombro",
        peito: "Peito",
        peitoral: "Peitoral",
        militar: "Militar",
        remo_oceanico: "Remo oceânico",
        beach_tennis: "Beach Tennis",
        jiu_jitsu: "Jiu-jítsu",
        natacao: "Natação",
        surf: "Surf",
        corrida_curta: "Corrida curta"
      }
    },
  flowcenter: {
  // TÍTULOS
  titulo: "Seu ciclo de treino",
  sub: "Consistência diária para evoluir com foco.",
  cicloTreinoTitulo: "Ciclo de treino",
  diaTreinoAtual: "Treino {letra} · Dia {dia}",

  // BOTÕES
  treino: "Treino",
  treinoExtra: "Treino extra",
  evolucao: "Evolução",
  respiracao: "Respiração",
  endurance: "Endurance",
  proximoTreino: "Programa-se",

  treinoExtraTitulo: "Treino Extra",
  treinoExtraSub: "Escolha a área que deseja focar hoje.",
  treinoExtraSuperior: "Superior",
  treinoExtraInferior: "Inferior",
  treinoExtraAbdomem: "Abdômen",
  treinoExtraMobilidade: "Mobilidade",
  treinoExtraFechar: "Fechar"
}
,

  ciclo: {
    titulo: "Defina seu ciclo de treino",
    sub: "Escolha a divisão de treinos que você seguirá.",
    confirmar: "Confirmar ciclo",
    footer: "Essa configuração define a ordem dos seus treinos."
  },

  treino: {
    tituloTopo: "Treino Diário",
    tituloExtra: "Treino Extra",
    diaPrograma: "Dia do Programa",
     diaProgramaLabel: "Dia {dia}",
    extraTitulo: "Treino extra — {tipo}",
    extraLabel: "Geral",
    extraOpcoes: {
      superior: "Superior",
      inferior: "Inferior",
      abdomem: "Abdômen",
      mobilidade: "Mobilidade"
    },
    btnSalvar: "💾 Salvar treino",
    btnCancelar: "Cancelar",
    pseTitulo: "Como foi o treino?",
    pseLabel: "PSE (0 a 10)",
    pseSalvar: "Salvar",
    pseCancelar: "Cancelar",
    proximoModal: {
      titulo: "Hoje: Treino {letra} (Dia {diaAtual})",
      subtitulo: "Amanhã: Treino {letra} (Dia {proximoDia}).",
      listaTitulo: "Treino de amanhã",
      vazio: "Estamos preparando o próximo treino."
    },
    tour: {
      step: "{atual}/{total}",
      salvarTitulo: "Salve seu treino",
      salvarTexto: "Ao finalizar, salve para registrar seu PSE e evolução.",
      cancelarTitulo: "Voltar ao painel",
      cancelarTexto: "Use cancelar para sair do treino e voltar ao FlowCenter.",
      next: "Próximo",
      finish: "Concluir",
      skip: "Pular"
    },
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
  raiz: "Respiração Força",
  clareza: "Respiração Foco",
  brilho: "Respiração Potência",
  sereno: "Respiração Controle",

  /* Protocolos — Grupo Treino */
  wake: "Acordar",
  charge: "Carregar Energia",
  release: "Descarregar",
  restore: "Restaurar",

  /* Protocolos — Universais */
  equilibrio: "Resistência",
  transparencia: "Disciplina",

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
  faseAtual: "Ciclo atual",
  nenhumDado: "Nenhum dado registrado ainda."
},
   sistema: {
    cicloConfigurado: "Ciclo configurado!",
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
  },
  SM: {
    titulo: "🟢 Submáxima",
    texto: "Descanso curto para estimular o músculo em ênfase."
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
    faseAtual: "your training cycle",
  },

  menu: {
    title: "Menu",
    fechar: "Close",
    idioma: "Language",
    sac: "I need help",
    ciclo: "Training cycle",
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
      videoUrl:   "https://www.youtube.com/embed/tOm9I6eKOj4",

      botaoFlowcenter: "Continue your workout",
      tituloPersonal:  "Personal Training",
      tituloFollowMe:  "Train together for 30 days",
      tituloMuscular:  "Muscle focus training",
      tituloEsportes:  "Sports",
      tituloCasa:      "Home training",
      cards: {
        forcaabc: "Strength",
        quadriceps: "Quadriceps",
        gluteos: "Glutes",
        corrida_longa: "Long run",
        casa_core_gluteo: "Glutes & Core",
        casa_queima_gordura: "Fat Burn",
        casa_mobilidade: "Mobility",
        casa_fullbody_praia: "Beach full body",
        costas: "Back",
        ombro: "Shoulders",
        peito: "Chest",
        peitoral: "Pectorals",
        militar: "Military",
        remo_oceanico: "Ocean rowing",
        beach_tennis: "Beach Tennis",
        jiu_jitsu: "Jiu-jitsu",
        natacao: "Swimming",
        surf: "Surf",
        corrida_curta: "Short run"
      }
    },
 flowcenter: {
  titulo: "Your training cycle",
  sub: "Consistency with focus, day after day.",
  cicloTreinoTitulo: "Training cycle",
  diaTreinoAtual: "Workout {letra} · Day {dia}",

  treino: "Training",
  treinoExtra: "Extra training",
  evolucao: "Progress",
  respiracao: "Breathing",
  endurance: "Endurance",
  proximoTreino: "See next workout",

  treinoExtraTitulo: "Extra Training",
  treinoExtraSub: "Choose the area you want to focus on today.",
  treinoExtraSuperior: "Upper body",
  treinoExtraInferior: "Lower body",
  treinoExtraAbdomem: "Abs",
  treinoExtraMobilidade: "Mobility",
  treinoExtraFechar: "Close"
},

  ciclo: {
    titulo: "Set your training cycle",
    sub: "Choose the workout split you will follow.",
    confirmar: "Confirm cycle",
    footer: "This setup defines the order of your workouts."
  },

  treino: {
    tituloTopo: "Daily Workout",
    tituloExtra: "Extra Workout",
    diaPrograma: "Program Day",
   diaProgramaLabel: "Day {dia}",
    extraTitulo: "Extra workout — {tipo}",
    extraLabel: "General",
    extraOpcoes: {
      superior: "Upper body",
      inferior: "Lower body",
      abdomem: "Abs",
      mobilidade: "Mobility"
    },
    btnSalvar: "💾 Save workout",
    btnCancelar: "Cancel",
    pseTitulo: "How was the workout?",
    pseLabel: "RPE (0 to 10)",
    pseSalvar: "Save",
    pseCancelar: "Cancel",
    proximoModal: {
      titulo: "Today: Workout {letra} (Day {diaAtual})",
      subtitulo: "Tomorrow: Workout {letra} (Day {proximoDia}).",
      listaTitulo: "Tomorrow's workout",
      vazio: "We are preparing the next workout."
    },
    tour: {
      step: "{atual}/{total}",
      salvarTitulo: "Save your workout",
      salvarTexto: "When you finish, save it to record your RPE and progress.",
      cancelarTitulo: "Back to the panel",
      cancelarTexto: "Use cancel to leave the workout and return to FlowCenter.",
      next: "Next",
      finish: "Done",
      skip: "Skip"
    },
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
  raiz: "Strength Breath",
  clareza: "Focus Breath",
  brilho: "Power Breath",
  sereno: "Control Breath",

  /* Training Protocols */
  wake: "Wake Up",
  charge: "Charge",
  release: "Release",
  restore: "Restore",

  /* Universal */
  equilibrio: "Endurance",
  transparencia: "Discipline",

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
  faseAtual: "Current cycle",
  nenhumDado: "No data recorded yet."
},

  sistema: {
    cicloConfigurado: "Cycle configured!",
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
  },
  SM: {
    titulo: "🟢 Submaximal",
    texto: "Short rest intervals to emphasize the target muscle."
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
    faseAtual: "votre cycle d'entraînement",
  },

  menu: {
    title: "Menu",
    fechar: "Fermer",
    idioma: "Langue",
    sac: "J’ai besoin d’aide",
    ciclo: "Cycle d'entraînement",
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
      videoUrl:   "https://www.youtube.com/embed/2N9Lf3dSGpo",

      botaoFlowcenter: "Continuez votre entraînement",
      tituloPersonal:  "Personal",
      tituloFollowMe:  "Entraînez-vous pendant 30 jours",
      tituloMuscular:  "Entraînements par groupe musculaire",
      tituloEsportes:  "Sports",
      tituloCasa:      "S'entraîner à la maison",
      cards: {
        forcaabc: "Force",
        quadriceps: "Quadriceps",
        gluteos: "Fessiers",
        corrida_longa: "Course longue",
        casa_core_gluteo: "Fessiers et core",
        casa_queima_gordura: "Brûle-graisse",
        casa_mobilidade: "Mobilité",
        casa_fullbody_praia: "Full body plage",
        costas: "Dos",
        ombro: "Épaules",
        peito: "Poitrine",
        peitoral: "Pectoraux",
        militar: "Militaire",
        remo_oceanico: "Aviron océanique",
        beach_tennis: "Beach Tennis",
        jiu_jitsu: "Jiu-jitsu",
        natacao: "Natation",
        surf: "Surf",
        corrida_curta: "Course courte"
      }
    },
  flowcenter: {
  titulo: "Votre cycle d'entraînement",
  sub: "De la constance et du focus, chaque jour.",
  cicloTreinoTitulo: "Cycle d'entraînement",
  diaTreinoAtual: "Entraînement {letra} · Jour {dia}",

  treino: "Entraînement",
  treinoExtra: "Entraînement extra",
  evolucao: "Évolution",
  respiracao: "Respiration",
  endurance: "Endurance",
  proximoTreino: "Voir le prochain entraînement",

  treinoExtraTitulo: "Entraînement extra",
  treinoExtraSub: "Choisissez la zone que vous souhaitez travailler aujourd’hui.",
  treinoExtraSuperior: "Haut du corps",
  treinoExtraInferior: "Bas du corps",
  treinoExtraAbdomem: "Abdos",
  treinoExtraMobilidade: "Mobilité",
  treinoExtraFechar: "Fermer"
},

  ciclo: {
    titulo: "Définissez votre cycle d'entraînement",
    sub: "Choisissez la division d'entraînement que vous suivrez.",
    confirmar: "Confirmer le cycle",
    footer: "Cette configuration définit l'ordre de vos entraînements."
  },

  treino: {
    tituloTopo: "Entraînement du jour",
    tituloExtra: "Entraînement extra",
    diaPrograma: "Jour du programme",
     diaProgramaLabel: "Jour {dia}",
    extraTitulo: "Entraînement extra — {tipo}",
    extraLabel: "Général",
    extraOpcoes: {
      superior: "Haut du corps",
      inferior: "Bas du corps",
      abdomem: "Abdos",
      mobilidade: "Mobilité"
    },
    btnSalvar: "💾 Enregistrer l’entraînement",
    btnCancelar: "Annuler",
    pseTitulo: "Comment était l'entraînement ?",
    pseLabel: "PSE (0 à 10)",
    pseSalvar: "Enregistrer",
    pseCancelar: "Annuler",
    proximoModal: {
      titulo: "Aujourd’hui : Entraînement {letra} (Jour {diaAtual})",
      subtitulo: "Demain : Entraînement {letra} (Jour {proximoDia}).",
      listaTitulo: "Entraînement de demain",
      vazio: "Nous préparons le prochain entraînement."
    },
    tour: {
      step: "{atual}/{total}",
      salvarTitulo: "Enregistrez votre entraînement",
      salvarTexto: "À la fin, enregistrez pour noter votre PSE et votre progression.",
      cancelarTitulo: "Retour au tableau",
      cancelarTexto: "Utilisez annuler pour quitter l’entraînement et revenir au FlowCenter.",
      next: "Suivant",
      finish: "Terminer",
      skip: "Ignorer"
    },
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
  raiz: "Respiration Force",
  clareza: "Respiration Focus",
  brilho: "Respiration Puissance",
  sereno: "Respiration Contrôle",

  /* Protocoles – Entraînement */
  wake: "Réveil",
  charge: "Charger l'énergie",
  release: "Relâcher",
  restore: "Restaurer",

  /* Protocoles universels */
  equilibrio: "Endurance",
  transparencia: "Discipline",

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
  faseAtual: "Cycle actuel",
  nenhumDado: "Aucune donnée enregistrée."
},
  sistema: {
    cicloConfigurado: "Cycle configuré !",
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
  },
  SM: {
    titulo: "🟢 Submaximale",
    texto: "Repos courts pour stimuler le muscle ciblé."
  }
}
 }


};

/* ============================================================
   🔔 SINALIZAR QUE OS IDIOMAS ESTÃO PRONTOS
============================================================ */
// Disparar após garantir carregamento completo
window.addEventListener("DOMContentLoaded", () => {
    document.dispatchEvent(new CustomEvent("femflow:langReady"));
});
