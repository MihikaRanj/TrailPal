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

ReactDOM.render(<App />, document.getElementById('root'));