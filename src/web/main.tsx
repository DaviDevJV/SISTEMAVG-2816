import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, Switch } from "wouter";
import Index from './pages/index';
import Forecasting from './pages/forecasting';
import './index.css';

console.log("VANGUARD: Starting application with routing...");
const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/forecasting" component={Forecasting} />
          <Route>404 Page Not Found</Route>
        </Switch>
      </React.StrictMode>
    );
    console.log("VANGUARD: Render call complete with routing.");
  } catch (error) {
    console.error("VANGUARD: Render error:", error);
  }
} else {
  console.error("VANGUARD: Root element NOT found!");
}
