import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import Index from './pages/index';
import Forecasting from './pages/forecasting';
import './index.css';

// Error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'white', padding: '20px', textAlign: 'center' }}>
          <h1>Erro ao carregar a aplicação</h1>
          <p>{this.state.error?.message}</p>
          <pre style={{ textAlign: 'left', overflow: 'auto' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hook para roteamento
function useLocation() {
  const [location, setLocation] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      console.log('[useLocation] popstate event, new pathname:', window.location.pathname);
      setLocation(window.location.pathname);
    };

    const handleNavigate = () => {
      console.log('[useLocation] navigate event, new pathname:', window.location.pathname);
      setLocation(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('navigate', handleNavigate);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('navigate', handleNavigate);
    };
  }, []);

  return location;
}

function App() {
  const location = useLocation();
  
  console.log('[App] Rendering with location:', location);

  try {
    if (location.includes('/forecasting')) {
      console.log('[App] Rendering Forecasting component');
      return <Forecasting />;
    }

    console.log('[App] Rendering Index component');
    return <Index />;
  } catch (error) {
    console.error('[App] Error rendering component:', error);
    throw error;
  }
}

// Global navigation helper
(window as any).navigateTo = (href: string) => {
  console.log('[navigateTo] Navigating to:', href);
  try {
    window.history.pushState({}, '', href);
    
    // Dispatch custom event
    const event = new Event('navigate', { bubbles: true });
    window.dispatchEvent(event);
    console.log('[navigateTo] Navigation successful');
  } catch (error) {
    console.error('[navigateTo] Error:', error);
  }
};

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[GlobalError]', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UnhandledRejection]', event.reason);
});

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('[App] Mounting React application');
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('[App] React mounted successfully');
  } catch (error) {
    console.error('[App] Error mounting React:', error);
  }
} else {
  console.error('[App] Root element not found!');
}
