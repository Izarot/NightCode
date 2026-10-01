// Game State
let currentLevel = 1;
let levelData = null;
let seesaw = new Seesaw();
let renderer = null;
let lastTime = 0;
let gameRunning = false;
let dragState = { active: false, weightIndex: -1, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
let hintCooldown = 0;
let startTime = 0;
let elapsedTime = 0;
let starsEarned = 0;

// DOM Elements
const canvas = document.getElementById('game');
const timerEl = document.getElementById('timer');
const levelInfoEl = document.getElementById('level-info');
const torqueLeftEl = document.getElementById('torque-left');
const torqueRightEl = document.getElementById('torque-right');
const torqueLVal = document.getElementById('torque-l');
const torqueRVal = document.getElementById('torque-r');
const inventoryEl = document.getElementById('inventory');
const hintBtn = document.getElementById('hint-btn');
const pauseBtn = document.getElementById('pause-btn');
const pauseModal = document.getElementById('pause-modal');
const completeModal = document.getElementById('complete-modal');
const menuModal = document.getElementById('menu-modal');
const starsEl = document.getElementById('stars');
const timeResultEl = document.getElementById('time-result');

// Initialize
function init() {
  renderer = new Renderer(canvas);
  loadProgress();
  setupUI();
  showMenu();
  requestAnimationFrame(gameLoop);
}

function loadProgress() {
  const saved = localStorage.getItem('balanceShift_progress');
  if (saved) {
    const data = JSON.parse(saved);
    currentLevel = data.currentLevel || 1;
    // Update continue button
    document.getElementById('continue-btn').classList.toggle('hidden', currentLevel >= LEVELS.length);
  }
}

function saveProgress() {
  localStorage.setItem('balanceShift_progress', JSON.stringify({ currentLevel }));
}

function setupUI() {
  // Inventory weight buttons
  function updateInventory() {
    inventoryEl.innerHTML = '';
    const available = seesaw.getAvailableWeights();
    available.forEach((w, idx) => {
      const btn = document.createElement('button');
      btn.className = 'weight-btn';
      btn.style.background = w.type.color;
      btn.textContent = w.type.label;
      btn.dataset.index = w.id;
      btn.addEventListener('mousedown', (e) => startDrag(e, w.id));
      btn.addEventListener('touchstart', (e) => startDrag(e, w.id), { passive: false });
      inventoryEl.appendChild(btn);
    });
    // Update placed weights visual
    document.querySelectorAll('.weight-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
  }
  
  // Drag handling
  function startDrag(e, weightIndex) {
    if (gameRunning === false) return;
    const weight = seesaw.weights.find(w => w.id === weightIndex);
    if (!weight || weight.placed) return;
    
    dragState.active = true;
    dragState.weightIndex = weightIndex;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragState.startX = clientX;
    dragState.startY = clientY;
    dragState.offsetX = clientX - rect.left;
    dragState.offsetY = clientY - rect.top;
    
    weight.x = (dragState.offsetX - renderer.offsetX) / renderer.scale;
    weight.y = (dragState.offsetY - renderer.offsetY) / renderer.scale;
    weight.targetX = weight.x;
    weight.targetY = weight.y;
    
    audio.play('pickup');
    e.preventDefault();
  }

  function handleDrag(e) {
    if (!dragState.active) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - renderer.offsetX) / renderer.scale;
    const y = (clientY - rect.top - renderer.offsetY) / renderer.scale;
    
    const weight = seesaw.weights[dragState.weightIndex];
    if (weight) {
      weight.targetX = x;
      weight.targetY = y;
    }
    e.preventDefault();
  }

  function endDrag(e) {
    if (!dragState.active) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - renderer.offsetX) / renderer.scale;
    const y = (clientY - rect.top - renderer.offsetY) / renderer.scale;
    
    // Check slot collision
    let placed = false;
    seesaw.slots.forEach((slot, i) => {
      if (!slot.occupied && !slot.locked) {
        const dx = x - slot.x;
        const dy = y - slot.y;
        if (Math.abs(dx) < CONFIG.SEESAW.slotWidth/2 && Math.abs(dy) < CONFIG.SEESAW.slotHeight/2 + 30) {
          if (seesaw.tryPlaceWeight(dragState.weightIndex, i)) {
            placed = true;
            updateInventory();
          }
        }
      }
    });
    
    if (!placed) {
      // Return to inventory position
      const weight = seesaw.weights[dragState.weightIndex];
      if (weight) {
        weight.targetX = weight.x;
        weight.targetY = weight.y;
      }
    }
    
    dragState.active = false;
    dragState.weightIndex = -1;
  }

  canvas.addEventListener('mousemove', handleDrag);
  canvas.addEventListener('mouseup', endDrag);
  canvas.addEventListener('touchmove', handleDrag, { passive: false });
  canvas.addEventListener('touchend', endDrag);
  
  // Click on placed weight to pick up
  canvas.addEventListener('click', (e) => {
    if (dragState.active) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - renderer.offsetX) / renderer.scale;
    const y = (e.clientY - rect.top - renderer.offsetY) / renderer.scale;
    
    seesaw.getPlacedWeights().forEach(w => {
      const dx = x - w.x;
      const dy = y - w.y;
      if (Math.sqrt(dx*dx + dy*dy) < w.type.radius) {
        seesaw.removeWeight(w.id);
        updateInventory();
      }
    });
  });

  // Hint button
  hintBtn.addEventListener('click', () => {
    if (Date.now() - hintCooldown < CONFIG.HINT_COOLDOWN) return;
    hintCooldown = Date.now();
    audio.play('hint');
    alert(levelData.hint);
  });

  // Pause button
  pauseBtn.addEventListener('click', () => {
    audio.play('click');
    togglePause();
  });

  // Modal buttons
  document.getElementById('resume-btn').addEventListener('click', () => {
    audio.play('click');
    togglePause();
  });
  document.getElementById('restart-btn').addEventListener('click', () => {
    audio.play('click');
    startLevel(currentLevel);
    togglePause();
  });
  document.getElementById('menu-btn').addEventListener('click', () => {
    audio.play('click');
    gameRunning = false;
    togglePause();
    showMenu();
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    audio.play('click');
    if (currentLevel < LEVELS.length) {
      currentLevel++;
      saveProgress();
      startLevel(currentLevel);
    } else {
      showMenu();
    }
    completeModal.classList.add('hidden');
  });
  document.getElementById('replay-btn').addEventListener('click', () => {
    audio.play('click');
    startLevel(currentLevel);
    completeModal.classList.add('hidden');
  });
  document.getElementById('start-btn').addEventListener('click', () => {
    audio.play('click');
    currentLevel = 1;
    saveProgress();
    startLevel(1);
    menuModal.classList.add('hidden');
  });
  document.getElementById('continue-btn').addEventListener('click', () => {
    audio.play('click');
    startLevel(currentLevel);
    menuModal.classList.add('hidden');
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    audio.play('click');
    if (confirm('Reset all progress?')) {
      localStorage.removeItem('balanceShift_progress');
      currentLevel = 1;
      document.getElementById('continue-btn').classList.add('hidden');
    }
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameRunning) togglePause();
    if (e.key === 'h' || e.key === 'H') hintBtn.click();
  });

  // Store updateInventory globally
  window.updateInventory = updateInventory;
}

function startLevel(levelNum) {
  levelData = LEVELS.find(l => l.id === levelNum);
  if (!levelData) return;
  
  seesaw.init(levelData);
  
  // Position fulcrum at center of design
  const fulcrumX = CONFIG.DESIGN_WIDTH / 2;
  const fulcrumY = CONFIG.DESIGN_HEIGHT / 2;
  seesaw.updateSlotPositions(fulcrumX, fulcrumY, 0);
  
  // Position unplaced weights in inventory area (bottom center)
  const invY = CONFIG.DESIGN_HEIGHT - 80;
  const invStartX = CONFIG.DESIGN_WIDTH / 2 - (seesaw.getAvailableWeights().length * 70) / 2;
  seesaw.getAvailableWeights().forEach((w, i) => {
    w.x = invStartX + i * 70 + 35;
    w.y = invY;
    w.targetX = w.x;
    w.targetY = w.y;
  });
  
  levelInfoEl.textContent = `Level ${levelData.id} / ${LEVELS.length}: ${levelData.name}`;
  startTime = Date.now();
  elapsedTime = 0;
  starsEarned = 0;
  gameRunning = true;
  
  window.updateInventory();
  
  // Hide modals
  pauseModal.classList.add('hidden');
  completeModal.classList.add('hidden');
  menuModal.classList.add('hidden');
}

function togglePause() {
  gameRunning = !gameRunning;
  pauseModal.classList.toggle('hidden', gameRunning);
}

function showMenu() {
  gameRunning = false;
  menuModal.classList.remove('hidden');
  pauseModal.classList.add('hidden');
  completeModal.classList.add('hidden');
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap at 100ms
  lastTime = timestamp;
  
  if (gameRunning) {
    // Update timer
    elapsedTime = (Date.now() - startTime) / 1000;
    const mins = Math.floor(elapsedTime / 60);
    const secs = (elapsedTime % 60).toFixed(2).padStart(5, '0');
    timerEl.textContent = `${mins}:${secs}`;
    
    // Time limit check
    if (levelData.timeLimit > 0 && elapsedTime > levelData.timeLimit) {
      audio.play('error');
      startLevel(currentLevel); // restart
    }
    
    // Physics
    seesaw.updatePhysics(dt);
    seesaw.updateSlotPositions(CONFIG.DESIGN_WIDTH/2, CONFIG.DESIGN_HEIGHT/2, seesaw.angle);
    
    // Update torque UI
    const { left, right, diff } = seesaw.calculateTorque();
    const total = left + right || 1;
    torqueLeftEl.style.width = `${(left/total)*100}%`;
    torqueRightEl.style.width = `${(right/total)*100}%`;
    torqueLVal.textContent = left.toFixed(1);
    torqueRVal.textContent = right.toFixed(1);
    
    // Check win
    if (seesaw.isBalanced) {
      gameRunning = false;
      completeLevel();
    }
  }
  
  // Render
  renderer.render(seesaw);
  requestAnimationFrame(gameLoop);
}

function completeLevel() {
  audio.play('balance');
  renderer.addBalanceParticles(CONFIG.DESIGN_WIDTH/2, CONFIG.DESIGN_HEIGHT/2);
  
  // Calculate stars
  const thresholds = CONFIG.STAR_THRESHOLDS;
  starsEarned = 0;
  if (elapsedTime <= thresholds[2]) starsEarned = 3;
  else if (elapsedTime <= thresholds[1]) starsEarned = 2;
  else if (elapsedTime <= thresholds[0]) starsEarned = 1;
  
  // Save best stars for level
  const saved = JSON.parse(localStorage.getItem('balanceShift_progress') || '{}');
  saved.levelStars = saved.levelStars || {};
  if (!saved.levelStars[currentLevel] || starsEarned > saved.levelStars[currentLevel]) {
    saved.levelStars[currentLevel] = starsEarned;
  }
  if (currentLevel < LEVELS.length) {
    saved.currentLevel = currentLevel + 1;
  }
  localStorage.setItem('balanceShift_progress', JSON.stringify(saved));
  
  // Show modal
  starsEl.innerHTML = '';
  for (let i = 1; i <= 3; i++) {
    const star = document.createElement('span');
    star.className = 'star' + (i <= starsEarned ? ' filled' : '');
    star.textContent = '★';
    starsEl.appendChild(star);
  }
  timeResultEl.textContent = `Time: ${elapsedTime.toFixed(2)}s`;
  document.getElementById('next-btn').classList.toggle('hidden', currentLevel >= LEVELS.length);
  completeModal.classList.remove('hidden');
}

// Start
audio.resume();
init();
