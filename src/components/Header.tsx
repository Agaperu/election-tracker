import React, { useEffect } from 'react';
import { Activity, AlertCircle, Clock, Moon, Settings, Sun } from 'lucide-react';
import useElectionStore from '../store/electionStore';
import { formatDistanceToNow } from 'date-fns';

const Header: React.FC = () => {
  const { 
    electionData, 
    scrapeConfig, 
    toggleScraping,
    settings,
    toggleDarkMode
  } = useElectionStore();
  
  // Apply dark mode class to body
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Format last updated time
  const lastUpdatedFormatted = electionData.lastUpdated 
    ? formatDistanceToNow(new Date(electionData.lastUpdated), { addSuffix: true })
    : 'Never';

  return (
    <header className="bg-white dark:bg-neutral-800 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary-600" />
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">American Viewpoint Election Data Tracker</h1>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>Last updated: {lastUpdatedFormatted}</span>
            </div>
            
            <div className="mx-4 h-4 border-l border-neutral-300 dark:border-neutral-600"></div>
            
            <button 
              onClick={toggleScraping}
              className={`btn ${scrapeConfig.isRunning ? 'btn-primary' : 'btn-secondary'}`}
            >
              {scrapeConfig.isRunning ? 'Stop Scraping' : 'Start Scraping'}
            </button>
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Toggle dark mode"
            >
              {settings.darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            <button 
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;