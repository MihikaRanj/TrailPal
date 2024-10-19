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
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
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

  useEffect(() => {
    if (locationState.state) {
      const { location, type, stopIndex } = locationState.state;

      if (type === 'start') {
        setStartLocation(location);
      } else if (type === 'end') {
        setEndLocation(location);
      } else if (type === 'stop' && stopIndex !== undefined) {
        const updatedStops = [...stops];
        updatedStops[stopIndex] = location;
        setStops(updatedStops);
      }
    }
  }, [locationState.state, stops]);

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
      const route = {
        startlocation: { address: startLocation },
        endlocation: { address: endLocation },
        stops: stops.map((stop) => ({ address: stop })),
        methodOfTravel: methodOfTravel || 'Not specified', // Save method of travel
        estimatedTime: estimatedTime + ' minutes', // Save estimated time
        createdAt: new Date(),
      };

      try {
        if (user) {
          const savedRoutesCollection = collection(db, 'users', user.uid, 'savedroutes');
          await addDoc(savedRoutesCollection, route);
          alert('Route saved successfully to saved routes!');
        }
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
        <IonItem>
          <IonLabel>Start Location (required): {startLocation || 'Not Selected'}</IonLabel>
          <IonButton expand="block" onClick={() => history.push({pathname: '/map/start',state: { from: locationState.state?.from }})}>
            Select Starting Location
          </IonButton>
        </IonItem>

        <IonItem>
          <IonLabel>End Location (required): {endLocation || 'Not Selected'}</IonLabel>
          <IonButton expand="block" onClick={() => history.push({pathname: '/map/end',state: { from: locationState.state?.from }})}>
            Select Ending Location
          </IonButton>
        </IonItem>

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
            placeholder="Enter time in minutes" // Placeholder to indicate the expected input
          />
        </IonItem>
      </IonContent>

      
        <IonToolbar>
          <IonButton  onClick={handleAddStop}>
            Add Stop
          </IonButton>

          {/* Save Route Button */}
          <IonButton
           
            onClick={handleSaveRoute}
            disabled={!startLocation || !endLocation || !estimatedTime} // Disable until required fields are filled
          >
            Save Route
          </IonButton>

          <IonButton onClick={handleShowRoute}>
            Show Route
          </IonButton>
        </IonToolbar>
        <BottomBar />
    
      
    </IonPage>
  );
};

export default CreateRoutePage;