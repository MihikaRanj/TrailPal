import React, { useEffect, useState } from 'react';
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
  IonModal,
  IonToast,
  IonInput,
  IonRadioGroup,
  IonRadio,
  IonFooter,
} from '@ionic/react';
import { useHistory } from 'react-router';
import { arrowBack } from 'ionicons/icons';
import { auth, db } from '../firebaseConfig';
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import BottomBar from '../components/BottomBar';

const ViewUpdateScheduledRoute: React.FC = () => {
  const history = useHistory();
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showSelectRouteModal, setShowSelectRouteModal] = useState(true); // Modal to show list of routes
  const [scheduledStartTime, setScheduledStartTime] = useState<string | null>(null);
  const [enableTracking, setEnableTracking] = useState<boolean>(false); // State for tracking radio button
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const user = auth.currentUser;

  useEffect(() => {
    fetchSavedScheduledRoutes();
  }, []);

  const fetchSavedScheduledRoutes = async () => {
    if (user) {
      const savedRoutesCollection = collection(db, 'users', user.uid, 'savedscheduledroutes');
      const querySnapshot = await getDocs(savedRoutesCollection);
      const routes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSavedRoutes(routes);
    }
  };

  const handleSelectRoute = (route: any) => {
    setSelectedRoute(route);
    setScheduledStartTime(route.scheduledStartTime);
    setEnableTracking(route.enableTracking); 
    setShowSelectRouteModal(false); 
    setShowRouteModal(true); // Open route details modal
  };

  const handleBack = () => {
    setShowSelectRouteModal(false);
    history.push('/track-route/scheduled'); 
  };

  const handleSave = async () => {
    if (selectedRoute && user) {
      try {
        const routeDoc = doc(db, 'users', user.uid, 'savedscheduledroutes', selectedRoute.id);
        await setDoc(routeDoc, {
          ...selectedRoute,
          scheduledStartTime,
          enableTracking, 
        });
        setToastMessage('Scheduled route updated successfully!');
        setShowToast(true);
        fetchSavedScheduledRoutes(); 
        setShowSelectRouteModal(true);
        setShowRouteModal(false);
      } catch (error) {
        setToastMessage('Failed to update the scheduled route.');
        setShowToast(true);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedRoute && user) {
      try {
        const routeDoc = doc(db, 'users', user.uid, 'savedscheduledroutes', selectedRoute.id);
        await deleteDoc(routeDoc);
        setToastMessage('Scheduled route deleted successfully!');
        setShowToast(true);
        fetchSavedScheduledRoutes(); 
        setShowRouteModal(false); 
      } catch (error) {
        setToastMessage('Failed to delete the scheduled route.');
        setShowToast(true);
      }
    }
  };

  const handleSelectRouteBack = () => {
    setShowRouteModal(false); 
    setShowSelectRouteModal(true); 
  };

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
          <IonTitle className="custom-ion-title">View/Update Scheduled Routes</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonModal isOpen={showSelectRouteModal}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={handleBack}>
                  <IonIcon icon={arrowBack} />
                  Back
                </IonButton>
              </IonButtons>
              <IonTitle className="custom-ion-title">Select Scheduled Route</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {savedRoutes.map((route) => (
              <IonItem key={route.id} button onClick={() => handleSelectRoute(route)}>
                <IonLabel>
                  {route.route.startlocation.address} to {route.route.endlocation.address} at {route.scheduledStartTime}
                </IonLabel>
              </IonItem>
            ))}
          </IonContent>
          <IonFooter>
            <IonButton expand="block" onClick={() => history.push({ pathname: '/track-route/scheduled' })}>
              Close
            </IonButton>
          </IonFooter>
        </IonModal>

        <IonModal isOpen={showRouteModal} onDidDismiss={() => setShowRouteModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={handleSelectRouteBack}>
                  <IonIcon icon={arrowBack} />
                  Back
                </IonButton>
              </IonButtons>
              <IonTitle className="custom-ion-title">Update Scheduled Route</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent>
            {selectedRoute && (
              <>
                <IonItem>
                  <IonLabel>Start Location: {selectedRoute.route.startlocation.address}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>End Location: {selectedRoute.route.endlocation.address}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Method of Travel: {selectedRoute.route.methodOfTravel}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Contact: {selectedRoute.contact.name}, {selectedRoute.contact.phone} {selectedRoute.contact.email !== 'Not specified' && `, ${selectedRoute.contact.email}`}</IonLabel>
                </IonItem>
                <IonItem>
                  <IonLabel>Scheduled Start Time:</IonLabel>
                  <IonInput
                    type="time"
                    value={scheduledStartTime || ''}
                    onIonChange={(e) => setScheduledStartTime(e.detail.value!)}
                  />
                </IonItem>

                <IonRadioGroup
  value={enableTracking ? 'true' : 'false'}  
  onIonChange={(e) => setEnableTracking(e.detail.value === 'true')}
>
  <IonItem>
    <IonLabel>Enable Tracking</IonLabel>
    <IonRadio slot="start" value="true" />
  </IonItem>
  <IonItem>
    <IonLabel>Disable Tracking</IonLabel>
    <IonRadio slot="start" value="false" />
  </IonItem>
</IonRadioGroup>
              </>
            )}
          </IonContent>

          <IonFooter>
            <IonButton expand="block" color="danger" onClick={handleDelete}>
              Delete
            </IonButton>
            <IonButton expand="block" onClick={handleSave}>
              Save
            </IonButton>
          </IonFooter>
        </IonModal>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>

      <BottomBar />
    </IonPage>
  );
};

export default ViewUpdateScheduledRoute;
