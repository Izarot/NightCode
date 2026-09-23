// Assembly Line Optimizer - Main Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas setup
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ratio = 16/9;
  let cw, ch;
  if (w/h > ratio) {
    ch = h;
    cw = ch * ratio;
  } else {
    cw = w;
    ch = cw / ratio;
  }
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  canvas.width = cw;
  canvas.height = ch;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game state
const STATE = {
  currency: 0,
  completedItems: 0,
  prestigePoints: 0,
  researchPoints: 0,
  beltSpeedMult: 1,
  stations: [],
  items: [],
  particles: [],
  floatingTexts: [],
  lastSave: Date.now(),
  lastTime: 0,
  accumulator: 0,
  speedSlider: { x: 0.02, y: 0.88, width: 0.3, height: 0.02, value: 1 },
  selectedStation: null,
  modal: null,
  settings: { masterVolume: 0.5, musicVolume: 0.3, musicEnabled: true },
  achievements: {},
  research: { fasterBelts: 0, reducedQueuePenalty: 0, autoUpgrade: 0 },
  offlineTimestamp: Date.now()
};

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
masterGain.gain.value = STATE.settings.masterVolume;

function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(masterGain);
  gain.gain.value = 0.1;
  switch(type) {
    case 'spawn': osc.type='square'; osc.frequency.value=440; gain.gain.value=0.1; break;
    case 'collect': osc.type='sine'; osc.frequency.value=660; gain.gain.value=0.15; break;
    case 'upgrade': osc.type='triangle'; osc.frequency.value=880; gain.gain.value=0.12; break;
    case 'breakdown': osc.type='sawtooth'; osc.frequency.value=110; gain.gain.value=0.2; break;
    case 'prestige': osc.type='sine'; osc.frequency.value=330; gain.gain.value=0.3; setTimeout(()=>osc.stop(),500); break;
  }
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

// Station types
const STATION_TYPES = {
  stamping: { name:'Stamping', baseTime:2.0, color:'#ff6f61', icon:'🔨' },
  painting: { name:'Painting', baseTime:1.5, color:'#6bcf7f', icon:'🎨' },
  testing: { name:'Testing', baseTime:1.0, color:'#4d96ff', icon:'🧪' }
};

// Initialize stations
function initStations() {
  const types = Object.keys(STATION_TYPES);
  STATE.stations = [];
  for(let i=0;i<3;i++) {
    STATE.stations.push({
      id: i,
      type: types[i],
      slot: i,
      level: 0,
      queue: [],
      processing: null,
      x: 0,
      y: 0.3,
      width: 0.12,
      height: 0.15
    });
  }
}

// Save/Load
function saveGame() {
  const saveData = {
    currency: STATE.currency,
    completedItems: STATE.completedItems,
    prestigePoints: STATE.prestigePoints,
    researchPoints: STATE.researchPoints,
    beltSpeedMult: STATE.beltSpeedMult,
    stations: STATE.stations.map(s=>({type:s.type,slot:s.slot,level:s.level})),
    lastSave: Date.now(),
    settings: STATE.settings,
    achievements: STATE.achievements,
    research: STATE.research
  };
  localStorage.setItem('ALO_save', JSON.stringify(saveData));
  STATE.lastSave = Date.now();
}

function loadGame() {
  const data = localStorage.getItem('ALO_save');
  if (!data) return false;
  try {
    const save = JSON.parse(data);
    STATE.currency = save.currency||0;
    STATE.completedItems = save.completedItems||0;
    STATE.prestigePoints = save.prestigePoints||0;
    STATE.researchPoints = save.researchPoints||0;
    STATE.beltSpeedMult = save.beltSpeedMult||1;
    STATE.settings = save.settings||STATE.settings;
    STATE.achievements = save.achievements||{};
    STATE.research = save.research||STATE.research;
    STATE.offlineTimestamp = save.lastSave||Date.now();
    if (save.stations) {
      STATE.stations = save.stations.map(s=>({
        id: Math.random(),
        type: s.type,
        slot: s.slot,
        level: s.level,
        queue: [],
        processing: null,
        x:0,y:0.3,width:0.12,height:0.15
      }));
    } else {
      initStations();
    }
    applyOfflineProgress(save.lastSave);
    return true;
  } catch(e) {
    console.error('Save load error:', e);
    return false;
  }
}

function applyOfflineProgress(lastSave) {
  if (!lastSave) return;
  const elapsed = (Date.now() - lastSave) / 1000;
  const capped = Math.min(elapsed, 4*3600);
  const itemsPerSec = 1 / Math.max(0.1, 1.0 / STATE.beltSpeedMult);
  const offlineEarn = Math.floor(capped * itemsPerSec * 10 * (1 + STATE.prestigePoints*0.05));
  STATE.currency += offlineEarn;
  STATE.completedItems += Math.floor(capped * itemsPerSec);
  if (offlineEarn > 0) addFloatingText(canvas.width*0.9, canvas.height*0.4, '+' + offlineEarn + ' OFFLINE');
}

// Game loop
let lastTimestamp = 0;
function gameLoop(timestamp) {
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  STATE.accumulator += delta / 1000;
  const dt = 1/60;
  while (STATE.accumulator >= dt) {
    update(dt);
    STATE.accumulator -= dt;
  }
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Update items
  for (let i = STATE.items.length - 1; i >= 0; i--) {
    const item = STATE.items[i];
    item.x += item.speed * dt;
    if (item.x > canvas.width + 50) {
      STATE.items.splice(i, 1);
      STATE.completedItems++;
      STATE.currency += 10 * (1 + STATE.prestigePoints*0.05);
      playSound('collect');
      addFloatingText(canvas.width*0.9, canvas.height*0.4, '+10');
      checkAchievements();
    }
  }
  // Spawn items
  STATE.spawnTimer = (STATE.spawnTimer||0) + dt;
  if (STATE.spawnTimer > 1.0 / STATE.beltSpeedMult) {
    STATE.spawnTimer = 0;
    STATE.items.push({ x: -50, y: canvas.height*0.35, speed: 100*STATE.beltSpeedMult, type: 'raw' });
    playSound('spawn');
  }
  // Update particles
  for (let i = STATE.particles.length - 1; i >= 0; i--) {
    const p = STATE.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) STATE.particles.splice(i, 1);
  }
  // Update floating texts
  for (let i = STATE.floatingTexts.length - 1; i >= 0; i--) {
    const t = STATE.floatingTexts[i];
    t.y -= 30 * dt;
    t.life -= dt;
    if (t.life <= 0) STATE.floatingTexts.splice(i, 1);
  }
  // Autosave
  if (Date.now() - STATE.lastSave > 5000) saveGame();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw background
  ctx.fillStyle = 'linear-gradient(to bottom, #1a1a1a, #0f0f0f)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw belt
  const beltY = canvas.height * 0.3;
  const beltHeight = canvas.height * 0.08;
  ctx.fillStyle = '#555';
  ctx.fillRect(0, beltY, canvas.width, beltHeight);
  // Draw stations
  STATE.stations.forEach(station => {
    const x = canvas.width * (0.1 + station.slot * 0.25);
    const y = beltY - canvas.height * 0.05;
    const w = canvas.width * 0.12;
    const h = canvas.height * 0.15;
    const type = STATION_TYPES[station.type];
    ctx.fillStyle = type.color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = (canvas.height * 0.05) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(type.icon, x + w/2, y + h/2 + 10);
  });
  // Draw items
  STATE.items.forEach(item => {
    ctx.fillStyle = item.type === 'raw' ? '#aaa' : '#ff0';
    ctx.beginPath();
    ctx.arc(item.x, item.y, 10, 0, Math.PI*2);
    ctx.fill();
  });
  // Draw particles
  STATE.particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // Draw floating texts
  STATE.floatingTexts.forEach(t => {
    ctx.fillStyle = t.color;
    ctx.font = t.size + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  });
  // Draw HUD
  drawHUD();
  // Draw speed slider
  drawSpeedSlider();
  // Draw modal if active
  if (STATE.modal) drawModal();
}

function drawHUD() {
  // Currency
  ctx.fillStyle = '#fff';
  ctx.font = (canvas.height * 0.04) + 'px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('💰 ' + formatNumber(STATE.currency), canvas.width * 0.02, canvas.height * 0.05);
  // Completed Items
  ctx.textAlign = 'right';
  ctx.fillText('📦 ' + formatNumber(STATE.completedItems), canvas.width * 0.98, canvas.height * 0.05);
  // Prestige & Research
  ctx.textAlign = 'center';
  ctx.fillText('⭐ ' + STATE.prestigePoints + '  🔬 ' + STATE.researchPoints, canvas.width * 0.5, canvas.height * 0.95);
  // Speedrun Timer
  ctx.fillStyle = '#4d96ff';
  ctx.fillText('⏱️ ' + formatTime(STATE.speedrunTime||0), canvas.width * 0.5, canvas.height * 0.05);
}

function drawSpeedSlider() {
  const x = canvas.width * STATE.speedSlider.x;
  const y = canvas.height * STATE.speedSlider.y;
  const w = canvas.width * STATE.speedSlider.width;
  const h = canvas.height * STATE.speedSlider.height;
  ctx.fillStyle = '#444';
  ctx.fillRect(x, y, w, h);
  const thumbX = x + (STATE.speedSlider.value - 0.5) / 2.5 * w;
  ctx.fillStyle = '#4d96ff';
  ctx.fillRect(thumbX - 10, y - 5, 20, h + 10);
  ctx.fillStyle = '#fff';
  ctx.font = (canvas.height * 0.025) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Speed: ' + STATE.beltSpeedMult.toFixed(1) + 'x', x + w/2, y - 5);
}

function drawModal() {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#222';
  const w = canvas.width * 0.4;
  const h = canvas.height * 0.4;
  ctx.fillRect(canvas.width/2 - w/2, canvas.height/2 - h/2, w, h);
  ctx.fillStyle = '#fff';
  ctx.font = (canvas.height * 0.03) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Upgrade Station', canvas.width/2, canvas.height/2 - 30);
  ctx.fillText('Cost: ' + (100 * Math.pow(1.5, STATE.selectedStation?.level||0)), canvas.width/2, canvas.height/2);
  ctx.fillStyle = '#6bcf7f';
  ctx.fillRect(canvas.width/2 - 60, canvas.height/2 + 20, 120, 40);
  ctx.fillStyle = '#fff';
  ctx.fillText('Buy', canvas.width/2, canvas.height/2 + 50);
}

function formatNumber(n) {
  if (n >= 1e9) return (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

function formatTime(s) {
  const h = Math.floor(s/3600);
  const m = Math.floor((s%3600)/60);
  const sec = Math.floor(s%60);
  return h.toString().padStart(2,'0') + ':' + m.toString().padStart(2,'0') + ':' + sec.toString().padStart(2,'0');
}

function addFloatingText(x, y, text, color='#ff0') {
  STATE.floatingTexts.push({
    x, y, text, color,
    life: 1,
    size: 20
  });
}

function addParticle(x, y, color) {
  STATE.particles.push({
    x, y,
    vx: (Math.random()-0.5)*100,
    vy: (Math.random()-0.5)*100,
    life: 0.5,
    maxLife: 0.5,
    size: 5,
    color: color
  });
}

function checkAchievements() {
  if (STATE.completedItems >= 10000 && !STATE.achievements.thousandItems) {
    STATE.achievements.thousandItems = true;
    STATE.currency += 1000;
    addFloatingText(canvas.width*0.5, canvas.height*0.5, 'ACHIEVEMENT: 10K Items!', '#ff6f61');
  }
}

// Input handlers
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  // Check slider
  const sliderX = canvas.width * STATE.speedSlider.x;
  const sliderY = canvas.height * STATE.speedSlider.y;
  const sliderW = canvas.width * STATE.speedSlider.width;
  const sliderH = canvas.height * STATE.speedSlider.height;
  if (x >= sliderX && x <= sliderX + sliderW && y >= sliderY && y <= sliderY + sliderH + 20) {
    STATE.draggingSlider = true;
    updateSlider(x, sliderX, sliderW);
  }
  // Check stations
  const beltY = canvas.height * 0.3;
  STATE.stations.forEach(station => {
    const sx = canvas.width * (0.1 + station.slot * 0.25);
    const sy = beltY - canvas.height * 0.05;
    const sw = canvas.width * 0.12;
    const sh = canvas.height * 0.15;
    if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) {
      STATE.selectedStation = station;
      STATE.modal = true;
    }
  });
});

canvas.addEventListener('mousemove', e => {
  if (STATE.draggingSlider) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const sliderX = canvas.width * STATE.speedSlider.x;
    const sliderW = canvas.width * STATE.speedSlider.width;
    updateSlider(x, sliderX, sliderW);
  }
});

canvas.addEventListener('mouseup', () => {
  STATE.draggingSlider = false;
});

canvas.addEventListener('click', e => {
  if (STATE.modal) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const modalW = canvas.width * 0.4;
    const modalH = canvas.height * 0.4;
    const btnX = canvas.width/2 - 60;
    const btnY = canvas.height/2 + 20;
    if (x >= btnX && x <= btnX + 120 && y >= btnY && y <= btnY + 40) {
      if (STATE.selectedStation && STATE.currency >= 100 * Math.pow(1.5, STATE.selectedStation.level)) {
        STATE.currency -= 100 * Math.pow(1.5, STATE.selectedStation.level);
        STATE.selectedStation.level++;
        playSound('upgrade');
        addParticle(canvas.width/2, canvas.height/2, '#6bcf7f');
      }
    }
    STATE.modal = false;
  }
});

function updateSlider(x, sliderX, sliderW) {
  const percent = (x - sliderX) / sliderW;
  STATE.beltSpeedMult = 0.5 + percent * 2.5;
  STATE.beltSpeedMult = Math.max(0.5, Math.min(3.0, STATE.beltSpeedMult));
  STATE.speedSlider.value = STATE.beltSpeedMult;
}

// Keyboard shortcuts
window.addEventListener('keydown', e => {
  switch(e.key.toLowerCase()) {
    case 'u': STATE.modal = true; break;
    case 's': alert('Settings: Mute=' + (masterGain.gain.value===0)); break;
    case 'p':
      if (STATE.completedItems >= 100000) {
        STATE.prestigePoints++;
        STATE.currency = 0;
        STATE.completedItems = 0;
        STATE.beltSpeedMult = 1;
        STATE.stations.forEach(s => s.level = 0);
        playSound('prestige');
        addFloatingText(canvas.width*0.5, canvas.height*0.5, 'PRESTIGE!', '#ff6f61');
      }
      break;
  }
});

// Speedrun timer
let speedrunStart = Date.now();
function updateSpeedrunTimer() {
  STATE.speedrunTime = (Date.now() - speedrunStart) / 1000;
  requestAnimationFrame(updateSpeedrunTimer);
}

// Init
if (!loadGame()) initStations();
STATE.spawnTimer = 0;
requestAnimationFrame(gameLoop);
updateSpeedrunTimer();

// Visibility change save
document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveGame();
});

// Initial save
if (!localStorage.getItem('ALO_save')) saveGame();
