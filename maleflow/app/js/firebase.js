// firebase.js — Integração MaleFlow com Firebase

// 1. Inicialização do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SUA_AUTH_DOMAIN",
  projectId: "SUA_PROJECT_ID",
  storageBucket: "SUA_BUCKET",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 2. Autenticar com Google
export function loginGoogle() {
  return signInWithPopup(auth, provider);
}

// 3. Salvar treino de um dia
export async function salvarTreino(uid, ciclo, dia, dados) {
  const ref = doc(db, `usuarios/${uid}/ciclos/${ciclo}/dias/${dia}`);
  await setDoc(ref, dados, { merge: true });
}

// 4. Buscar treino salvo
export async function buscarTreino(uid, ciclo, dia) {
  const ref = doc(db, `usuarios/${uid}/ciclos/${ciclo}/dias/${dia}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// 5. Detectar login automático
export function detectarUsuario(callback) {
  onAuthStateChanged(auth, user => {
    if (user) callback(user);
    else callback(null);
  });
}
