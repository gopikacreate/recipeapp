// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7t_lEkxkkQsgA-WDyhdwO7jx6HpPVIoM",
  authDomain: "recipeapp-ae306.firebaseapp.com",
  projectId: "recipeapp-ae306",
  storageBucket: "recipeapp-ae306.firebasestorage.app",
  messagingSenderId: "52285657440",
  appId: "1:52285657440:web:f3f2ff173bca129e5c0e05",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
