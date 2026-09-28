import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RestobookProvider } from './context/RestobookContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RestobookProvider>
      <App />
    </RestobookProvider>
  </React.StrictMode>
);
