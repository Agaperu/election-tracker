import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import useElectionStore from '../store/electionStore';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const years = [2000, 2004, 2008, 2012, 2016, 2020];
const electionTypes = [
  { value: 'presidential', label: 'Presidential' },
  { value: 'senate', label: 'Senate' },
  { value: 'house', label: 'House' },
  { value: 'governor', label: 'Governor' },
];

interface HistoricalData {
  year: number;
  state: string;
  winner: 'democrat' | 'republican';
  margin: number;
}

const HistoricalTrends: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [selectedType, setSelectedType] = useState('presidential');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
  
  // Mock historical data - in production, this would come from an API
  const historicalData: HistoricalData[] = years.flatMap(year => 
    ['Alabama', 'Alaska', /* ... other states ... */].map(state => ({
      year,
      state,
      winner: Math.random() > 0.5 ? 'democrat' : 'republican',
      margin: Math.random() * 30,
    }))
  );

  const getStateColor = (stateName: string) => {
    const data = historicalData.find(d => d.year === selectedYear && d.state === stateName);
    if (!data) return "#e5e7eb";
    
    const intensity = Math.min(Math.max(data.margin / 20, 0.2), 1);
    return data.winner === 'democrat'
      ? `rgba(37, 99, 235, ${intensity})`
      : `rgba(220, 38, 38, ${intensity})`;
  };

  const getStateHistory = (stateName: string) => {
    return historicalData
      .filter(d => d.state === stateName)
      .sort((a, b) => a.year - b.year);
  };

  const handleMouseMove = (e: React.MouseEvent, stateName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const stateHistory = getStateHistory(stateName);
    const content = `${stateName}\n${stateHistory.map(d => 
      `${d.year}: ${d.winner === 'democrat' ? 'D' : 'R'} +${d.margin.toFixed(1)}%`
    ).join('\n')}`;
    
    setTooltip({ content, x, y });
  };

  return (
    <div className="card mt-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold">Historical Trends</h2>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="mt-4 space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Election Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700"
              >
                {electionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">State</label>
              <select
                value={selectedState || ''}
                onChange={(e) => setSelectedState(e.target.value || null)}
                className="w-full p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700"
              >
                <option value="">All States</option>
                {historicalData
                  .filter(d => d.year === selectedYear)
                  .map(d => d.state)
                  .sort()
                  .map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Year: {selectedYear}</label>
            <input
              type="range"
              min={Math.min(...years)}
              max={Math.max(...years)}
              step={4}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700"
            />
            <div className="flex justify-between text-sm text-neutral-500">
              {years.map(year => (
                <span key={year}>{year}</span>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="relative w-full aspect-[4/3]">
            {tooltip && (
              <div 
                className="absolute z-10 pointer-events-none bg-white dark:bg-neutral-800 rounded-md shadow-lg p-2 text-sm"
                style={{
                  left: tooltip.x,
                  top: tooltip.y - 10,
                  transform: 'translate(-50%, -100%)',
                  whiteSpace: 'pre-line'
                }}
              >
                {tooltip.content}
              </div>
            )}

            <ComposableMap projection="geoAlbersUsa">
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const stateName = geo.properties.name;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getStateColor(stateName)}
                          stroke="#ffffff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: {
                              fill: "#93c5fd",
                              outline: "none",
                              cursor: "pointer"
                            },
                            pressed: { outline: "none" }
                          }}
                          onMouseMove={(evt) => handleMouseMove(evt, stateName)}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Historical Summary</h3>
            <div className="space-y-2">
              {selectedState ? (
                // State-specific summary
                <div>
                  <h4 className="font-medium">{selectedState} Voting History</h4>
                  <div className="mt-2 space-y-1">
                    {getStateHistory(selectedState).map(data => (
                      <div key={data.year} className="flex justify-between">
                        <span>{data.year}</span>
                        <span className={data.winner === 'democrat' ? 'text-democrat-500' : 'text-republican-500'}>
                          {data.winner === 'democrat' ? 'Democratic' : 'Republican'} +{data.margin.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // National summary
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Select a state to view detailed historical voting patterns.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Democratic Strongholds</h4>
                      <ul className="text-sm space-y-1">
                        {historicalData
                          .filter(d => d.year === selectedYear && d.winner === 'democrat')
                          .sort((a, b) => b.margin - a.margin)
                          .slice(0, 5)
                          .map(d => (
                            <li key={d.state}>{d.state} (+{d.margin.toFixed(1)}%)</li>
                          ))
                        }
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Republican Strongholds</h4>
                      <ul className="text-sm space-y-1">
                        {historicalData
                          .filter(d => d.year === selectedYear && d.winner === 'republican')
                          .sort((a, b) => b.margin - a.margin)
                          .slice(0, 5)
                          .map(d => (
                            <li key={d.state}>{d.state} (+{d.margin.toFixed(1)}%)</li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricalTrends;