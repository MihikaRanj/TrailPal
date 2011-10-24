import React, { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSelect, IonSelectOption, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonFooter, IonModal, IonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import BottomBar from '../components/BottomBar';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { arrowBack, refreshOutline } from 'ionicons/icons';
import ContactForm from '../components/ContactForm';
import { useIonViewWillEnter } from '@ionic/react';
import './TrailPal.css';
import { Geolocation } from '@capacitor/geolocation';
import { BackgroundGeolocation } from '../plugins';
import { explainBackgroundLocationAccess, getCurrentLocationWithRetries, getRoutePath, hasReachedDestination, initializeBackgroundMode, isOnRoute, releaseWakeLock, sendNotificationToContact, startForegroundService, stopBackgroundMode } from '../tracking';


const OnDemandTracking: React.FC = () => {
  const history = useHistory();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedContactOption, setSelectedContactOption] = useState<string | null>(null);
  const [startLocation, setStartLocation] = useState<string | null>(null);
  const [endLocation, setEndLocation] = useState<string | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [methodOfTravel, setMethodOfTravel] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSelectContactModal, setShowSelectContactModal] = useState(false);
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [showSelectRouteModal, setShowSelectRouteModal] = useState(false); // State for showing route selection modal
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]); // State for saved routes
  const [selectedSavedRoute, setSelectedSavedRoute] = useState<any | null>(null); // State for currently selected route in modal
  const [tracking, setTracking] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [currentContact, setCurrentContact] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>('Not Specified');
  const [lastName, setLastName] = useState<string>('Not Specified');
  const [timeDeviation, setTimeDeviation] = useState<number>(0);
  const [distanceDeviation, setDistanceDeviation] = useState<number>(0);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const currentRouteRef = useRef<CurrentRoute | null>(null);
  const currentContactRef = useRef<CurrentContact | null>(null);
  const deviationAlertRef = useRef<boolean>(false);
  const [minPollingInterval, setMinPollingInterval] = useState<number>(60000); 
  const watcherIdRef = useRef<string | null>(null); 
  const watchIdRef = useRef<string | null>(null);  

  const [minDistancePolling, setMinDistancePolling] = useState<number>(5);
  const user = auth.currentUser;


  useEffect(() => {
    if (window.cordova) {
      explainBackgroundLocationAccess();
    }
    // Fetch user data and route information
    fetchUserData();
    loadData();
    console.log("window.cordova:" + window.cordova);

    const fetchRouteData = async () => {
      if (user) {
        const routesCollection = collection(db, 'users', user.uid, 'currentdata');
        const routeDoc = doc(routesCollection, 'currentRoute');
        const contactDoc = doc(routesCollection, 'currentContact');

        const routeSnapshot = await getDoc(routeDoc);
        if (routeSnapshot.exists()) {
          const routeData = routeSnapshot.data() as CurrentRoute;
          setStartLocation(routeData.startlocation?.address || null);
          setEndLocation(routeData.endlocation?.address || null);
          setStops(routeData.stops?.map((stop: any) => stop.address) || []);
          setMethodOfTravel(routeData.methodOfTravel || null);
          setEstimatedTime(routeData.estimatedTime || null);
          setCurrentRoute(routeData);
          currentRouteRef.current = routeData;
        }

        const contactSnapshot = await getDoc(contactDoc);
        if (contactSnapshot.exists()) {
          const contactData = contactSnapshot.data() as CurrentContact;
          setCurrentContact(contactData);
          setContact({
            name: contactData.name,
            phone: contactData.phone,
            email: contactData.email
          });
          currentContactRef.current = contactData;
        }
      }
      setLoading(false);
    };

    fetchRouteData();
  }, [user]);

  useEffect(() => {
    if (showSelectContactModal) {
      fetchSavedContacts();
    }
  }, [showSelectContactModal]);

  useIonViewWillEnter(() => {
    loadData();
  });

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


  const loadData = async (): Promise<void> => {
    console.log('loadData');
    if (user) {
      const routesCollection = collection(db, 'users', user.uid, 'currentdata');
      const routeDoc = doc(routesCollection, 'currentRoute');
      const contactDoc = doc(routesCollection, 'currentContact');

      const routeSnapshot = await getDoc(routeDoc);
      if (routeSnapshot.exists()) {
        const routeData = routeSnapshot.data() as CurrentRoute;
        setStartLocation(routeData.startlocation?.address || null);
        setEndLocation(routeData.endlocation?.address || null);
        setStops(routeData.stops?.map((stop: any) => stop.address) || []);
        setMethodOfTravel(routeData.methodOfTravel || null);
        setEstimatedTime(routeData.estimatedTime || null);
        setCurrentRoute(routeData);
        currentRouteRef.current = routeData;
      }

      const contactSnapshot = await getDoc(contactDoc);
      if (contactSnapshot.exists()) {
        const contactData = contactSnapshot.data() as CurrentContact;
        setCurrentContact(contactData);
        setContact({
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email
        });
        currentContactRef.current = contactData;
      }
    }
  };


  const startTracking = async () => {
    deviationAlertRef.current=false;
    setTracking(true);
    await fetchUserData(); // Ensure user data is fetched before continuing
    await loadData(); // Load route and contact data

    console.log("startTracking");
    console.log(timeDeviation + " ,distanceDeviation:" + distanceDeviation + " ,minDistancePolling:" + minDistancePolling);
    console.log("currentRoute:" + currentRoute);
    console.log("currentContact:" + currentContact);
    console.log("currentRouteRef:" + currentRouteRef.current);
    console.log("currentContactRef:" + currentContactRef.current)

    if (!currentRouteRef.current || !currentContactRef.current) {
      console.log('Route or contact data missing, tracking cannot start.');
      setTracking(false);
      return;
    }

    if (window.cordova){
      await startForegroundService(); 
      await initializeBackgroundMode();
    }
    // Send initial notification to contact
    await sendNotificationToContact('tracking-started', {
      location: await getCurrentLocationWithRetries(),
      route: currentRouteRef.current,
    }, currentContactRef.current, user, firstName);

    trackLocation();
  };


  const configureBackgroundGeolocation = async (routePath: any[] | undefined, totalTimeBeforeTimeout: Date) => {
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
        // location updates
        console.log('Location update:', location);

        if (!location)
          return;
        const currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude
        };

        if (!routePath)
          return;
        await checkAndSendAlerts(currentLocation, routePath, totalTimeBeforeTimeout);
        console.log("before exit, watcherIdRef.current:" + watcherIdRef.current);
      }
    );

    watcherIdRef.current = id;
    console.log("watcher id: " + watcherIdRef.current);

  };

  const checkAndSendAlerts = async (currentLocation: any, routePath: any, totalTimeBeforeTimeout: Date) => {

    console.log("Inside checkAndSendAlerts:currentLocation:"+currentLocation+", distanceDeviation:"+distanceDeviation+",deviationAlertRef.current:"+deviationAlertRef.current);
    const currentTime = new Date();
    if (!deviationAlertRef.current && !isOnRoute(currentLocation, routePath, distanceDeviation)) {
      deviationAlertRef.current = true;
      sendNotificationToContact('route-deviation', { location: currentLocation }, currentContactRef.current, user, firstName);
      stopTracking();
    }

    if (hasReachedDestination(currentLocation, currentRouteRef.current)) {
      sendNotificationToContact('reached-destination', { location: currentLocation }, currentContactRef.current, user, firstName);
      stopTracking();
    }

    if (!hasReachedDestination(currentLocation, currentRouteRef.current) && (currentTime > totalTimeBeforeTimeout)) {
      await sendNotificationToContact('late-arrival', { location: currentLocation }, currentContactRef.current, user, firstName);
      stopTracking();
    }
  }

  const trackLocation = async () => {
    //alert('Inside trackLocation');
    const routePath = getRoutePath(currentRouteRef.current);
    let intervalId: any;
    deviationAlertRef.current = false;

    const estimatedTime = currentRouteRef.current?.estimatedTime || "5";
    const totalTime = parseInt(estimatedTime || '0', 10) + (timeDeviation || 5);
    const totalTimeoutInMs = totalTime * 60 * 1000;
    const startTime = new Date();
    const totalTimeBeforeTimeout = new Date(startTime.getTime() + totalTimeoutInMs);

    console.log("currentTime:" + startTime);
    console.log("totalTimeBeforeTimeout:" + totalTimeBeforeTimeout);


    if (window.cordova) {
      await configureBackgroundGeolocation(routePath, totalTimeBeforeTimeout);

      console.log("After configureBackgroundGeolocation call");
    } else {

      const checkPosition = async () => {
        const currentTime = new Date();
        const position = await getCurrentLocationWithRetries(); // Fetches current location
        console.log("position:"+position);
        if (!position) return; // Skip if no location
        const { latitude, longitude } = position;
        const currentLocation = { latitude, longitude };

        console.log("currentTime:" + currentTime);
        console.log("totalTimeBeforeTimeout:" + totalTimeBeforeTimeout+",latitude:"+ latitude+",longitude:"+longitude+",routePath:"+routePath);

        if (!latitude || !longitude || !routePath || !routePath.length) return;
        console.log("after if");
        await checkAndSendAlerts(currentLocation, routePath, totalTimeBeforeTimeout);
      };
      intervalId = setInterval(checkPosition, minPollingInterval);
      watchIdRef.current=intervalId;
    }
  };


  const stopTracking = async () => {
    console.log("stop tracking, watcherId: " + watcherIdRef.current + ", watchIdRef.current :" + watchIdRef.current );
    if (window.cordova) {
      if (watcherIdRef.current) {
        await stopBackgroundMode();
        await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        watcherIdRef.current=null;
      }
    } else {
      if (watchIdRef.current) {
        clearInterval(watchIdRef.current);
        Geolocation.clearWatch({ id: watchIdRef.current });
        watchIdRef.current = null;
      }
    }
    setTracking(false);
  };


  const clearRouteData = async () => {
    if (user) {
      try {
        const routesCollection = collection(db, 'users', user.uid, 'currentdata');
        const routeDoc = doc(routesCollection, 'currentRoute');
        const contactDoc = doc(routesCollection, 'currentContact');

        await deleteDoc(routeDoc);
        await deleteDoc(contactDoc);
      } catch (error) {
        console.error('Error deleting route/contact data:', error);
      }
    }

    setStartLocation(null);
    setEndLocation(null);
    setStops([]);
    setMethodOfTravel(null);
    setEstimatedTime(null);
    setContact(null);
    history.replace({ pathname: history.location.pathname, state: undefined });
  };

  const handleRefresh = async () => {
    await clearRouteData();
  };

  const handleBack = async () => {
    await clearRouteData();
    history.push('/track-route');
  };

  const handleContactBack = async (name: string, phone: string, email: string) => {
    if (name && phone) {
      const newContact = {
        email: email || 'Not specified',
        name: name,
        phone: phone,
        createdAt: new Date(),
      };

      try {
        if (user) {
          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const contactDoc = doc(routesCollection, 'currentContact');
          await setDoc(contactDoc, newContact, { merge: true }); // Update Firestore with new field value   

          setContact(newContact);
        }
      } catch (error) {
        console.error('Error saving contact:', error);
      }
    }
    setShowContactModal(false);
  };

  const handleContactRefresh = async () => {
    setShowContactModal(false);
  };

  const handleSaveContact = async (name: string, phone: string, email: string) => {
    if (name && phone) {
      const newContact = {
        email: email?.trim() ? email : 'Not specified',
        name: name.trim(),
        phone: phone.trim(),
        createdAt: new Date(),
      };

      try {
        if (user) {
          const savedContactsCollection = collection(db, 'users', user.uid, 'savedcontacts');
          const querySnapshot = await getDocs(savedContactsCollection);
          let existingContactId: string | null = null;

          querySnapshot.forEach((doc) => {
            const contactData = doc.data();
            if (
              contactData.name === name &&
              contactData.phone === phone &&
              contactData.email === (email?.trim() || 'Not specified')
            ) {
              existingContactId = doc.id;
            }
          });

          if (existingContactId) {
            const contactDoc = doc(savedContactsCollection, existingContactId);
            await setDoc(contactDoc, newContact, { merge: true });
          } else {
            await addDoc(savedContactsCollection, newContact);
          }
          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const currentContactDoc = doc(routesCollection, 'currentContact');
          await setDoc(currentContactDoc, newContact, { merge: true });

          setContact(newContact);

        }
      } catch (error) {
        console.error('Error saving contact:', error);
      }
    } else {
      alert('Please enter both name and phone number');
    }
    setShowContactModal(false);
  };

  const handleRouteSelection = (value: string) => {
    setSelectedRoute(value);
    if (value === 'create') {
      history.push({ pathname: '/create-route', state: { from: 'OnDemandTracking' } });
    } else if (value === 'select') {
      setShowSelectRouteModal(true);  // Show route selection modal
    }
  };

  const handleContactSelection = (value: string) => {
    setSelectedContactOption(value);
    if (value === 'create') {
      setShowContactModal(true);
    } else if (value === 'select') {
      setShowSelectContactModal(true);
    }
  };

  const handleSelectContact = async () => {
    if (selectedContact) {
      try {
        if (user) {
          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const contactDoc = doc(routesCollection, 'currentContact');

          await setDoc(contactDoc, selectedContact, { merge: true }); 
          setContact(selectedContact);
          setShowSelectContactModal(false);
        }
      } catch (error) {
        console.error('Error selecting contact:', error);
        alert('Failed to select the contact. Please try again.');
      }
    }
  };

  const handleSelectContactBack = async () => {
    setShowSelectContactModal(false);
    setSelectedContact(null);
  };

  const fetchSavedContacts = async () => {
    if (user) {
      const savedContactsCollection = collection(db, 'users', user.uid, 'savedcontacts');
      const querySnapshot = await getDocs(savedContactsCollection);
      const contacts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedContacts(contacts);
      setSelectedContact(null);
    }
  };


  if (loading) {
    return <IonContent>Loading...</IonContent>;
  }

  const fetchSavedRoutes = async () => {
    console.log("Inside fetchSavedRoutes");
    if (user) {
      const savedRoutesCollection = collection(db, 'users', user.uid, 'savedroutes');
      const querySnapshot = await getDocs(savedRoutesCollection);
      const routes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedRoutes(routes);
      setSelectedSavedRoute(null);
    }
  };

  const handleSelectRoute = async () => {
    console.log("Inside handleSelectRoute");
    if (selectedSavedRoute) {
      try {
        if (user) {
          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const currentRouteDoc = doc(routesCollection, 'currentRoute');
          await setDoc(currentRouteDoc, selectedSavedRoute, { merge: true }); 
          setStartLocation(selectedSavedRoute.startlocation?.address || null);
          setEndLocation(selectedSavedRoute.endlocation?.address || null);
          setStops(selectedSavedRoute.stops?.map((stop: any) => stop.address) || []);
          setMethodOfTravel(selectedSavedRoute.methodOfTravel || null);
          setEstimatedTime(selectedSavedRoute.estimatedTime || null);
          setShowSelectRouteModal(false);
        }
      } catch (error) {
        console.error('Error selecting route:', error);
        alert('Failed to select the route. Please try again.');
      }
    }
  };

  const handleSelectRouteBack = async () => {
    setShowSelectRouteModal(false);
    setSelectedSavedRoute(null);
  };

  if (loading) {
    return <IonContent>Loading...</IonContent>;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="light">
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBack} />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle className="custom-ion-title">On-demand Tracking</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleRefresh}>
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {startLocation && endLocation && estimatedTime ? (
          <IonItem>
            <IonLabel>
              <h1>Selected Route</h1>
            </IonLabel>
          </IonItem>
        ) : (

          <IonItem>
            <IonLabel>Route</IonLabel>
            <IonSelect
              value={selectedRoute}
              placeholder="Select Route to Track"
              onIonChange={(e) => handleRouteSelection(e.detail.value!)}
            >
              <IonSelectOption value="create">Create Route</IonSelectOption>
              <IonSelectOption value="select">Select Route</IonSelectOption>
            </IonSelect>
          </IonItem>
        )}

        {startLocation && (
          <IonItem>
            <IonLabel>Start: {startLocation}</IonLabel>
          </IonItem>
        )}
        {endLocation && (
          <IonItem>
            <IonLabel>End: {endLocation}</IonLabel>
          </IonItem>
        )}
        {stops.length > 0 && (
          <IonItem>
            <IonLabel>Stops: {stops.join(', ')}</IonLabel>
          </IonItem>
        )}
        {methodOfTravel && (
          <IonItem>
            <IonLabel>Method of Travel: {methodOfTravel}</IonLabel>
          </IonItem>
        )}
        {estimatedTime && (
          <IonItem>
            <IonLabel>Estimated Time (minutes): {estimatedTime}</IonLabel>
          </IonItem>
        )}

        {contact ? (
          <IonItem>
            <IonLabel>
              <h1>Selected Contact</h1>
            </IonLabel>
          </IonItem>
        ) : (
          <IonItem>
            <IonLabel>Contact</IonLabel>
            <IonSelect
              value={selectedContactOption}
              placeholder="Select Contact Option"
              onIonChange={(e) => handleContactSelection(e.detail.value!)}
            >
              <IonSelectOption value="create">Create Contact</IonSelectOption>
              <IonSelectOption value="select">Select Contact</IonSelectOption>
            </IonSelect>
          </IonItem>
        )}
        {contact && (
          <><IonItem>
            <IonLabel>Name: {contact.name}</IonLabel>
          </IonItem><IonItem>
              <IonLabel>Phone: {contact.phone}</IonLabel>
            </IonItem></>
        )}

        {contact && contact.email !== 'Not specified' && (
          <IonItem>
            <IonLabel>Email: {contact?.email}</IonLabel>
          </IonItem>
        )}


        <IonModal isOpen={showContactModal} onDidDismiss={() => setShowContactModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => handleContactBack(contact?.name || '', contact?.phone || '', contact?.email || '')}>
                  <IonIcon icon={arrowBack} />
                  Back
                </IonButton>
              </IonButtons>
              <IonTitle className="custom-ion-title">Add Contact</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleContactRefresh}>
                  <IonIcon slot="icon-only" icon={refreshOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <ContactForm onSave={handleSaveContact} />
          </IonContent>
          <IonFooter>
            <IonButton expand="block" onClick={() => setShowContactModal(false)}>Close</IonButton>
          </IonFooter>
        </IonModal>

        <IonModal isOpen={showSelectContactModal} onDidDismiss={() => setShowSelectContactModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={handleSelectContactBack}>
                  <IonIcon icon={arrowBack} />
                  Back
                </IonButton>
              </IonButtons>
              <IonTitle>Select Contact</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={fetchSavedContacts}>
                  <IonIcon slot="icon-only" icon={refreshOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {savedContacts.map(contact => (
              <IonItem key={contact.id} button onClick={() => setSelectedContact(contact)}
                color={selectedContact?.id === contact.id ? 'medium' : 'light'}>
                <IonLabel>{contact.name}, {contact.phone} {contact.email !== 'Not specified' && `, ${contact.email}`}</IonLabel>
              </IonItem>
            ))}
          </IonContent>
          <IonFooter>
            <IonButton expand="block" disabled={!selectedContact} onClick={handleSelectContact}>
              Select Contact
            </IonButton>
            <IonButton expand="block" onClick={() => setShowSelectContactModal(false)}>Close</IonButton>
          </IonFooter>
        </IonModal>

        <IonModal isOpen={showSelectRouteModal} onDidPresent={fetchSavedRoutes}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={handleSelectRouteBack}>
                  <IonIcon icon={arrowBack} />
                  Back
                </IonButton>
              </IonButtons>
              <IonTitle className="custom-ion-title">Select Route</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={fetchSavedRoutes}>
                  <IonIcon slot="icon-only" icon={refreshOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {savedRoutes.map(route => (
              <IonItem key={route.id} onClick={() => setSelectedSavedRoute(route)}
                color={selectedSavedRoute?.id === route.id ? 'medium' : 'light'}>
                <IonLabel>From: [{route.startlocation.address}], To: [{route.endlocation.address}], Estimated Time: [{route.estimatedTime}]</IonLabel>
              </IonItem>
            ))}
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton expand="full" onClick={handleSelectRoute} disabled={!selectedSavedRoute}>
                Select Route
              </IonButton>
              <IonButton expand="block" onClick={handleSelectRouteBack}>Close</IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>



      </IonContent>
      <IonButton onClick={startTracking} disabled={tracking}>
        Start Tracking
      </IonButton>
      <IonButton onClick={() => stopTracking()} disabled={!tracking}>
        Stop Tracking
      </IonButton>

      <IonToast
        isOpen={tracking}
        message="Tracking started."
        duration={2000}
      />
      <BottomBar />
    </IonPage>
  );
};

export default OnDemandTracking;
