// src/pages/MapPage.tsx
import React, { useEffect, useState } from 'react';
import { IonContent, IonInput, IonItem, IonList, IonButton } from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for missing marker icons in Leaflet (especially on mobile)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface MapPageProps {
  onLocationSelected: (location: string) => void;
}

const MapPage: React.FC<MapPageProps> = ({ onLocationSelected }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');  // Address input
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]); // List of matching addresses
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [marker, setMarker] = useState<L.Marker | null>(null);

  // Initialize the map
  useEffect(() => {
    const initializeMap = () => {
      if (!map) {
        const myMap = L.map('map', {
          center: [51.505, -0.09], // Default to London
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

  // Fetch address suggestions using OpenStreetMap Nominatim API
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length > 2) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );
      const data = await response.json();
      setAddressSuggestions(data);
    } else {
      setAddressSuggestions([]);
    }
  };

  // Handle address selection
  const handleSelectAddress = (lat: number, lon: number, display_name: string) => {
    setSelectedLocation({ lat, lon });

    if (map) {
      // Move the map to the selected location
      map.setView([lat, lon], 13);

      // Remove existing marker, if any
      if (marker) {
        marker.remove();
      }

      // Add a new marker at the selected location
      const newMarker = L.marker([lat, lon]).addTo(map);
      newMarker.bindPopup(display_name).openPopup();

      setMarker(newMarker);  // Store the marker so it can be removed later
    }

    // Clear suggestions and input field
    setAddressSuggestions([]);
    setSearchQuery(display_name);
  };

  // Handle input change for address search
  const handleSearchChange = (e: any) => {
    const query = e.detail.value;
    setSearchQuery(query);
    fetchAddressSuggestions(query);
  };

  const handleSaveLocation = () => {
    if (selectedLocation) {
      const { lat, lon } = selectedLocation;
      onLocationSelected(`Lat: ${lat}, Lng: ${lon}`);
    }
  };

  return (
    <IonContent>
      {/* Address Search Input */}
      <IonItem>
        <IonInput
          value={searchQuery}
          placeholder="Enter address"
          onIonChange={handleSearchChange}
        />
      </IonItem>

      {/* Address Suggestions Dropdown */}
      {addressSuggestions.length > 0 && (
        <IonList>
          {addressSuggestions.map((suggestion) => (
            <IonItem
              key={suggestion.place_id}
              button
              onClick={() =>
                handleSelectAddress(
                  parseFloat(suggestion.lat),
                  parseFloat(suggestion.lon),
                  suggestion.display_name
                )
              }
            >
              {suggestion.display_name}
            </IonItem>
          ))}
        </IonList>
      )}

      {/* Map Display */}
      <div id="map" style={{ height: '500px', marginTop: '10px' }}></div>

      {/* Save Location Button */}
      <IonButton expand="block" onClick={handleSaveLocation} disabled={!selectedLocation}>
        Save Location
      </IonButton>
    </IonContent>
  );
};

export default MapPage;
