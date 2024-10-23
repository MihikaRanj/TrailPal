import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonButtons,
  IonIcon,
  IonFooter,
  IonSelect,
  IonSelectOption,
  IonInput,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { arrowBack, refreshOutline, carOutline, walkOutline } from 'ionicons/icons';
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; // Firestore config
import BottomBar from '../components/BottomBar';


const CreateRoutePage: React.FC = () => {
  const history = useHistory();
  const locationState = useLocation<{ from?: string, location: string; type: string; stopIndex?: number }>();

  const [startLocation, setStartLocation] = useState<string | null>(null);
  const [endLocation, setEndLocation] = useState<string | null>(null);
  const [stops, setStops] = useState<string[]>([]); // Array to store multiple stops
  const [methodOfTravel, setMethodOfTravel] = useState<string | null>(null); // New state for method of travel
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null); // New state for estimated journey time
  const [loading, setLoading] = useState(true); // State to handle loading

  const user = auth.currentUser; // Get the current authenticated user

  //console.log(locationState.state?.from );
  useEffect(() => {
    const fetchRouteData = async () => {
      if (user) {
        const routesCollection = collection(db, 'users', user.uid, 'currentdata');
        const routeDoc = doc(routesCollection, 'currentRoute');
        const docSnapshot = await getDoc(routeDoc);

        if (docSnapshot.exists()) {
          const routeData = docSnapshot.data();
          setStartLocation(routeData.startlocation?.address || null);
          setEndLocation(routeData.endlocation?.address || null);
          setStops(routeData.stops?.map((stop: any) => stop.address) || []);
          setMethodOfTravel(routeData.methodOfTravel || null);
          setEstimatedTime(routeData.estimatedTime || null);
        }

      }
      setLoading(false);
    };

    fetchRouteData();
  }, [user]);

  const clearRouteData = async () => {
    if (user) {
      try {
        const routesCollection = collection(db, 'users', user.uid, 'currentdata');
        const routeDoc = doc(routesCollection, 'currentRoute');
        await deleteDoc(routeDoc);
      } catch (error) {
        console.error('Error deleting route data:', error);
        alert('Failed to refresh. Please try again.');
      }
    }

    setStartLocation(null);
    setEndLocation(null);
    setStops([]);
    setMethodOfTravel(null);
    setEstimatedTime(null);
    history.replace({ pathname: history.location.pathname, state: undefined });
  };

  const handleRefresh = async () => {
    await clearRouteData();
  };

  const handleSaveRoute = async () => {
    if (startLocation && endLocation && estimatedTime) {
      try {
        if (user) {
          const routesCollection = collection(db, 'users', user.uid, 'currentdata');
          const routeDoc = doc(routesCollection, 'currentRoute');
          const docSnapshot = await getDoc(routeDoc);
  
          if (docSnapshot.exists()) {
            const routeData = docSnapshot.data(); // Retrieve the full route data from currentdata
  
            // Create the route object
            const route = {
              startlocation: {
                address: routeData.startlocation.address,
                lat: routeData.startlocation.lat,
                lon: routeData.startlocation.lon,
              },
              endlocation: {
                address: routeData.endlocation.address,
                lat: routeData.endlocation.lat,
                lon: routeData.endlocation.lon,
              },
              stops: routeData.stops.map((stop: any) => ({
                address: stop.address,
                lat: stop.lat,
                lon: stop.lon,
              })),
              methodOfTravel: methodOfTravel || 'Not specified',
              estimatedTime: estimatedTime,
              createdAt: new Date(),
            };
  
            const savedRoutesCollection = collection(db, 'users', user.uid, 'savedroutes');
  
            // Query all saved routes
            const querySnapshot = await getDocs(savedRoutesCollection);
            let existingRouteId: string | null = null;
  
            // Check if an identical route already exists
            querySnapshot.forEach((doc) => {
              const savedRoute = doc.data();
  
              const isSameRoute = 
                savedRoute.startlocation.address === route.startlocation.address &&
                savedRoute.endlocation.address === route.endlocation.address &&
                JSON.stringify(savedRoute.stops) === JSON.stringify(route.stops) &&
                savedRoute.methodOfTravel === route.methodOfTravel &&
                savedRoute.estimatedTime === route.estimatedTime;
  
              if (isSameRoute) {
                existingRouteId = doc.id;
              }
            });
  
            // If identical route found, update it
            if (existingRouteId) {
              const existingRouteDoc = doc(savedRoutesCollection, existingRouteId);
              await setDoc(existingRouteDoc, route, { merge: true });
            } else {
              // If no identical route found, add a new one
              await addDoc(savedRoutesCollection, route);
              //alert('Route saved successfully!');
            }
  
          } else {
            alert('Failed to retrieve current route data.');
          }
        }
        handleBack();
      } catch (error) {
        console.error('Error saving route:', error);
        alert('Failed to save the route. Please try again.');
      }
    } else {
      alert('Please enter both start and end locations, and the estimated journey time.');
    }
  };
  
  
  const handleFieldUpdate = async (field: string, value: any) => {
    if (user) {
      const routesCollection = collection(db, 'users', user.uid, 'currentdata');
      const routeDoc = doc(routesCollection, 'currentRoute');

      const updateData: any = {};
      updateData[field] = value;

      await setDoc(routeDoc, updateData, { merge: true }); // Update Firestore with new field value
    }
  };

  const handleShowRoute = () => {
    if (startLocation && endLocation) {
      alert('Displaying route from start to end with stops: ' + stops.join(', '));
    } else {
      alert('Please enter both start and end locations.');
    }
  };

  const handleAddStop = () => {
    setStops([...stops, '']);
  };

  const handleBack = async () => {
    //await clearRouteData();
    if (locationState.state?.from === 'OnDemandTracking') {
      history.push('/track-route/on-demand'); // Go back to OnDemandTracking
    } else if (locationState.state?.from === 'ScheduledTracking') {
      history.push('/track-route/scheduled'); // Go back to ScheduledTracking
    } else {
      history.push('/track-route'); // Default fallback if no source is found
    }
    //history.push('/track-route');
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

          <IonTitle>Create Route</IonTitle>

          <IonButtons slot="end">
            <IonButton onClick={handleRefresh}>
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
      {startLocation ? (
          <IonItem>
            <IonLabel>Start Location: {startLocation}</IonLabel>
          </IonItem>
        ) : (
          <IonItem>
            <IonButton expand="block" onClick={() => history.push({pathname: '/map/start',state: { from: locationState.state?.from }})}>
            Select Starting Location (required)
          </IonButton>
          </IonItem>
      )}

      
        {endLocation ? (
          <IonItem>
            <IonLabel>End Location: {endLocation}</IonLabel>
          </IonItem>
        ) : (

          <IonItem lines="none" style={{ display: 'flex', justifyContent: 'center' }}>
            <IonButton expand="block" onClick={() => history.push({pathname: '/map/end',state: { from: locationState.state?.from }})}>
            Select Ending Location (required)
          </IonButton>
          </IonItem>
        )}

        {stops.map((stop, index) => (
          <IonItem key={index}>
            <IonLabel>Stop {index + 1}: {stop || 'Not Selected'}</IonLabel>
            <IonButton expand="block" onClick={() => history.push({pathname: `/map/stop/${index}`,state: { from: locationState.state?.from }})}>
              Select Stop {index + 1}
            </IonButton>
          </IonItem>
        ))}

        {/* Method of Travel Input */}
        <IonItem>
          <IonLabel>Method of Travel</IonLabel>
          <IonSelect
            value={methodOfTravel}
            placeholder="Select Travel Method"
            onIonChange={(e) => {
              setMethodOfTravel(e.detail.value);
              handleFieldUpdate('methodOfTravel', e.detail.value); // Update Firestore when selected
            }}
          >
            <IonSelectOption value="Driving">
              🚗 Driving {/* Use emojis instead of IonIcons for now */}
            </IonSelectOption>
            <IonSelectOption value="Walking">
              🚶 Walking
            </IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Estimated Journey Time Input */}
        <IonItem>
          <IonLabel>Estimated Journey Time (required)</IonLabel>
          <IonInput
            type="number"
            value={estimatedTime || ''}
            onIonChange={(e) => {
              setEstimatedTime(e.detail.value!);
              handleFieldUpdate('estimatedTime', e.detail.value!); // Update Firestore when entered
            }}
            required
            placeholder="minutes"
            style={{ width: '100px', marginLeft: 'auto' }} // Ensure input is compact and right-aligned
          />
        </IonItem>
      </IonContent>

      
        <IonToolbar>
          <IonButton expand="full"  onClick={handleAddStop}>
            Add Stop
          </IonButton>

          {/* Save Route Button */}
          <IonButton expand="full" 
           
            onClick={handleSaveRoute}
            disabled={!startLocation || !endLocation || !estimatedTime} // Disable until required fields are filled
          >
            Save Route
          </IonButton>

          <IonButton expand="full"  onClick={handleShowRoute}>
            Show Route
          </IonButton>
        </IonToolbar>
        <BottomBar />
    
      
    </IonPage>
  );
};

export default CreateRoutePage;
