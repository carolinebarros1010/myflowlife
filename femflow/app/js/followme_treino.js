/* ============================================================
   FOLLOWME • TREINO DO DIA
   Opção B — Conta como TREINO REAL (avança ciclo)
============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  const id = localStorage.getItem("femflow_id");
  const enfase = localStorage.getItem("femflow_enfase") || "";
  const coach = enfase.replace("followme_", ""); // livia / karoline / thalita

  if (!id || !coach) {
    FEMFLOW.toast("Erro ao carregar treino.");
    return FEMFLOW.router("flowcenter");
  }

  /* --------------------------
     1) Sincronizar com backend
  -------------------------- */
  const resp = await FEMFLOW.api.get("sync", { id });
  if (!resp || resp.status !== "ok") {
    FEMFLOW.toast("Não foi possível sincronizar o ciclo.");
    return;
  }

  const fase = resp.fase;       
  const dia = resp.diaCiclo;    
  const nivel = resp.nivel;

  // Título
  document.getElementById("fmCoach").textContent =
    "Treine com " + coach.charAt(0).toUpperCase() + coach.slice(1);

  document.getElementById("fmFaseDia").textContent =
    `Fase: ${fase} • Dia do ciclo: ${dia}`;

  /* --------------------------
     2) Carregar vídeo correto
     videos/<coach>/<fase>_<dia>.mp4
  -------------------------- */
  const src = `videos/${coach}/${fase}_${dia}.mp4`;
  document.getElementById("fmSource").src = src;
  document.getElementById("fmVideo").load();


  /* --------------------------
     3) Abrir modal PSE
  -------------------------- */
  const modal = document.getElementById("fmModalPSE");
  document.getElementById("fmSalvar").onclick = () => {
    modal.classList.remove("hidden");
  };

  document.getElementById("fmCancelar").onclick = () => {
    modal.classList.add("hidden");
  };

  /* --------------------------
     4) Confirmar PSE → SALVAR TREINO REAL
  -------------------------- */
  document.getElementById("fmConfirmar").onclick = async () => {

    const pse = Number(document.getElementById("fmPSE").value);

    const resultado = await FEMFLOW.api.post({
      action: "salvarTreino",
      id: id,
      fase: fase,
      diaFirebase: dia,
      pse: pse,
      treino: `followme_${coach}`,
      obs: ""
    });

    if (resultado && resultado.status === "ok") {
      FEMFLOW.toast("Treino registrado!");
      FEMFLOW.router("flowcenter");
    } else {
      FEMFLOW.toast("Erro ao salvar.");
    }
  };

  /* --------------------------
     5) Voltar
  -------------------------- */
  document.getElementById("fmVoltar").onclick = () => {
    FEMFLOW.router("flowcenter");
  };

});
