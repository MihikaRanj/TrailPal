import React from 'react';
import { IonPage, IonContent, IonButton, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import BottomBar from '../components/BottomBar';
import { useHistory } from 'react-router';

const TrackRoute: React.FC = () => {

  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track Route</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonButton expand="block" onClick={() => history.push('/create-route')}>
          Create Route
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/select-route')}>
          Select Route
        </IonButton>
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default TrackRoute;