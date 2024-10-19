// src/pages/InputPage.tsx
import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonInput, IonModal, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonList, IonFooter } from '@ionic/react';
import MapPage from './MapPage';  // This will be the map component from the previous section
import ContactForm from '../components/ContactForm';

const InputPage: React.FC = () => {
  const [location, setLocation] = useState<string | null>(null); // Store selected location
  const [contact, setContact] = useState<{ name: string; phone: string } | null>(null); // Store contact info

  const [showMapModal, setShowMapModal] = useState(false); // Show/hide map modal
  const [showContactModal, setShowContactModal] = useState(false); // Show/hide contact modal

  const handleSaveContact = (name: string, phone: string) => {
    setContact({ name, phone });
    setShowContactModal(false);
  };

  const handleSaveLocation = (loc: string) => {
    setLocation(loc);
    setShowMapModal(false);
  };

  return (
    <IonPage>
      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel>Location: {location || 'No location selected'}</IonLabel>
            <IonButton onClick={() => setShowMapModal(true)} slot="end">Select Location</IonButton>
          </IonItem>

          <IonItem>
            <IonLabel>Contact: {contact ? `${contact.name}, ${contact.phone}` : 'No contact added'}</IonLabel>
            <IonButton onClick={() => setShowContactModal(true)} slot="end">Add Contact</IonButton>
          </IonItem>
        </IonList>

        {/* Modal for selecting location */}
        <IonModal isOpen={showMapModal} onDidDismiss={() => setShowMapModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Location</IonTitle>
            </IonToolbar>
          </IonHeader>
          <MapPage onLocationSelected={handleSaveLocation} />
          <IonFooter>
            <IonButton expand="block" onClick={() => setShowMapModal(false)}>Close Map</IonButton>
          </IonFooter>
        </IonModal>

        {/* Modal for adding contact */}
        <IonModal isOpen={showContactModal} onDidDismiss={() => setShowContactModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Contact</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <ContactForm onSave={handleSaveContact} />
          </IonContent>
          <IonFooter>
            <IonButton expand="block" onClick={() => setShowContactModal(false)}>Close</IonButton>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default InputPage;
