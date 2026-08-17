// Central GameState with Proxy-based reactivity
const GameState = new Proxy({
  energy: 0,
  clicks: 0,
  highScore: 0,
  speedrunTime: 0,
  startTime: Date.now(),
  clickBoostLevel: 0,
  prestigeLevel: 0,
  upgrades: {},
  activeSlots: 1,
  maxSlots: 6,
  unlockedShapes: ['square'],
  settings: {
    sound: true,
    vibration: true
  }
}, {
  set(target, key, value) {
    target[key] = value;
    updateUI();
    return true;
  }
});

function updateUI() {
  const energyEl = document.getElementById('energy');
  const clicksEl = document.getElementById('clicks');
  const highScoreEl = document.getElementById('highScore');
  const speedrunEl = document.getElementById('speedrun');
  if (energyEl) energyEl.textContent = formatNumber(GameState.energy);
  if (clicksEl) clicksEl.textContent = GameState.clicks;
  if (highScoreEl) highScoreEl.textContent = formatNumber(GameState.highScore);
  if (speedrunEl) speedrunEl.textContent = GameState.speedrunTime.toFixed(2);
  const prestigeBtn = document.getElementById('prestigeBtn');
  if (prestigeBtn) prestigeBtn.style.display = GameState.energy >= 1000 ? 'block' : 'none';
}

function formatNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
}

function saveGame() {
  localStorage.setItem('geometricClicker_save', JSON.stringify({
    energy: GameState.energy,
    clicks: GameState.clicks,
    highScore: GameState.highScore,
    clickBoostLevel: GameState.clickBoostLevel,
    prestigeLevel: GameState.prestigeLevel,
    upgrades: GameState.upgrades,
    activeSlots: GameState.activeSlots,
    unlockedShapes: GameState.unlockedShapes
  }));
}

function loadGame() {
  const saved = localStorage.getItem('geometricClicker_save');
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(GameState, data);
  }
}

window.addEventListener('beforeunload', saveGame);
