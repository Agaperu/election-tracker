import { create } from 'zustand';
import { ElectionData, Race, ScrapeConfig, SettingsState } from '../types';

interface ElectionStore {
  // Election data
  electionData: ElectionData;
  updateElectionData: (data: ElectionData) => void;
  updateRace: (race: Race) => void;

  // Scraper config
  scrapeConfig: ScrapeConfig;
  updateScrapeConfig: (config: Partial<ScrapeConfig>) => void;
  toggleSource: (sourceId: string) => void;
  setRefreshInterval: (interval: number) => void;
  toggleScraping: () => void;

  // UI state
  selectedRace: string | null;
  setSelectedRace: (raceId: string | null) => void;
  
  // Settings
  settings: SettingsState;
  updateSettings: (settings: Partial<SettingsState>) => void;
  toggleDarkMode: () => void;
  
  // Filters
  filters: {
    state: string | null;
    raceType: string | null;
    search: string;
  };
  updateFilters: (filters: Partial<ElectionStore['filters']>) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// Initial scrape configuration - updated for Dallas County
const initialScrapeConfig: ScrapeConfig = {
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
const initialSettings: SettingsState = {
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  notifications: true,
  focusedStates: ['Texas'],
  focusedRaces: [],
};

// Initial mock election data
const initialElectionData: ElectionData = {
  races: [],
  lastUpdated: new Date().toISOString(),
};

export const useElectionStore = create<ElectionStore>((set) => ({
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