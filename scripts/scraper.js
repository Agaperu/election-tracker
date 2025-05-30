import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import cheerio from 'cheerio';
import { setTimeout } from 'timers/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_PATH)) {
  fs.mkdirSync(DATA_PATH, { recursive: true });
}

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 10,
  minDelayBetweenRequests: 1000, // 1 second
};

// Source configurations with detailed selectors
const sources = [
  {
    id: 'ap',
    name: 'Associated Press',
    baseUrl: 'https://apnews.com/hub/election-results',
    selectors: {
      raceContainer: '.race-container',
      candidateRow: '.candidate-row',
      candidateName: '.candidate-name',
      candidateParty: '.party-affiliation',
      voteCount: '.vote-count',
      precincts: '.precinct-reporting',
    },
    transformData: ($, element) => {
      // AP-specific data transformation
      const race = {
        title: $(element).find('.race-title').text().trim(),
        state: $(element).find('.state-name').text().trim(),
        candidates: [],
        precincts: {
          reporting: 0,
          total: 0,
          percentage: 0,
        },
      };

      $(element).find('.candidate-row').each((_, candidateEl) => {
        const $candidate = $(candidateEl);
        race.candidates.push({
          name: $candidate.find('.candidate-name').text().trim(),
          party: $candidate.find('.party-affiliation').text().trim().toLowerCase(),
          votes: parseInt($candidate.find('.vote-count').text().replace(/,/g, ''), 10),
          percentage: parseFloat($candidate.find('.vote-percentage').text()),
        });
      });

      const precinctText = $(element).find('.precinct-reporting').text();
      const [reporting, total] = precinctText.match(/\d+/g).map(Number);
      race.precincts = {
        reporting,
        total,
        percentage: (reporting / total) * 100,
      };

      return race;
    },
  },
  {
    id: 'nyt',
    name: 'New York Times',
    baseUrl: 'https://www.nytimes.com/interactive/2024/us/elections/results',
    selectors: {
      raceContainer: '.nyt-race',
      candidateRow: '.candidate-row',
      candidateName: '.name',
      candidateParty: '.party',
      voteCount: '.votes',
      precincts: '.precincts',
    },
    transformData: ($, element) => {
      // NYT-specific data transformation
      // Similar structure to AP but with NYT-specific selectors
      return {/* NYT race data structure */};
    },
  },
];

// Axios instance with retry logic
const createAxiosInstance = (source) => {
  const instance = axios.create({
    baseURL: source.baseUrl,
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  instance.interceptors.response.use(null, async (error) => {
    if (error.config && error.config.__retryCount < 3) {
      error.config.__retryCount = (error.config.__retryCount || 0) + 1;
      await setTimeout(error.config.__retryCount * 2000);
      return instance(error.config);
    }
    return Promise.reject(error);
  });

  return instance;
};

// Rate limiter implementation
class RateLimiter {
  constructor(requestsPerMinute) {
    this.requestsPerMinute = requestsPerMinute;
    this.requests = [];
  }

  async acquireToken() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < 60000);
    
    if (this.requests.length >= this.requestsPerMinute) {
      const oldestRequest = this.requests[0];
      const waitTime = 60000 - (now - oldestRequest);
      await setTimeout(waitTime);
    }
    
    this.requests.push(now);
  }
}

// Main scraping function
async function scrapeSource(source, rateLimiter) {
  console.log(`Scraping ${source.name}...`);
  const axios = createAxiosInstance(source);
  
  try {
    await rateLimiter.acquireToken();
    const response = await axios.get('');
    const $ = cheerio.load(response.data);
    
    const races = [];
    $(source.selectors.raceContainer).each((_, element) => {
      try {
        const raceData = source.transformData($, element);
        races.push(raceData);
      } catch (error) {
        console.error(`Error parsing race data from ${source.name}:`, error);
      }
    });

    // Save raw data for debugging
    const rawDataPath = path.join(DATA_PATH, `${source.id}_raw_${Date.now()}.html`);
    fs.writeFileSync(rawDataPath, response.data);

    // Save processed data
    const processedDataPath = path.join(DATA_PATH, `${source.id}_${Date.now()}.json`);
    fs.writeFileSync(processedDataPath, JSON.stringify(races, null, 2));

    return races;
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error);
    // Log detailed error information
    fs.appendFileSync(
      path.join(DATA_PATH, 'scraper_errors.log'),
      `${new Date().toISOString()} - ${source.name}: ${error.message}\n${error.stack}\n\n`
    );
    return null;
  }
}

// Data normalization function
function normalizeData(races) {
  return races.map(race => ({
    id: `${race.state}-${race.title}`.toLowerCase().replace(/\s+/g, '-'),
    title: race.title,
    state: race.state,
    type: determineRaceType(race.title),
    candidates: race.candidates.map(candidate => ({
      id: `${candidate.name}-${candidate.party}`.toLowerCase().replace(/\s+/g, '-'),
      name: candidate.name,
      party: normalizeParty(candidate.party),
      votes: candidate.votes,
      percentage: candidate.percentage,
      incumbent: determineIncumbency(candidate),
    })),
    precincts: race.precincts,
    lastUpdated: new Date().toISOString(),
    called: determineIfCalled(race),
    isLive: true,
  }));
}

// Helper functions
function determineRaceType(title) {
  if (title.includes('President')) return 'presidential';
  if (title.includes('Senate')) return 'senate';
  if (title.includes('House')) return 'house';
  if (title.includes('Governor')) return 'governor';
  return 'other';
}

function normalizeParty(party) {
  party = party.toLowerCase();
  if (party.includes('dem')) return 'democrat';
  if (party.includes('rep')) return 'republican';
  return 'other';
}

function determineIncumbency(candidate) {
  return candidate.name.includes('(I)') || candidate.name.includes('Incumbent');
}

function determineIfCalled(race) {
  const topCandidates = [...race.candidates]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 2);
  
  if (topCandidates.length < 2) return false;
  
  const [leader, runner] = topCandidates;
  const margin = leader.percentage - runner.percentage;
  const precinctReporting = race.precincts.percentage;
  
  return precinctReporting > 98 || (precinctReporting > 80 && margin > 15);
}

// Main execution function
async function main() {
  console.log('Starting election data scraper...');
  const rateLimiter = new RateLimiter(RATE_LIMIT.requestsPerMinute);
  
  try {
    // Scrape all sources
    const results = await Promise.all(
      sources.map(source => scrapeSource(source, rateLimiter))
    );

    // Process and combine results
    const validResults = results.filter(Boolean);
    if (validResults.length > 0) {
      const normalizedData = validResults.flatMap(normalizeData);
      
      // Save combined data
      const combinedPath = path.join(DATA_PATH, `combined_${Date.now()}.json`);
      fs.writeFileSync(combinedPath, JSON.stringify(normalizedData, null, 2));
      
      console.log(`Successfully scraped data from ${validResults.length} sources`);
      return normalizedData;
    } else {
      throw new Error('No valid data retrieved from any source');
    }
  } catch (error) {
    console.error('Critical error in scraper:', error);
    process.exit(1);
  }
}

// Run the scraper
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { main as scrape, sources, normalizeData };