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
        

        
          <IonLabel>Welcome to the <b>Track Route</b> page! To start tracking, first click the <b>on-demand</b> tracking button. Over here 
            you wll get the opportunity to choose a route and a contact. Pressing the <b>select route</b> text, you will get the option 
            to either make your own route or use an already saved route. After pressing the <b>create route</b> button, you will be moved 
            to a page in which you will have to fill out information necessary to creating your path. Once you have finished filling
             out the information, you can then start your tracking! You also have the option to go to <b>select routes</b> which will lead you to
              a page with all your currently saved paths. You can choose one of them and then start your tracking. Lastly, you will also see 
              the button <b>scheduled tracking</b> in which once you press it, you  can either enable or disable the choice to keep a path of your choice 
              on repeat every day. 
          </IonLabel>
       

        
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default TrackRoutePage;
