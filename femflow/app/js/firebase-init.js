(function initFirebaseFemFlow() {
  if (typeof firebase === "undefined") {
    console.error("[FemFlow] Firebase SDK não carregado.");
    return;
  }

  if (firebase.apps && firebase.apps.length > 0) {
    console.info("[FemFlow] Firebase já inicializado.");
    return;
  }

  const firebaseConfig = {
    apiKey: "AIzaSyCNDL55caHcFqLpCPgxq5QK2Yt9YkXAvkE",
    authDomain: "femflow-ebec2.firebaseapp.com",
    projectId: "femflow-ebec2",
    storageBucket: "femflow-ebec2.appspot.com",
    messagingSenderId: "929402947409",
    appId: "1:929402947409:web:b65b7775ac44edeb4283ae"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore(); // 👈 opcional, mas útil
    console.info("[FemFlow] Firebase inicializado com sucesso.");
  } catch (err) {
    console.error("[FemFlow] Erro ao inicializar Firebase:", err);
  }
})();

