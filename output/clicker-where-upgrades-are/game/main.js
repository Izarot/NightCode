// Main game loop and initialization
let lastTime = 0;
let accumulator = 0;
const FPS = 60;
const FRAME_TIME = 1000 / FPS;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += dt;
  while (accumulator >= FRAME_TIME) {
    update(FRAME_TIME / 1000);
    accumulator -= FRAME_TIME;
  }
  Renderer.render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  Input.update(dt);
  Shapes.update(dt);
  updateParticles(dt);
  GameState.speedrunTime = (Date.now() - GameState.startTime) / 1000;
  const passiveIncome = Shapes.list.reduce((sum, s) => sum + s.ps, 0) * dt;
  GameState.energy += passiveIncome;
  if (GameState.energy > GameState.highScore) GameState.highScore = GameState.energy;
  updateUpgradeUI();
}

function updateUpgradeUI() {
  const list = document.getElementById('upgradeList');
  if (!list) return;
  list.innerHTML = '';
  Shapes.list.forEach(shape => {
    const item = document.createElement('div');
    item.className = 'upgrade-item';
    item.innerHTML = '<div>' + ShapeTypes[shape.type].name + ' Lv' + shape.level + '</div><div>EPS: ' + shape.ps.toFixed(1) + '</div><div>Cost: ' + formatNumber(shape.cost) + '</div><button ' + (GameState.energy < shape.cost ? 'disabled' : '') + ' onclick="Shapes.upgrade(' + Shapes.list.indexOf(shape) + ')">Upgrade</button>';
    list.appendChild(item);
  });
}

// Audio system using Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
}
function playSound(type, level) {
  if (level === undefined) level = 0;
  if (!GameState.settings.sound) return;
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  switch (type) {
    case 'click':
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      break;
    case 'whoosh':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200 + level * 50, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      break;
    case 'prestige':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      break;
  }
  osc.start();
  osc.stop(audioCtx.currentTime + (type === 'prestige' ? 0.5 : type === 'whoosh' ? 0.2 : 0.05));
}

function prestige() {
  if (GameState.energy < 1000) return;
  GameState.prestigeLevel += 1;
  GameState.energy = 0;
  GameState.clickBoostLevel += 1;
  Shapes.list = [];
  GameState.unlockedShapes = ['square', 'triangle'];
  GameState.activeSlots = Math.min(GameState.activeSlots + 1, GameState.maxSlots);
  playSound('prestige');
  if (GameState.settings.vibration && navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function initGame() {
  loadGame();
  const canvas = document.getElementById('gameCanvas');
  Input.init(canvas);
  Renderer.init(canvas);
  Shapes.add('square', 0);
  const tooltip = document.getElementById('tooltip');
  if (tooltip && !localStorage.getItem('geometricClicker_tutorialSeen')) {
    tooltip.classList.add('show');
    localStorage.setItem('geometricClicker_tutorialSeen', 'true');
  }
  const prestigeBtn = document.getElementById('prestigeBtn');
  if (prestigeBtn) prestigeBtn.addEventListener('click', prestige);
  requestAnimationFrame(gameLoop);
}

window.addEventListener('load', initGame);
