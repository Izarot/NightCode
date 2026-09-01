const Dashboard = {
  render() {
    const m = GameState.metrics;
    return `
      <aside id="side">
        <h3 style="color:var(--accent);">📊 Metrics</h3>
        <div class="metric"><label>GDP</label><div class="bar econ"><div style="width:${m.gdp}%"></div></div>${m.gdp.toFixed(1)}%</div>
        <div class="metric"><label>Workers</label><div class="bar work"><div style="width:${m.satisfaction}%"></div></div>${m.satisfaction.toFixed(0)}%</div>
        <div class="metric"><label>Environment</label><div class="bar env"><div style="width:${100-m.pollution}%"></div></div>${(100-m.pollution).toFixed(0)}%</div>
        <div class="metric"><label>Approval</label><div class="bar pol"><div style="width:${m.approval}%"></div></div>${m.approval.toFixed(0)}%</div>
        <div class="metric"><label>Debt</label><div class="bar"><div style="width:${m.debt}%;background:#e67e22;"></div></div>${m.debt.toFixed(0)}%</div>
        <div class="metric"><label>Jobs (K)</label>${m.jobs.toFixed(0)}</div>
        <div class="metric"><label>Strikes</label>${m.strikes}</div>
        <button class="btn" onclick="App.openPolicy()">📋 Policies</button>
        <button class="btn ok" onclick="App.advance()">▶ Next Quarter</button>
      </aside>
    `;
  },
  update() {
    document.getElementById('side').innerHTML = this.render().match(/<aside[^>]*>([\s\S]*)<\/aside>/)[1];
  }
};
