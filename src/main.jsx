import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/acute.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Acute Connect] Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '24px',
          fontFamily: 'system-ui, sans-serif', textAlign: 'center',
          background: '#f9fafb', color: '#111827'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: '#6b7280', marginBottom: 24, maxWidth: 400 }}>
            Acute Connect encountered an unexpected error. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: '#2563eb', color: '#fff', fontWeight: 600,
              fontSize: 15, cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: 24, padding: 16, background: '#fee2e2', borderRadius: 10,
              fontSize: 12, color: '#991b1b', maxWidth: 600, overflow: 'auto',
              textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);