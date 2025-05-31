import React, { useState, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useElectionStore from '../store/electionStore';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const USAMap: React.FC = () => {
  const { electionData, filters, setSelectedRace } = useElectionStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Group races by state and calculate vote percentages
  const stateResults = electionData.races.reduce((acc, race) => {
    if (!acc[race.state]) {
      acc[race.state] = {
        democratVotes: 0,
        republicanVotes: 0,
        totalVotes: 0,
        margin: 0,
        leader: null as 'democrat' | 'republican' | null
      };
    }
    
    race.candidates.forEach(candidate => {
      if (candidate.party === 'democrat') {
        acc[race.state].democratVotes += candidate.votes;
      } else if (candidate.party === 'republican') {
        acc[race.state].republicanVotes += candidate.votes;
      }
    });
    
    acc[race.state].totalVotes = acc[race.state].democratVotes + acc[race.state].republicanVotes;
    
    if (acc[race.state].totalVotes > 0) {
      const demPercent = (acc[race.state].democratVotes / acc[race.state].totalVotes) * 100;
      const repPercent = (acc[race.state].republicanVotes / acc[race.state].totalVotes) * 100;
      acc[race.state].margin = Math.abs(demPercent - repPercent);
      acc[race.state].leader = demPercent > repPercent ? 'democrat' : 'republican';
    }
    
    return acc;
  }, {} as Record<string, {
    democratVotes: number;
    republicanVotes: number;
    totalVotes: number;
    margin: number;
    leader: 'democrat' | 'republican' | null;
  }>);

  const getStateColor = (stateName: string) => {
    const results = stateResults[stateName];
    if (!results || results.totalVotes === 0) return "#e5e7eb";
    
    const { margin, leader } = results;
    const intensity = Math.min(Math.max(margin / 20, 0.2), 1);
    
    return leader === 'democrat'
      ? `rgba(37, 99, 235, ${intensity})`
      : `rgba(220, 38, 38, ${intensity})`;
  };

  const getTooltipContent = (stateName: string) => {
    const results = stateResults[stateName];
    if (!results || results.totalVotes === 0) return `${stateName}\nNo data available`;
    
    const { margin, leader, democratVotes, republicanVotes } = results;
    const demPercent = (democratVotes / results.totalVotes * 100).toFixed(1);
    const repPercent = (republicanVotes / results.totalVotes * 100).toFixed(1);
    
    return `${stateName}\n` +
           `Democratic: ${demPercent}%\n` +
           `Republican: ${repPercent}%\n` +
           `${leader === 'democrat' ? 'Democratic' : 'Republican'} lead: ${margin.toFixed(1)}%`;
  };

  const handleMouseMove = (e: React.MouseEvent, stateName: string) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTooltip({
      content: getTooltipContent(stateName),
      x,
      y
    });
  };

  return (
    <div className="card">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-semibold">Election Results Map</h2>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="w-full aspect-[4/3] relative mt-4" ref={mapRef}>
          <div 
            className="absolute z-10 pointer-events-none bg-white dark:bg-neutral-800 rounded-md shadow-lg p-2 text-sm"
            style={{
              display: tooltip ? 'block' : 'none',
              left: tooltip?.x ?? 0,
              top: (tooltip?.y ?? 0) - 10,
              transform: 'translate(-50%, -100%)',
              whiteSpace: 'pre-line'
            }}
          >
            {tooltip?.content}
          </div>

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
                        onMouseEnter={(evt) => handleMouseMove(evt, stateName)}
                        onMouseMove={(evt) => handleMouseMove(evt, stateName)}
                        onMouseLeave={() => setTooltip(null)}
                        onClick={() => {
                          const stateRaces = electionData.races.filter(r => r.state === stateName);
                          if (stateRaces.length > 0) {
                            setSelectedRace(stateRaces[0].id);
                          }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>
        
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-democrat-500 opacity-30 rounded"></div>
              <div className="w-4 h-4 bg-democrat-500 opacity-60 rounded"></div>
              <div className="w-4 h-4 bg-democrat-500 opacity-100 rounded"></div>
            </div>
            <span>Democratic Lead</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-4 h-4 bg-republican-500 opacity-30 rounded"></div>
              <div className="w-4 h-4 bg-republican-500 opacity-60 rounded"></div>
              <div className="w-4 h-4 bg-republican-500 opacity-100 rounded"></div>
            </div>
            <span>Republican Lead</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-600 rounded"></div>
            <span>No Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default USAMap;