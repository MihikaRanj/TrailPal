// src/components/ContactForm.tsx
import React, { useState } from 'react';
import { IonItem, IonLabel, IonInput, IonButton, IonList, IonText } from '@ionic/react';

interface ContactFormProps {
  onSave: (name: string, phone: string, email: string) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null); // State for error handling

  const handleSubmit = () => {
    if (!name || !phone) {
      setError('Name and Phone number are required.');
    } else {
      setError(null);
      onSave(name, phone, email);
    }
  };

  return (
    <IonList>
      {/* Name Input Field */}
      <IonItem>
        <IonLabel position="stacked">Name <IonText color="danger">*</IonText></IonLabel>
        <IonInput
          value={name}
          onIonChange={(e) => setName(e.detail.value!)}
          placeholder="Enter contact name"
          required
        />
      </IonItem>

      {/* Phone Number Input Field */}
      <IonItem>
        <IonLabel position="stacked">Phone <IonText color="danger">*</IonText></IonLabel>
        <IonInput
          type="tel"
          value={phone}
          onIonChange={(e) => setPhone(e.detail.value!)}
          placeholder="Enter phone number"
          required
        />
      </IonItem>

      {/* Email Address Input Field */}
      <IonItem>
        <IonLabel position="stacked">Email</IonLabel>
        <IonInput
          type="email"
          value={email}
          onIonChange={(e) => setEmail(e.detail.value!)}
          placeholder="Enter email address (optional)"
        />
      </IonItem>

      {/* Error Message */}
      {error && (
        <IonItem lines="none">
          <IonText color="danger">{error}</IonText>
        </IonItem>
      )}

      {/* Save Button */}
      <IonButton
        expand="block"
        onClick={handleSubmit}
        disabled={!name || !phone}  // Disable button if name or phone are not filled
      >
        Save Contact
      </IonButton>
    </IonList>
  );
};

export default ContactForm;
