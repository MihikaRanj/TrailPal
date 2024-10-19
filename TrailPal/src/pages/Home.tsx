// src/pages/Home.tsx
import React from 'react';
import { IonPage, IonContent, IonButton, IonText, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import BottomBar from '../components/BottomBar';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          Add introduction to app
        </IonText>
       {/*  <IonButton expand="block" onClick={() => history.push('/track-route')}>
          Track Route
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/settings')}>
          Settings
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/location')}>
          Location
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/input')}>
          Input
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/routes')}>
          Routes
        </IonButton> */}
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default Home;