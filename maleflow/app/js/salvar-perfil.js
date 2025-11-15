import { db } from './firebase.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js';
import { detectarUsuario } from './firebase.js';

// Salva nome e registro do aluno no Firestore
async function salvarPerfil(uid, nome, registro) {
  const ref = doc(db, `usuarios/${uid}`);
  await setDoc(ref, {
    nome: nome.trim(),
    registro: registro.trim(),
    atualizadoEm: new Date()
  }, { merge: true });

  alert("✅ Perfil salvo com sucesso!");
  document.getElementById('formPerfil').style.display = 'none';
}

// Verifica se já existe perfil salvo
async function checarPerfil(uid) {
  const ref = doc(db, `usuarios/${uid}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Detecta se o usuário está logado e mostra/esconde o formulário
detectarUsuario(async user => {
  if (user) {
    const perfil = await checarPerfil(user.uid);
    if (!perfil || !perfil.nome || !perfil.registro) {
      document.getElementById('formPerfil').style.display = 'block';
      document.getElementById('btnSalvarPerfil').addEventListener('click', () => {
        const nome = document.getElementById('nomeAluno').value;
        const registro = document.getElementById('registroAluno').value;

        if (nome.trim() && registro.trim()) {
          salvarPerfil(user.uid, nome, registro);
        } 
             else {
          alert('Preencha todos os campos antes de salvar.');
        }
        
      });
    }
  }
});
