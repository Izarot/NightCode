const PolicyPanel = {
  templates() {
    return GameState.regulationTypes.map(r => `
      <div class="reg-card">
        <strong>${r.name}</strong>
        <button class="btn" onclick="PolicyPanel.add('${r.id}')">+ Add</button>
      </div>
    `).join('');
  },
  add(id) {
    const type = GameState.regulationTypes.find(r => r.id === id);
    const policy = { id, name: type.name, vars: {} };
    type.vars.forEach(v => policy.vars[v] = v === 'rate' ? 20 : v === 'visits' ? 3 : 50);
    GameState.policies.push(policy);
    Audio.click();
    App.render();
  },
  remove(idx) {
    GameState.policies.splice(idx, 1);
    App.render();
  },
  updateVar(idx, key, val) {
    GameState.policies[idx].vars[key] = parseFloat(val);
  },
  render() {
    return `
      <h3 style="color:var(--accent);">📋 Active Regulations</h3>
      ${GameState.policies.map((p, i) => `
        <div class="reg-card warn">
          <div style="display:flex;justify-content:space-between;"><strong>${p.name}</strong><button class="btn warn" onclick="PolicyPanel.remove(${i})">✕</button></div>
          ${Object.keys(p.vars).map(k => `
            <div class="slider-row">
              <label>${k}: <span id="v${i}${k}">${p.vars[k]}</span></label>
              <input type="range" min="0" max="100" value="${p.vars[k]}" oninput="PolicyPanel.updateVar(${i},'${k}',this.value);document.getElementById('v${i}${k}').textContent=this.value;">
            </div>
          `).join('')}
        </div>
      `).join('')}
      <h4>Available</h4>
      ${this.templates()}
      <button class="btn ok" onclick="App.closePolicy()">Close</button>
    `;
  }
};
