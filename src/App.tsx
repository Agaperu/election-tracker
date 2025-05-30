import React, { useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import useElectionStore from './store/electionStore';

function App() {
  const { settings } = useElectionStore();
  
  // Apply dark mode on initial load if needed
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, [settings.darkMode]);

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
}

export default App;