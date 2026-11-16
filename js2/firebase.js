// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDJ6zzo0j3pmR66JvbHTkxPjSkgSSbtqSw",
  authDomain: "webgames-2465e.firebaseapp.com",
  projectId: "webgames-2465e",
  storageBucket: "webgames-2465e.firebasestorage.app",
  messagingSenderId: "232744715284",
  appId: "1:232744715284:web:0d51c11f3f5ea6ef785301",
  measurementId: "G-0KG4CBX669"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// Example custom event
/*export function logTikTakPlay() {
  analytics.logEvent("tiktak_play", {
    page: "TikTak",
    timestamp: Date.now()
  });
}*/


