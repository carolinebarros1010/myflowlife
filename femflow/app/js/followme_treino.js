/* ============================================================
   FOLLOWME • TREINO DO DIA
   MODO B — Carregar vídeo por fase + diaCiclo
   ------------------------------------------------------------
   Estrutura dos vídeos:
   videos/{coach}/{fase}_{dia}.mp4
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  FEMFLOW.inserirHeaderApp?.();
  FEMFLOW.inserirMenuLateral?.();
  FEMFLOW.inserirModalIdioma?.();

  /* ------------------------------------------------------------
     1) IDENTIFICAR QUAL COACH A ALUNA ESCOLHEU
  ------------------------------------------------------------ */
  const enfase = localStorage.getItem("femflow_enfase") || "";
  let coach = null;

  if (enfase.includes("livia"))      coach = "livia";
  else if (enfase.includes("karoline")) coach = "karoline";
  else if (enfase.includes("thalita"))  coach = "thalita";

  if (!coach) {
    FEMFLOW.toast("Selecione a coach no menu FollowMe.");
    return FEMFLOW.router("followme.html");
  }

  /* ------------------------------------------------------------
     2) BUSCAR CICLO ATUAL DO BACKEND
  ------------------------------------------------------------ */
  let perfil = await FEMFLOW.carregarCicloBackend();

  if (!perfil || !perfil.fase || !perfil.diaCiclo) {
    FEMFLOW.toast("Erro ao carregar ciclo. Verifique sua conexão.");
    return;
  }

  const fase  = perfil.fase.toLowerCase();   // menstrual / follicular / ovulatory / luteal
  const dia   = Number(perfil.diaCiclo);     // 1–28

  /* ------------------------------------------------------------
     3) MONTAR URL DO VÍDEO (MODELO B)
        caminho: videos/{coach}/{fase}_{dia}.mp4
  ------------------------------------------------------------ */
  const videoPath = `videos/${coach}/${fase}_${dia}.mp4`;

  const videoEl = document.getElementById("videoFollow");
  const srcEl   = document.getElementById("videoSrc");

  srcEl.src = videoPath;

  videoEl.load();

  /* ------------------------------------------------------------
     4) COLOCAR NOME DA COACH E INFO DO DIA
  ------------------------------------------------------------ */
  const mapaCoachNome = {
    livia: "Lívia Rapaci",
    karoline: "Karoline Bombeira",
    thalita: "Thalita Prates"
  };

  document.getElementById("coachNome").textContent =
    `Treino com ${mapaCoachNome[coach]}`;

  document.getElementById("coachSub").textContent =
    `FollowMe — Dia ${dia} do ciclo`;

  document.getElementById("faseHormonal").textContent =
    `Fase hormonal: ${fase}`;

  document.getElementById("diaPrograma").textContent =
    `Treino correspondente ao ciclo — Dia ${dia}`;

  /* ------------------------------------------------------------
     5) MODAL PSE
  ------------------------------------------------------------ */
  const modal    = document.getElementById("modalPSE");
  const rangePSE = document.getElementById("inputPSE");

  document.getElementById("btnRegistrarPSE").onclick = () => {
    modal.classList.remove("hidden");
  };

  document.getElementById("btnFecharPSE").onclick = () => {
    modal.classList.add("hidden");
  };

  document.getElementById("btnSalvarPSE").onclick = async () => {

    const pse = Number(rangePSE.value || 0);
    const id  = localStorage.getItem("femflow_id");

    // salvar local
    const hist = JSON.parse(localStorage.getItem("femflow_hist") || "[]");
    hist.push({ data: Date.now(), pse });
    localStorage.setItem("femflow_hist", JSON.stringify(hist));

    // salvar backend
    if (id) {
      try {
        await fetch(FEMFLOW.SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "salvarpse",
            id,
            fase,
            diaCiclo: dia,
            pse
          })
        });
      } catch (err) {}
    }

    FEMFLOW.toast("PSE registrada!");
    modal.classList.add("hidden");
  };

  /* ------------------------------------------------------------
     6) BOTÃO VOLTAR
  ------------------------------------------------------------ */
  document.getElementById("btnVoltarFollow").onclick = () => {
    FEMFLOW.router("followme.html");
  };

});
