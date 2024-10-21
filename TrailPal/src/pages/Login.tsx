// src/pages/Login.tsx
import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { auth, db } from '../firebaseConfig'; // Import db from firebaseConfig for Firestore
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Firestore functions
import { getMessaging, getToken } from "firebase/messaging"; // Firebase messaging for FCM

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const history = useHistory();

  // Function to handle user login
  const handleLogin = async () => {
    try {
      if (email && password) {
        await signInWithEmailAndPassword(auth, email, password);
        history.push('/home');
      }
    } catch (error) {
      setToastMessage('Login failed. Please try again. If you are not registered yet, click on Register button.');
      setShowToast(true);
    }
  };

  // Function to handle user registration and notification permission
  const handleRegister = async () => {
    try {
      if (email && password) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a new user document in Firestore with default values
        await setDoc(doc(db, 'users', user.uid), {
          "First Name": 'Not Specified',
          "Last Name": 'Not Specified',
          "Time Deviation": 5,  // Set to 5 minutes
          "Distance Deviation": 5  // Set to 5 miles
        });

        // Request permission for notifications
        const permissionGranted = await askNotificationPermission();
        if (permissionGranted) {
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            // Store the FCM token in Firestore
            await setDoc(doc(db, 'users', user.uid), { fcmToken }, { merge: true });
            console.log("FCM Token saved:", fcmToken);
          }
        }

        history.push('/home');
      }
    } catch (error) {
      setToastMessage('Registration failed. Please try again.');
      setShowToast(true);
    }
  };

  // Function to ask for notification permission
  const askNotificationPermission = async (): Promise<boolean> => {
    try {
      const messaging = getMessaging();
      const token = await Notification.requestPermission();
      return token === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  // Function to generate FCM token
  const getFCMToken = async (): Promise<string | null> => {
    try {
      const messaging = getMessaging();
      const token = await getToken(messaging, { vapidKey: "BKSk3Nkr65Q9epzcbohyoWLqsPYv-TE_-216O4WAq4Tj469SWJDOkh6d-4Qdn7wMUtCRy9hWpTxl-P0qQgcj-wA" });
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel>Email: </IonLabel>
          <IonInput
            value={email}
            type="email"
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel>Password: </IonLabel>
          <IonInput
            value={password}
            type="password"
            onIonChange={(e) => setPassword(e.detail.value!)}
          />
        </IonItem>
        <IonButton expand="block" onClick={handleLogin}>
          Sign In
        </IonButton>
        <IonButton expand="block" fill="outline" onClick={handleRegister}>
          Register
        </IonButton>
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
