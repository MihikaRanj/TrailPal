// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCH69egmm4aGKsiP7t5lOE55jw4JqgOzUc",
    authDomain: "trailpath-b857e.firebaseapp.com",
    projectId: "trailpath-b857e",
    storageBucket: "trailpath-b857e.appspot.com",
    messagingSenderId: "888504770138",
    appId: "1:888504770138:web:0a8ba430d12d1b82558263"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
