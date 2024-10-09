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
import { auth } from '../firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const history = useHistory();

  const handleLogin = async () => {
    try {
      if (email && password) {
        await signInWithEmailAndPassword(auth, email, password);
        history.push('/home');
      }
    } catch (error) {
      setToastMessage('Login failed. Please try again.');
      setShowToast(true);
    }
  };

  const handleRegister = async () => {
    try {
      if (email && password) {
        await createUserWithEmailAndPassword(auth, email, password);
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
          <IonLabel position="floating">Email</IonLabel>
          <IonInput
            value={email}
            type="email"
            onIonChange={(e) => setEmail(e.detail.value!)}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="floating">Password</IonLabel>
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
