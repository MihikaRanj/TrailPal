// public/firebase-messaging-sw.js

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase with your configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkncIHmyvnc03mQ8Wg4yFopKocdx-FEA4",
    authDomain: "trailpal-983de.firebaseapp.com",
    projectId: "trailpal-983de",
    storageBucket: "trailpal-983de.appspot.com",
    messagingSenderId: "690309186701",
    appId: "1:690309186701:web:93f742d4d7878aeea48ec4"
  };

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'  // Replace with your app's icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
