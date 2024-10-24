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
  IonSelect,
  IonSelectOption,
  IonInput,
  IonModal,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { arrowBack, refreshOutline } from 'ionicons/icons';
import { doc, getDoc, setDoc, deleteDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import BottomBar from '../components/BottomBar';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

const CreateRoutePage: React.FC = () => {
  const history = useHistory();
  const locationState = useLocation<{ from?: string; location: string; type: string; stopIndex?: number }>();

  const [startLocation, setStartLocation] = useState<string | null>(null);
  const [startLatLng, setStartLatLng] = useState<{ lat: number; lon: number } | null>(null);
  const [endLocation, setEndLocation] = useState<string | null>(null);
  const [endLatLng, setEndLatLng] = useState<{ lat: number; lon: number } | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [methodOfTravel, setMethodOfTravel] = useState<string>('Driving');
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [map, setMap] = useState<L.Map | null>(null); // Store map instance here

  const user = auth.currentUser;

  useEffect(() => {
    const fetchRouteData = async () => {
      if (user) {
        const routesCollection = collection(db, 'users', user.uid, 'currentdata');
        const routeDoc = doc(routesCollection, 'currentRoute');
        const docSnapshot = await getDoc(routeDoc);

        if (docSnapshot.exists()) {
          const routeData = docSnapshot.data();
          setStartLocation(routeData.startlocation?.address || null);
          setStartLatLng({ lat: routeData.startlocation?.lat, lon: routeData.startlocation?.lon });
          setEndLocation(routeData.endlocation?.address || null);
          setEndLatLng({ lat: routeData.endlocation?.lat, lon: routeData.endlocation?.lon });
          setStops(routeData.stops?.map((stop: any) => stop.address) || []);
          setMethodOfTravel(routeData.methodOfTravel || 'Driving');
          setEstimatedTime(routeData.estimatedTime || null);
        }
      }
      setLoading(false);
    };

    fetchRouteData();
  }, [user]);

  const handleShowRoute = () => {
    if (startLatLng && endLatLng) {
      setShowRouteModal(true);
    } else {
      alert('Please enter both start and end locations.');
    }
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

  const handleHideRoute = () => {
    setShowRouteModal(false);
    if (map) {
      map.remove(); // Properly clean up the map on modal close
      setMap(null); // Reset map instance
    }
  };

  const fetchRoute = async (startLat: number, startLon: number, endLat: number, endLon: number, mode: string) => {
    try {
      const travelMode = mode === 'Driving' ? 'driving-car' : 'foot-walking';
      const apikey = '5b3ce3597851110001cf6248d85f427c71894eb987dd971ab317c6fd'; // Use your OpenRouteService API key here
      const response = await axios.get(
        `https://api.openrouteservice.org/v2/directions/${travelMode}?api_key=${apikey}&start=${startLon},${startLat}&end=${endLon},${endLat}`
      );

      return response.data.features[0].geometry.coordinates.map((coord: [number, number]) => ({
        lat: coord[1],
        lon: coord[0],
      }));
    } catch (error) {
      console.error('Error fetching route:', error);
      return [];
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
    setMethodOfTravel('Driving');
    setEstimatedTime(null);
    history.replace({ pathname: history.location.pathname, state: undefined });
  };

  const handleRefresh = async () => {
    await clearRouteData();
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

  // UseEffect to initialize the map after the modal is rendered
  useEffect(() => {
    if (showRouteModal && startLatLng && endLatLng && !map) {
      const initializeMap = async () => {
        // Wait for the DOM to render the map container
        setTimeout(async () => {
          const mapInstance = L.map('route-map').setView([startLatLng.lat, startLatLng.lon], 13);
          setMap(mapInstance); // Store the map instance

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(mapInstance);

          const waypoints = [];
          const routeCoords = await fetchRoute(startLatLng.lat, startLatLng.lon, endLatLng.lat, endLatLng.lon, methodOfTravel);

          if (routeCoords.length > 0) {
            const latlngs = routeCoords.map((coord: { lat: any; lon: any }) => [coord.lat, coord.lon]);
            L.polyline(latlngs, { color: 'blue' }).addTo(mapInstance); // Draw the route
          }

          if (startLatLng) {
            waypoints.push(L.marker([startLatLng.lat, startLatLng.lon]).bindPopup('Start: ' + startLocation).addTo(mapInstance));
          }

          if (endLatLng) {
            waypoints.push(L.marker([endLatLng.lat, endLatLng.lon]).bindPopup('End: ' + endLocation).addTo(mapInstance));
          }

          const group = L.featureGroup(waypoints);
          mapInstance.fitBounds(group.getBounds());
        }, 300); // Delay to ensure DOM is fully rendered
      };

      initializeMap();
    }
  }, [showRouteModal, startLatLng, endLatLng, methodOfTravel, map]);

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
            <IonButton expand="block" onClick={() => history.push({ pathname: '/map/start', state: { from: locationState.state?.from } })}>
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
            <IonButton expand="block" onClick={() => history.push({ pathname: '/map/end', state: { from: locationState.state?.from } })}>
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

        <IonItem>
          <IonLabel>Method of Travel</IonLabel>
          <IonSelect value={methodOfTravel} placeholder="Select Travel Method" onIonChange={(e) => setMethodOfTravel(e.detail.value)}>
            <IonSelectOption value="Driving">🚗 Driving</IonSelectOption>
            <IonSelectOption value="Walking">🚶 Walking</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Estimated Journey Time (required)</IonLabel>
          <IonInput
            type="number"
            value={estimatedTime || ''}
            onIonChange={(e) => setEstimatedTime(e.detail.value!)}
            required
            placeholder="minutes"
            style={{ width: '100px', marginLeft: 'auto' }}
          />
        </IonItem>
      </IonContent>

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

      <IonToolbar>
        <IonButton expand="full" onClick={handleShowRoute}>
          Show Route
        </IonButton>
      </IonToolbar>

      <IonModal isOpen={showRouteModal} onDidDismiss={handleHideRoute}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Route Map</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleHideRoute}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div id="route-map" style={{ height: '400px', width: '100%' }} />
        </IonContent>
      </IonModal>

      <BottomBar />
    </IonPage>
  );
};

export default CreateRoutePage;
