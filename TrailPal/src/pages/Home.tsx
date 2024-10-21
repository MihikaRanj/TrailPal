// src/pages/Home.tsx
import React from 'react';
import { IonPage, IonContent, IonButton, IonText, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import BottomBar from '../components/BottomBar';

const Home: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonText>
          Hello! Welcome to Trailpal, an app than will help make travelling more safer.
          <br />
          <br />
          On the bottom of this screen you will see a few icons: Track Route, Settings, Logout.<br /><br />
          Track Route- After pressing the Track Route icon, you will be taken to a page in which you can start making your paths that
          you want tracked.
          You can also save paths and start your tracking!<br /><br />
          Settings- In this page, you will get to input some important information used in all you trackings. This includes 
          the number of miles that one is allowed to deviate away from their path, as well as the number of minutes that one 
          is allowed to deviate from their originial estimated travel time. Keep in mind that the number of minutes inputed
           will be only added to the estimated travel time, not also subtracted. Lastly you will be able to input your last 
           and first name for which will be used when composing a message sent to the user.<br /><br />
          Logout- The Logout icon will take you out of your saved account and back to the sign in page.
          
        </IonText>
       {/*  <IonButton expand="block" onClick={() => history.push('/track-route')}>
          Track Route
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/settings')}>
          Settings
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/location')}>
          Location
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/input')}>
          Input
        </IonButton>
        <IonButton expand="block" onClick={() => history.push('/routes')}>
          Routes
        </IonButton> */}
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default Home;