// valida-perfil.js — Verifica se perfil do aluno está completo
import { db } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';
import { detectarUsuario } from './firebase.js';

// Se não houver nome e registro, redireciona para cadastro.html
detectarUsuario(async user => {
  if (user) {
    const ref = doc(db, `usuarios/${user.uid}`);
    const snap = await getDoc(ref);
    if (!snap.exists() || !snap.data().nome || !snap.data().registro) {
      alert("👋 Você precisa completar seu perfil antes de treinar.");
      window.location.href = "cadastro.html";
    }
  } else {
    alert("Você precisa estar logado.");
  }
});
