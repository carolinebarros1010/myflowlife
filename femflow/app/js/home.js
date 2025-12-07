/* ============================================================
   FemFlow • HOME.JS — VERSÃO FINAL 2025
   Compatível com CORE 5.2
=========================================================== */

/* LINKS DE COMPRA */
const LINK_ACESSO_APP = "https://pay.hotmart.com/E102962105N";
const LINK_PERSONAL   = "https://myflowlife.com.br/#ofertas";

/* FOLLOWME STUB */
const FOLLOWME_LINKS = {
  livia: "#",
  karoline: "#",
  thalita: "#"
};

/* ============================================================
   0. LOADING
=========================================================== */

function showHomeLoader() {
  const box = document.createElement("div");
  box.id = "homeLoader";
  box.innerHTML = `
    <div class="loader-box">
      <div class="loader-circle"></div>
      <p>Carregando...</p>
    </div>
  `;
  document.body.appendChild(box);
}

function hideHomeLoader() {
  document.getElementById("homeLoader")?.remove();
}

/* ============================================================
   1. INICIALIZAÇÃO COMPLETA (com backend)
=========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  showHomeLoader();

  // 1) Carregar perfil rápido
  await FEMFLOW.carregarPerfil();

  // 2) Sincronizar ciclo, produto, ativa, enfase
  await FEMFLOW.carregarCicloBackend();

  // 3) Agora sim libera a Home
  window.dispatchEvent(new Event("femflow:ready"));

  hideHomeLoader();
});

/* ============================================================
   2. SAUDAÇÃO E RENDERIZAÇÃO
=========================================================== */
window.addEventListener("femflow:ready", () => {

  const nome = localStorage.getItem("femflow_nome");

  if (nome)
    document.getElementById("bvTexto").textContent = `Bem-vinda, ${nome}!`;

  ativarCardPersonalTopo();

  renderRail(document.getElementById("railFollowMe"), LISTA_FOLLOWME);
  renderRail(document.getElementById("railMuscular"), LISTA_MUSCULAR);
  renderRail(document.getElementById("railEsportes"), LISTA_ESPORTES);
  renderRail(document.getElementById("railCasa"), LISTA_CASA);
  renderRail(document.getElementById("railPersonal"), LISTA_PERSONAL);
});
