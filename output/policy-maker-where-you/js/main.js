const App = {
  timerStart: Date.now(),
  init() {
    Persistence.load();
    IndustryView.init();
    document.getElementById('topbar').innerHTML += `<span>🏆 HS:${GameState.highScore}</span>`;
    document.getElementById('timer').textContent = `Q${GameState.quarter} • 00:00`;
    this.menu();
    setInterval(() => this.tickTimer(), 1000);
  },
  menu() {
    GameState.phase = 'MENU';
    document.getElementById('main').innerHTML = `
      <div style="margin:auto;text-align:center;padding:2em;">
        <h1 style="color:var(--accent);font-size:2.5em;">🏭 INDUSTRY REGULATOR</h1>
        <p>Balance the economy, workers, environment, and politics.</p>
        <p>High Score: ${GameState.highScore}</p>
        <button class="btn ok" onclick="App.start()">▶ Start Game</button>
      </div>
    `;
    document.getElementById('side')?.remove();
  },
  start() {
    Audio.init();
    GameState.phase = 'DRAFTING';
    GameState.quarter = 1;
    GameState.timerStart = Date.now();
    GameState.speedrun.startTime = Date.now();
    Object.assign(GameState.metrics, { gdp:50, satisfaction:50, pollution:40, approval:70, debt:30, strikes:0, safety:67 });
    GameState.policies = [];
    GameState.log = [];
    document.getElementById('main').innerHTML = '<canvas id="canvas"></canvas>';
    IndustryView.canvas = document.getElementById('canvas');
    IndustryView.ctx = IndustryView.canvas.getContext('2d');
    IndustryView.resize();
    this.render();
    addLog('🎮 Game started. Draft your policies!', 'info');
  },
  render() {
    if (GameState.phase === 'MENU') return;
    document.getElementById('main').insertAdjacentHTML('beforeend', Dashboard.render());
    const logEl = document.getElementById('log');
    logEl.innerHTML = GameState.log.map(l => `<div class="log-${l.type}">[Q${l.q}] ${l.msg}</div>`).join('');
  },
  openPolicy() {
    Audio.click();
    document.getElementById('policyDrawer').innerHTML = PolicyPanel.render();
    document.getElementById('policyDrawer').classList.remove('hidden');
  },
  closePolicy() { document.getElementById('policyDrawer').classList.add('hidden'); },
  advance() {
    if (GameState.phase === 'DRAFTING') {
      GameState.phase = 'SIMULATION';
      addLog('⚙️ Simulating quarter...', 'info');
      let steps = 0;
      const sim = setInterval(() => {
        steps++;
        if (steps >= 30) {
          clearInterval(sim);
          Simulation.runQuarter();
          Events.trigger();
          GameState.quarter++;
          GameState.phase = 'DRAFTING';
          const result = Events.checkEnd();
          if (result) {
            Persistence.saveScore();
            if (result.win) Audio.win();
            Modals.show(result.win ? '🏆 Victory!' : '💀 Game Over', result.msg, 'App.menu()');
          }
          this.render();
        }
      }, 50);
    }
  },
  tickTimer() {
    if (GameState.phase === 'MENU') return;
    const elapsed = Math.floor((Date.now() - this.timerStart) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `Q${GameState.quarter} • ${m}:${s}`;
    document.getElementById('budget').textContent = `Budget: $${GameState.budget.toFixed(0)}M`;
  }
};

window.App = App;
window.PolicyPanel = PolicyPanel;
window.Modals = Modals;
window.Audio = Audio;
window.Simulation = Simulation;
window.GameState = GameState;
window.addEventListener('DOMContentLoaded', () => App.init());
