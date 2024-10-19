// src/pages/MapPage.tsx
import React, { useEffect, useState } from 'react';
import { IonContent, IonButton } from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


// Fix for missing marker icons in Leaflet (especially on mobile)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface MapPageProps {
  onLocationSelected: (location: string) => void;
}

const MapPage_v2: React.FC<MapPageProps> = ({ onLocationSelected }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('No location selected');

  useEffect(() => {
    const initializeMap = () => {
      if (!map) {
        const myMap = L.map('map', {
          center: [51.505, -0.09], // Default location (London)
          zoom: 13,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(myMap);

        myMap.on('click', (e) => {
          const { lat, lng } = e.latlng;
          const loc = `Lat: ${lat}, Lng: ${lng}`;
          setSelectedLocation(loc);
        });

        setMap(myMap);
      }
    };

    // Delay the map initialization to ensure the map div is rendered
    setTimeout(() => {
    if (!map){
      initializeMap();
      }
    }, 100);
  }, [map]);

  const handleSaveLocation = () => {
    onLocationSelected(selectedLocation);
  };

  return (
    <IonContent>
      <div id="map" style={{ height: '500px' }}></div>
      <IonButton expand="block" onClick={handleSaveLocation}>
        Save Location
      </IonButton>
    </IonContent>
  );
};

export default MapPage_v2;
