import React from 'react';
import ReactDOM from 'react-dom/client';
import Index from './pages/index';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Index />
    </React.StrictMode>
  );
}
