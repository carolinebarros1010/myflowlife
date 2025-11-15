// salvar-treino.js — Salva pesos + data no Firebase
import { db } from './firebase.js';
import { detectarUsuario } from './firebase.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';

const cicloAtual = 'ciclo1';
const diaAtual = 'dia1';

async function salvarTreino(uid) {
  const container = document.querySelector('[data-dia]') || document.body;
  const inputs = container.querySelectorAll("input[data-exercicio]");
  const pseInput = document.getElementById("pseTreino");
  const registro = {};

  inputs.forEach(input => {
    const nome = input.dataset.exercicio;
    const peso = input.value.trim();
    if (peso) {
      registro[nome] = { nome, peso };
    }
  });

  if (pseInput && pseInput.value) {
    registro.pse = {
      valor: pseInput.value,
      registradoEm: new Date()
    };
  }

  Object.values(registro).forEach(r => {
    if (typeof r === 'object' && !r.registradoEm) {
      r.registradoEm = new Date();
    }
  });

  const ref = doc(db, `usuarios/${uid}/ciclos/${cicloAtual}/dias/${diaAtual}`);
  await setDoc(ref, registro, { merge: true });
  alert("✅ Treino salvo!");
}

// Botão de salvar
const botao = document.getElementById("btnSalvarTreino");
if (botao) {
  detectarUsuario(user => {
    botao.addEventListener("click", () => {
      if (user) salvarTreino(user.uid);
      else alert("Você precisa estar logado para salvar o treino.");
    });
  });
}
