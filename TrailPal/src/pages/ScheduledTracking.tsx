import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonLabel } from '@ionic/react';
import { useHistory } from 'react-router';
import BottomBar from '../components/BottomBar';

const ScheduledTracking: React.FC = () => {

  const history = useHistory();
  
  const handleCreateRoute = () => {
    history.push({
      pathname: '/create-route',
      state: { from: 'ScheduledTracking' }
    });
  };
  
  return (
    <IonPage>
      <IonHeader>
      <IonToolbar>
          {/* Back Link */}
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.push('/track-route')}>
              <IonLabel>Back</IonLabel>
            </IonButton>
          </IonButtons>
          <IonTitle>Scheduled Tracking</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Your content for Scheduled tracking here */}
        <p>This is the Scheduled tracking page.</p>
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default ScheduledTracking;
