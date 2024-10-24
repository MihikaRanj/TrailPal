import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonLabel } from '@ionic/react';
import { useHistory } from 'react-router';
import BottomBar from '../components/BottomBar';

const GeoFenceLocation: React.FC = () => {

  const history = useHistory();
  
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
          <IonTitle className="custom-ion-title">Geo-fence Location</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Your content for Geo-fence location here */}
        <p>This is the Geo-fence location page.</p>
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default GeoFenceLocation;
