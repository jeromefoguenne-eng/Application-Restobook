import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { RestobookProvider } from './context/RestobookContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <RestobookProvider>
          <App />
        </RestobookProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
