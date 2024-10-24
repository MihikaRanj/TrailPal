import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router';
import { arrowBack } from 'ionicons/icons';
import BottomBar from '../components/BottomBar';

const ScheduledTracking: React.FC = () => {
  const history = useHistory();

  const handleCreateScheduledRoute = () => {
    // Navigate to CreateScheduledRoute page
    history.push('/create-scheduled-route');
  };

  const handleViewUpdateScheduledRoute = () => {
    // Navigate to View or Update Scheduled Route page (create the path for this page)
    history.push('/view-update-scheduled-route');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/track-route')}>
              <IonIcon icon={arrowBack} />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle>Scheduled Tracking</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Button to create a new scheduled route */}
        <IonButton expand="block" onClick={handleCreateScheduledRoute}>
          Create Scheduled Route
        </IonButton>

        {/* Button to view or update scheduled route */}
        <IonButton color="danger" expand="block" onClick={handleViewUpdateScheduledRoute}>
          View / Update Scheduled Route
        </IonButton>
      </IonContent>

      <BottomBar />
    </IonPage>
  );
};

export default ScheduledTracking;
