import React, { useEffect, useState } from 'react';
import useElectionStore from '../store/electionStore';
import RaceCard from './RaceCard';
import SourcesPanel from './SourcesPanel';
import FiltersPanel from './FiltersPanel';
import StatsOverview from './StatsOverview';
import USAMap from './USAMap';
import HistoricalTrends from './HistoricalTrends';
import { generateMockElectionData } from '../utils/mockData';
import { ElectionData } from '../types';

const Dashboard: React.FC = () => {
  const { 
    electionData, 
    updateElectionData,
    filters,
    scrapeConfig,
    setIsLoading,
    isLoading,
  } = useElectionStore();

  // Load mock data on first render
  useEffect(() => {
    const loadInitialData = () => {
      setIsLoading(true);
      
      // Simulate API call with timeout
      setTimeout(() => {
        const mockRaces = generateMockElectionData();
        updateElectionData({
          races: mockRaces,
          lastUpdated: new Date().toISOString(),
        });
        setIsLoading(false);
      }, 1500);
    };
    
    if (electionData.races.length === 0) {
      loadInitialData();
    }
  }, [electionData.races.length, updateElectionData, setIsLoading]);
  
  // Set up polling if auto-refresh is enabled
  useEffect(() => {
    if (!scrapeConfig.isRunning) return;
    
    const interval = setInterval(() => {
      // Update with new mock data to simulate live updates
      const mockRaces = generateMockElectionData();
      updateElectionData({
        races: mockRaces,
        lastUpdated: new Date().toISOString(),
      });
    }, scrapeConfig.refreshInterval);
    
    return () => clearInterval(interval);
  }, [scrapeConfig.isRunning, scrapeConfig.refreshInterval, updateElectionData]);
  
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
          <HistoricalTrends />
          
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