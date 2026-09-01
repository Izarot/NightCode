const GameState = {
  phase: 'MENU',
  quarter: 1,
  budget: 1000,
  metrics: {
    gdp: 50, growth: 2.1, jobs: 847,
    satisfaction: 50, strikes: 0, safety: 67,
    pollution: 40, air: 50, water: 60,
    approval: 70, debt: 30
  },
  policies: [],
  log: [],
  speedrun: { startTime: null, total: 0 },
  highScore: 0,
  initialized: false,
  regulationTypes: [
    { id: 'emissions', name: 'Emissions Cap', vars: ['threshold', 'penalty'] },
    { id: 'safety', name: 'Worker Safety', vars: ['maxHours', 'breaks'] },
    { id: 'tax', name: 'Corporate Tax', vars: ['rate'] },
    { id: 'antitrust', name: 'Antitrust Index', vars: ['threshold'] },
    { id: 'inspect', name: 'Inspection Rate', vars: ['visits'] }
  ]
};

function addLog(msg, type='info') {
  GameState.log.unshift({ msg, type, q: GameState.quarter });
  if (GameState.log.length > 20) GameState.log.pop();
}
