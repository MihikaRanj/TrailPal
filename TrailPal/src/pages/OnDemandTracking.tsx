import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSelect, IonSelectOption, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonFooter, IonModal, IonToast } from '@ionic/react';
import { useHistory } from 'react-router';
import BottomBar from '../components/BottomBar';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { arrowBack, refreshOutline } from 'ionicons/icons';
import ContactForm from '../components/ContactForm';
import { useIonViewWillEnter } from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import { findNearest, getDistance } from 'geolib';  // For distance calculation
import './TrailPal.css';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
  const [fcmToken, setFcmToken] = useState<string | null>(null); // Store FCM token for the contact

  const user = auth.currentUser;

  useEffect(() => {
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
          // Fetch the FCM token for this contact based on their email
          await fetchContactFcmToken(contactData.email);
        }
      }
      setLoading(false);
    };

    fetchRouteData();
  }, [user]);

    // Function to fetch FCM token for the contact using their email
    const fetchContactFcmToken = async (email: string) => {
      const contactQuery = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(contactQuery);
      if (!querySnapshot.empty) {
        const contactDoc = querySnapshot.docs[0];
        const contactData = contactDoc.data();
        setFcmToken(contactData.fcmToken || null);
        console.log('FCM token retrieved:', contactData.fcmToken);
      } else {
        console.log('No user found with email:', email);
      }
    };
  // Load route and contact data on view enter
  useIonViewWillEnter(() => {
    loadData();
  });

  // Fetch route and contact details from Firestore
  const loadData = async () => {
    if (user) {
      const routesCollection = collection(db, 'users', user.uid, 'currentdata');
      const routeDoc = doc(routesCollection, 'currentRoute');
      const contactDoc = doc(routesCollection, 'currentContact');

      const routeSnapshot = await getDoc(routeDoc);
      /* console.log("routeSnapshot");
      console.log(routeSnapshot); */
      if (routeSnapshot.exists()) {
        const routeData = routeSnapshot.data();
        setStartLocation(routeData.startlocation?.address || null);
        setEndLocation(routeData.endlocation?.address || null);
        setStops(routeData.stops?.map((stop: any) => stop.address) || []);
        setMethodOfTravel(routeData.methodOfTravel || null);
        setEstimatedTime(routeData.estimatedTime || null);
        setCurrentRoute(routeData)
      }

      const contactSnapshot = await getDoc(contactDoc);
      /* console.log("contactSnapshot");
      console.log(contactSnapshot); */
      if (contactSnapshot.exists()) {
        const contactData = contactSnapshot.data();
        setCurrentContact(contactData);
        setContact({
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email
        });
      }
  }; 
};

const startTracking = async () => {
  loadData();
  console.log(currentRoute);
  console.log(currentContact);
  console.log(fcmToken);
  // Ensure that currentRoute and currentContact are fully loaded
  if (!currentRoute || !currentContact || !fcmToken) {
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
  const routePath = getRoutePath(); // Helper function to build the path from start, stops, to end

  const watchId = await Geolocation.watchPosition({}, async (position) => {
    const { latitude, longitude } = position?.coords;
    const currentLocation = { latitude, longitude };

    if (!latitude || !longitude || !routePath.length) return; // Ensure valid data

    console.log('checking deviationalert');
    console.log(watchId);
    // Check if the user deviates from the path
    if (!deviationAlertSent && !isOnRoute(currentLocation, routePath)) {
      setDeviationAlertSent(true);
      await sendNotificationToContact('route-deviation', {
        location: currentLocation,
      });
    }

    console.log('checking hasReachedDestination');
    // Check if the user has reached the destination
    if (hasReachedDestination(currentLocation)) {
      await sendNotificationToContact('reached-destination', {
        location: currentLocation,
      });
      stopTracking();
    }

    console.log('checking setTimeout');
    // Check if the user is late
    setTimeout(async () => {
      if (!hasReachedDestination(await getCurrentLocation())) {
        await sendNotificationToContact('late-arrival', {
          location: await getCurrentLocation(),
        });
        console.log('inside settimeout');
        stopTracking();
      }
    }, (currentRoute.estimatedTime + 1) * 60 * 1000); // Estimated time + buffer- here 1 is bufferTime in minutes
  });

  setWatchId(watchId);  // Store the watch ID to stop tracking later
};



const stopTracking = () => {
  if (watchId) {
    Geolocation.clearWatch({ id: watchId });
    setWatchId(null);
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
    console.log(currentLocation);
    console.log(routePath);
    const closestPoint = findNearest(currentLocation, routePath);
    const distanceToRoute = getDistance(currentLocation, closestPoint);
    return distanceToRoute <= 8046.72; // 5 miles in meters
  };

  // Helper to check if the user has reached the destination
  const hasReachedDestination = (currentLocation: any) => {
    console.log("hasReachedDestination");
    console.log(currentLocation);
    console.log(currentRoute);
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
      console.error('Error getting current location:', error);
      throw error;  // Re-throw the error to handle it in the calling function
    }
  };

  const getCurrentLocationWithRetries = async (retries = 3) => {
    while (retries > 0) {
      try {
        return await getCurrentLocation();
      } catch (error) {
        if (error.code === 3 && retries > 0) {  // Handle timeout error
          console.log('Retrying location fetch...');
          retries -= 1;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Unable to get location after multiple attempts');
  };
  
  
// OnDemandTracking.tsx (Updates for error handling)
const sendNotificationToContact = async (type: string, data: any) => {
  if (!fcmToken) {
    console.log('FCM token is missing. Cannot send notification.');
    return;
  }

  const payload = {
    fcmToken,
    message: buildNotificationMessage(type, data),
  };

  try {
    const functions = getFunctions(); // Get Firebase Functions instance
    const sendNotification = httpsCallable(functions, 'sendNotification'); // Call the cloud function

    console.log(payload);
    // Send the notification payload
    const result = await sendNotification(payload);
    console.log('Notification sent:', result.data);

    // Handle token error cases (invalid or expired token)
    if (result.data.error && result.data.error.code === 'messaging/invalid-registration-token') {
      console.log('FCM token is invalid. Attempting to refresh token.');

      // Refresh FCM token logic
      const refreshedToken = await refreshContactFcmToken();
      if (refreshedToken) {
        // Retry sending the notification with the refreshed token
        const retryPayload = {
          fcmToken: refreshedToken,
          message: buildNotificationMessage(type, data),
        };
        await sendNotification(retryPayload);
        console.log('Retry notification sent successfully.');
      }
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Function to refresh contact FCM token (this will refresh token and update Firestore if needed)
const refreshContactFcmToken = async () => {
  try {
    const userDoc = await getDoc(doc(db, 'users', currentContact.id));
    if (userDoc.exists()) {
      const newToken = userDoc.data()?.fcmToken;
      if (newToken) {
        setFcmToken(newToken); // Update the local state
        console.log('FCM token refreshed:', newToken);
        return newToken;
      }
    }
  } catch (error) {
    console.error('Error refreshing FCM token:', error);
  }
  return null;
};

  const buildNotificationMessage = (type: string, data: any) => {
    switch (type) {
      case 'tracking-started':
        return `${user?.email} has started their journey. Route details: ${JSON.stringify(data.route)}`;
      case 'route-deviation':
        return `${user?.email} has deviated from the planned route! Current location: ${JSON.stringify(data.location)}`;
      case 'reached-destination':
        return `${user?.email} has safely reached the destination.`;
      case 'late-arrival':
        return `${user?.email} has not arrived at the destination on time. Last known location: ${JSON.stringify(data.location)}`;
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
        alert('Failed to refresh. Please try again.');
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
        alert('Failed to save the contact. Please try again.');
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
            alert('Contact updated successfully!');
          } else {
            await addDoc(savedContactsCollection, newContact);
            alert('Contact saved successfully to saved contacts!');
          }

         
          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const currentContactDoc = doc(routesCollection, 'currentContact');            
          await setDoc(currentContactDoc, newContact, { merge: true }); // Update Firestore with new field value

          setContact(newContact);

        }
      } catch (error) {
        console.error('Error saving contact:', error);
        alert('Failed to save the contact. Please try again.');
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
        if (user){
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
        if (user){
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
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBack} />
              Back
            </IonButton>
          </IonButtons>
          <IonTitle>On-demand Tracking</IonTitle>
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
            <IonLabel>Estimated Time: {estimatedTime}</IonLabel>
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
              <IonTitle>Add Contact</IonTitle>
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
              <IonTitle>Select Route</IonTitle>
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
                <IonLabel>{route.startlocation.address} to {route.endlocation.address}</IonLabel>
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
        <IonButton onClick={stopTracking} disabled={!tracking}>
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
