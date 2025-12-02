// js/lang.js

window.FEMFLOW = window.FEMFLOW || {};

FEMFLOW.langs = {
  pt: {
    menu: {
      title: "Menu",
      idioma: "Idioma",
      ciclo: "Ajustar ciclo",
      respiracao: "Respiração",
      treinos: "Meus Treinos",
      nivel: "Alterar nível",
      tema: "Tema",
      voltar: "Voltar",
      sair: "Sair"
    },
    fases: {
      menstrual: "Menstrual",
      follicular: "Folicular",
      ovulatory: "Ovulatória",
      luteal: "Lútea"
    },
    geral: {
      carregando: "Carregando…",
      faseAtual: "Fase atual",
    }
  },

  fr: {
    menu: {
      title: "Menu",
      idioma: "Langue",
      ciclo: "Ajuster le cycle",
      respiracao: "Respiration",
      treinos: "Mes entraînements",
      nivel: "Changer le niveau",
      tema: "Thème",
      voltar: "Retour",
      sair: "Quitter"
    },
    fases: {
      menstrual: "Menstruelle",
      follicular: "Folliculaire",
      ovulatory: "Ovulatoire",
      luteal: "Lutéale"
    },
    geral: {
      carregando: "Chargement…",
      faseAtual: "Phase actuelle",
    }
  },

  en: {
    menu: {
      title: "Menu",
      idioma: "Language",
      ciclo: "Adjust cycle",
      respiracao: "Breathing",
      treinos: "My Workouts",
      nivel: "Change level",
      tema: "Theme",
      voltar: "Back",
      sair: "Logout"
    },
    fases: {
      menstrual: "Menstrual",
      follicular: "Follicular",
      ovulatory: "Ovulatory",
      luteal: "Luteal"
    },
    geral: {
      carregando: "Loading…",
      faseAtual: "Current phase",
    }
  }
};

// Define idioma atual
FEMFLOW.lang = localStorage.getItem("femflow_lang") || "pt";

FEMFLOW.setLang = function(code) {
  FEMFLOW.lang = code;
  localStorage.setItem("femflow_lang", code);

  // Dispara evento para páginas atualizarem textos
  document.dispatchEvent(new CustomEvent("femflow:langChange"));
};
