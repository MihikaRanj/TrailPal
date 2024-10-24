import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSelect, IonSelectOption, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonFooter, IonModal, IonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import BottomBar from '../components/BottomBar';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { arrowBack, refreshOutline } from 'ionicons/icons';
import ContactForm from '../components/ContactForm';
import { useIonViewWillEnter } from '@ionic/react';
import { findNearest, getDistance } from 'geolib';  // For distance calculation
import './TrailPal.css';
import { SMS } from '@awesome-cordova-plugins/sms';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode';
import { Geolocation } from '@capacitor/geolocation';
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions';
import { Dialog } from '@capacitor/dialog';

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
  const [deviationAlertSent, setDeviationAlertSent] = useState(false); // To avoid multiple alerts
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [currentContact, setCurrentContact] = useState<any>(null);
  const [watchId, setWatchId] = useState<string | null>(null);  // Store the watch ID for stopping the tracking
  const [firstName, setFirstName] = useState<string>('Not Specified');
  const [lastName, setLastName] = useState<string>('Not Specified');
  const [timeDeviation, setTimeDeviation] = useState<number>(0);
  const [distanceDeviation, setDistanceDeviation] = useState<number>(0);
  const [timeoutId, setTimeoutId] = useState<any | null>(null);
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


  const user = auth.currentUser;





  const requestLocationPermissions = async () => {

    // Now ask for background permission
    const backgroundPermission = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.ACCESS_BACKGROUND_LOCATION);

    if (backgroundPermission.hasPermission) {
      alert('Background location permission granted');
    } else {
      alert('Background location permission denied');
    }

  };

  const explainBackgroundLocationAccess = async () => {
    const foregroundPermission = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.ACCESS_FINE_LOCATION);

    if (foregroundPermission.hasPermission) {
      alert('Foreground location permission granted');

      const { value } = await Dialog.confirm({
        title: 'Location Access Required',
        message: 'We need background location access to track your location even when the app is not in use.',
      });

      if (value) {
        // Proceed with requesting background location permission
        await requestLocationPermissions();
      }
    } else {
      alert('Foreground location permission denied');
    }
  };

  /* const requestPermissions = async () => {
    try {
  
      const smsPermission = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.SEND_SMS);
  
      // Request foreground location permission first
      const foregroundPermission = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.ACCESS_FINE_LOCATION);
      
      if (foregroundPermission.hasPermission) {
        alert('Foreground location permission granted');
  
        // Check if we should show a rationale for background location permission
        const shouldShowRationale = await AndroidPermissions.shouldShowRequestPermissionRationale(AndroidPermissions.PERMISSION.ACCESS_BACKGROUND_LOCATION);
        
        if (shouldShowRationale) {
          alert('We need background location permission to track your location even when the app is not in use.');
        }
  
        // Request background location permission
        const backgroundPermission = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.ACCESS_BACKGROUND_LOCATION);
  
        if (backgroundPermission.hasPermission) {
          alert('Background location permission granted');
        } else {
          alert('Background location permission denied');
        }
      } else {
        alert('Foreground location permission denied');
      }
      if (!smsPermission.hasPermission) {
        const smsGranted = AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.SEND_SMS);
      }
    } catch (error) {
      console.warn('Error requesting permissions:', error);
    }
  }; */


  useEffect(() => {
    // Request permissions when the component mounts
    explainBackgroundLocationAccess();

    // Fetch user data and route information
    fetchUserData();

    const fetchRouteData = async () => {
      if (user) {
        const routesCollection = collection(db, 'users', user.uid, 'currentdata');
        const routeDoc = doc(routesCollection, 'currentRoute');
        const contactDoc = doc(routesCollection, 'currentContact');

        const routeSnapshot = await getDoc(routeDoc);
        if (routeSnapshot.exists()) {
          const routeData = routeSnapshot.data();
          setStartLocation(routeData.startlocation?.address || null);
          setEndLocation(routeData.endlocation?.address || null);
          setStops(routeData.stops?.map((stop: any) => stop.address) || []);
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
      setLoading(false);
    };

    // Enable Background Mode
    const enableBackgroundMode = () => {
      if (window.cordova) {
        // Enable the background mode
        BackgroundMode.enable();

        // Optional: Customize the notification when the app is in the background
        BackgroundMode.setDefaults({
          title: 'Tracking in progress',
          text: 'Your location is being tracked in the background.',
          color: 'F14F4D', // Notification icon color (Android)
        });

        // Disable web view optimizations
        BackgroundMode.disableWebViewOptimizations();

        // Listen for background mode activation
        document.addEventListener('activate', () => {
          console.log('App is running in background mode.');
          // Ensure location tracking continues in background mode
          trackLocation();
        });

        // Listen for background mode deactivation
        document.addEventListener('deactivate', () => {
          console.log('App is running in foreground mode.');
        });
      }
    };

    // Call the functions to fetch data and enable background mode
    fetchRouteData();
    enableBackgroundMode(); // Activate background mode tracking

    // Cleanup event listeners when component unmounts
    return () => {
      document.removeEventListener('activate', () => {
        console.log('Background mode listener removed.');
      });

      document.removeEventListener('deactivate', () => {
        console.log('Foreground mode listener removed.');
      });
    };
  }, [user]);  // This ensures the effect re-runs when the `user` changes


  // Load route and contact data on view enter
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
      }
    }
  };


  // Fetch route and contact details from Firestore
  const loadData = async (): Promise<void> => {
    if (user) {
      const routesCollection = collection(db, 'users', user.uid, 'currentdata');
      const routeDoc = doc(routesCollection, 'currentRoute');
      const contactDoc = doc(routesCollection, 'currentContact');

      const routeSnapshot = await getDoc(routeDoc);
      if (routeSnapshot.exists()) {
        const routeData = routeSnapshot.data();
        setStartLocation(routeData.startlocation?.address || null);
        setEndLocation(routeData.endlocation?.address || null);
        setStops(routeData.stops?.map((stop: any) => stop.address) || []);
        setMethodOfTravel(routeData.methodOfTravel || null);
        setEstimatedTime(routeData.estimatedTime || null);
        setCurrentRoute(routeData);
      }

      const contactSnapshot = await getDoc(contactDoc);
      if (contactSnapshot.exists()) {
        const contactData = contactSnapshot.data();
        setCurrentContact(contactData);
        setContact({
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email
        });
      }
    }
  };


  const startTracking = async () => {
    await fetchUserData(); // Ensure user data is fetched before continuing
    await loadData(); // Load route and contact data

    await delay(2000); // Delay for 2 seconds to ensure data has fully loaded
    console.log("startTracking");
    console.log(timeDeviation + ":" + distanceDeviation);
    console.log(currentRoute);
    console.log(currentContact);

    // Ensure that currentRoute and currentContact are fully loaded
    if (!currentRoute || !currentContact) {
      console.log('Route or contact data missing, tracking cannot start.');
      return;
    }

    setTracking(true);

    // Send initial notification to contact
    await sendNotificationToContact('tracking-started', {
      location: await getCurrentLocationWithRetries(),
      route: currentRoute,
    });

    // Start location tracking
    trackLocation();
  };

  const trackLocation = async () => {
    const routePath = getRoutePath();
    let intervalId: any;
    setDeviationAlertSent(false);

    const estimatedTime = currentRoute.estimatedTime || 5;
    const totalTime = parseInt(estimatedTime || '0', 10) + (timeDeviation || 5);
    const totalTimeoutInMs = totalTime * 60 * 1000;

    const checkPosition = async () => {
      const position = await getCurrentLocation();
      const { latitude, longitude } = position;
      const currentLocation = { latitude, longitude };

      if (!latitude || !longitude || !routePath.length) return;
      console.log('deviationAlertSent' + deviationAlertSent);

      if (!deviationAlertSent && !isOnRoute(currentLocation, routePath)) {
        setDeviationAlertSent(true);
        await sendNotificationToContact('route-deviation', { location: currentLocation });
        stopTracking(intervalId, timeoutId);
      }

      if (hasReachedDestination(currentLocation)) {
        await sendNotificationToContact('reached-destination', { location: currentLocation });
        stopTracking(intervalId, timeoutId);
      }
    };

    intervalId = setInterval(checkPosition, 30000);
    setWatchId(intervalId);

    const newTimeoutId = setTimeout(async () => {
      const currentLocation = await getCurrentLocation();
      if (!hasReachedDestination(currentLocation)) {
        await sendNotificationToContact('late-arrival', { location: currentLocation });
      }
      stopTracking(intervalId, newTimeoutId);
    }, totalTimeoutInMs);

    setTimeoutId(newTimeoutId);
  };

  const stopTracking = (intervalId: any, timeoutId: any) => {
    if (intervalId) {
      clearInterval(intervalId);
      setWatchId(null);
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    if (watchId) {
      Geolocation.clearWatch({ id: watchId });
    }

    setTracking(false);
  };



  // Helper to get route path: an array of waypoints
  const getRoutePath = () => {
    const path = [currentRoute.startlocation, ...(currentRoute.stops || []), currentRoute.endlocation];
    // Ensure all locations have valid lat/lon
    return path.map((location) => ({
      latitude: location?.lat,
      longitude: location?.lon,
    })).filter(location => location.latitude && location.longitude);
  };

  // Helper to check if the user is on the route within a 5 mile range
  const isOnRoute = (currentLocation: any, routePath: any[]) => {
    console.log("isOnRoute");
    console.log("distanceDeviation" + distanceDeviation);
    //console.log(routePath);
    const closestPoint = findNearest(currentLocation, routePath);
    const distanceToRoute = getDistance(currentLocation, closestPoint);
    return distanceToRoute <= distanceDeviation * 1609.34; // convert miles in meters
  };

  // Helper to check if the user has reached the destination
  const hasReachedDestination = (currentLocation: any) => {
    console.log("hasReachedDestination");
    //console.log(currentLocation);
    //console.log(currentRoute);
    const destination = {
      latitude: currentRoute.endlocation.lat,
      longitude: currentRoute.endlocation.lon,
    };
    console.log(destination);
    const distanceToDestination = getDistance(currentLocation, destination);
    return distanceToDestination <= 100; // 100 meters as the arrival threshold
  };

  // Helper to get the current user's location
  const getCurrentLocation = async () => {
    console.log("getCurrentLocation");
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,  // Request high accuracy for better GPS results
        timeout: 10000,            // Set a timeout of 10 seconds (10000 ms)
        maximumAge: 0              // Do not use a cached location
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      alert('Error getting current location:' + error);
      throw error;  // Re-throw the error to handle it in the calling function
    }
  };

  const getCurrentLocationWithRetries = async (retries = 3) => {
    while (retries > 0) {
      try {
        return await getCurrentLocation();
      } catch (error) {
        if (error instanceof Error && 'code' in error && (error as any).code === 3 && retries > 0) {
          console.log('Retrying location fetch...');
          retries -= 1;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Unable to get location after multiple attempts');
  };



  // Update the sendNotificationToContact function to send SMS
  const sendNotificationToContact = async (type: string, data: any) => {
    console.log(currentContact?.phone);
    if (!currentContact?.phone) {
      console.log('Phone number is missing. Cannot send SMS.');
      return;
    }

    // Build the SMS message content
    const message = buildNotificationMessage(type, data);

    console.log(currentContact?.phone + ":" + message);
    //alert(currentContact?.phone + ":"+ message)

    try {
      const options = {
        replaceLineBreaks: false,
        android: {
          intent: '' // leave empty to send SMS without opening an SMS app
        }
      };

      //await SMS.send('2487874138', 'This is a test SMS from TrailPal app!', options);
      await SMS.send(currentContact.phone, message, options);

      console.log('Test SMS sent successfully' + currentContact.phone);
    } catch (error) {
      console.error('Error sending SMS:', error);
      console.log('Failed to send SMS ' + error);
    }
  };


  const buildNotificationMessage = (type: string, data: any) => {
    const createLocationLink = (lat: number, lon: number) => {
      return `https://www.google.com/maps?q=${lat},${lon}`;
    };

    switch (type) {
      case 'tracking-started':
        const startLocationLink = createLocationLink(data.route.startlocation.lat, data.route.startlocation.lon);
        const endLocationLink = createLocationLink(data.route.endlocation.lat, data.route.endlocation.lon);
        return `${firstName == 'Not Specified' ? (user?.email) : firstName} has started their journey. \nStart: ${data.route.startlocation.address} \nEnd: ${data.route.endlocation.address} \nEstimated Travel Time: ${data.route.estimatedTime} minutes.\nStart Location: ${startLocationLink} \nEnd Location: ${endLocationLink}`;

      case 'route-deviation':
        const currentLocationLink = createLocationLink(data.location.latitude, data.location.longitude);
        return `${firstName == 'Not Specified' ? (user?.email) : firstName} has deviated from the planned route! Current location: ${currentLocationLink}`;

      case 'reached-destination':
        const destinationLink = createLocationLink(data.location.latitude, data.location.longitude);
        return `${firstName == 'Not Specified' ? (user?.email) : firstName} has safely reached the destination. \nLocation: ${destinationLink}`;

      case 'late-arrival':
        const lastLocationLink = createLocationLink(data.location.latitude, data.location.longitude);
        return `${firstName == 'Not Specified' ? (user?.email) : firstName} has not arrived at the destination on time. Last known location: ${lastLocationLink}`;

      default:
        return '';
    }
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
        //alert('Failed to save the contact. Please try again.');
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
            //alert('Contact updated successfully!');
          } else {
            await addDoc(savedContactsCollection, newContact);
            //alert('Contact saved successfully to saved contacts!');
          }


          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const currentContactDoc = doc(routesCollection, 'currentContact');
          await setDoc(currentContactDoc, newContact, { merge: true }); // Update Firestore with new field value

          setContact(newContact);

        }
      } catch (error) {
        console.error('Error saving contact:', error);
        //alert('Failed to save the contact. Please try again.');
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

          await setDoc(contactDoc, selectedContact, { merge: true }); // Update Firestore with new field value
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

  useEffect(() => {
    if (showSelectContactModal) {
      fetchSavedContacts();
    }
  }, [showSelectContactModal]);

  if (loading) {
    return <IonContent>Loading...</IonContent>;
  }

  const fetchSavedRoutes = async () => {
    if (user) {
      const savedRoutesCollection = collection(db, 'users', user.uid, 'savedroutes');
      const querySnapshot = await getDocs(savedRoutesCollection);
      const routes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSavedRoutes(routes);
      setSelectedSavedRoute(null);
    }
  };

  const handleSelectRoute = async () => {
    if (selectedSavedRoute) {
      try {
        if (user) {
          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const currentRouteDoc = doc(routesCollection, 'currentRoute');
          await setDoc(currentRouteDoc, selectedSavedRoute, { merge: true }); // Update Firestore with new field value
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
              {/*               <p>Start: {startLocation}</p>
              <p>End: {endLocation}</p>
              <p>Estimated Time: {estimatedTime}</p> */}
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
            {/* <IonLabel>Contact: {contact.name}, {contact.phone}</IonLabel> */}
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

        {/* Modal for selecting contact */}
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
      <IonButton onClick={() => stopTracking(watchId, timeoutId)} disabled={!tracking}>
        Stop Tracking
      </IonButton>

      {/* Optionally show a toast when tracking starts */}
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
