import React, { useState, useEffect } from 'react';
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
import { auth, db } from '../firebaseConfig'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { getMessaging, getToken } from "firebase/messaging"; 

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const history = useHistory();

  useEffect(() => {
    // Optional: Capture FCM token if the user is already logged in when the app starts
    const captureFCMToken = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            // Store the FCM token in Firestore
            await setDoc(doc(db, 'users', user.uid), { fcmToken }, { merge: true });
            console.log("FCM Token captured on app start:", fcmToken);
          }
        }
      } catch (error) {
        console.error("Error capturing FCM token on app start:", error);
      }
    };
    captureFCMToken();
  }, []);

  // Function to handle user login
  const handleLogin = async () => {
    try {
      if (email && password) {
        // Authenticate user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the FCM token in Firestore after login
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await setDoc(doc(db, 'users', user.uid), { fcmToken }, { merge: true });
          console.log("FCM Token updated on login:", fcmToken);
        }

        // Navigate to home page after successful login
        history.push('/home');
      }
    } catch (error) {
      setToastMessage('Login failed. Please try again.');
      setShowToast(true);
    }
  };

  // Function to handle user registration and notification permission
  const handleRegister = async () => {
    try {
      if (email && password) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create a new user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          "First Name": 'Not Specified',
          "Last Name": 'Not Specified',
          "Time Deviation": 5,
          "Distance Deviation": 5
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
          <IonInput value={email} type="email" onIonChange={(e) => setEmail(e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel>Password: </IonLabel>
          <IonInput value={password} type="password" onIonChange={(e) => setPassword(e.detail.value!)} />
        </IonItem>
        <IonButton expand="block" onClick={handleLogin}>
          Sign In
        </IonButton>
        <IonButton expand="block" fill="outline" onClick={handleRegister}>
          Register
        </IonButton>
        <IonToast isOpen={showToast} message={toastMessage} duration={2000} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
