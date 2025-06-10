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

// Source configurations with detailed selectors for Dallas County
const sources = [
  {
    id: 'dallas-county',
    name: 'Dallas County Elections',
    baseUrl: 'https://results.enr.clarityelections.com/TX/Dallas/123851/web.345435',
    apiUrl: 'https://results.enr.clarityelections.com/TX/Dallas/123851/json/en/summary.json',
    selectors: {
      raceContainer: '.contest',
      candidateRow: '.candidate',
      candidateName: '.candidate-name',
      candidateParty: '.party',
      voteCount: '.votes',
      percentage: '.percentage',
      precincts: '.precincts-reporting',
    },
    transformData: async (data) => {
      // Handle JSON API response from Clarity Elections
      if (data.Contests) {
        return data.Contests.map(contest => {
          const race = {
            id: `dallas-${contest.C}`,
            title: contest.N || 'Unknown Contest',
            state: 'Texas',
            county: 'Dallas',
            type: determineRaceType(contest.N),
            candidates: [],
            precincts: {
              reporting: contest.PR || 0,
              total: contest.PT || 0,
              percentage: contest.PT > 0 ? Math.round((contest.PR / contest.PT) * 100) : 0,
            },
            lastUpdated: new Date().toISOString(),
            called: false,
            isLive: true,
          };

          // Process candidates
          if (contest.CH) {
            contest.CH.forEach(candidate => {
              race.candidates.push({
                id: `${race.id}-${candidate.CID}`,
                name: candidate.N || 'Unknown Candidate',
                party: normalizeParty(candidate.P || ''),
                votes: parseInt(candidate.V || 0),
                percentage: parseFloat(candidate.VP || 0),
                incumbent: (candidate.N || '').includes('(I)'),
              });
            });
          }

          // Determine if race is called
          race.called = determineIfCalled(race);
          if (race.called && race.candidates.length > 0) {
            const winner = race.candidates.reduce((prev, current) => 
              prev.votes > current.votes ? prev : current
            );
            race.winner = winner.id;
          }

          return race;
        });
      }
      return [];
    },
  },
];

// Axios instance with retry logic
const createAxiosInstance = (source) => {
  const instance = axios.create({
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/html, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
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
    
    // Try to get JSON data first (preferred for Clarity Elections)
    let races = [];
    
    try {
      console.log(`Attempting to fetch JSON data from: ${source.apiUrl}`);
      const jsonResponse = await axios.get(source.apiUrl);
      races = await source.transformData(jsonResponse.data);
      console.log(`Successfully parsed ${races.length} races from JSON API`);
    } catch (jsonError) {
      console.log('JSON API failed, trying HTML scraping...');
      
      // Fallback to HTML scraping
      const htmlResponse = await axios.get(source.baseUrl);
      const $ = cheerio.load(htmlResponse.data);
      
      // Try to extract data from HTML
      const htmlRaces = [];
      $('.contest, .race-container, [data-contest]').each((_, element) => {
        try {
          const $contest = $(element);
          const contestName = $contest.find('.contest-name, .race-title, h3, h4').first().text().trim();
          
          if (contestName) {
            const race = {
              id: `dallas-html-${Date.now()}-${Math.random()}`,
              title: contestName,
              state: 'Texas',
              county: 'Dallas',
              type: determineRaceType(contestName),
              candidates: [],
              precincts: {
                reporting: 0,
                total: 0,
                percentage: 0,
              },
              lastUpdated: new Date().toISOString(),
              called: false,
              isLive: true,
            };

            // Extract candidates
            $contest.find('.candidate, .candidate-row, tr').each((_, candidateEl) => {
              const $candidate = $(candidateEl);
              const name = $candidate.find('.candidate-name, .name, td:first-child').text().trim();
              const votes = $candidate.find('.votes, .vote-count, td:nth-child(2)').text().replace(/[^\d]/g, '');
              const percentage = $candidate.find('.percentage, .percent, td:nth-child(3)').text().replace(/[^\d.]/g, '');
              
              if (name && votes) {
                race.candidates.push({
                  id: `${race.id}-${name.replace(/\s+/g, '-').toLowerCase()}`,
                  name: name,
                  party: 'other', // Default since party info might not be available in HTML
                  votes: parseInt(votes) || 0,
                  percentage: parseFloat(percentage) || 0,
                  incumbent: name.includes('(I)'),
                });
              }
            });

            if (race.candidates.length > 0) {
              htmlRaces.push(race);
            }
          }
        } catch (error) {
          console.error(`Error parsing HTML race data:`, error);
        }
      });
      
      races = htmlRaces;
      console.log(`Parsed ${races.length} races from HTML`);
    }

    // Save raw data for debugging
    const timestamp = Date.now();
    const rawDataPath = path.join(DATA_PATH, `${source.id}_raw_${timestamp}.json`);
    
    // Save processed data
    const processedDataPath = path.join(DATA_PATH, `${source.id}_${timestamp}.json`);
    fs.writeFileSync(processedDataPath, JSON.stringify(races, null, 2));
    
    console.log(`Successfully scraped ${races.length} races from ${source.name}`);
    return races;

  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error.message);
    
    // Log detailed error information
    const errorLog = `${new Date().toISOString()} - ${source.name}: ${error.message}\n${error.stack}\n\n`;
    fs.appendFileSync(path.join(DATA_PATH, 'scraper_errors.log'), errorLog);
    
    return [];
  }
}

// Data normalization function
function normalizeData(races) {
  return races.map(race => ({
    ...race,
    id: race.id || `${race.state}-${race.title}`.toLowerCase().replace(/\s+/g, '-'),
    candidates: race.candidates.map(candidate => ({
      ...candidate,
      party: normalizeParty(candidate.party),
    })),
    lastUpdated: new Date().toISOString(),
  }));
}

// Helper functions
function determineRaceType(title) {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('president')) return 'presidential';
  if (titleLower.includes('senate')) return 'senate';
  if (titleLower.includes('house') || titleLower.includes('congress')) return 'house';
  if (titleLower.includes('governor')) return 'governor';
  if (titleLower.includes('mayor')) return 'mayor';
  if (titleLower.includes('judge')) return 'judicial';
  if (titleLower.includes('sheriff')) return 'sheriff';
  if (titleLower.includes('district attorney') || titleLower.includes('da ')) return 'district-attorney';
  return 'other';
}

function normalizeParty(party) {
  if (!party) return 'other';
  const partyLower = party.toLowerCase();
  if (partyLower.includes('dem') || partyLower.includes('democratic')) return 'democrat';
  if (partyLower.includes('rep') || partyLower.includes('republican')) return 'republican';
  if (partyLower.includes('lib') || partyLower.includes('libertarian')) return 'libertarian';
  if (partyLower.includes('green')) return 'green';
  return 'other';
}

function determineIfCalled(race) {
  if (!race.candidates || race.candidates.length < 2) return false;
  
  const topCandidates = [...race.candidates]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 2);
  
  if (topCandidates.length < 2) return false;
  
  const [leader, runner] = topCandidates;
  const margin = leader.percentage - runner.percentage;
  const precinctReporting = race.precincts.percentage;
  
  return precinctReporting > 95 || (precinctReporting > 75 && margin > 10);
}

// Main execution function
async function main() {
  console.log('Starting Dallas County election data scraper...');
  const rateLimiter = new RateLimiter(RATE_LIMIT.requestsPerMinute);
  
  try {
    // Scrape all sources
    const results = await Promise.all(
      sources.map(source => scrapeSource(source, rateLimiter))
    );

    // Process and combine results
    const validResults = results.filter(result => result && result.length > 0);
    
    if (validResults.length > 0) {
      const allRaces = validResults.flat();
      const normalizedData = normalizeData(allRaces);
      
      // Save combined data
      const combinedPath = path.join(DATA_PATH, `combined_${Date.now()}.json`);
      fs.writeFileSync(combinedPath, JSON.stringify(normalizedData, null, 2));
      
      console.log(`Successfully scraped data: ${normalizedData.length} races total`);
      
      // Display summary
      console.log('\n=== SCRAPING SUMMARY ===');
      console.log(`Total races found: ${normalizedData.length}`);
      
      const raceTypes = normalizedData.reduce((acc, race) => {
        acc[race.type] = (acc[race.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Race types:');
      Object.entries(raceTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      return normalizedData;
    } else {
      console.log('No valid data retrieved from any source');
      return [];
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