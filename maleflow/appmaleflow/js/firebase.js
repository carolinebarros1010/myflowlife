import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

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
getAnalytics(app);
