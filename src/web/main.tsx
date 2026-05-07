import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Index from './pages/index';
import Forecasting from './pages/forecasting';
import './index.css';

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const handleLocationChange = () => {
      const newPath = window.location.pathname;
      console.log('[Router] Navigation to:', newPath);
      setPath(newPath);
      setUpdateCount(prev => prev + 1);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('navigate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('navigate', handleLocationChange);
    };
  }, []);

  const currentPath = path || window.location.pathname;
  console.log('[Router] Current path:', currentPath, 'Update count:', updateCount);

  // Force re-render by using key
  if (currentPath.includes('/forecasting')) {
    return <Forecasting key={`forecasting-${updateCount}`} />;
  }

  return <Index key={`index-${updateCount}`} />;
}

// Global navigation helper with better error handling
(window as any).navigateTo = (href: string) => {
  console.log('[Navigation] Navigating to:', href);
  try {
    window.history.pushState({}, '', href);
    // Dispatch custom event to trigger re-render
    const event = new Event('navigate', { bubbles: true });
    window.dispatchEvent(event);
    console.log('[Navigation] Event dispatched successfully');
  } catch (error) {
    console.error('[Navigation] Error:', error);
  }
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
