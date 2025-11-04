Descrição dos 9 níveis de lógica (usuária → motor cíclico)

Tabela de status (PWA, Banco, Motor Hormonal etc.)

Referência ao Apps Script e link do deploy

Estrutura modular /modulos/transicao_15/[slug]/[fase]/treino_X_fase_slug.html




treino.js teste 
// ✅ Fallback para teste direto sem login
let id = localStorage.getItem("femflow_id");
if (!id) {
  const idPrompt = prompt("Digite o seu ID FemFlow para continuar:");
  if (idPrompt) {
    id = idPrompt.trim();
    localStorage.setItem("femflow_id", id);
  } else {
    FEMFLOW.toast("⚠️ ID não informado. Retornando...");
    location.href = "index.html";
    return;
  }
}
treino.js original

const id = localStorage.getItem("femflow_id");
if (!id) {
  FEMFLOW.toast("⚠️ Faça login novamente.");
  location.href = "ciclo.html";
  return;
}
