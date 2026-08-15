(function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const gameState = {
    energy: 0,
    clicks: 0,
    upgrades: {
      triangle: { level: 0, size: 10, eps: 0, cost: 100, color: '#ff0000' },
      square: { level: 0, size: 10, eps: 0, cost: 100, color: '#00ff00' },
      circle: { level: 0, size: 10, eps: 0, cost: 100, color: '#0000ff' },
      hexagon: { level: 0, size: 10, eps: 0, cost: 100, color: '#ffff00' },
      star: { level: 0, size: 10, eps: 0, cost: 100, color: '#ff00ff' }
    },
    prestigeMultiplier: 1,
    metaShapes: []
  };
  function updateUpgradePanel() {
    const panel = document.getElementById('upgradePanel');
    panel.innerHTML = '';
    Object.values(gameState.upgrades).forEach(upgrade => {
      const slot = document.createElement('div');
      slot.className = 'shape-slot';
      slot.innerHTML = `<div>${upgrade.type}</div><div>Level: ${upgrade.level}</div><div>EPS: ${upgrade.eps}</div><button onclick="upgradeShape('${upgrade.type}')">Upgrade</button>`;
      panel.appendChild(slot);
    });
  }
  function updateSpeedBar() {
    const speed = 200 * speedMultiplier;
    const bar = document.getElementById('speedFill');
    bar.style.width = `${(speed / 600) * 100}%`;
  }
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
})();