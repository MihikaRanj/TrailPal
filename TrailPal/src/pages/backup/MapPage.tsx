// src/pages/MapPage.tsx
import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonFooter,
} from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Geolocation } from '@capacitor/geolocation';

interface MapPageProps {
  onRouteSaved: (route: { start: string; end: string; stops: string[]; travelMode: string }) => void;
}

const MapPage: React.FC<MapPageProps> = ({ onRouteSaved }) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [startLocation, setStartLocation] = useState(''); // Start location input (address)
  const [endLocation, setEndLocation] = useState(''); // End location input (address)
  const [stops, setStops] = useState<string[]>([]); // Array of stops (addresses)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    start: { lat: number; lon: number } | null;
    end: { lat: number; lon: number } | null;
    stops: { lat: number; lon: number }[];
  }>({
    start: null,
    end: null,
    stops: [],
  });
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]); // List of matching addresses
  const [travelMode, setTravelMode] = useState<'driving' | 'walking'>('driving'); // Travel mode (driving/walking)
  const [routeLayer, setRouteLayer] = useState<L.Polyline | null>(null); // Layer for route polyline

  // Initialize the map
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

  // Get user's current location for start location
  useEffect(() => {
    const showCurrentLocation = async () => {
      try {
        const position = await Geolocation.getCurrentPosition();
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Reverse geocode to get address from lat/lon
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
        );
        const data = await response.json();

        // Set start location to user's current address
        setStartLocation(data.display_name);
        setSelectedCoordinates((prev) => ({ ...prev, start: { lat, lon } }));

        if (map) {
          // Center map on user's location
          map.setView([lat, lon], 13);

          // Add marker for the user's location
          const userMarker = L.marker([lat, lon]).addTo(map);
          userMarker.bindPopup('Start Location (Your current location)').openPopup();
        }
      } catch (error) {
        console.error('Error getting current location', error);
      }
    };

    showCurrentLocation();
  }, [map]);

  // Fetch address suggestions using OpenStreetMap Nominatim API
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

  // Handle address selection for start, end, and stops
  const handleSelectAddress = (
    lat: number,
    lon: number,
    display_name: string,
    type: 'start' | 'end' | 'stop',
    stopIndex?: number
  ) => {
    if (type === 'start') {
      setStartLocation(display_name);
      setSelectedCoordinates((prev) => ({ ...prev, start: { lat, lon } }));
    } else if (type === 'end') {
      setEndLocation(display_name);
      setSelectedCoordinates((prev) => ({ ...prev, end: { lat, lon } }));
    } else if (type === 'stop' && stopIndex !== undefined) {
      const updatedStops = [...selectedCoordinates.stops];
      updatedStops[stopIndex] = { lat, lon };
      setStops((prev) => {
        const updatedStopsText = [...prev];
        updatedStopsText[stopIndex] = display_name;
        return updatedStopsText;
      });
      setSelectedCoordinates((prev) => ({ ...prev, stops: updatedStops }));
    }

    // Clear suggestions after selection
    setAddressSuggestions([]);
  };

  // Handle input change for address search for start, end, and stops
  const handleSearchChange = (e: any, type: 'start' | 'end' | 'stop', stopIndex?: number) => {
    const query = e.detail.value;
    if (type === 'start') setStartLocation(query);
    else if (type === 'end') setEndLocation(query);
    else if (type === 'stop' && stopIndex !== undefined) {
      const updatedStops = [...stops];
      updatedStops[stopIndex] = query;
      setStops(updatedStops);
    }
    fetchAddressSuggestions(query);
  };

  // Add a new stop field dynamically
  const addStop = () => {
    setStops([...stops, '']);
  };

  // Draw route on the map (driving/walking)
  const drawRoute = async () => {
    if (!selectedCoordinates.start || !selectedCoordinates.end) return;

    let waypoints = [
      { lat: selectedCoordinates.start.lat, lon: selectedCoordinates.start.lon },
      ...selectedCoordinates.stops,
      { lat: selectedCoordinates.end.lat, lon: selectedCoordinates.end.lon },
    ];

    const coordinatesString = waypoints.map(waypoint => `${waypoint.lon},${waypoint.lat}`).join(';');
    const routeProfile = travelMode === 'driving' ? 'car' : 'foot';

    // Fetch route from OSRM API
    const routeUrl = `https://router.project-osrm.org/route/v1/${routeProfile}/${coordinatesString}?overview=full&geometries=geojson`;
    const response = await fetch(routeUrl);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const routeCoordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

      if (routeLayer) {
        routeLayer.remove();  // Remove any existing route layer
      }

      const polyline = L.polyline(routeCoordinates, { color: 'blue' }).addTo(map!);
      setRouteLayer(polyline);

      // Fit the map view to the new route
      map!.fitBounds(polyline.getBounds());
    }
  };

  // Handle route saving
  const handleSaveRoute = () => {
    if (!startLocation || !endLocation) return;

    const routeData = {
      start: startLocation,
      end: endLocation,
      stops: stops,
      travelMode,
    };

    onRouteSaved(routeData);
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Map</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* Start Location Input */}
        <IonItem>
          <IonLabel>Start Location</IonLabel>
          <IonInput
            value={startLocation}
            placeholder="Enter start location"
            onClick={(e) => handleSearchChange(e, 'start')}
          />
        </IonItem>

        {/* End Location Input */}
        <IonItem>
          <IonLabel>End Location</IonLabel>
          <IonInput
            value={endLocation}
            placeholder="Enter end location"
            onClick={(e) => handleSearchChange(e, 'end')}
          />
        </IonItem>

        {/* Stops (Intermediate Locations) */}
        {stops.map((stop, index) => (
          <IonItem key={index}>
            <IonLabel>Stop {index + 1}</IonLabel>
            <IonInput
              value={stop}
              placeholder="Enter stop location"
              onIonChange={(e) => handleSearchChange(e, 'stop', index)}
            />
          </IonItem>
        ))}

        {/* Add Stop Button */}
        <IonButton expand="block" onClick={addStop}>
          Add Stop
        </IonButton>

        {/* Travel Mode Selection 
        <IonItem>
          <IonLabel>Travel Mode</IonLabel>
          <IonSelect value={travelMode} onIonChange={(e) => setTravelMode(e.detail.value)}>
            <IonSelectOption value="driving">Driving</IonSelectOption>
            <IonSelectOption value="walking">Walking</IonSelectOption>
          </IonSelect>
        </IonItem>*/}

        {/* Map Display */}
        <div id="map" style={{ height: '200px', marginTop: '10px' }}></div>

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
                    suggestion.display_name,
                    stops.length ? 'stop' : 'start' 
                  )
                }
              >
                {suggestion.display_name}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>

      {/* Footer with "Show Route" and "Save Route" Buttons */}
      
      {/*
      <IonFooter>
        <IonToolbar>
          <IonButton expand="block" onClick={drawRoute} disabled={!startLocation || !endLocation}>
            Show Route
          </IonButton>
          <IonButton expand="block" onClick={handleSaveRoute} disabled={!startLocation || !endLocation}>
            Save Route
          </IonButton>
        </IonToolbar>
      </IonFooter>*/ }
    </>
  );
};

export default MapPage;
