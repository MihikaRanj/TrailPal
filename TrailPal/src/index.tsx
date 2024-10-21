// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';

// index.tsx or equivalent

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(function(registration) {
          console.log('Service Worker registered with scope: ', registration.scope);
        })
        .catch(function(err) {
          console.log('Service Worker registration failed: ', err);
        });
    });
  }
  

ReactDOM.render(<App />, document.getElementById('root'));