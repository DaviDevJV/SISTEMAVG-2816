import React from 'react';
import ReactDOM from 'react-dom/client';
import Index from './pages/index';
import './index.css';

console.log("VANGUARD: Starting application...");
const rootElement = document.getElementById('root');
console.log("VANGUARD: Root element found:", !!rootElement);

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <Index />
      </React.StrictMode>
    );
    console.log("VANGUARD: Render call complete.");
  } catch (error) {
    console.error("VANGUARD: Render error:", error);
  }
} else {
  console.error("VANGUARD: Root element NOT found!");
}
