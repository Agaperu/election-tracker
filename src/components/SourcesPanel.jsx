import React from 'react';
import { Database, RefreshCw } from 'lucide-react';
import useElectionStore from '../store/electionStore';
import { formatDistanceToNow } from 'date-fns';

const SourcesPanel = () => {
  const { scrapeConfig, toggleSource, setRefreshInterval } = useElectionStore();

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Database className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold">Data Sources</h2>
      </div>
      
      <div className="space-y-3">
        {scrapeConfig.sources.map((source) => (
          <div key={source.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`source-${source.id}`}
                checked={source.enabled}
                onChange={() => toggleSource(source.id)}
                className="h-4 w-4 text-primary-600 rounded border-neutral-300 dark:border-neutral-600"
              />
              <label htmlFor={`source-${source.id}`} className="text-sm">
                {source.name}
              </label>
            </div>
            
            {source.lastScrape && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDistanceToNow(new Date(source.lastScrape), { addSuffix: true })}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-2 mb-2">
          <RefreshCw className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          <h3 className="text-sm font-medium">Refresh Interval</h3>
        </div>
        
        <select
          value={scrapeConfig.refreshInterval}
          onChange={(e) => setRefreshInterval(Number(e.target.value))}
          className="w-full p-2 text-sm bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md"
        >
          <option value={15000}>15 seconds</option>
          <option value={30000}>30 seconds</option>
          <option value={60000}>1 minute</option>
          <option value={300000}>5 minutes</option>
          <option value={600000}>10 minutes</option>
        </select>
      </div>
    </div>
  );
};

export default SourcesPanel;