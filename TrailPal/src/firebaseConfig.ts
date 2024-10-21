// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, onMessage } from "firebase/messaging"; // Import for FCM


const firebaseConfig = {
  apiKey: "AIzaSyCkncIHmyvnc03mQ8Wg4yFopKocdx-FEA4",
  authDomain: "trailpal-983de.firebaseapp.com",
  projectId: "trailpal-983de",
  storageBucket: "trailpal-983de.appspot.com",
  messagingSenderId: "690309186701",
  appId: "1:690309186701:web:93f742d4d7878aeea48ec4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app); // Initialize Messaging
