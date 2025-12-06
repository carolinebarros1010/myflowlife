/* ===============================================
   FOLLOWME — Treine Junto por 30 dias
=============================================== */

const COACHES = [
  {
    enfase: "followme_livia",
    img: "img/livia.jpg", // você troca depois
    titulo: {
      pt: "Treine com Lívia Rapaci",
      en: "Train with Lívia Rapaci",
      fr: "Entraînez-vous avec Lívia Rapaci"
    },
    desc: {
      pt: "30 dias treinando junto com Lívia",
      en: "30 days training with Lívia",
      fr: "30 jours d’entraînement avec Lívia"
    }
  },
  {
    enfase: "followme_karoline",
    img: "img/karoline.jpg",
    titulo: {
      pt: "Treine com Karoline Bombeira",
      en: "Train with Karoline Bombeira",
      fr: "Entraînez-vous avec Karoline Bombeira"
    },
    desc: {
      pt: "30 dias com Karoline",
      en: "30 days with Karoline",
      fr: "30 jours avec Karoline"
    }
  },
  {
    enfase: "followme_thalita",
    img: "img/thalita.jpg",
    titulo: {
      pt: "Treine com Thalita Prates",
      en: "Train with Thalita Prates",
      fr: "Entraînez-vous avec Thalita Prates"
    },
    desc: {
      pt: "30 dias com Thalita",
      en: "30 days with Thalita",
      fr: "30 jours avec Thalita"
    }
  }
];

/* ============================================================
   RENDERIZAÇÃO DOS CARDS
============================================================ */
function renderCoaches(){
  const lang = FEMFLOW?.lang || "pt";
  const grid = document.getElementById("coachGrid");

  grid.innerHTML = COACHES.map(c => `
    <div class="coach-card" data-enfase="${c.enfase}">
      <div class="coach-thumb" style="background-image:url('${c.img}')"></div>
      <h3 class="coach-title">${c.titulo[lang]}</h3>
      <p class="coach-desc">${c.desc[lang]}</p>
      <button class="btn-treinar" onclick="iniciarFollowMe('${c.enfase}')">
        ${lang === "pt" ? "Iniciar treino do dia" : lang === "en" ? "Start today's workout" : "Commencer l'entraînement"}
      </button>
    </div>
  `).join("");
}

/* ============================================================
   INICIAR TREINO — SALVAR ENFASE E DIA
============================================================ */
window.iniciarFollowMe = function(enfase){

  const produto = (localStorage.getItem("femflow_produto") || "").toLowerCase();
  const ativa   = localStorage.getItem("femflow_ativa") === "true";

  // restrição de acesso
  if (produto !== "followme" || !ativa){
    FEMFLOW.toast("Seu plano não inclui o Treino Junto por 30 dias.");
    return;
  }

  // salva coach
  localStorage.setItem("femflow_enfase", enfase);
  localStorage.setItem("femflow_followme_coach", enfase);

  // se não existir ainda → inicia no dia 1
  const dia = Number(localStorage.getItem("femflow_followme_dia") || 1);
  localStorage.setItem("femflow_followme_dia", String(dia));

  // redireciona para treino
  FEMFLOW.router("treino.html");
};

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  renderCoaches();
});
