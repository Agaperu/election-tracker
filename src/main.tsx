import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Create the data directory if it doesn't exist
try {
  // This would typically be done server-side but we're setting up the structure
  console.log('Initializing application...');
} catch (error) {
  console.error('Error initializing application:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);