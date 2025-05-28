// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import {getStorage} from "firebase/storage"
import {getFirestore} from "firebase/firestore"
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "speech-text-speech-6b769.firebaseapp.com",
  projectId: "speech-text-speech-6b769",
  storageBucket: "speech-text-speech-6b769.firebasestorage.app",
  messagingSenderId: "942558752554",
  appId: "1:942558752554:web:13a41c9245afb1f1bfb853",
  measurementId: "G-1PXTQ27K5X"
};

// Initialize Firebase
const app = getApps.length===0 ?  initializeApp(firebaseConfig): getApp()
// const analytics = getAnalytics(app);

const db = getFirestore(app)

const storage = getStorage(app)

export {db, storage}