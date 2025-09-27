import React from 'react';
import { formatDistance } from 'date-fns';
import { AlertCircle, Check, ChevronRight, MapPin } from 'lucide-react';
import useElectionStore from '../store/electionStore';

const RaceCard = ({ race }) => {
  const { setSelectedRace, selectedRace } = useElectionStore();
  const isSelected = selectedRace === race.id;
  
  const sortedCandidates = [...race.candidates].sort((a, b) => b.votes - a.votes);
  
  const lastUpdatedTime = formatDistance(
    new Date(race.lastUpdated),
    new Date(),
    { addSuffix: true }
  );
  
  return (
    <div 
      className={`card hover:shadow-lg transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-primary-500' : ''
      }`}
      onClick={() => setSelectedRace(race.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{race.title}</h3>
          <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{race.state}</span>
          </div>
        </div>
        {race.called && (
          <span className="badge badge-other flex items-center space-x-1">
            <Check className="h-3 w-3" />
            <span>Called</span>
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        {sortedCandidates.map((candidate) => {
          const isWinner = race.called && race.winner === candidate.id;
          const partyColor = candidate.party === 'democrat' 
            ? 'bg-democrat-500' 
            : candidate.party === 'republican' 
              ? 'bg-republican-500' 
              : 'bg-neutral-500';
          
          return (
            <div key={candidate.id} className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {candidate.incumbent && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      (I)
                    </span>
                  )}
                  <span className={`font-medium ${isWinner ? 'font-bold' : ''}`}>
                    {candidate.name}
                  </span>
                  <span className={`badge ${
                    candidate.party === 'democrat' 
                      ? 'badge-democrat' 
                      : candidate.party === 'republican' 
                        ? 'badge-republican' 
                        : 'badge-other'
                  }`}>
                    {candidate.party.charAt(0).toUpperCase() + candidate.party.slice(1)}
                  </span>
                </div>
                <span className="font-semibold">{candidate.percentage}%</span>
              </div>
              
              <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${partyColor}`}
                  style={{ width: `${candidate.percentage}%` }}
                ></div>
              </div>
              
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                {candidate.votes.toLocaleString()} votes
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center text-sm text-neutral-500 dark:text-neutral-400">
        <div>
          {race.precincts.percentage}% reporting
          <span className="mx-2">•</span>
          Updated {lastUpdatedTime}
        </div>
        
        {race.isLive && (
          <span className="flex items-center text-primary-600 dark:text-primary-400">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-600"></span>
            </span>
            Live
          </span>
        )}
        
        <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
};

export default RaceCard;