// src/pages/Home.tsx
import React from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import BottomBar from '../components/BottomBar';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={() => history.push('/track-route')}>
          Track Route
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/settings')}>
          Settings
        </IonButton>
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default Home;