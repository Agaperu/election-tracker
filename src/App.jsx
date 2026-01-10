import React, { useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import useElectionStore from './store/electionStore';
import { fetchScrapeConfig } from './utils/api';

function App() {
  try {
    const { settings, updateScrapeConfig, setError } = useElectionStore();

    // Apply dark mode on initial load if needed
    useEffect(() => {
      try {
        if (settings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Error applying dark mode:', error);
      }
    }, [settings.darkMode]);

    // Hydrate scrape config from the backend
    useEffect(() => {
      let isMounted = true;

      const loadConfig = async () => {
        try {
          const config = await fetchScrapeConfig();
          if (isMounted && config) {
            updateScrapeConfig(config);
            setError(null);
          }
        } catch (error) {
          console.error('Failed to load scraper configuration:', error);
          if (isMounted) {
            setError('Unable to load scraper configuration. Start the backend server and try again.');
          }
        }
      };

      loadConfig();

      return () => {
        isMounted = false;
      };
    }, [setError, updateScrapeConfig]);

    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-50">
        <Header />
        <main className="pb-16">
          <Dashboard />
        </main>
        <footer className="text-center py-4 text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800">
          <div className="container mx-auto px-4">
            <p>Election Data Tracker &copy; {new Date().getFullYear()}</p>
            <p className="text-xs mt-1">Data sourced from multiple providers. Refreshed in real-time.</p>
          </div>
        </footer>
      </div>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="text-red-700 mb-4">Something went wrong loading the application.</p>
          <p className="text-sm text-red-600">Check the browser console for more details.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
  
export default App;
