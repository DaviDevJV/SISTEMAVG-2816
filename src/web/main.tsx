import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Index from './pages/index';
import Forecasting from './pages/forecasting';
import './index.css';

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Custom event for internal navigation
    window.addEventListener('navigate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('navigate', handleLocationChange);
    };
  }, []);

  // Explicit routing based on window.location.pathname
  const currentPath = window.location.pathname;
  
  if (currentPath === '/forecasting') {
    return <Forecasting />;
  }

  return <Index />;
}

// Global navigation helper
(window as any).navigateTo = (href: string) => {
  window.history.pushState({}, '', href);
  window.dispatchEvent(new Event('navigate'));
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
