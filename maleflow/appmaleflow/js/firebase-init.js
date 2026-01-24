(function initFirebaseMaleFlow() {
  if (typeof firebase === "undefined") {
    console.error("[MaleFlow] Firebase SDK não carregado.");
    return;
  }

  if (firebase.apps && firebase.apps.length > 0) {
    console.info("[MaleFlow] Firebase já inicializado.");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyAU83ezlbZt7n4OpGcZp8fcrVZ0ZWTkMXA",
    authDomain: "male-flow.firebaseapp.com",
    projectId: "male-flow",
    storageBucket: "male-flow.firebasestorage.app",
    messagingSenderId: "88249220728",
    appId: "1:88249220728:web:b746e5384b9ee6623a378d",
    measurementId: "G-6WKRP3Z6VT"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore(); // 👈 opcional, mas útil
    console.info("[MaleFlow] Firebase inicializado com sucesso.");
  } catch (err) {
    console.error("[MaleFlow] Erro ao inicializar Firebase:", err);
  }
})();
