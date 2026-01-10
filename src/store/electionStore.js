import { create } from 'zustand';
import {
  startScraping as startScrapingRequest,
  stopScraping as stopScrapingRequest,
  toggleSource as toggleSourceRequest,
  updateRefreshInterval as updateRefreshIntervalRequest,
} from '../utils/api';

// Initial scrape configuration - updated for Dallas County
const initialScrapeConfig = {
  sources: [
    {
      id: 'dallas-county',
      name: 'Dallas County Elections',
      url: 'https://results.enr.clarityelections.com/TX/Dallas/123851/web.345435',
      enabled: true,
      scrapingInterval: 30000, // 30 seconds for live election data
    },
    {
      id: 'civicapi',
      name: 'CivicAPI Elections',
      url: 'https://www.civicapi.org/api',
      enabled: true,
      scrapingInterval: 45000,
    },
    {
      id: 'fox-news',
      name: 'Fox News Elections',
      url: 'https://www.foxnews.com/elections/2024/general-results',
      enabled: true,
      scrapingInterval: 60000,
    },
    {
      id: 'ap',
      name: 'Associated Press',
      url: 'https://apnews.com/hub/election-results',
      enabled: false, // Disabled by default, focus on Dallas County
      scrapingInterval: 60000,
    },
    {
      id: 'nyt',
      name: 'New York Times',
      url: 'https://www.nytimes.com/elections',
      enabled: false,
      scrapingInterval: 60000,
    },
    {
      id: 'cnn',
      name: 'CNN',
      url: 'https://www.cnn.com/election/results',
      enabled: false,
      scrapingInterval: 60000,
    },
  ],
  refreshInterval: 30000, // 30 seconds for live updates
  isRunning: false,
};

// Initial settings
const initialSettings = {
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  notifications: true,
  focusedStates: ['Texas'],
  focusedRaces: [],
};

// Initial mock election data
const initialElectionData = {
  races: [],
  lastUpdated: null,
};

export const useElectionStore = create((set, get) => ({
  // Election data
  electionData: initialElectionData,
  updateElectionData: (data) => set({ electionData: data }),
  updateRace: (race) =>
    set((state) => ({
      electionData: {
        ...state.electionData,
        races: state.electionData.races.map((r) => (r.id === race.id ? race : r)),
        lastUpdated: new Date().toISOString(),
      },
    })),

  // Scraper config
  scrapeConfig: initialScrapeConfig,
  updateScrapeConfig: (config) => set({ scrapeConfig: { ...get().scrapeConfig, ...config } }),
  toggleSource: async (sourceId) => {
    try {
      const updatedConfig = await toggleSourceRequest(sourceId);
      set({ scrapeConfig: updatedConfig });
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  },
  setRefreshInterval: async (interval) => {
    try {
      const updatedConfig = await updateRefreshIntervalRequest(interval);
      set({ scrapeConfig: updatedConfig });
    } catch (error) {
      console.error('Failed to update refresh interval:', error);
    }
  },
  toggleScraping: async () => {
    try {
      const { scrapeConfig } = get();
      const updatedConfig = scrapeConfig.isRunning
        ? await stopScrapingRequest()
        : await startScrapingRequest();
      set({ scrapeConfig: updatedConfig });
    } catch (error) {
      console.error('Failed to toggle scraping state:', error);
    }
  },

  // UI state
  selectedRace: null,
  setSelectedRace: (raceId) => set({ selectedRace: raceId }),

  // Settings
  settings: initialSettings,
  updateSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),
  toggleDarkMode: () =>
    set((state) => ({
      settings: { ...state.settings, darkMode: !state.settings.darkMode },
    })),

  // Filters
  filters: {
    state: null,
    raceType: null,
    search: '',
  },
  updateFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),

  // Loading state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  // Error state for API interactions
  error: null,
  setError: (message) => set({ error: message }),
}));

export default useElectionStore;
