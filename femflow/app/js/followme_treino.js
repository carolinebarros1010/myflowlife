/* ============================================================
   FOLLOWME TREINO — VERSÃO FINAL 2025
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  const id = localStorage.getItem("femflow_id");
  const coach = localStorage.getItem("femflow_followme_coach");
  let dia = Number(localStorage.getItem("femflow_followme_dia") || 1);

  const fase = localStorage.getItem("femflow_fase") || "follicular";

  if (!id || !coach) {
    alert("Erro: dados ausentes.");
    return (location.href = "flowcenter.html");
  }

  // ELEMENTOS
  const tituloCoach = document.getElementById("fmCoachNome");
  const progressTxt = document.getElementById("fmProgress");
  const videoEl = document.getElementById("fmVideo");
  const modalPSE = document.getElementById("fmModalPSE");

  tituloCoach.textContent = `Treinando com ${coach}`;

  /* ============================================================
     1) PROGRESSO (1/30)
  ============================================================ */
  function atualizarProgresso() {
    progressTxt.textContent = `Dia ${dia} de 30 — Fase: ${fase}`;
  }

  atualizarProgresso();

  if (dia > 30) {
    alert("Parabéns! Você concluiu os 30 dias do FollowMe.");
    return location.href = "flowcenter.html";
  }

  /* ============================================================
     2) DEFINIR VIDEO DO DIA (coach + fase)
  ============================================================ */
  function obterURLVideo() {
    const map = {
      "livia": {
        menstrual: ["videos/livia/menstrual1.mp4","videos/livia/menstrual2.mp4","videos/livia/menstrual3.mp4","videos/livia/menstrual4.mp4","videos/livia/menstrual5.mp4"],
        follicular: ["videos/livia/follicular1.mp4","videos/livia/follicular2.mp4","videos/livia/follicular3.mp4","videos/livia/follicular4.mp4","videos/livia/follicular5.mp4","videos/livia/follicular6.mp4","videos/livia/follicular7.mp4"],
        ovulatoria: ["videos/livia/ov1.mp4","videos/livia/ov2.mp4","videos/livia/ov3.mp4","videos/livia/ov4.mp4"],
        luteal: ["videos/livia/lut1.mp4","videos/livia/lut2.mp4","videos/livia/lut3.mp4","videos/livia/lut4.mp4","videos/livia/lut5.mp4","videos/livia/lut6.mp4","videos/livia/lut7.mp4","videos/livia/lut8.mp4","videos/livia/lut9.mp4","videos/livia/lut10.mp4","videos/livia/lut11.mp4","videos/livia/lut12.mp4","videos/livia/lut13.mp4","videos/livia/lut14.mp4"]
      }
      // adicionar Karoline / Thalita aqui
    };

    const diasFase = map[coach][fase];
    const idx = (dia - 1) % diasFase.length;
    return diasFase[idx];
  }

  const urlVideo = obterURLVideo();
  videoEl.src = urlVideo;


  /* ============================================================
     3) QUANDO O VIDEO TERMINA → ABRE MODAL PSE
  ============================================================ */
  videoEl.onended = () => {
    modalPSE.classList.remove("hidden");
  };


  /* ============================================================
     4) SALVAR PSE + AVANÇAR DIA
  ============================================================ */
  function salvarTreino(pse) {
    fetch(FEMFLOW.ENDPOINT_BACKEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvarTreino",
        id,
        fase,
        diaFirebase: dia,
        pse,
        treino: `followme_${coach}_${fase}_${dia}`
      })
    });

    dia++;
    localStorage.setItem("femflow_followme_dia", String(dia));

    alert("Treino salvo! Parabéns 🙌");
    location.href = "flowcenter.html";
  }

  document.querySelectorAll(".pse-val").forEach(btn => {
    btn.onclick = () => {
      const val = Number(btn.textContent);
      salvarTreino(val);
    };
  });

  document.getElementById("fmCancelarPSE").onclick = () => {
    modalPSE.classList.add("hidden");
  };

  /* ============================================================
     5) REPLAY PERMITIDO
  ============================================================ */
  document.getElementById("fmReplayBtn").onclick = () => {
    videoEl.currentTime = 0;
    videoEl.play();
  };

  /* ============================================================
     6) VOLTAR SEM SALVAR
  ============================================================ */
  document.getElementById("fmVoltarBtn").onclick = () => {
    location.href = "followme.html";
  };

});
