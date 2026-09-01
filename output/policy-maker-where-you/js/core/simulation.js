const Simulation = {
  industries: [
    { name: 'Steel Corp', behavior: 'loophole', gdp: 20, pollution: 15 },
    { name: 'Tech United', behavior: 'comply', gdp: 25, pollution: 5 },
    { name: 'ChemCo', behavior: 'defiant', gdp: 15, pollution: 25 },
    { name: 'Auto Group', behavior: 'negotiate', gdp: 18, pollution: 12 }
  ],
  tick: 0,
  runQuarter() {
    this.tick = 0;
    let econEffect = 0, envEffect = 0, workEffect = 0, polEffect = 0;
    GameState.policies.forEach(p => {
      const w = (p.id === 'emissions' ? -2 : 0) + (p.id === 'safety' ? 1.5 : 0) +
                (p.id === 'tax' ? -1 : 0) + (p.id === 'antitrust' ? -0.5 : 0) +
                (p.id === 'inspect' ? 0.3 : 0);
      polEffect += p.id === 'inspect' ? (p.vars.visits || 1) * 0.5 : 0;
      envEffect += p.id === 'emissions' ? -1 : 0;
      workEffect += p.id === 'safety' ? 2 : 0;
      econEffect += w;
    });
    GameState.metrics.gdp = clamp(GameState.metrics.gdp + econEffect + (Math.random() - 0.5) * 3, 0, 100);
    GameState.metrics.pollution = clamp(GameState.metrics.pollution + envEffect + (Math.random() - 0.4) * 2, 0, 100);
    GameState.metrics.satisfaction = clamp(GameState.metrics.satisfaction + workEffect + (Math.random() - 0.5) * 4, 0, 100);
    GameState.metrics.approval = clamp(GameState.metrics.approval - GameState.metrics.pollution * 0.05 + polEffect - (GameState.metrics.debt * 0.1), 0, 100);
    GameState.budget += GameState.metrics.gdp * 2;
    GameState.metrics.debt = clamp(GameState.metrics.debt - 0.5 + (100 - GameState.metrics.gdp) * 0.02, 0, 100);
    this.industries.forEach((ind, i) => {
      const drift = ind.behavior === 'defiant' ? 3 : ind.behavior === 'comply' ? -1 : 0;
      ind.pollution = clamp(ind.pollution + drift + (Math.random() - 0.5) * 2, 0, 100);
      ind.gdp = clamp(ind.gdp + (Math.random() - 0.4) * 3, 0, 100);
    });
  }
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
