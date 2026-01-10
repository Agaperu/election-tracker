import express from 'express';
import cors from 'cors';
import { scrape, sources as scraperSources } from '../scripts/scraper.js';

const PORT = process.env.PORT || 4000;
const API_PREFIX = '/api';

const app = express();
app.use(cors());
app.use(express.json());

const initialSources = scraperSources.map((source) => ({
  id: source.id,
  name: source.name,
  url: source.baseUrl || source.url,
  enabled: source.enabled !== false,
  lastScrape: null,
}));

const state = {
  electionData: {
    races: [],
    lastUpdated: null,
  },
  scrapeConfig: {
    sources: initialSources,
    refreshInterval: Number(process.env.SCRAPE_INTERVAL_MS) || 30000,
    isRunning: false,
    lastScrapeTime: null,
    lastError: null,
  },
};

let scrapeTimer = null;
let isScraping = false;
const sseClients = new Set();

function getActiveSourceDefinitions() {
  const enabledIds = new Set(
    state.scrapeConfig.sources.filter((source) => source.enabled).map((source) => source.id)
  );
  return scraperSources.filter((source) => enabledIds.has(source.id));
}

function broadcast(event, payload) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach((client) => client.write(message));
}

async function runScrape() {
  if (isScraping) return;
  const activeSources = getActiveSourceDefinitions();
  if (activeSources.length === 0) {
    console.warn('No enabled data sources. Skipping scrape run.');
    return;
  }

  isScraping = true;
  try {
    const races = await scrape(activeSources);
    const timestamp = new Date().toISOString();

    if (Array.isArray(races) && races.length > 0) {
      state.electionData = {
        races,
        lastUpdated: timestamp,
      };
    } else {
      state.electionData = {
        ...state.electionData,
        lastUpdated: timestamp,
      };
    }

    state.scrapeConfig.lastScrapeTime = timestamp;
    state.scrapeConfig.lastError = null;
    state.scrapeConfig.sources = state.scrapeConfig.sources.map((source) =>
      activeSources.some((active) => active.id === source.id)
        ? { ...source, lastScrape: timestamp }
        : source
    );

    broadcast('results', state.electionData);
    broadcast('config', state.scrapeConfig);
  } catch (error) {
    console.error('Scrape run failed:', error);
    state.scrapeConfig.lastError = error.message || 'Unknown scrape error';
    broadcast('error', { message: state.scrapeConfig.lastError });
  } finally {
    isScraping = false;
  }
}

function startScraping() {
  if (scrapeTimer) return;
  state.scrapeConfig.isRunning = true;
  runScrape();
  scrapeTimer = setInterval(runScrape, state.scrapeConfig.refreshInterval);
  broadcast('config', state.scrapeConfig);
}

function stopScraping() {
  if (scrapeTimer) {
    clearInterval(scrapeTimer);
    scrapeTimer = null;
  }
  state.scrapeConfig.isRunning = false;
  broadcast('config', state.scrapeConfig);
}

function setRefreshInterval(interval) {
  state.scrapeConfig.refreshInterval = interval;
  if (state.scrapeConfig.isRunning) {
    if (scrapeTimer) {
      clearInterval(scrapeTimer);
    }
    scrapeTimer = setInterval(runScrape, interval);
  }
  broadcast('config', state.scrapeConfig);
}

app.get(`${API_PREFIX}/election-results`, (req, res) => {
  res.json(state.electionData);
});

app.get(`${API_PREFIX}/config`, (req, res) => {
  res.json(state.scrapeConfig);
});

app.post(`${API_PREFIX}/scrape/start`, (req, res) => {
  startScraping();
  res.json(state.scrapeConfig);
});

app.post(`${API_PREFIX}/scrape/stop`, (req, res) => {
  stopScraping();
  res.json(state.scrapeConfig);
});

app.post(`${API_PREFIX}/config/refresh-interval`, (req, res) => {
  const { refreshInterval } = req.body || {};
  const parsed = Number(refreshInterval);
  if (Number.isNaN(parsed) || parsed < 5000) {
    return res.status(400).json({ message: 'refreshInterval must be >= 5000ms' });
  }
  setRefreshInterval(parsed);
  res.json(state.scrapeConfig);
});

app.post(`${API_PREFIX}/config/sources/:id/toggle`, (req, res) => {
  const { id } = req.params;
  let updated = false;
  state.scrapeConfig.sources = state.scrapeConfig.sources.map((source) => {
    if (source.id === id) {
      updated = true;
      return { ...source, enabled: !source.enabled };
    }
    return source;
  });

  if (!updated) {
    return res.status(404).json({ message: `Source ${id} not found` });
  }

  broadcast('config', state.scrapeConfig);
  res.json(state.scrapeConfig);
});

app.get(`${API_PREFIX}/election-results/stream`, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`event: results\ndata: ${JSON.stringify(state.electionData)}\n\n`);
  res.write(`event: config\ndata: ${JSON.stringify(state.scrapeConfig)}\n\n`);

  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
    res.end();
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Election tracker server listening on port ${PORT}`);
});
