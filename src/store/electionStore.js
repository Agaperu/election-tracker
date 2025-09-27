import { create } from 'zustand';

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
  lastUpdated: new Date().toISOString(),
};

export const useElectionStore = create((set) => ({
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
  updateScrapeConfig: (config) =>
    set((state) => ({ scrapeConfig: { ...state.scrapeConfig, ...config } })),
  toggleSource: (sourceId) =>
    set((state) => ({
      scrapeConfig: {
        ...state.scrapeConfig,
        sources: state.scrapeConfig.sources.map((source) =>
          source.id === sourceId ? { ...source, enabled: !source.enabled } : source
        ),
      },
    })),
  setRefreshInterval: (interval) =>
    set((state) => ({
      scrapeConfig: { ...state.scrapeConfig, refreshInterval: interval },
    })),
  toggleScraping: () =>
    set((state) => ({
      scrapeConfig: {
        ...state.scrapeConfig,
        isRunning: !state.scrapeConfig.isRunning,
        lastScrapeTime: state.scrapeConfig.isRunning ? state.scrapeConfig.lastScrapeTime : new Date().toISOString(),
      },
    })),

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
}));

export default useElectionStore;