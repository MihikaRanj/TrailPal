// src/pages/Settings.tsx
import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import BottomBar from '../components/BottomBar';

const Settings: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Settings Page</h2>
        {/* Implement settings functionality here */}
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default Settings;
