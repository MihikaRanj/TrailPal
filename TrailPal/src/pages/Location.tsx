import React from 'react';
import { IonPage, IonContent, IonInput, IonItem, IonLabel } from '@ionic/react';
import BottomBar from '../components/BottomBar';
import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';



const Location: React.FC = () => {

  const useCurrentLocation = () => {
    const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  
    useEffect(() => {
      const getPosition = async () => {
        const position = await Geolocation.getCurrentPosition();
        setPosition({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      };
      getPosition();
    }, []);

    return position;
  };

  const position =   useCurrentLocation();
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2>Location</h2>
        <IonItem>
            <IonLabel position="stacked">Your location latitude</IonLabel>
            <IonInput readonly={true} value={position?.lat}/>
        </IonItem>
        <IonItem>
            <IonLabel position="stacked">Your location longitude</IonLabel>
            <IonInput readonly={true} value={position?.lon}/>
        </IonItem>
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default Location;