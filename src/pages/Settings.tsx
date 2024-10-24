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
  const user = auth.currentUser;

  // Fetch existing settings when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          setFirstName(userData["First Name"] || 'Not Specified');
          setLastName(userData["Last Name"] || 'Not Specified');
          setTimeDeviation(userData["Time Deviation"] || 5);
          setDistanceDeviation(userData["Distance Deviation"] || 5);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Handle Save button click
  const handleSave = async () => {
    if (timeDeviation === undefined || distanceDeviation === undefined) {
      setToastMessage('Time Deviation and Distance Deviation are required.');
      setShowToast(true);
      return;
    }

    try {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
          "First Name": firstName,
          "Last Name": lastName,
          "Time Deviation": timeDeviation,
          "Distance Deviation": distanceDeviation,
        }, { merge: true });

        setToastMessage('Settings saved successfully.');
        setShowToast(true);
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
        {/* First Name Input */}
        <IonItem>
          <IonLabel>First Name</IonLabel>
          <IonInput
            value={firstName}
            onIonChange={(e) => setFirstName(e.detail.value!)}
            style={{ width: '200px', marginLeft: 'auto' }} 
          />
        </IonItem>

        {/* Last Name Input */}
        <IonItem>
          <IonLabel>Last Name</IonLabel>
          <IonInput
            value={lastName}
            onIonChange={(e) => setLastName(e.detail.value!)}
            style={{ width: '200px', marginLeft: 'auto' }}
          />
        </IonItem>

        {/* Time Deviation Input */}
        <IonItem>
          <IonLabel>Time Deviation (minutes)</IonLabel>
          <IonInput
            type="number"
            value={timeDeviation}
            onIonChange={(e) => setTimeDeviation(parseInt(e.detail.value!) || 5)} // Default to 5 if input is empty or invalid
            style={{ width: '100px', marginLeft: 'auto' }}
          />
        </IonItem>

        {/* Distance Deviation Input */}
        <IonItem>
          <IonLabel>Distance Deviation (miles)</IonLabel>
          <IonInput
            type="number"
            value={distanceDeviation}
            onIonChange={(e) => setDistanceDeviation(parseInt(e.detail.value!) || 5)} // Default to 5 if input is empty or invalid
            style={{ width: '100px', marginLeft: 'auto' }}
          />
        </IonItem>

        {/* Save Button */}
        <IonButton expand="block" onClick={handleSave}>
          Save
        </IonButton>

        {/* Toast to show success or error messages */}
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
