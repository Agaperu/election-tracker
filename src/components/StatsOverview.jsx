import React from 'react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import useElectionStore from '../store/electionStore';

const StatsOverview = () => {
  const { electionData } = useElectionStore();
  
  // Calculate statistics
  const totalRaces = electionData.races.length;
  const calledRaces = electionData.races.filter(race => race.called).length;
  const liveRaces = electionData.races.filter(race => race.isLive).length;
  
  // Count by party
  const democratWins = electionData.races.filter(
    race => race.called && race.winner && 
    race.candidates.find(c => c.id === race.winner)?.party === 'democrat'
  ).length;
  
  const republicanWins = electionData.races.filter(
    race => race.called && race.winner && 
    race.candidates.find(c => c.id === race.winner)?.party === 'republican'
  ).length;
  
  const otherWins = calledRaces - democratWins - republicanWins;
  
  // Calculate reporting percentages
  const totalPrecincts = electionData.races.reduce(
    (sum, race) => sum + race.precincts.total, 0
  );
  
  const reportingPrecincts = electionData.races.reduce(
    (sum, race) => sum + race.precincts.reporting, 0
  );
  
  const reportingPercentage = totalPrecincts > 0
    ? Math.round((reportingPrecincts / totalPrecincts) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Races Overview */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-3">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium">Races</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Total</span>
            <span className="font-semibold">{totalRaces}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Called</span>
            <span className="font-semibold">{calledRaces}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Live</span>
            <span className="font-semibold">{liveRaces}</span>
          </div>
          
          <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full mt-2">
            <div 
              className="h-full bg-primary-600 rounded-full"
              style={{ width: `${(calledRaces / totalRaces) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            {Math.round((calledRaces / totalRaces) * 100)}% of races called
          </div>
        </div>
      </div>
      
      {/* Results by Party */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-3">
          <PieChart className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium">Results by Party</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-democrat-500 mr-2"></div>
            <span className="text-neutral-600 dark:text-neutral-400 flex-1">Democrat</span>
            <span className="font-semibold">{democratWins}</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-republican-500 mr-2"></div>
            <span className="text-neutral-600 dark:text-neutral-400 flex-1">Republican</span>
            <span className="font-semibold">{republicanWins}</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-neutral-500 mr-2"></div>
            <span className="text-neutral-600 dark:text-neutral-400 flex-1">Other</span>
            <span className="font-semibold">{otherWins}</span>
          </div>
          
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex">
            {democratWins > 0 && (
              <div 
                className="h-full bg-democrat-500"
                style={{ width: `${(democratWins / calledRaces) * 100}%` }}
              ></div>
            )}
            {republicanWins > 0 && (
              <div 
                className="h-full bg-republican-500"
                style={{ width: `${(republicanWins / calledRaces) * 100}%` }}
              ></div>
            )}
            {otherWins > 0 && (
              <div 
                className="h-full bg-neutral-500"
                style={{ width: `${(otherWins / calledRaces) * 100}%` }}
              ></div>
            )}
          </div>
        </div>
      </div>
      
      {/* Reporting Status */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h3 className="font-medium">Reporting Status</h3>
        </div>
        
        <div className="flex flex-col items-center justify-center h-24">
          <div className="relative h-20 w-20">
            <svg className="h-full w-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
                className="dark:stroke-neutral-700"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray={`${reportingPercentage}, 100`}
                className="stroke-primary-600"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold">
              {reportingPercentage}%
            </div>
          </div>
          <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
            Precincts Reporting
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;