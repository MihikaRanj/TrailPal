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
} from '@ionic/react';
import { Route, Redirect } from 'react-router-dom';

// Import your sub-pages (On-demand, Scheduled, Geo-fence)
import OnDemandTracking from './OnDemandTracking';
import ScheduledTracking from './ScheduledTracking';
import GeoFenceLocation from './GeoFenceLocation';
import BottomBar from '../components/BottomBar';
import './TrailPal.css';

const TrackRoutePage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Track Route</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonTabs>
          {/* Tab buttons at the top */}
          <IonTabBar slot="top">
            <IonTabButton tab="on-demand" href="/track-route/on-demand" className="on-demand-tab">
              <IonLabel>On-demand tracking</IonLabel>
            </IonTabButton>

            <IonTabButton tab="scheduled" href="/track-route/scheduled" className="scheduled-tab">
              <IonLabel>Scheduled tracking</IonLabel>
            </IonTabButton>

            <IonTabButton tab="geo-fence" href="/track-route/geo-fence" className="geo-fence-tab">
              <IonLabel>Geo-fence location</IonLabel>
            </IonTabButton>
          </IonTabBar>

          {/* Router outlet to render different components based on selected tab */}
          <IonRouterOutlet>
            {/* Route for each tab */}
            <Route path="/track-route/on-demand" component={OnDemandTracking} exact />
            <Route path="/track-route/scheduled" component={ScheduledTracking} exact />
            <Route path="/track-route/geo-fence" component={GeoFenceLocation} exact />

           
          </IonRouterOutlet>
          <IonLabel>Write Instructions here!</IonLabel>
        </IonTabs>

        
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default TrackRoutePage;