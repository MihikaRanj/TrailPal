// src/pages/MapPage.tsx
import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import { Geolocation } from '@capacitor/geolocation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for missing marker icons in Leaflet (especially on mobile)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapPage_back: React.FC = () => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [currentPosition, setCurrentPosition] = useState<[number, number] | null>(null);

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

  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition();
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setCurrentPosition([lat, lon]);

      // Update the map to show the current position
      if (map) {
        map.setView([lat, lon], 13);
        const marker = L.marker([lat, lon]).addTo(map);
        marker.bindPopup('You are here!').openPopup();
      }
    } catch (error) {
      console.error('Error getting location', error);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <div id="map" style={{ height: '500px' }}></div>
        <IonButton expand="block" onClick={getCurrentLocation}>
          Get Current Location
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default MapPage_back;
