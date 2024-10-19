import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSelect, IonSelectOption, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonFooter, IonModal } from '@ionic/react';
import { useHistory } from 'react-router';
import BottomBar from '../components/BottomBar';
import { addDoc, collection, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { arrowBack, refreshOutline } from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { getDistance } from 'geolib';
import { sendSMS } from '../smsService';  // Your Twilio or SMS service

const OnDemandTracking: React.FC = () => {
  const history = useHistory();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<any | null>(null);
  const [endLocation, setEndLocation] = useState<any | null>(null);
  const [stops, setStops] = useState<any[]>([]);
  const [methodOfTravel, setMethodOfTravel] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [contact, setContact] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeoutId, setTimeoutId] = useState<any | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    // Fetch route and contact data from Firestore
    const fetchRouteData = async () => {
      if (user) {
        const routesCollection = collection(db, 'users', user.uid, 'currentdata');
        const routeDoc = doc(routesCollection, 'currentRoute');
        const contactDoc = doc(routesCollection, 'currentContact');

        const routeSnapshot = await getDoc(routeDoc);
        if (routeSnapshot.exists()) {
          const routeData = routeSnapshot.data();
          setStartLocation(routeData.startlocation?.coordinates);
          setEndLocation(routeData.endlocation?.coordinates);
          setStops(routeData.stops?.map((stop: any) => stop.coordinates) || []);
          setMethodOfTravel(routeData.methodOfTravel || null);
          setEstimatedTime(routeData.estimatedTime || null);
        }

        const contactSnapshot = await getDoc(contactDoc);
        if (contactSnapshot.exists()) {
          const contactData = contactSnapshot.data();
          setContact({
            name: contactData.name,
            phone: contactData.phone,
            email: contactData.email
          });
        }
      }
    };

    fetchRouteData();
  }, [user]);

  const sendRouteNotification = async () => {
    if (contact && startLocation && endLocation) {
      const message = `User has started their journey. Route: from ${startLocation.address} to ${endLocation.address} with stops: ${stops.map(stop => stop.address).join(', ')}. Estimated time: ${estimatedTime}`;
      sendSMS(contact.phone, message);
    }
  };

  const startTracking = async () => {
    setTrackingActive(true);
    setStartTime(new Date());
    await sendRouteNotification();

    // Track location every 10 seconds
    const locationWatcher = await Geolocation.watchPosition({ enableHighAccuracy: true }, (position) => {
      if (position && startLocation && endLocation) {
        const currentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        const currentDistanceFromRoute = calculateDistanceFromRoute(currentLocation);
        if (currentDistanceFromRoute > 5) {
          sendDeviationAlert();
        }

        // Check if user has reached the destination
        if (getDistance(currentLocation, endLocation) < 0.1) {
          sendArrivalNotification();
          stopTracking();
        }
      }
    });

    // Set up a timeout for estimated time + 5 minutes
    const timeLimit = (parseInt(estimatedTime || '0') + 5) * 60 * 1000; // in ms
    const timeout = setTimeout(() => {
      sendTimeExceededAlert();
    }, timeLimit);

    setTimeoutId(timeout);
  };

  const stopTracking = async () => {
    setTrackingActive(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    // Stop background geolocation tracking
    await Geolocation.clearWatch({ id: '' });
  };

  const calculateDistanceFromRoute = (currentLocation: any) => {
    // Use geolib to calculate distance from the current location to the nearest point on the path (startLocation -> stops -> endLocation)
    const routePoints = [startLocation, ...stops, endLocation];
    let closestDistance = Infinity;

    routePoints.forEach((point, index) => {
      const pointDistance = getDistance(currentLocation, point);
      if (pointDistance < closestDistance) {
        closestDistance = pointDistance;
      }
    });

    return closestDistance / 1609.34; // Convert meters to miles
  };

  const sendDeviationAlert = () => {
    if (contact) {
      const message = `Alert: The user has deviated more than 5 miles from the planned route.`;
      sendSMS(contact.phone, message);
    }
  };

  const sendArrivalNotification = () => {
    if (contact) {
      const message = `User has safely reached the destination.`;
      sendSMS(contact.phone, message);
    }
  };

  const sendTimeExceededAlert = () => {
    if (contact) {
      const message = `Alert: User has not reached the destination within the estimated time.`;
      sendSMS(contact.phone, message);
    }
  };

  const handleStartTrackingClick = () => {
    startTracking();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()}>
              <IonIcon icon={arrowBack} />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle>On-demand Tracking</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Route and contact details */}
        {startLocation && endLocation && (
          <>
            <IonItem>
              <IonLabel>Start: {startLocation.address}</IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>End: {endLocation.address}</IonLabel>
            </IonItem>
            {stops.length > 0 && (
              <IonItem>
                <IonLabel>Stops: {stops.map(stop => stop.address).join(', ')}</IonLabel>
              </IonItem>
            )}
            <IonItem>
              <IonLabel>Estimated Time: {estimatedTime} minutes</IonLabel>
            </IonItem>
          </>
        )}

        {contact && (
          <IonItem>
            <IonLabel>Contact: {contact.name} ({contact.phone})</IonLabel>
          </IonItem>
        )}

        <IonButton expand="block" onClick={handleStartTrackingClick} disabled={trackingActive}>
          Start Tracking
        </IonButton>
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default OnDemandTracking;
