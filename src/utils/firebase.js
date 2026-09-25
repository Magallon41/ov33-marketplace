import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

let app = null;
let db = null;
let storage = null;
let auth = null;
let isFirebaseEnabled = false;

try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA_z-6o1IJId00eQLlRMA3C39DpCGIv7nQ",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ov33-marketplace.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ov33-marketplace",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ov33-marketplace.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "387856414897",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:387856414897:web:6f83ee2ebd9f2c0f69ca90",
  };

  // Validar de forma extremadamente defensiva si las variables obligatorias existen y son cadenas válidas
  const isFirebaseConfigured = 
    firebaseConfig.apiKey && 
    typeof firebaseConfig.apiKey === 'string' &&
    firebaseConfig.apiKey.trim() !== "" &&
    firebaseConfig.apiKey !== "undefined" &&
    firebaseConfig.projectId && 
    typeof firebaseConfig.projectId === 'string' &&
    firebaseConfig.projectId.trim() !== "" &&
    firebaseConfig.projectId !== "undefined" &&
    firebaseConfig.appId &&
    typeof firebaseConfig.appId === 'string' &&
    firebaseConfig.appId.trim() !== "" &&
    firebaseConfig.appId !== "undefined";

  if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    isFirebaseEnabled = true;
  } else {
    if (import.meta.env.DEV) {
      console.warn("💡 Firebase no configurado. Usando base de datos local de respaldo (solo desarrollo).");
    }
  }
} catch (error) {
  console.error("❌ Error crítico inicializando Firebase SDK, recurriendo a base de datos de respaldo local:", error);
  app = null;
  db = null;
  storage = null;
  auth = null;
  isFirebaseEnabled = false;
}

export { db, storage, auth, isFirebaseEnabled };
