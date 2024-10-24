import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonRouterOutlet,
  IonButton,
  IonButtons,
} from '@ionic/react';
import { Route, Redirect, useHistory } from 'react-router-dom';

// Import your sub-pages (On-demand, Scheduled, Geo-fence)
import OnDemandTracking from './OnDemandTracking';
import ScheduledTracking from './ScheduledTracking';
import GeoFenceLocation from './GeoFenceLocation';
import BottomBar from '../components/BottomBar';
import './TrailPal.css';




const TrackRoutePage: React.FC = () => {
  const history = useHistory();

const handleOnDemand = () => {
  history.push('/track-route/on-demand');
};

const handleScheduled = () => {
  // Navigate to View or Update Scheduled Route page (create the path for this page)
  history.push('/track-route/scheduled');
};

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
          <IonButton  onClick={handleOnDemand}  className="on-demand-tab" >
              <IonLabel>On-demand tracking</IonLabel>
            </IonButton>
            <IonButton   onClick={handleScheduled} >
              <IonLabel>Scheduled tracking</IonLabel>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent color="success">
        

        
          <IonLabel>Welcome to the <b>Track Route</b> page! This is the main page to start your tracking. Here you have two options, <b>on-demand tracking</b> which allows you to instantly start tracking a path, and <b>scheduled tracking</b> which allows you to schedule tracking a path to repeat every day at a given time. <br/> <br/>  In both options you will be able to create a new route in which you will fill in information pertaining to the route you choose to make such as start location, end location, any intermediate stops, and the estimated time you think it will take for the journey. You will get the opportunity to use a saved path, which is when you can reuse a path that you had previously saved. You also will have to create or select a contact for every path you want to be tracked. <br/> <br/>  Once done, your contact will start receiving SMS notifications when you start on the path, when you deviate from the path, when you reach the destination, or when you don’t reach the destination in the estimated time. 
          The SMS will also contain your current location information.
          </IonLabel>
       

        
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default TrackRoutePage;
