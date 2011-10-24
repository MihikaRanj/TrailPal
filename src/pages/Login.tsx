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
import { auth, db } from '../firebaseConfig'; 
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); 
  const history = useHistory();

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMessage('Please enter both email and password.');
      setShowToast(true);
      return;
    }

    setLoading(true); 
    try {
      // Authenticate user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      history.push('/home');
    } catch (error) {
      setToastMessage('Login failed. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false); 
    }
  };

  // Function to handle user registration and notification permission
  const handleRegister = async () => {
    if (!email || !password) {
      setToastMessage('Please enter both email and password.');
      setShowToast(true);
      return;
    }

    setLoading(true); 
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a new user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        "First Name": 'Not Specified',
        "Last Name": 'Not Specified',
        "Time Deviation": 5,
        "Distance Deviation": 5,
        "Minimum Distance Polling": 5,
        email: email
      });

      history.push('/home');
    } catch (error) {
      setToastMessage('Registration failed. Please try again.');
      setShowToast(true);
    } finally {
      setLoading(false); 
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
            onIonInput={(e: any) => setEmail(e.target.value)} 
            required
          />
        </IonItem>
        <IonItem>
          <IonLabel>Password: </IonLabel>
          <IonInput 
            value={password}
            type="password"
            onIonInput={(e: any) => setPassword(e.target.value)} 
            required
          />
        </IonItem>
        <IonButton expand="block" onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </IonButton>
        <IonButton expand="block" fill="outline" onClick={handleRegister} disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </IonButton>
        <IonToast isOpen={showToast} message={toastMessage} duration={2000} onDidDismiss={() => setShowToast(false)} />
      </IonContent>
    </IonPage>
  );
};

export default Login;
