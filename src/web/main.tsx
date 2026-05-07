import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import Index from './pages/index';
import Forecasting from './pages/forecasting';
import './index.css';

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

  if (location.includes('/forecasting')) {
    console.log('[App] Rendering Forecasting component');
    return <Forecasting />;
  }

  console.log('[App] Rendering Index component');
  return <Index />;
}

// Global navigation helper
(window as any).navigateTo = (href: string) => {
  console.log('[navigateTo] Navigating to:', href);
  window.history.pushState({}, '', href);
  
  // Dispatch custom event
  const event = new Event('navigate', { bubbles: true });
  window.dispatchEvent(event);
};

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('[App] Mounting React application');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('[App] Root element not found!');
}
