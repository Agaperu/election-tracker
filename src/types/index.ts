export interface Candidate {
  id: string;
  name: string;
  party: 'democrat' | 'republican' | 'other';
  votes: number;
  percentage: number;
  incumbent: boolean;
}

export interface Race {
  id: string;
  title: string;
  state: string;
  type: 'presidential' | 'senate' | 'house' | 'governor' | 'other';
  candidates: Candidate[];
  precincts: {
    total: number;
    reporting: number;
    percentage: number;
  };
  lastUpdated: string;
  called: boolean;
  winner?: string;
  isLive: boolean;
}

export interface ElectionSource {
  id: string;
  name: string;
  url: string;
  logo?: string;
  enabled: boolean;
  lastScrape?: string;
  scrapingInterval: number; // in milliseconds
}

export interface ScrapeConfig {
  sources: ElectionSource[];
  refreshInterval: number; // in milliseconds
  isRunning: boolean;
  lastScrapeTime?: string;
}

export interface ElectionData {
  races: Race[];
  lastUpdated: string;
}

export interface SettingsState {
  darkMode: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  notifications: boolean;
  focusedStates: string[];
  focusedRaces: string[];
}