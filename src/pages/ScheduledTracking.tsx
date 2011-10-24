import React, { useEffect, useRef, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonFooter } from '@ionic/react';
import { useHistory } from 'react-router';
import { arrowBack } from 'ionicons/icons';
import { collection, getDocs, doc, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import BottomBar from '../components/BottomBar';
import { Geolocation } from '@capacitor/geolocation';
import { BackgroundGeolocation } from '../plugins';
import { explainBackgroundLocationAccess, getCurrentLocationWithRetries, getRoutePath, hasReachedDestination, initializeBackgroundMode, isOnRoute, sendNotificationToContact, startForegroundService, stopBackgroundMode } from '../tracking';


const ScheduledTracking: React.FC = () => {
  const history = useHistory();
  const [scheduledRoutes, setScheduledRoutes] = useState<ScheduledRoute[]>([]);
  const scheduledRoutesRef = useRef<ScheduledRoute[]>([]);
  const [trackingInProgress, setTrackingInProgress] = useState<boolean>(false);
  const [minPollingInterval, setMinPollingInterval] = useState<number>(60000); 
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState<string>('Not Specified');
  const [lastName, setLastName] = useState<string>('Not Specified');
  const [timeDeviation, setTimeDeviation] = useState<number>(0);
  const [distanceDeviation, setDistanceDeviation] = useState<number>(0);
  const deviationAlertRef = useRef<boolean>(false);
  const trackingRef = useRef<boolean>(false);
  const scheduledRoutesFetched = useRef<boolean>(false);
  const currentScheduledRouteRef = useRef<ScheduledRoute | null>(null);
  const currentScheduledEndTimeRef = useRef<Date>(new Date());
  const watcherIdRef = useRef<string | null>(null); 
  const [minDistancePolling, setMinDistancePolling] = useState<number>(5);
  const watchIdRef = useRef<string | null>(null);  

  useEffect(() => {
    console.log("useEffect");
    setScheduledRoutes([]);
    scheduledRoutesRef.current = [];
    scheduledRoutesFetched.current = false;

    if (window.cordova) {
      explainBackgroundLocationAccess();
    }
    fetchUserData();

  }, [user]);

  const getScheduledDate = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0); 
    return scheduledDate;
  };

  const fetchUserData = async (): Promise<void> => {
    console.log('fetchUserData');
    const user = auth.currentUser;
    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        setFirstName(userData["First Name"]);
        setLastName(userData["Last Name"]);
        setTimeDeviation(userData["Time Deviation"]);
        setDistanceDeviation(userData["Distance Deviation"]);
        setMinDistancePolling(userData["Minimum Distance Polling"]);
      }
    }
  };


  const handleStartTracking = async () => {
    let intervalId: any;
    setTrackingInProgress(true);
    currentScheduledEndTimeRef.current = new Date();

    if (window.cordova) {
      await startForegroundService(); 
      await initializeBackgroundMode();
    }

    if (user) {
      if (!scheduledRoutesFetched.current) {
        const scheduledRoutesCollection = collection(db, 'users', user.uid, 'savedscheduledroutes');
        console.log("checkScheduledRoutes fetching db");
        const q = query(scheduledRoutesCollection, where('enableTracking', '==', true));
        const querySnapshot = await getDocs(q);

        const routes: ScheduledRoute[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          enableTracking: doc.data().enableTracking,
          route: doc.data().route,
          contact: doc.data().contact,
          scheduledStartTime: doc.data().scheduledStartTime
        }));
        setScheduledRoutes(routes);
        scheduledRoutesRef.current = routes;
        scheduledRoutesFetched.current = true;
      }
    }

    if (window.cordova) {
      await configureBackgroundGeolocation();

      console.log("After configureBackgroundGeolocation call");
    } else {
      const checkPosition = async () => {
        const currentTime = new Date();
        const position = await getCurrentLocationWithRetries();
        if (!position) return;

        console.log("Inside checkPosition, trackingRef.current:" + trackingRef.current + ", currentTime:" + currentTime + ", currentScheduledEndTimeRef.current:" + currentScheduledEndTimeRef.current + ", currentScheduledRouteRef.current:" + currentScheduledRouteRef.current);
        if (!trackingRef.current &&
          (currentScheduledEndTimeRef.current && currentTime >= currentScheduledEndTimeRef.current)) {
          await checkScheduledRoutes();
        }
        if (trackingRef.current && currentScheduledRouteRef.current && currentScheduledEndTimeRef.current) {
          await startTracking(currentScheduledRouteRef.current.route, currentScheduledRouteRef.current.contact, position, currentScheduledEndTimeRef.current);
        }
      };

      intervalId = setInterval(checkPosition, minPollingInterval);
      watchIdRef.current = intervalId;
    }

  }

  const configureBackgroundGeolocation = async () => {
    console.log("configureBackgroundGeolocation: Before calling addWatcher");
    const id = await BackgroundGeolocation.addWatcher(
      {
        requestPermissions: true,
        stale: false,
        distanceFilter: minDistancePolling, 
        backgroundMessage: "Location tracking in progress...",
        backgroundTitle: "Location Tracking",
      },
      async (location, error) => {
        if (error) {
          if (error.code === 'NOT_AUTHORIZED') {
            if (window.confirm('This app requires location tracking permission. Would you like to enable it in settings?')) {
              BackgroundGeolocation.openSettings();
            }
          }
          return console.error('Error:', error);
        }
        
        console.log('Location update:', location);

        if (!location)
          return;
        const currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude
        };

        const currentTime = new Date();
        const position = await getCurrentLocationWithRetries();
        if (!position) return; 

        console.log("Inside checkPosition, trackingRef.current:" + trackingRef.current + ", currentTime:" + currentTime + ", currentScheduledEndTimeRef.current:" + currentScheduledEndTimeRef.current + ", currentScheduledRouteRef.current:" + currentScheduledRouteRef.current);
        if (!trackingRef.current &&
          (currentScheduledEndTimeRef.current && currentTime >= currentScheduledEndTimeRef.current)) {
          await checkScheduledRoutes();
        }
        if (trackingRef.current && currentScheduledRouteRef.current && currentScheduledEndTimeRef.current) {
          await startTracking(currentScheduledRouteRef.current.route, currentScheduledRouteRef.current.contact, position, currentScheduledEndTimeRef.current);
        }
      }

    );

    watcherIdRef.current = id;
    console.log("watcher id: " + watcherIdRef.current);
  };


  // Check if any route needs to start tracking based on `scheduledStartTime`
  const checkScheduledRoutes = async () => {

    currentScheduledRouteRef.current = null;
    if (user) {
      const currentTime = new Date();

      for (const route of scheduledRoutesRef.current) {
        const scheduledStartTime = getScheduledDate(route.scheduledStartTime);
        const estimatedTimeInMinutes = parseInt(route.route.estimatedTime, 10) + (timeDeviation || 5);; 
        const scheduledEndTime = new Date(scheduledStartTime.getTime() + estimatedTimeInMinutes * 60000); 

        console.log('checkScheduledRoutes:' + route.id + ", currentTime:" + currentTime + ", scheduledStartTime:" + scheduledStartTime + ", scheduledEndTime:" + scheduledEndTime);

        if (scheduledEndTime >= currentTime && scheduledStartTime <= currentTime) {
          console.log(`Starting scheduled tracking for route: ${route.id}`);
          trackingRef.current = true;
          deviationAlertRef.current = false;
          currentScheduledRouteRef.current = route;
          currentScheduledEndTimeRef.current = scheduledEndTime;
          // Send initial notification to contact
          await sendNotificationToContact('tracking-started', {
            location: await getCurrentLocationWithRetries(),
            route: route.route,
          }, route.contact, user, firstName);
        }
      }
    }
  };



  const startTracking = async (currentRoute: any, currentContact: any, currentPosition: any, totalTimeBeforeTimeout: Date) => {
    trackingRef.current = true;
    console.log("startTracking");
    console.log(timeDeviation + ":" + distanceDeviation);
    console.log(currentRoute);
    console.log(currentContact);

    // Ensures that currentRoute and currentContact are fully loaded
    if (!currentRoute || !currentContact) {
      console.log('Route or contact data missing, tracking cannot start.');
      trackingRef.current = false;
      return;
    }

    if (deviationAlertRef.current)
      return;

    const routePath = getRoutePath(currentRoute);

    if (!routePath)
      return;

    if (!currentPosition) return;
    const { latitude, longitude } = currentPosition;
    const currentLocation = { latitude, longitude };

    console.log("totalTimeBeforeTimeout:" + totalTimeBeforeTimeout + ",latitude:" + latitude + ",longitude:" + longitude + ",routePath:" + routePath);

    if (!latitude || !longitude || !routePath || !routePath.length) return;
    console.log("after if");
    await checkAndSendAlerts(currentLocation, routePath, totalTimeBeforeTimeout, currentRoute, currentContact);

  }

  const checkAndSendAlerts = async (currentLocation: any, routePath: any, totalTimeBeforeTimeout: Date, currentRoute: any, currentContact: any) => {
    console.log("Inside checkAndSendAlerts:currentLocation:" + currentLocation + ", distanceDeviation:" + distanceDeviation + ",deviationAlertRef.current:" + deviationAlertRef.current);

    const currentTime = new Date();
    if (!deviationAlertRef.current && !isOnRoute(currentLocation, routePath, distanceDeviation)) {
      deviationAlertRef.current = true;
      sendNotificationToContact('route-deviation', { location: currentLocation }, currentContact, user, firstName);
      stopTracking();
    }

    if (hasReachedDestination(currentLocation, currentRoute)) {
      sendNotificationToContact('reached-destination', { location: currentLocation }, currentContact, user, firstName);
      stopTracking();
    }

    if (!hasReachedDestination(currentLocation, currentRoute) && (currentTime > totalTimeBeforeTimeout)) {
      await sendNotificationToContact('late-arrival', { location: currentLocation }, currentContact, user, firstName);
      stopTracking();
    }
  }

  const stopTracking = () => {
    console.log("stopTracking");
    trackingRef.current = false;
  };



  const handleStopTracking = async () => {
    setScheduledRoutes([]);
    scheduledRoutesRef.current = [];
    scheduledRoutesFetched.current = false;
    console.log("Inside handleStopTracking, scheduledRoutes: " + scheduledRoutes + ", scheduledRoutesRef: " + scheduledRoutesRef.current);

    stopTracking();
    console.log("stop tracking, watcherId: " + watcherIdRef.current + ", watchIdRef.current :" + watchIdRef.current);
    if (window.cordova) {
      if (watcherIdRef.current) {
        await stopBackgroundMode();
        await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        watcherIdRef.current = null;
      }
    } else {
      if (watchIdRef.current) {
        clearInterval(watchIdRef.current);
        Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }
    }
    setTrackingInProgress(false);
  };


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/track-route')}>
              <IonIcon icon={arrowBack} />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle className="custom-ion-title">Scheduled Tracking</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={() => history.push('/create-scheduled-route')}>
          Create Scheduled Route
        </IonButton>

        <IonButton color="danger" expand="block" onClick={() => history.push('/view-update-scheduled-route')}>
          View / Update Scheduled Route
        </IonButton>
      </IonContent>


      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px' }}>
        <IonButton color="primary" onClick={handleStartTracking} disabled={trackingInProgress}>
          Start Tracking
        </IonButton>
        <IonButton color="danger" onClick={handleStopTracking} disabled={!trackingInProgress}>
          Stop Tracking
        </IonButton>
      </div>

      <BottomBar />
    </IonPage>
  );
};

export default ScheduledTracking;
