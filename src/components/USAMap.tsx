import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import useElectionStore from '../store/electionStore';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const USAMap: React.FC = () => {
  const { electionData, filters, setSelectedRace } = useElectionStore();

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
    
    // Sum up votes for each party
    race.candidates.forEach(candidate => {
      if (candidate.party === 'democrat') {
        acc[race.state].democratVotes += candidate.votes;
      } else if (candidate.party === 'republican') {
        acc[race.state].republicanVotes += candidate.votes;
      }
    });
    
    // Calculate total votes and winning margin
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

  // Get state color based on results and margin
  const getStateColor = (stateName: string) => {
    const results = stateResults[stateName];
    if (!results || results.totalVotes === 0) return "#e5e7eb"; // Neutral gray for no data
    
    const { margin, leader } = results;
    
    // Calculate color intensity based on margin
    // Max intensity at 20% margin, min intensity at 1% margin
    const intensity = Math.min(Math.max(margin / 20, 0.2), 1);
    
    if (leader === 'democrat') {
      // Democrat blue with varying intensity
      return `rgba(37, 99, 235, ${intensity})`;
    } else {
      // Republican red with varying intensity
      return `rgba(220, 38, 38, ${intensity})`;
    }
  };

  // Format margin for tooltip
  const getMarginText = (stateName: string) => {
    const results = stateResults[stateName];
    if (!results || results.totalVotes === 0) return "No data";
    
    const { margin, leader } = results;
    const partyName = leader === 'democrat' ? 'Democratic' : 'Republican';
    return `${partyName} +${margin.toFixed(1)}%`;
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Election Results Map</h2>
      <div className="w-full aspect-[4/3] relative">
        <ComposableMap projection="geoAlbersUsa">
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const stateName = geo.properties.name;
                  const results = stateResults[stateName];
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getStateColor(stateName)}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: "none",
                        },
                        hover: {
                          fill: "#93c5fd",
                          outline: "none",
                          cursor: "pointer"
                        },
                        pressed: {
                          outline: "none"
                        }
                      }}
                      onClick={() => {
                        const stateRaces = electionData.races.filter(r => r.state === stateName);
                        if (stateRaces.length > 0) {
                          setSelectedRace(stateRaces[0].id);
                        }
                      }}
                      title={`${stateName}: ${getMarginText(stateName)}`}
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
  );
};

export default USAMap;