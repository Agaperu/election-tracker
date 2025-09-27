import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Chrome compatibility fixes
if (typeof global === 'undefined') {
  (window as any).global = window;
}

console.log('Starting Election Tracker application...');
console.log('User Agent:', navigator.userAgent);
console.log('Chrome detected:', navigator.userAgent.includes('Chrome'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('Application rendered successfully');
} catch (error) {
  console.error('Error rendering application:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Application Error</h1>
      <p>There was an error loading the application. Please check the console for details.</p>
      <p><strong>Browser:</strong> ${navigator.userAgent}</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${error}</pre>
      <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Page</button>
    </div>
  `;
}