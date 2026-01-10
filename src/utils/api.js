const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch (error) {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchElectionResults() {
  return request('/election-results');
}

export function fetchScrapeConfig() {
  return request('/config');
}

export function startScraping() {
  return request('/scrape/start', { method: 'POST' });
}

export function stopScraping() {
  return request('/scrape/stop', { method: 'POST' });
}

export function updateRefreshInterval(refreshInterval) {
  return request('/config/refresh-interval', {
    method: 'POST',
    body: JSON.stringify({ refreshInterval }),
  });
}

export function toggleSource(sourceId) {
  return request(`/config/sources/${sourceId}/toggle`, { method: 'POST' });
}

export function connectToResultsStream({ onResults, onConfig, onError }) {
  if (typeof window === 'undefined' || !window.EventSource) {
    return () => {};
  }

  const eventSource = new EventSource(`${API_BASE_URL}/election-results/stream`);

  const safeParse = (payload) => {
    try {
      return JSON.parse(payload);
    } catch (error) {
      console.error('Failed to parse SSE payload:', payload);
      return null;
    }
  };

  eventSource.addEventListener('results', (event) => {
    const data = safeParse(event.data);
    if (data && onResults) {
      onResults(data);
    }
  });

  eventSource.addEventListener('config', (event) => {
    const data = safeParse(event.data);
    if (data && onConfig) {
      onConfig(data);
    }
  });

  eventSource.addEventListener('error', (event) => {
    if (onError) {
      onError(event);
    }
  });

  return () => {
    eventSource.close();
  };
}
