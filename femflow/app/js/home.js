/* ============================================================
   FemFlow • HOME.JS — VERSÃO FINAL 2025 CORRIGIDA
   Agora sincroniza ANTES de exibir cards
=========================================================== */

/* LINKS */
const LINK_ACESSO_APP = "https://pay.hotmart.com/E102962105N";
const LINK_PERSONAL   = "https://myflowlife.com.br/#ofertas";

/* FOLLOWME */
const FOLLOWME_LINKS = {
  livia: "#",
  karoline: "#",
  thalita: "#"
};

/* ============================================================
   LOADING
=========================================================== */
function mostrarLoading() {
  const box = document.createElement("div");
  box.id = "homeLoading";
  box.className = "home-loading";
  box.innerHTML = `
    <div class="loader-card">
      <div class="loader-circle"></div>
      <p>Carregando…</p>
    </div>
  `;
  document.body.appendChild(box);
}

function esconderLoading() {
  document.getElementById("homeLoading")?.remove();
}

/* ============================================================
   INÍCIO DA HOME — SINCRONIZAÇÃO AUTOMÁTICA
=========================================================== */
document.addEventListener("DOMContentLoaded", async () => {

  mostrarLoading();

  // ---------------------------
  // 1) EXECUTA SYNC DO CORE
  // ---------------------------
  const perfil = await FEMFLOW.carregarPerfil();

  if (!perfil) {
    FEMFLOW.toast("Erro ao carregar dados.");
    esconderLoading();
    return;
  }

  // Agora o localStorage DEVE possuir:
  // femflow_produto / femflow_ativa / femflow_personal

  // ---------------------------
  // 2) Atualiza saudação
  // ---------------------------
  const nome = localStorage.getItem("femflow_nome");
  if (nome) document.getElementById("bvTexto").textContent = `Bem-vinda, ${nome}!`;

  // ---------------------------
  // 3) Renderiza cards
  // ---------------------------
   renderRail(document.getElementById("railFollowMe"), LISTA_FOLLOWME);
  renderRail(document.getElementById("railMuscular"), LISTA_MUSCULAR);
  renderRail(document.getElementById("railEsportes"), LISTA_ESPORTES);
  renderRail(document.getElementById("railCasa"), LISTA_CASA);
  renderRail(document.getElementById("railPersonal"), LISTA_PERSONAL);

  esconderLoading();
});
