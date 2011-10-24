// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonInput, IonItem, IonLabel, IonButton, IonToast, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import BottomBar from '../components/BottomBar';

const Settings: React.FC = () => {
  const [firstName, setFirstName] = useState<string>('Not Specified');
  const [lastName, setLastName] = useState<string>('Not Specified');
  const [timeDeviation, setTimeDeviation] = useState<number>(5);
  const [distanceDeviation, setDistanceDeviation] = useState<number>(5);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [minDistancePolling, setMinDistancePolling] = useState<number>(5);
  const user = auth.currentUser;

  // Fetch existing settings when the component loads
  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setFirstName(userData["First Name"] || 'Not Specified');
        setLastName(userData["Last Name"] || 'Not Specified');
        setTimeDeviation(userData["Time Deviation"]);
        setDistanceDeviation(userData["Distance Deviation"]);
        setMinDistancePolling(userData["Minimum Distance Polling"]);
        console.log("userData:"+userData["Minimum Distance Polling"]+", misDistancePolling:"+minDistancePolling);
      }
    }
  };
  // Handle Save button click
  const handleSave = async () => {
    if (!timeDeviation && !distanceDeviation && !minDistancePolling) {
      setToastMessage('Time Deviation, Distance Deviation and Minimum Distance Polling are required.');
      setShowToast(true);
      return;
    }

    try {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
          "First Name": firstName,
          "Last Name": lastName,
          "Time Deviation": (timeDeviation || timeDeviation==0)?timeDeviation:5,
          "Distance Deviation": (distanceDeviation || distanceDeviation==0)?distanceDeviation:5,
          "Minimum Distance Polling": (minDistancePolling || minDistancePolling==0)?minDistancePolling:5,
        }, { merge: true });

        setToastMessage('Settings saved successfully.');
        setShowToast(true);
        fetchUserData();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setToastMessage('Failed to save settings. Please try again.');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="ion-text-center">Settings Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent color="success" className="ion-padding">

        <IonItem>
          <IonLabel>First Name</IonLabel>
          <IonInput
            value={firstName}
            onIonInput={(e: any) => setFirstName(e.detail.value!)}
            style={{ width: '200px', marginLeft: 'auto' }} 
          />
        </IonItem>

        <IonItem>
          <IonLabel>Last Name</IonLabel>
          <IonInput
            value={lastName}
            onIonInput={(e: any) => setLastName(e.detail.value!)}
            style={{ width: '200px', marginLeft: 'auto' }}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Time Deviation (minutes)</IonLabel>
          <IonInput
            type="number"
            value={timeDeviation}
            onIonInput={(e: any)=> setTimeDeviation(parseInt(e.detail.value!))} 
            style={{ width: '100px', marginLeft: 'auto' }}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Distance Deviation (miles)</IonLabel>
          <IonInput
            type="number"
            value={distanceDeviation}
            onIonInput={(e: any) => setDistanceDeviation(parseInt(e.detail.value!))} 
            style={{ width: '100px', marginLeft: 'auto' }}
          />
        </IonItem>

        <IonItem>
          <IonLabel>Minimum Distance Polling (meters)</IonLabel>
          <IonInput
            type="number"
            value={minDistancePolling}
            onIonInput={(e: any) => setMinDistancePolling(parseInt(e.target.value))} 
            style={{ width: '100px', marginLeft: 'auto' }}
          />
        </IonItem>

        <IonButton expand="block" onClick={handleSave}>
          Save
        </IonButton>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
      
      <BottomBar />
    </IonPage>
  );
};

export default Settings;
