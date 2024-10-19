import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonList, IonItem, IonButtons, IonLabel } from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';
import { useHistory, useParams, useLocation } from 'react-router-dom'; // Import useLocation to access state
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; // Import Firebase config

const MapPage: React.FC = () => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const history = useHistory();
  const { type, stopIndex } = useParams<{ type: string; stopIndex?: string }>();

  // Extract the 'from' state passed from CreateRoutePage
  const location = useLocation<{ from?: string }>();
  const from = location.state?.from || ''; // Fallback to an empty string if 'from' is not provided

  console.log(type);
  console.log(from);

  useEffect(() => {
    const initializeMap = () => {
      if (!map) {
        const myMap = L.map('map', {
          center: [42.3314, -83.0458], // Default to Detroit, Michigan
          zoom: 13,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(myMap);

        setMap(myMap);
      }
    };

    // Delay the map initialization to ensure the map div is rendered
    setTimeout(() => {
      initializeMap();
    }, 100);
  }, [map]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      const position = await Geolocation.getCurrentPosition();
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();

      setAddress(data.display_name);
      setSelectedCoordinates({ lat, lon });

      if (map) {
        map.setView([lat, lon], 13);
        const marker = L.marker([lat, lon]).addTo(map);
        marker.bindPopup('Current Location').openPopup();
      }
    };

    getCurrentLocation();
  }, [map]);

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length > 2) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`
      );
      const data = await response.json();
      setAddressSuggestions(data);
    } else {
      setAddressSuggestions([]);
    }
  };

  const handleAddressChange = (e: any) => {
    const query = e.detail.value;
    setAddress(query);
    fetchAddressSuggestions(query);
  };

  const handleSelectAddress = (lat: number, lon: number, display_name: string) => {
    setAddress(display_name);
    setSelectedCoordinates({ lat, lon });
    setAddressSuggestions([]);
    if (map) {
      map.setView([lat, lon], 13);
      L.marker([lat, lon]).addTo(map).bindPopup(display_name).openPopup();
    }
  };

  const handleSaveLocation = async () => {
    if (address && selectedCoordinates) {
      const user = auth.currentUser;
      if (!user) return; // Ensure user is logged in

      // Reference to the user's routes collection inside the users collection
      const routesCollection = collection(db, 'users', user.uid, 'currentdata');
      const routeDoc = doc(routesCollection, 'currentRoute'); // Use a document for the current route

      const routeData = (await getDoc(routeDoc)).data() || { startlocation: null, endlocation: null, stops: [] };

      // Update the current route with start, end, or stop based on type
      if (type === 'start') {
        routeData.startlocation = { address, lat: selectedCoordinates.lat, lon: selectedCoordinates.lon };
      } else if (type === 'end') {
        routeData.endlocation = { address, lat: selectedCoordinates.lat, lon: selectedCoordinates.lon };
      } else if (type === 'stop' && stopIndex !== undefined) {
        routeData.stops[parseInt(stopIndex)] = { address, lat: selectedCoordinates.lat, lon: selectedCoordinates.lon };
      }

      await setDoc(routeDoc, routeData); // Save the document in the user's routes collection

      // Return to CreateRoutePage with the selected address, type, stopIndex, and 'from' state
      history.push({
        pathname: '/create-route',
        state: { location: address, type, stopIndex, from },
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* Back Link */}
          <IonButtons slot="start">
            <IonButton fill="clear" onClick={() => history.push({
              pathname: '/create-route',
              state: { from } // Pass 'from' state back when going back
            })}>
              <IonLabel>Back</IonLabel>
            </IonButton>
          </IonButtons>
          <IonTitle>Select {type === 'start' ? 'Start' : type === 'end' ? 'End' : 'Stop'} Location</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonInput
            value={address}
            placeholder="Enter address"
            onIonChange={handleAddressChange}
          />
        </IonItem>

        {/* Suggestions List */}
        {addressSuggestions.length > 0 && (
          <IonList>
            {addressSuggestions.map((suggestion) => (
              <IonItem
                key={suggestion.place_id}
                button
                onClick={() =>
                  handleSelectAddress(parseFloat(suggestion.lat), parseFloat(suggestion.lon), suggestion.display_name)
                }
              >
                {suggestion.display_name}
              </IonItem>
            ))}
          </IonList>
        )}

        <div id="map" style={{ height: '400px' }}></div>

        <IonButton expand="block" onClick={handleSaveLocation} disabled={!address || !selectedCoordinates}>
          Save Location
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default MapPage;
