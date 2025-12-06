/* ============================================================
   FOLLOWME • TREINO DIÁRIO COM VÍDEO (2025)
   Lógica oficial FemFlow — opção A (auto-salvar)
============================================================ */

/* ------------------------------------------------------------
   1) Obter Coach, Fase Hormonal e Dia do Programa
------------------------------------------------------------ */
function getCoachSlug() {
  const enfase = localStorage.getItem("femflow_enfase") || "";
  return enfase.replace("followme_", "");   // ex.: followme_livia → livia
}

function getVideoPath() {
  const coach = getCoachSlug();
  const fase  = (localStorage.getItem("femflow_fase") || "follicular").toLowerCase();
  const dia   = Number(localStorage.getItem("femflow_dia_treino") || 1);

  return `videos/${coach}/${fase}/${dia}.mp4`;
}

/* ------------------------------------------------------------
   2) SALVAR TREINO NO BACKEND
------------------------------------------------------------ */
async function salvarFollowMe() {
  const id = localStorage.getItem("femflow_id");
  const fase = localStorage.getItem("femflow_fase") || "follicular";
  const diaFirebase = Number(localStorage.getItem("femflow_dia_treino") || 1);

  if (!id) return;

  try {
    await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarTreino",
        id,
        fase,
        diaFirebase,
        pse: 0,             // FollowMe não usa PSE ainda
        treino: "followme", // marca o registro
        obs: ""
      })
    });
  } catch (err) {
    console.warn("Erro ao salvar treino FollowMe:", err);
  }
}

/* ------------------------------------------------------------
   3) AVANÇAR DIA DO PROGRAMA
------------------------------------------------------------ */
function avancarDia() {
  let dia = Number(localStorage.getItem("femflow_dia_treino") || 1);
  dia++;

  // se passar de 30 → finalizado
  if (dia > 30) {
    localStorage.setItem("followme_finalizado", "true");
    return false; // indica fim do ciclo
  }

  localStorage.setItem("femflow_dia_treino", String(dia));
  return true;
}

/* ------------------------------------------------------------
   4) Fluxo principal
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {

  // Se finalizado, bloquear
  if (localStorage.getItem("followme_finalizado") === "true") {
    alert("✨ Você concluiu os 30 dias do FollowMe! Parabéns!");
    FEMFLOW.router("flowcenter");
    return;
  }

  const video = document.getElementById("followmeVideo");
  if (!video) return;

  // carregar vídeo correto
  video.src = getVideoPath();

  // quando o vídeo terminar → auto salvar + avançar dia
  video.addEventListener("ended", async () => {
    FEMFLOW.toast("Treino concluído! Salvando progresso…");

    await salvarFollowMe();

    const continua = avancarDia();

    if (!continua) {
      FEMFLOW.toast("✨ Programa FollowMe finalizado.");
      FEMFLOW.router("flowcenter");
      return;
    }

    FEMFLOW.toast("Dia concluído! Seu próximo treino estará disponível ✨");

    setTimeout(() => FEMFLOW.router("flowcenter"), 1500);
  });
});
