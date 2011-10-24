import { AndroidPermissions } from "@awesome-cordova-plugins/android-permissions";
import { BackgroundMode } from "@awesome-cordova-plugins/background-mode";
import { ForegroundService } from "@awesome-cordova-plugins/foreground-service";
import { PowerManagement } from "@awesome-cordova-plugins/power-management";
import { SMS } from "@awesome-cordova-plugins/sms";
import { AppLauncher } from "@capacitor/app-launcher";
import { Dialog } from "@capacitor/dialog";
import { Geolocation } from '@capacitor/geolocation';
import { findNearest, getDistance } from "geolib";

const acquireWakeLock = async () => {
    try {
        await PowerManagement.acquire();
        console.log("Wake lock acquired");
    } catch (error) {
        console.error("Failed to acquire wake lock", error);
    }
};

export const releaseWakeLock = async () => {
    try {
        await PowerManagement.release();
        console.log("Wake lock released");
    } catch (error) {
        console.error("Failed to release wake lock", error);
    }
};

// Function to start the foreground service
export const startForegroundService = () => {
    ForegroundService.start(
        'Location Tracking',                    // Title of the notification
        'Tracking your location in the background...', // Text in the notification
        'icon',                                 // Icon to display (replace 'icon' with a drawable if needed)
        2                                       // Importance level (1 = MIN, 2 = LOW, 3 = DEFAULT, 4 = HIGH)
    );
};

export const initializeBackgroundMode = async () => {
    //startForegroundService(); // Start foreground service
    acquireWakeLock();
    BackgroundMode.setDefaults({
        title: 'Tracking in progress',
        text: 'Your location is being tracked in the background.',
        color: 'F14F4D',
        icon: 'icon'
    });

    await BackgroundMode.enable();
    console.log("After BackgroundMode.enable");
    await BackgroundMode.disableWebViewOptimizations();
    console.log("After BackgroundMode.disableWebViewOptimizations");
    await BackgroundMode.disableBatteryOptimizations();
    console.log("After BackgroundMode.disableBatteryOptimizations");

};

export const stopBackgroundMode = async () => {
    stopForegroundService(); // Stop foreground service
    await BackgroundMode.disable();
    await releaseWakeLock();
}

const stopForegroundService = () => {
    ForegroundService.stop();
};


// Update the sendNotificationToContact function to send SMS
export const sendNotificationToContact = async (type: string, data: any, currentContact: any, user: any, firstName: string) => {
    console.log(currentContact.phone);
    if (!currentContact.phone) {
        console.log('Phone number is missing. Cannot send SMS.');
        return;
    }

    // Build the SMS message content
    const message = buildNotificationMessage(type, data, user, firstName);

    try {
        const options = {
            replaceLineBreaks: false,
            android: {
                intent: '' // leave empty to send SMS without opening an SMS app
            }
        };

        const currentTime = new Date();

        console.log("SMS Message:" + currentTime + ":" + message);
        if (window.cordova) {
            await SMS.send(currentContact.phone, currentTime + ":" + message, options);
            console.log('SMS sent successfully to' + currentContact.phone);
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
        console.log('Failed to send SMS ' + error);
    }
};


const buildNotificationMessage = (type: string, data: any, user: any, firstName: string) => {
    const createLocationLink = (lat: number, lon: number) => {
        return `https://www.google.com/maps?q=${lat},${lon}`;
    };

    switch (type) {
        case 'tracking-started':
            const startLocationLink = createLocationLink(data.route.startlocation.lat, data.route.startlocation.lon);
            const endLocationLink = createLocationLink(data.route.endlocation.lat, data.route.endlocation.lon);
            return `${firstName == 'Not Specified' ? (user?.email) : firstName} has started their journey. \nStart: ${data.route.startlocation.address} \nEnd: ${data.route.endlocation.address} \nEstimated Travel Time: ${data.route.estimatedTime} minutes.\nStart Location: ${startLocationLink} \nEnd Location: ${endLocationLink}`;

        case 'route-deviation':
            const currentLocationLink = createLocationLink(data.location.latitude, data.location.longitude);
            return `${firstName == 'Not Specified' ? (user?.email) : firstName} has deviated from the planned route! Current location: ${currentLocationLink}`;

        case 'reached-destination':
            const destinationLink = createLocationLink(data.location.latitude, data.location.longitude);
            return `${firstName == 'Not Specified' ? (user?.email) : firstName} has safely reached the destination. \nLocation: ${destinationLink}`;

        case 'late-arrival':
            const lastLocationLink = createLocationLink(data.location.latitude, data.location.longitude);
            return `${firstName == 'Not Specified' ? (user?.email) : firstName} has not arrived at the destination on time. Last known location: ${lastLocationLink}`;

        default:
            return 'Test message';
    }
};

  // Helper to check if the user has reached the destination
export  const hasReachedDestination = (currentLocation: any, currentRoute: any) => {
    console.log("hasReachedDestination");

    if (!currentRoute)
      return;

    const destination = {
      latitude: currentRoute.endlocation.lat,
      longitude: currentRoute.endlocation.lon,
    };
    console.log(destination);
    const distanceToDestination = getDistance(currentLocation, destination);
    return distanceToDestination <= 100; // 100 meters as the arrival threshold
  };

 // Helper to check if the user is on the route within a 5 mile range
export const isOnRoute = (currentLocation: any, routePath: any[], distanceDeviation: any) => {
    console.log("isOnRoute");
    console.log("distanceDeviation" + distanceDeviation);
    //console.log(routePath);
    const closestPoint = findNearest(currentLocation, routePath);
    const distanceToRoute = getDistance(currentLocation, closestPoint);
    return distanceToRoute <= distanceDeviation * 1609.34; // convert miles in meters
};

  // Helper to get route path: an array of waypoints
export  const getRoutePath = (currentRoute: any) => {
    if (!currentRoute)
      return;
    const path = [currentRoute.startlocation, ...(currentRoute.stops || []), currentRoute.endlocation];
    // Ensure all locations have valid lat/lon
    return path.map((location) => ({
      latitude: location?.lat,
      longitude: location?.lon,
    })).filter(location => location.latitude && location.longitude);
  };


export const getCurrentLocationWithRetries = async (retries = 3) => {
    while (retries > 0) {
        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            });
            return { latitude: position.coords.latitude, longitude: position.coords.longitude };
        } catch (error) {
            if (retries > 1) {
                console.log('Retrying location fetch...');
            }
            retries--;
        }
    }
    throw new Error('Unable to fetch location after multiple retries');
};


// Initialize Background Mode settings

export const explainBackgroundLocationAccess = async () => {

    const smsPermission = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.SEND_SMS);
    if (!smsPermission.hasPermission) {
        console.log("getting smsPermission");
        const smsGranted = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.SEND_SMS);
    }

    const accessFineLocationPermission = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.ACCESS_FINE_LOCATION);
    if (!accessFineLocationPermission.hasPermission) {
        console.log("getting accessFineLocationPermission");
        const accessFineLocationPermissionGranted = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.ACCESS_FINE_LOCATION);
    }

    const foregroundPermission = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.FOREGROUND_SERVICE_LOCATION);
    if (!foregroundPermission.hasPermission) {
        console.log("getting foregroundPermission");

        const foregroundPermissionGranted = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.FOREGROUND_SERVICE_LOCATION);

        const foregroundPermission2 = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.FOREGROUND_SERVICE_LOCATION);

        if (foregroundPermission2.hasPermission) {
            //alert('Foreground location permission granted');
            console.log("getting foregroundPermission.hasPermission");
            const { value } = await Dialog.confirm({
                title: 'Location Access Required',
                message: 'We need background location access to track your location even when the app is not in use.',
            });

            if (value) {
                // Proceed with requesting background location permission
                await requestLocationPermissions();
            } else {
                //alert('Foreground location permission denied');
            }
        }
    }
};

const requestLocationPermissions = async () => {
    console.log("Inside requestLocationPermissions");

    // Now ask for background permission
    const backgroundPermission = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.ACCESS_BACKGROUND_LOCATION);

    if (backgroundPermission.hasPermission) {
        //alert('Background location permission granted');
    } else {
        console.log("Inside backgroundPermission.hasPermission");
        // Open the app settings
        const canOpen = await AppLauncher.canOpenUrl({ url: 'app-settings:' });

        if (canOpen.value) {
            await AppLauncher.openUrl({ url: 'app-settings:' });
        } else {
            alert('Unable to open app settings. Please manually enable background location access.');
        }
    }
};
