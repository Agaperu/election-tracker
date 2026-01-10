# Election Tracker

## Development

1. Install dependencies: `npm install`
2. Start the backend scraper server: `npm run server`
3. In another terminal, start the Vite dev server: `npm run dev`

The dashboard communicates with the Node server via `/api` endpoints (proxied in development) and receives live updates through Server-Sent Events. Use the **Start Scraping** button in the UI to begin polling the data sources; stop it anytime to pause updates.

### Data Sources

- Dallas County Elections (Clarity Elections JSON + HTML backup)
- Fox News Elections (https://www.foxnews.com/elections/2024/general-results)
