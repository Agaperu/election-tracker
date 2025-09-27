import React from 'react';
import { Filter, Search } from 'lucide-react';
import useElectionStore from '../store/electionStore';

const FiltersPanel = () => {
  const { filters, updateFilters } = useElectionStore();

  // Get all US states plus focus on Texas
  const states = [
    'Texas', 'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const raceTypes = [
    { value: 'presidential', label: 'Presidential' },
    { value: 'senate', label: 'Senate' },
    { value: 'house', label: 'House' },
    { value: 'governor', label: 'Governor' },
    { value: 'mayor', label: 'Mayor' },
    { value: 'judicial', label: 'Judicial' },
    { value: 'sheriff', label: 'Sheriff' },
    { value: 'district-attorney', label: 'District Attorney' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <Filter className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold">Filters</h2>
      </div>
      
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium mb-1">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-500" />
            </div>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              placeholder="Candidate, race, county..."
              className="w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-sm"
            />
          </div>
        </div>
        
        {/* State filter */}
        <div>
          <label htmlFor="state-filter" className="block text-sm font-medium mb-1">
            State
          </label>
          <select
            id="state-filter"
            value={filters.state || ''}
            onChange={(e) => updateFilters({ state: e.target.value || null })}
            className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-sm"
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        
        {/* Race type filter */}
        <div>
          <label htmlFor="race-type-filter" className="block text-sm font-medium mb-1">
            Race Type
          </label>
          <select
            id="race-type-filter"
            value={filters.raceType || ''}
            onChange={(e) => updateFilters({ raceType: e.target.value || null })}
            className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-sm"
          >
            <option value="">All Race Types</option>
            {raceTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        
        {/* Reset filters button */}
        <button
          onClick={() => updateFilters({ state: null, raceType: null, search: '' })}
          className="w-full btn btn-secondary text-sm"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default FiltersPanel;