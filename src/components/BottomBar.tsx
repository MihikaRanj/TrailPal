// src/components/BottomBar.tsx
import React from 'react';
import {
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { homeOutline, walkOutline, settingsOutline, logOutOutline } from 'ionicons/icons';
import { auth } from '../firebaseConfig';

const BottomBar: React.FC = () => {
  const history = useHistory();

  const handleLogout = async () => {
    await auth.signOut();
    history.push('/login');
  };

  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" onClick={() => history.push('/home')}>
        <IonIcon icon={homeOutline} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="track-route" onClick={() => history.push('/track-route')}>
        <IonIcon icon={walkOutline} />
        <IonLabel>Track Route</IonLabel>
      </IonTabButton>
      <IonTabButton tab="settings" onClick={() => history.push('/settings')}>
        <IonIcon icon={settingsOutline} />
        <IonLabel>Settings</IonLabel>
      </IonTabButton>
      <IonTabButton tab="logout" onClick={handleLogout}>
        <IonIcon icon={logOutOutline} />
        <IonLabel>Logout</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default BottomBar;