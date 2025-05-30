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

  // Group races by state
  const stateResults = electionData.races.reduce((acc, race) => {
    if (!acc[race.state]) {
      acc[race.state] = {
        democrat: 0,
        republican: 0,
        other: 0,
        total: 0
      };
    }
    
    if (race.called && race.winner) {
      const winningCandidate = race.candidates.find(c => c.id === race.winner);
      if (winningCandidate) {
        acc[race.state][winningCandidate.party]++;
        acc[race.state].total++;
      }
    }
    
    return acc;
  }, {} as Record<string, { democrat: number; republican: number; other: number; total: number }>);

  // Get state color based on results
  const getStateColor = (stateName: string) => {
    const results = stateResults[stateName];
    if (!results) return "#e5e7eb"; // Neutral gray for no data
    
    const { democrat, republican, total } = results;
    if (total === 0) return "#e5e7eb";
    
    const demShare = democrat / total;
    const repShare = republican / total;
    
    if (demShare > repShare) {
      const intensity = Math.min(0.2 + demShare * 0.8, 1);
      return `rgba(37, 99, 235, ${intensity})`; // Democrat blue
    } else if (repShare > demShare) {
      const intensity = Math.min(0.2 + repShare * 0.8, 1);
      return `rgba(220, 38, 38, ${intensity})`; // Republican red
    }
    
    return "#e5e7eb";
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
                        if (results?.total > 0) {
                          const stateRaces = electionData.races.filter(r => r.state === stateName);
                          if (stateRaces.length > 0) {
                            setSelectedRace(stateRaces[0].id);
                          }
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
      
      <div className="flex justify-center space-x-4 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-democrat-500 rounded mr-2"></div>
          <span>Democrat</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-republican-500 rounded mr-2"></div>
          <span>Republican</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-neutral-200 dark:bg-neutral-600 rounded mr-2"></div>
          <span>No Data</span>
        </div>
      </div>
    </div>
  );
};

export default USAMap;