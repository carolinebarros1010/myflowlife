// firebase.js — Integração MaleFlow com Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyAU83ezlbZt7n4OpGcZp8fcrVZ0ZWTkMXA",
  authDomain: "male-flow.firebaseapp.com",
  projectId: "male-flow",
  storageBucket: "male-flow.firebasestorage.app",
  messagingSenderId: "88249220728",
  appId: "1:88249220728:web:b746e5384b9ee6623a378d",
  measurementId: "G-6WKRP3Z6VT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

export function loginGoogle() {
  return signInWithPopup(auth, provider);
}

export async function salvarTreino(uid, ciclo, dia, dados) {
  const ref = doc(db, `usuarios/${uid}/ciclos/${ciclo}/dias/${dia}`);
  await setDoc(ref, dados, { merge: true });
}

export async function buscarTreino(uid, ciclo, dia) {
  const ref = doc(db, `usuarios/${uid}/ciclos/${ciclo}/dias/${dia}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function detectarUsuario(callback) {
  onAuthStateChanged(auth, user => {
    if (user) callback(user);
    else callback(null);
  });
}
