import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { RestobookProvider } from './context/RestobookContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RestobookProvider>
        <App />
      </RestobookProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
