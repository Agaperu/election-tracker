import React, { useEffect } from 'react';
import useElectionStore from '../store/electionStore';
import RaceCard from './RaceCard';
import SourcesPanel from './SourcesPanel';
import FiltersPanel from './FiltersPanel';
import StatsOverview from './StatsOverview';
import USAMap from './USAMap';
import { fetchElectionResults, connectToResultsStream } from '../utils/api';

const Dashboard = () => {
  const { 
    electionData, 
    updateElectionData,
    filters,
    scrapeConfig,
    setIsLoading,
    isLoading,
    updateScrapeConfig,
    error,
    setError,
  } = useElectionStore();

  // Load election data on first render
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchElectionResults();
        if (isMounted && data) {
          updateElectionData(data);
          setError(null);
        }
      } catch (fetchError) {
        console.error('Failed to fetch election results:', fetchError);
        if (isMounted) {
          setError('Unable to load election results. Ensure the backend scraper server is running.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (electionData.races.length === 0) {
      loadInitialData();
    }

    return () => {
      isMounted = false;
    };
  }, [electionData.races.length, setError, setIsLoading, updateElectionData]);
  
  // Subscribe to live updates using SSE with polling fallback
  useEffect(() => {
    if (!scrapeConfig.isRunning) return undefined;

    let cleanupStream;
    let fallbackTimer;
    let fallbackActive = false;

    const fetchLatest = async () => {
      try {
        const data = await fetchElectionResults();
        updateElectionData(data);
      } catch (fetchError) {
        console.error('Polling fallback failed:', fetchError);
        setError('Unable to refresh election results. Check the scraper server.');
      }
    };

    if (typeof window !== 'undefined' && window.EventSource) {
      cleanupStream = connectToResultsStream({
        onResults: (data) => {
          updateElectionData(data);
          setError(null);
        },
        onConfig: (config) => updateScrapeConfig(config),
        onError: () => {
          if (!fallbackActive) {
            fallbackActive = true;
            if (cleanupStream) {
              cleanupStream();
              cleanupStream = undefined;
            }
            fallbackTimer = setInterval(fetchLatest, scrapeConfig.refreshInterval);
          }
        },
      });
    } else {
      fallbackTimer = setInterval(fetchLatest, scrapeConfig.refreshInterval);
    }

    return () => {
      if (cleanupStream) cleanupStream();
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, [scrapeConfig.isRunning, scrapeConfig.refreshInterval, setError, updateElectionData, updateScrapeConfig]);
  
  // Filter races based on current filters
  const filteredRaces = electionData.races.filter(race => {
    // Filter by state
    if (filters.state && race.state !== filters.state) return false;
    
    // Filter by race type
    if (filters.raceType && race.type !== filters.raceType) return false;
    
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = race.title.toLowerCase().includes(searchLower);
      const stateMatch = race.state.toLowerCase().includes(searchLower);
      const candidateMatch = race.candidates.some(c => 
        c.name.toLowerCase().includes(searchLower)
      );
      
      if (!titleMatch && !stateMatch && !candidateMatch) return false;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {error && (
        <div className="mb-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with sources and filters */}
        <div className="lg:col-span-1 space-y-6">
          <SourcesPanel />
          <FiltersPanel />
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-3 space-y-6">
          <StatsOverview />
          <USAMap />
          
          {/* Race cards */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Election Results</h2>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card animate-pulse h-48"></div>
                ))}
              </div>
            ) : filteredRaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRaces.map(race => (
                  <RaceCard key={race.id} race={race} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <p>No races match your current filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
