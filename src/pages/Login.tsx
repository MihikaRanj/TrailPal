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

  // Function to handle user login
  const handleLogin = async () => {
    try {
      if (email && password) {
        // Authenticate user
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

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
          "Distance Deviation": 5,
          email: email
        });

        history.push('/home');
      }
    } catch (error) {
      setToastMessage('Registration failed. Please try again.');
      setShowToast(true);
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
