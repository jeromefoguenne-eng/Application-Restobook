import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Restobook Application Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#020617',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>🍽️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#f59e0b' }}>
            Restobook - Récupération de Session
          </h1>
          <p style={{ maxWidth: '500px', color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>
            Une anomalie s'est produite lors de l'affichage. Vous pouvez recharger l'application ou démarrer en mode autonome.
          </p>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '600px',
            textAlign: 'left',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#ef4444',
            marginBottom: '24px',
            overflowX: 'auto'
          }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: '#020617',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recharger l'application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
