// src/pages/MapPage.tsx
import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonList, IonItem } from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';
import { useHistory, useParams } from 'react-router-dom';

const MapPage: React.FC = () => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const history = useHistory();
  const { type, stopIndex } = useParams<{ type: string; stopIndex?: string }>();

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

  const handleSaveLocation = () => {
    if (address && selectedCoordinates) {
      // Return to previous page with the selected address as state
      history.push({
        pathname: '/create-route',
        state: { location: address, type, stopIndex },
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select {type === 'start' ? 'Start' : 'End'} Location</IonTitle>
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
