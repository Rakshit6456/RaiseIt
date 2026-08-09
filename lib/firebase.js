
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug: Check if config is loaded
console.log("Firebase Config Check:", {
    apiKey: firebaseConfig.apiKey ? "Present" : "Missing",
    authDomain: firebaseConfig.authDomain ? "Present" : "Missing",
    projectId: firebaseConfig.projectId ? "Present" : "Missing",
});

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
const auth = firebaseConfig.apiKey ? getAuth(app) : null;
const db = firebaseConfig.apiKey ? getFirestore(app) : null;

export { auth, db };
