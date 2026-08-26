// Rhythm Gate - Core Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const lanesContainer = document.getElementById('lanesContainer');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const menuBtn = document.getElementById('menuBtn');
const timerEl = document.getElementById('timer');
const gateFill = document.getElementById('gateFill');
const crowdEnergyEl = document.getElementById('crowdEnergy');
const bpmDisplay = document.getElementById('bpmDisplay');
const comboDisplay = document.getElementById('comboDisplay');
const finalStats = document.getElementById('finalStats');
const highScoreDisplay = document.getElementById('highScoreDisplay');

// --- Config ---
const LANE_COUNT = 3;
const LANE_KEYS = ['1', '2', '3'];
const LANE_COLORS = ['#00ffff', '#ff00ff', '#ffff00'];
const BASE_BPM = 120;
const NOTE_SPEED = 600; // px/s
const TIMING_WINDOWS = { perfect: 0.015, good: 0.040 };
const GATE_GAIN = { perfect: 3, good: 1.5, miss: -1 };
const CROWD_CHANGE = { perfect: 2, miss: -5 };
const COMBO_THRESHOLDS = [5, 10];
const COMBO_MULTIPLIERS = [1.2, 1.5];

// --- State ---
let gameState = 'MENU'; // MENU, PLAYING, GAME_OVER
let startTime = 0;
let elapsedTime = 0;
let gateCharge = 0;
let crowdEnergy = 100;
let combo = 0;
let maxCombo = 0;
let notes = [];
let noteIdCounter = 0;
let lastSpawnTime = 0;
let spawnInterval = 0;
let currentBPM = BASE_BPM;
let audioCtx = null;
let masterGain = null;
let highScore = parseFloat(localStorage.getItem('rhythmGateHighScore')) || null;

// --- Responsive Canvas ---
function resizeCanvas() {
  const ratio = 16 / 9;
  const maxW = window.innerWidth * 0.98;
  const maxH = window.innerHeight * 0.98;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  canvas.width = w * window.devicePixelRatio;
  canvas.height = h * window.devicePixelRatio;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  layoutLanes(w, h);
}
function layoutLanes(w, h) {
  lanesContainer.innerHTML = '';
  lanesContainer.style.width = w + 'px';
  lanesContainer.style.height = h + 'px';
  for (let i = 0; i < LANE_COUNT; i++) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.style.left = ((i + 1) / (LANE_COUNT + 1) * 100) + '%';
    lane.dataset.index = i;
    lanesContainer.appendChild(lane);
  }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Audio ---
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);
}
function playTone(freq, type, duration, gainVal = 0.1, delay = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainVal;
  osc.connect(gain);
  gain.connect(masterGain);
  const t = audioCtx.currentTime + delay;
  osc.start(t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.stop(t + duration);
}
function playNoteSound(lane, judgment) {
  const baseFreq = [261.63, 329.63, 392.00][lane]; // C4, E4, G4
  if (judgment === 'perfect') {
    playTone(baseFreq * 2, 'sine', 0.1, 0.15);
    playTone(baseFreq, 'square', 0.05, 0.1, 0.02);
  } else if (judgment === 'good') {
    playTone(baseFreq, 'triangle', 0.1, 0.1);
  } else {
    playTone(100, 'sawtooth', 0.2, 0.1);
  }
}
function playDoorOpen() {
  if (!audioCtx) return;
  [440, 554.37, 659.25, 880].forEach((f, i) => playTone(f, 'sine', 0.3, 0.08, i * 0.05));
}
function playGameOver() {
  if (!audioCtx) return;
  [330, 294, 262, 247].forEach((f, i) => playTone(f, 'sine', 0.4, 0.1, i * 0.15));
}

// --- Game Loop ---
let lastFrame = 0;
function gameLoop(ts) {
  if (gameState !== 'PLAYING') {
    requestAnimationFrame(gameLoop);
    return;
  }
  const dt = (ts - lastFrame) / 1000;
  lastFrame = ts;
  elapsedTime = (ts - startTime) / 1000;
  updateTimer();
  updateNotes(dt);
  checkSpawns();
  renderBackground();
  requestAnimationFrame(gameLoop);
}

function updateTimer() {
  const m = Math.floor(elapsedTime / 60).toString().padStart(2, '0');
  const s = Math.floor(elapsedTime % 60).toString().padStart(2, '0');
  const ms = Math.floor((elapsedTime % 1) * 1000).toString().padStart(3, '0');
  timerEl.textContent = `${m}:${s}.${ms}`;
}

function checkSpawns() {
  if (elapsedTime - lastSpawnTime >= spawnInterval) {
    spawnNote();
    lastSpawnTime = elapsedTime;
    // vary interval slightly
    spawnInterval = (60 / currentBPM) * (0.5 + Math.random() * 0.5); // 8th to quarter notes
  }
}

function spawnNote() {
  const lane = Math.floor(Math.random() * LANE_COUNT);
  const type = Math.random() < 0.8 ? 'single' : 'hold';
  const note = {
    id: noteIdCounter++,
    lane,
    type,
    y: -50, // start above screen
    targetY: canvas.height / window.devicePixelRatio * 0.85,
    hit: false,
    held: false,
    holdEnd: type === 'hold' ? (elapsedTime + 0.5 + Math.random() * 1.0) : null,
    element: createNoteElement(lane, type)
  };
  notes.push(note);
  lanesContainer.appendChild(note.element);
}

function createNoteElement(lane, type) {
  const el = document.createElement('div');
  el.className = `note ${type}`;
  el.style.background = LANE_COLORS[lane];
  el.style.color = LANE_COLORS[lane];
  el.style.left = ((lane + 1) / (LANE_COUNT + 1) * 100) + '%';
  el.style.top = '-50px';
  return el;
}

function updateNotes(dt) {
  const canvasH = canvas.height / window.devicePixelRatio;
  const targetY = canvasH * 0.85;
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    note.y += NOTE_SPEED * dt;
    note.element.style.top = note.y + 'px';
    
    // Check if note passed target without hit
    if (!note.hit && note.y > targetY + 50) {
      registerJudgment(note, 'miss');
      removeNote(i);
      continue;
    }
    // Hold note handling
    if (note.type === 'hold' && note.held) {
      if (elapsedTime >= note.holdEnd) {
        registerJudgment(note, 'perfect');
        removeNote(i);
      }
    }
  }
}

function removeNote(index) {
  const note = notes[index];
  if (note.element.parentNode) note.element.parentNode.removeChild(note.element);
  notes.splice(index, 1);
}

function registerJudgment(note, judgment) {
  if (note.hit) return;
  note.hit = true;
  
  let chargeDelta = 0;
  let crowdDelta = 0;
  
  if (judgment === 'perfect') {
    chargeDelta = GATE_GAIN.perfect;
    crowdDelta = CROWD_CHANGE.perfect;
    combo++;
  } else if (judgment === 'good') {
    chargeDelta = GATE_GAIN.good;
    combo++;
  } else {
    chargeDelta = GATE_GAIN.miss;
    crowdDelta = CROWD_CHANGE.miss;
    combo = 0;
  }
  
  // Combo multiplier
  let mult = 1;
  if (combo >= COMBO_THRESHOLDS[1]) mult = COMBO_MULTIPLIERS[1];
  else if (combo >= COMBO_THRESHOLDS[0]) mult = COMBO_MULTIPLIERS[0];
  chargeDelta *= mult;
  
  gateCharge = Math.max(0, Math.min(100, gateCharge + chargeDelta));
  crowdEnergy = Math.max(0, Math.min(110, crowdEnergy + crowdDelta));
  maxCombo = Math.max(maxCombo, combo);
  
  updateHUD();
  showHitFeedback(note.lane, judgment);
  playNoteSound(note.lane, judgment);
  
  if (gateCharge >= 100) {
    winLevel();
  }
  if (crowdEnergy <= 0) {
    gameOver();
  }
}

function showHitFeedback(lane, judgment) {
  const el = document.createElement('div');
  el.className = `hitFeedback ${judgment}`;
  el.textContent = judgment.toUpperCase();
  el.style.left = ((lane + 1) / (LANE_COUNT + 1) * 100) + '%';
  el.style.top = '80%';
  document.getElementById('uiOverlay').appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function updateHUD() {
  gateFill.style.width = gateCharge + '%';
  crowdEnergyEl.textContent = Math.round(crowdEnergy) + '%';
  crowdEnergyEl.style.borderColor = crowdEnergy < 20 ? '#ff3366' : '#ff6b6b';
  crowdEnergyEl.style.color = crowdEnergy < 20 ? '#ff3366' : '#ff6b6b';
  comboDisplay.textContent = combo > 1 ? `COMBO x${combo}` : '';
  bpmDisplay.textContent = `${Math.round(currentBPM)} BPM`;
}

function renderBackground() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  // Clear
  ctx.fillStyle = '#0a0a20';
  ctx.fillRect(0, 0, w, h);
  // Grid lines
  ctx.strokeStyle = 'rgba(0,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  // Target line
  const targetY = h * 0.85;
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(w, targetY); ctx.stroke();
  ctx.setLineDash([]);
  // Pulse on beat
  const beatPhase = (elapsedTime * currentBPM / 60) % 1;
  if (beatPhase < 0.02) {
    ctx.fillStyle = `rgba(0,255,255,${0.1 * (1 - beatPhase * 50)})`;
    ctx.fillRect(0, 0, w, h);
  }
}

// --- Input ---
const keyStates = {};
window.addEventListener('keydown', e => {
  if (gameState === 'PLAYING') {
    keyStates[e.key] = true;
    handleKeyPress(e.key);
  }
});
window.addEventListener('keyup', e => keyStates[e.key] = false);

function handleKeyPress(key) {
  const lane = LANE_KEYS.indexOf(key);
  if (lane === -1) return;
  checkNoteHit(lane);
}

// Touch support
lanesContainer.addEventListener('touchstart', e => {
  if (gameState !== 'PLAYING') return;
  e.preventDefault();
  const rect = lanesContainer.getBoundingClientRect();
  for (const touch of e.changedTouches) {
    const x = touch.clientX - rect.left;
    const lane = Math.floor(x / rect.width * LANE_COUNT);
    if (lane >= 0 && lane < LANE_COUNT) checkNoteHit(lane);
  }
}, { passive: false });

function checkNoteHit(lane) {
  const targetY = (canvas.height / window.devicePixelRatio) * 0.85;
  let bestNote = null;
  let bestDist = Infinity;
  for (const note of notes) {
    if (note.lane !== lane || note.hit) continue;
    const dist = Math.abs(note.y - targetY);
    if (dist < bestDist) {
      bestDist = dist;
      bestNote = note;
    }
  }
  if (!bestNote) return;
  
  const timeDiff = bestDist / NOTE_SPEED; // approximate time difference
  if (timeDiff <= TIMING_WINDOWS.perfect) {
    registerJudgment(bestNote, 'perfect');
    if (bestNote.type === 'hold') bestNote.held = true;
    else removeNote(notes.indexOf(bestNote));
  } else if (timeDiff <= TIMING_WINDOWS.good) {
    registerJudgment(bestNote, 'good');
    if (bestNote.type === 'hold') bestNote.held = true;
    else removeNote(notes.indexOf(bestNote));
  }
}

// --- Game Flow ---
function startGame() {
  initAudio();
  gameState = 'PLAYING';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  resetGame();
  startTime = performance.now();
  lastFrame = startTime;
  lastSpawnTime = 0;
  spawnInterval = 60 / currentBPM;
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  gateCharge = 0;
  crowdEnergy = 100;
  combo = 0;
  maxCombo = 0;
  notes.forEach(n => { if (n.element.parentNode) n.element.parentNode.removeChild(n.element); });
  notes = [];
  noteIdCounter = 0;
  currentBPM = BASE_BPM;
  updateHUD();
}

function winLevel() {
  gameState = 'GAME_OVER';
  playDoorOpen();
  const time = elapsedTime;
  if (highScore === null || time < highScore) {
    highScore = time;
    localStorage.setItem('rhythmGateHighScore', highScore.toString());
  }
  showGameOver(true, time);
}

function gameOver() {
  gameState = 'GAME_OVER';
  playGameOver();
  showGameOver(false, elapsedTime);
}

function showGameOver(won, time) {
  const m = Math.floor(time / 60).toString().padStart(2, '0');
  const s = Math.floor(time % 60).toString().padStart(2, '0');
  const ms = Math.floor((time % 1) * 1000).toString().padStart(3, '0');
  finalStats.innerHTML = `
    <div style="font-size: 24px; color: ${won ? '#00ff88' : '#ff3366'};">${won ? 'GATE UNLOCKED!' : 'CROWD LOST ENERGY'}</div>
    <div>Time: ${m}:${s}.${ms}</div>
    <div>Max Combo: x${maxCombo}</div>
    <div>Final Gate Charge: ${Math.round(gateCharge)}%</div>
  `;
  gameOverScreen.classList.remove('hidden');
  updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
  if (highScore !== null) {
    const m = Math.floor(highScore / 60).toString().padStart(2, '0');
    const s = Math.floor(highScore % 60).toString().padStart(2, '0');
    const ms = Math.floor((highScore % 1) * 1000).toString().padStart(3, '0');
    highScoreDisplay.textContent = `Best Time: ${m}:${s}.${ms}`;
  } else {
    highScoreDisplay.textContent = 'Best Time: --:--.---';
  }
}

// --- Event Listeners ---
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
menuBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  gameState = 'MENU';
});

// Initial high score display
updateHighScoreDisplay();

// Prevent scrolling on touch
document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// Start loop for menu background
requestAnimationFrame(function menuLoop(ts) {
  if (gameState === 'MENU') {
    elapsedTime = ts / 1000;
    renderBackground();
  }
  requestAnimationFrame(menuLoop);
});