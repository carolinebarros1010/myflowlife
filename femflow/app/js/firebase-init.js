/* ============================================================
   FEMFLOW • FIREBASE INIT (COMPAT)
   Versão segura para múltiplas páginas
   Compatível com Firebase v9 (compat)
============================================================ */

(function initFirebaseFemFlow() {
  // 🔒 Evita erro se o SDK não estiver carregado
  if (typeof firebase === "undefined") {
    console.error("[FemFlow] Firebase SDK não carregado.");
    return;
  }

  // 🔁 Evita inicialização duplicada
  if (firebase.apps && firebase.apps.length > 0) {
    console.info("[FemFlow] Firebase já inicializado.");
    return;
  }

  // 🔑 CONFIGURAÇÃO DO PROJETO
 const firebaseConfig = {
  apiKey: "AIzaSyB675lX-la7dGkZP1tfvzlPZ4oxvMPLBh0",
  authDomain: "femflow-ebec2.firebaseapp.com",
  projectId: "femflow-ebec2",
  storageBucket: "femflow-ebec2.firebasestorage.app",
  messagingSenderId: "1043953159611",
  appId: "1:1043953159611:web:d12b82f744740f3124c89e",
  measurementId: "G-6F644L5VTW"
};

  try {
    firebase.initializeApp(firebaseConfig);
    console.info("[FemFlow] Firebase inicializado com sucesso.");
  } catch (err) {
    console.error("[FemFlow] Erro ao inicializar Firebase:", err);
  }
})();

