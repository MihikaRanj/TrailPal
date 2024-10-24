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
        <IonToolbar color="light">
          <IonTabs>
          {/* Tab buttons at the top */}
          <IonTabBar slot="top">
            <IonTabButton tab="on-demand" href="/track-route/on-demand" className="on-demand-tab" >
              <IonLabel>On-demand tracking</IonLabel>
            </IonTabButton>

            <IonTabButton tab="scheduled" href="/track-route/scheduled">
              <IonLabel>Scheduled tracking</IonLabel>
              
            </IonTabButton>

            {/* <IonTabButton tab="geo-fence" href="/track-route/geo-fence" className="geo-fence-tab">
              <IonLabel>Geo-fence location</IonLabel>
            </IonTabButton> */}
          </IonTabBar>
            {/* Router outlet to render different components based on selected tab */}
            <IonRouterOutlet>
            {/* Route for each tab */}
            <Route path="/track-route/on-demand" component={OnDemandTracking} exact />
            <Route path="/track-route/scheduled" component={ScheduledTracking} exact />
           {/*  <Route path="/track-route/geo-fence" component={GeoFenceLocation} exact /> */}

           
          </IonRouterOutlet>
          </IonTabs>
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
