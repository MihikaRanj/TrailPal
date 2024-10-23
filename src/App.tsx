import { Redirect, Route } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import { onAuthStateChanged } from 'firebase/auth';

import { auth } from './firebaseConfig';
import Login from './pages/Login';
import Home from './pages/Home';
import Settings from './pages/Settings';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import MapPage from './pages/MapPage';
import RoutesPage from './pages/RoutesPage';
import CreateRoutePage from './pages/CreateRoutePage';
import TrackRoutePage from './pages/TrackRoutePage';
import GeoFenceLocation from './pages/GeoFenceLocation';
import OnDemandTracking from './pages/OnDemandTracking';
import ScheduledTracking from './pages/ScheduledTracking';
import CreateScheduledRoute from './pages/CreateScheduledRoute';
import ViewUpdateScheduledRoute from './pages/ViewUpdateScheduledRoute';

setupIonicReact();

const App: React.FC = () => {

  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  return (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
      {authenticated ? (
          <>
            <Route path="/home" component={Home} exact />
            <Route path="/track-route" component={TrackRoutePage} exact />
            <Route path="/settings" component={Settings} exact />
            <Route path="/routes" component={RoutesPage} exact />
            <Route path="/create-route" component={CreateRoutePage} />
            <Route path="/create-scheduled-route" component={CreateScheduledRoute} />
            <Route path="/view-update-scheduled-route" component={ViewUpdateScheduledRoute} />
            <Route path="/map/:type/:stopIndex?" component={MapPage} />
            <Route path="/track-route/on-demand" component={OnDemandTracking} exact />
            <Route path="/track-route/scheduled" component={ScheduledTracking} exact />
            <Route path="/track-route/geo-fence" component={GeoFenceLocation} exact />
            <Redirect exact from="/" to="/home" />
          </>
        ) : (
          <>
            <Route path="/login" component={Login} exact />
            <Redirect exact from="/" to="/login" />
          </>
        )}
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);
};

export default App;