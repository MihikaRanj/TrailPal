// src/pages/RoutesPage.tsx
import React from 'react';
import { IonPage, IonContent, IonButton, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { useHistory } from 'react-router-dom';

const RoutesPage: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Routes</IonTitle>
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
    </IonPage>
  );
};

export default RoutesPage;
