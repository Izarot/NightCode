// DriftGate Velocity - Simplified Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gaugeCanvas = document.getElementById('gauge');
const gaugeCtx = gaugeCanvas.getContext('2d');
const miniMap = document.getElementById('minimap');
const miniCtx = miniMap.getContext('2d');

// Responsive canvas sizing
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gaugeCanvas.width = 100;
  gaugeCanvas.height = 100;
  miniMap.width = 120;
  miniMap.height = 120;
}
window.addEventListener('resize', resize);
resize();

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur, type='sine') {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.value = freq;
  o.type = type;
  g.gain.setValueAtTime(0.001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime+0.01);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
  o.start();
  o.stop(audioCtx.currentTime+dur);
}

// Game state
let keys = {};
let lastTime = 0;
let accumulator = 0;
const physicsStep = 1/120;
let speed = 0;
let boostActive = false;
let boostTimer = 0;
let driftMeter = 0;
let lap = 1;
let position = 1;
let startTime = 0;
let elapsed = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gatesPassed = 0;
let driftAngle = 0;

// Car object
const car = {
  x: 400, y: 300, angle: 0,
  vx: 0, vy: 0,
  size: 20
};

// Track data - simple oval
const track = {
  width: 800, height: 600,
  centerX: 400, centerY: 300
};

// Gates
const gates = [];
for(let i=0;i<8;i++){
  gates.push({
    x: 200 + i*100, y: 150 + (i%2)*300,
    type: i%3===0 ? 'boost' : 'checkpoint',
    passed: false
  });
}

// Input handlers
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Physics update
function updatePhysics(dt) {
  const acc = keys['ArrowUp'] || keys['KeyW'];
  const brake = keys['ArrowDown'] || keys['KeyS'];
  const left = keys['ArrowLeft'] || keys['KeyA'];
  const right = keys['ArrowRight'] || keys['KeyD'];
  const drift = keys['Space'];

  // Acceleration
  if(acc) speed = Math.min(speed + 200*dt, 450);
  else if(brake) speed = Math.max(speed - 300*dt, -200);
  else speed *= 0.98;

  // Boost
  if(boostActive) {
    speed *= 1.4;
    boostTimer -= dt;
    if(boostTimer <= 0) { boostActive = false; }
  }

  // Steering
  let turnRate = 2.5 * (speed/(speed+100));
  if(left) car.angle -= turnRate*dt;
  if(right) car.angle += turnRate*dt;

  // Drift
  const forwardX = Math.sin(car.angle);
  const forwardY = -Math.cos(car.angle);
  car.vx = forwardX * speed;
  car.vy = forwardY * speed;

  if(drift && speed > 50) {
    driftMeter = Math.min(driftMeter + dt*50, 100);
    driftAngle = Math.abs(car.angle - Math.atan2(car.vy, car.vx));
  } else {
    driftMeter = Math.max(driftMeter - dt*20, 0);
  }

  // Update position
  car.x += car.vx * dt;
  car.y += car.vy * dt;

  // Gate collisions
  for(const gate of gates) {
    if(!gate.passed) {
      const dx = car.x - gate.x;
      const dy = car.y - gate.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 40) {
        gate.passed = true;
        gatesPassed++;
        if(gate.type === 'boost' && drift && driftAngle > 0.4) {
          boostActive = true;
          boostTimer = 2.5;
          driftMeter = Math.max(driftMeter - 50, 0);
          playSound(150, 0.3, 'square');
          playSound(80, 0.5, 'sawtooth');
        } else {
          playSound(400, 0.1, 'sine');
        }
      }
    }
  }

  // Reset gates
  if(gatesPassed >= gates.length) {
    gatesPassed = 0;
    lap++;
    if(lap > 3) lap = 1;
    gates.forEach(g => g.passed = false);
  }

  // Update HUD
  document.getElementById('speed').textContent = Math.round(speed) + ' KM/H';
  document.getElementById('lap').textContent = `LAP ${lap}/3`;
  document.getElementById('pos').textContent = `POS: ${position}/8`;

  // Timer
  if(!startTime) startTime = performance.now();
  elapsed = (performance.now() - startTime) / 1000;
  const mins = Math.floor(elapsed/60);
  const secs = (elapsed%60).toFixed(2).padStart(5,'0');
  document.getElementById('timer').textContent = `${mins}:${secs}`;

  // High score
  if(elapsed > parseFloat(highScore)) {
    highScore = elapsed.toFixed(2);
    localStorage.setItem('highScore', highScore);
  }
}

// Rendering
function render() {
  // Clear
  ctx.fillStyle = '#05060A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Camera offset
  const camX = canvas.width/2 - car.x;
  const camY = canvas.height/2 - car.y;

  // Draw track
  ctx.save();
  ctx.translate(camX, camY);
  ctx.fillStyle = '#1A1D24';
  ctx.fillRect(track.centerX-track.width/2, track.centerY-track.height/2, track.width, track.height);

  // Road markings
  ctx.strokeStyle = '#FFFFFF';
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(track.centerX-track.width/2+50, track.centerY);
  ctx.lineTo(track.centerX+track.width/2-50, track.centerY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw gates
  for(const gate of gates) {
    ctx.fillStyle = gate.type === 'boost' ? '#FFD700' : '#00F0FF';
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, 10, 0, Math.PI*2);
    ctx.fill();
    if(gate.type === 'boost') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#FFD700';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Draw car
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = boostActive ? '#FFFFFF' : (driftMeter > 0 ? '#FF4500' : '#00F0FF');
  ctx.beginPath();
  ctx.moveTo(-car.size/2, -car.size);
  ctx.lineTo(car.size/2, 0);
  ctx.lineTo(-car.size/2, car.size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();

  // Draw gauge
  drawGauge();
  drawMiniMap();
}

function drawGauge() {
  gaugeCtx.clearRect(0,0,100,100);
  gaugeCtx.fillStyle = '#05060A';
  gaugeCtx.fillRect(0,0,100,100);
  gaugeCtx.strokeStyle = '#00F0FF';
  gaugeCtx.lineWidth = 3;
  gaugeCtx.beginPath();
  gaugeCtx.arc(50,50,40,0,Math.PI*2);
  gaugeCtx.stroke();
  const angle = (driftMeter/100) * Math.PI * 2;
  gaugeCtx.beginPath();
  gaugeCtx.arc(50,50,40,0,angle);
  gaugeCtx.strokeStyle = '#FF4500';
  gaugeCtx.lineWidth = 4;
  gaugeCtx.stroke();
  gaugeCtx.fillStyle = '#FFFFFF';
  gaugeCtx.font = '10px monospace';
  gaugeCtx.textAlign = 'center';
  if(boostActive) {
    gaugeCtx.fillText('BOOST', 50, 50);
    gaugeCtx.fillText(boostTimer.toFixed(1)+'s', 50, 65);
  } else {
    gaugeCtx.fillText(Math.round(driftMeter)+'%', 50, 55);
  }
}

function drawMiniMap() {
  miniCtx.clearRect(0,0,120,120);
  miniCtx.fillStyle = '#05060A';
  miniCtx.fillRect(0,0,120,120);
  miniCtx.strokeStyle = '#00F0FF';
  miniCtx.lineWidth = 1;
  miniCtx.strokeRect(0,0,120,120);
  // Track
  miniCtx.fillStyle = '#1A1D24';
  miniCtx.fillRect(20,20,80,80);
  // Car
  miniCtx.fillStyle = '#00F0FF';
  miniCtx.beginPath();
  miniCtx.arc(60,60,3,0,Math.PI*2);
  miniCtx.fill();
  // Gates
  for(const gate of gates) {
    miniCtx.fillStyle = gate.type === 'boost' ? '#FFD700' : '#00F0FF';
    miniCtx.beginPath();
    miniCtx.arc(20+gate.x/10, 20+gate.y/10, 2, 0, Math.PI*2);
    miniCtx.fill();
  }
}

// Game loop
function gameLoop(currentTime) {
  if(!lastTime) lastTime = currentTime;
  let dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  accumulator += dt;
  while(accumulator >= physicsStep) {
    updatePhysics(physicsStep);
    accumulator -= physicsStep;
  }
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
