// src/pages/Home.tsx
import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonText, IonHeader, IonTitle, IonToolbar, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import BottomBar from '../components/BottomBar';

// Import the plugins
import { Capacitor } from '@capacitor/core';
import { SMS } from '@awesome-cordova-plugins/sms';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions';

const Home: React.FC = () => {
  const history = useHistory();
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [smsPermissionGranted, setSmsPermissionGranted] = useState<boolean>(false);

  // Function to request SMS permission on Android
  const requestSmsPermission = async () => {
    try {
      const platform = Capacitor.getPlatform();
      if (platform === 'web') {
        setToastMessage('SMS permission cannot be requested in a browser.');
        setShowToast(true);
        return;
      }

      // Request SMS permission on Android using cordova-plugin-android-permissions
      const permission = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.SEND_SMS);
      if (permission.hasPermission) {
        setSmsPermissionGranted(true);
        setToastMessage('SMS permission granted');
      } else {
        setToastMessage('SMS permission denied');
      }
      setShowToast(true);
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      setToastMessage('Error requesting SMS permission');
      setShowToast(true);
    }
  };

  // Function to send a test SMS
  const sendTestSms = async () => {
    if (!smsPermissionGranted) {
      setToastMessage('SMS permission not granted. Please request permission first.');
      setShowToast(true);
      return;
    }

    try {
      const options = {
        replaceLineBreaks: false,
        android: {
          intent: '' // leave empty to send SMS without opening an SMS app
        }
      };

      await SMS.send('2487874138', 'This is a test SMS from TrailPal app!', options);
      setToastMessage('Test SMS sent successfully');
    } catch (error) {
      console.error('Error sending SMS:', error);
      setToastMessage('Failed to send SMS');
    }
    setShowToast(true);
  };
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="ion-text-center">Home</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent color="success" className="ion-padding">
      <IonText>
          Hello! Welcome to <b>TrailPal</b>, an app that will be your Pal when you are travelling alone by monitoring your path.
          <br />
          On the bottom of the screen you will see following icons.
          <br />
          <br />

          <b>Track Route</b>- After pressing this icon you will be taken to a page in which you can start making your paths that
          you want to be tracked.
          You can also save paths and contacts, start your tracking right away or schedule them for future use!<br /><br />
          <b>Settings</b>- In this page, you will get to input some important information used in all of your trackings. This includes 
          the number of miles that one is allowed to deviate away from their path, as well as the number of minutes that one 
          is allowed to deviate from their original estimated travel time before their contact is alerted. Lastly you will be able to input your last 
           and first name which will be used when composing a message sent to the user.<br /><br />
        </IonText>
      </IonContent>
      <BottomBar/>
    </IonPage>
  );
};

export default Home;
