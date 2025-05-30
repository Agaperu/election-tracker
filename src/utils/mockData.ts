import { Candidate, Race } from '../types';

// Helper function to generate random vote counts that sum to total
const generateVoteCounts = (total: number, numCandidates: number): number[] => {
  const votes: number[] = [];
  let remaining = total;
  
  for (let i = 0; i < numCandidates - 1; i++) {
    // Generate a random portion of the remaining votes
    const vote = Math.floor(Math.random() * (remaining * 0.8));
    votes.push(vote);
    remaining -= vote;
  }
  
  // Assign the remaining votes to the last candidate
  votes.push(remaining);
  
  // Shuffle the array to randomize which candidate gets the most votes
  return votes.sort(() => Math.random() - 0.5);
};

// Generate a mock race with random data
export const generateMockRace = (id: string, state: string, type: Race['type']): Race => {
  const totalVotes = Math.floor(Math.random() * 1000000) + 100000;
  const voteCounts = generateVoteCounts(totalVotes, 2);
  
  const candidates: Candidate[] = [
    {
      id: `${id}-dem`,
      name: `John Smith`,
      party: 'democrat',
      votes: voteCounts[0],
      percentage: parseFloat((voteCounts[0] / totalVotes * 100).toFixed(1)),
      incumbent: Math.random() > 0.5,
    },
    {
      id: `${id}-rep`,
      name: `Jane Doe`,
      party: 'republican',
      votes: voteCounts[1],
      percentage: parseFloat((voteCounts[1] / totalVotes * 100).toFixed(1)),
      incumbent: Math.random() > 0.5,
    },
  ];
  
  // Determine race title based on type
  let title = '';
  switch (type) {
    case 'presidential':
      title = 'Presidential Election';
      break;
    case 'senate':
      title = `U.S. Senate - ${state}`;
      break;
    case 'house':
      const district = Math.floor(Math.random() * 10) + 1;
      title = `U.S. House - ${state} District ${district}`;
      break;
    case 'governor':
      title = `Governor - ${state}`;
      break;
    default:
      title = `${state} Election`;
  }
  
  const precinctTotal = Math.floor(Math.random() * 1000) + 500;
  const precinctsReporting = Math.floor(Math.random() * precinctTotal);
  const percentageReporting = parseFloat((precinctsReporting / precinctTotal * 100).toFixed(1));
  
  // Determine if race is called
  const called = percentageReporting > 80 && Math.abs(candidates[0].percentage - candidates[1].percentage) > 5;
  
  // Set winner if race is called
  let winner = undefined;
  if (called) {
    winner = candidates[0].votes > candidates[1].votes ? candidates[0].id : candidates[1].id;
  }
  
  return {
    id,
    title,
    state,
    type,
    candidates,
    precincts: {
      total: precinctTotal,
      reporting: precinctsReporting,
      percentage: percentageReporting,
    },
    lastUpdated: new Date().toISOString(),
    called,
    winner,
    isLive: true,
  };
};

// Generate mock data for multiple states
export const generateMockElectionData = (): Race[] => {
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
    'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri',
    'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];
  
  const races: Race[] = [];
  
  // Generate presidential races for all states
  states.forEach((state, index) => {
    races.push(generateMockRace(`pres-${index}`, state, 'presidential'));
  });
  
  // Generate senate races for 1/3 of states
  for (let i = 0; i < Math.floor(states.length / 3); i++) {
    const state = states[i];
    races.push(generateMockRace(`senate-${i}`, state, 'senate'));
  }
  
  // Generate governor races for some states
  for (let i = 0; i < 10; i++) {
    const stateIndex = Math.floor(Math.random() * states.length);
    const state = states[stateIndex];
    races.push(generateMockRace(`gov-${i}`, state, 'governor'));
  }
  
  // Generate house races
  for (let i = 0; i < 20; i++) {
    const stateIndex = Math.floor(Math.random() * states.length);
    const state = states[stateIndex];
    races.push(generateMockRace(`house-${i}`, state, 'house'));
  }
  
  return races;
};