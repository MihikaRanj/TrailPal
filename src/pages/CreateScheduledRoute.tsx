import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonSelect, IonSelectOption, IonItem, IonLabel, IonButtons, IonButton, IonIcon, IonFooter, IonModal, IonToast, IonInput, IonRadio, IonRadioGroup } from '@ionic/react';
import { useHistory } from 'react-router';
import BottomBar from '../components/BottomBar';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { arrowBack, refreshOutline } from 'ionicons/icons';
import ContactForm from '../components/ContactForm';
import { useIonViewWillEnter } from '@ionic/react';
import './TrailPal.css';

const CreateScheduledRoute: React.FC = () => {
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
  const [showSelectRouteModal, setShowSelectRouteModal] = useState(false); 
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [selectedSavedRoute, setSelectedSavedRoute] = useState<any | null>(null);
  const [currentRoute, setCurrentRoute] = useState<any>(null);
  const [currentContact, setCurrentContact] = useState<any>(null);
  const [enableTracking, setEnableTracking] = useState<boolean>(false); 
  const [scheduledStartTime, setScheduledStartTime] = useState<string | null>(null); 

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
          setCurrentRoute(routeData);
        }

        const contactSnapshot = await getDoc(contactDoc);
        if (contactSnapshot.exists()) {
          const contactData = contactSnapshot.data();
          setCurrentContact(contactData);
          setContact({
            name: contactData.name,
            phone: contactData.phone,
            email: contactData.email,
          });
        }
      }
      setLoading(false);
    };

    fetchRouteData();

    
  }, [user]);

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
          email: contactData.email,
        });
      }
  }; 
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
  


 const saveScheduledRoutes = async () => {
  if (!user || !currentRoute || !scheduledStartTime || !estimatedTime) {
    alert("All fields are required.");
    return;
  }

    /**start */
    try {
      const scheduledRoutesCollection = collection(db, 'users', user.uid, 'savedscheduledroutes');
      const querySnapshot = await getDocs(scheduledRoutesCollection);
  
      const [startHours, startMinutes] = scheduledStartTime.split(':').map(Number);
      const scheduledStartDate = new Date();
      scheduledStartDate.setHours(startHours, startMinutes, 0, 0);
  
      const scheduledEndDate = new Date(scheduledStartDate.getTime() + parseInt(estimatedTime) * 60000);
  
      const hasOverlap = querySnapshot.docs.some((doc) => {
        const data = doc.data();
  ;
  
        const [existingStartHours, existingStartMinutes] = data.scheduledStartTime.split(':').map(Number);
        const existingStartDate = new Date();
        existingStartDate.setHours(existingStartHours, existingStartMinutes, 0, 0);
  
        const existingEndDate = new Date(existingStartDate.getTime() + parseInt(data.route.estimatedTime) * 60000);
  
        return (
          (scheduledStartDate >= existingStartDate && scheduledStartDate < existingEndDate) ||
          (scheduledEndDate > existingStartDate && scheduledEndDate <= existingEndDate)
        );
      });
  
      if (hasOverlap) {
        alert("Another scheduled route is already created for this time. Please adjust the time on the existing route.");
        return;
      }
  
      await addDoc(scheduledRoutesCollection, {
        route: currentRoute,
        contact: currentContact,
        scheduledStartTime: scheduledStartTime,
        enableTracking: enableTracking,
      });
  
      alert('Scheduled tracking has been enabled!');
    } catch (error) {
      console.error('Error saving scheduled tracking:', error);
      alert('Failed to enable scheduled tracking.');
    }
    /**end */
    
  };
  
  const handleRefresh = async () => {
    await clearRouteData();
  };

  const handleBack = async () => {
    await clearRouteData();
    history.push('/track-route/scheduled');
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
      
          await setDoc(contactDoc, newContact, { merge: true }); // Updates Firestore with new field value
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
      history.push({ pathname: '/create-route', state: { from: 'ScheduledTracking' } });
    } else if (value === 'select') {
      setShowSelectRouteModal(true); 
    }
  };

  const handleContactSelection = (value: string) => {
    setSelectedContactOption(value);
    if (value === 'create') {
      setShowContactModal(true);
    } else if (value === 'select') {
      setShowSelectContactModal(true);
    }
    loadData();
  };

  const handleSelectContact = async () => {
    if (selectedContact) {
      try {
        if (user){
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
      loadData();
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

  const isScheduleTrackingEnabled = () => {
    console.log("before setting save enabled");
    console.log(currentRoute);
    console.log(currentContact);
    console.log(scheduledStartTime);
    return currentRoute && currentContact && scheduledStartTime;
  };


  const handleSelectRoute = async () => {
    if (selectedSavedRoute) {
      try {
        if (user){
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
    loadData();
  };

  const handleSelectRouteBack = async () => {
    loadData();
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
          <IonTitle className="custom-ion-title">Create Scheduled Tracking Route</IonTitle>
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

        <IonItem>
          <IonLabel>Scheduled Start Time:</IonLabel>
          <IonInput
            type="time"
            value={scheduledStartTime || ''}
            onIonChange={(e) => setScheduledStartTime(e.detail.value!)}
          />
        </IonItem>

         <IonRadioGroup
  value={enableTracking ? 'true' : 'false'}  
  onIonChange={(e) => setEnableTracking(e.detail.value === 'true')}
>
  <IonItem>
    <IonLabel>Enable Tracking</IonLabel>
    <IonRadio slot="start" value="true" />
  </IonItem>
  <IonItem>
    <IonLabel>Disable Tracking</IonLabel>
    <IonRadio slot="start" value="false" />
  </IonItem>
</IonRadioGroup>



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

        <IonButton
          onClick={saveScheduledRoutes}
          disabled={!isScheduleTrackingEnabled()}

          expand="full" 
        >
          Save
        </IonButton>
      </IonContent>
      <BottomBar />
    </IonPage>
  );
};

export default CreateScheduledRoute;
