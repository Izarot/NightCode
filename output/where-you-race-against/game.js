// Ghost Racer - Minimal Implementation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniMap = document.getElementById('miniMap');
const miniCtx = miniMap.getContext('2d');
const lapTimerEl = document.getElementById('lapTimer');
const speedNeedle = document.getElementById('speedNeedle');
const ghostDeltaBar = document.getElementById('ghostDeltaBar');

// Responsive scaling
function resize() {
  const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
  canvas.style.width = (canvas.width * scale) + 'px';
  canvas.style.height = (canvas.height * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

// Color Palette
const COLORS = {
  player: '#00D4FF',
  ghost: '#B800FF',
  track: '#2A2A2A',
  trackMark: '#CCCCCC',
  bg: '#0A0A1A',
  star: '#FFFFFF',
  particle: '#FFFFFF'
};

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='sine', vol=0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}
function engineSound(speed) {
  if (!engineOsc) {
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.connect(engineGain).connect(audioCtx.destination);
    engineGain.gain.value = 0.05;
    engineOsc.start();
  }
  engineOsc.frequency.value = 80 + speed * 20;
}
let engineOsc = null, engineGain = null;

// Track Generation
function generateTrack() {
  const segments = [];
  let x = 512, y = 600, angle = -Math.PI/2;
  const segmentCount = 8;
  for (let i = 0; i < segmentCount; i++) {
    const type = Math.random();
    if (type < 0.4) { // straight
      const len = 200 + Math.random() * 200;
      segments.push({type: 'straight', x, y, angle, length: len});
      x += Math.cos(angle) * len;
      y += Math.sin(angle) * len;
    } else if (type < 0.7) { // gentle curve
      const radius = 150 + Math.random() * 150;
      const sweep = (Math.random() - 0.5) * Math.PI;
      segments.push({type: 'curve', x, y, angle, radius, sweep});
      angle += sweep;
      x += Math.cos(angle) * radius * Math.abs(sweep);
      y += Math.sin(angle) * radius * Math.abs(sweep);
    } else { // sharp turn
      const radius = 50 + Math.random() * 50;
      const sweep = (Math.random() > 0.5 ? 1 : -1) * (Math.PI/2 + Math.random() * Math.PI/2);
      segments.push({type: 'sharp', x, y, angle, radius, sweep});
      angle += sweep;
      x += Math.cos(angle) * radius * Math.abs(sweep);
      y += Math.sin(angle) * radius * Math.abs(sweep);
    }
  }
  // Close loop (simplified)
  return segments;
}
const track = generateTrack();

// Compute track centerline points for rendering and collision
const centerline = [];
function buildCenterline() {
  centerline.length = 0;
  let x = 512, y = 600, angle = -Math.PI/2;
  centerline.push({x, y});
  for (const seg of track) {
    if (seg.type === 'straight') {
      for (let i = 1; i <= 10; i++) {
        const nx = x + Math.cos(angle) * seg.length * i/10;
        const ny = y + Math.sin(angle) * seg.length * i/10;
        centerline.push({x: nx, y: ny});
      }
      x += Math.cos(angle) * seg.length;
      y += Math.sin(angle) * seg.length;
    } else {
      const steps = Math.ceil(Math.abs(seg.sweep) * 10);
      for (let i = 1; i <= steps; i++) {
        const a = angle + seg.sweep * i/steps;
        const nx = x + Math.cos(a) * seg.radius * Math.abs(seg.sweep) * i/steps;
        const ny = y + Math.sin(a) * seg.radius * Math.abs(seg.sweep) * i/steps;
        centerline.push({x: nx, y: ny});
      }
      angle += seg.sweep;
      x += Math.cos(angle) * seg.radius * Math.abs(seg.sweep);
      y += Math.sin(angle) * seg.radius * Math.abs(seg.sweep);
    }
  }
}
buildCenterline();

// Checkpoints: every 1/4 of centerline
const checkpoints = [];
for (let i = 0; i < 4; i++) {
  const idx = Math.floor(centerline.length * i / 4);
  checkpoints.push({x: centerline[idx].x, y: centerline[idx].y, radius: 50, passed: false});
}

// Player State
const player = {
  x: 512, y: 600, angle: -Math.PI/2,
  vx: 0, vy: 0, speed: 0,
  maxSpeed: 8, accel: 0.3, friction: 0.95,
  steerSpeed: 0.04, driftFactor: 0.15,
  ghostRecord: [], ghostReplay: [], ghostDelay: 30, // 0.5s at 60fps
  recording: true, lapStart: 0, lapTime: 0, bestLap: Infinity,
  checkpointIndex: 0, lapCount: 0
};

// Load best lap from localStorage
const saved = localStorage.getItem('ghostRacerBest');
if (saved) {
  const data = JSON.parse(saved);
  player.bestLap = data.time;
  player.ghostReplay = data.ghost || [];
}

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
// Touch controls
const touchState = { left: false, right: false, accel: false, brake: false };
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.clientX < window.innerWidth/2) touchState.accel = true;
    else touchState.brake = true;
  }
}, {passive: false});
canvas.addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    touchState.accel = false; touchState.brake = false;
  }
});

// Game Loop
let lastTime = 0;
function gameLoop(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function update(dt) {
  // Input
  const accel = keys['ArrowUp'] || keys['KeyW'] || touchState.accel;
  const brake = keys['ArrowDown'] || keys['KeyS'] || touchState.brake;
  const left = keys['ArrowLeft'] || keys['KeyA'];
  const right = keys['ArrowRight'] || keys['KeyD'];
  const space = keys['Space'];

  // Physics
  if (accel) player.speed = Math.min(player.maxSpeed, player.speed + player.accel);
  else if (brake) player.speed = Math.max(-player.maxSpeed/2, player.speed - player.accel*2);
  else player.speed *= player.friction;

  let steer = 0;
  if (left) steer -= 1;
  if (right) steer += 1;
  const steerRate = player.steerSpeed * (1 - Math.abs(player.speed)/player.maxSpeed * 0.5);
  player.angle += steer * steerRate;

  // Drift momentum retention
  if (Math.abs(steer) > 0 && Math.abs(player.speed) > player.maxSpeed * 0.7) {
    player.speed *= (1 - player.driftFactor * Math.abs(steer));
  }

  player.vx = Math.cos(player.angle) * player.speed;
  player.vy = Math.sin(player.angle) * player.speed;
  player.x += player.vx;
  player.y += player.vy;

  // Boundary collision (simple screen wrap for now)
  if (player.x < 0) player.x = canvas.width;
  if (player.x > canvas.width) player.x = 0;
  if (player.y < 0) player.y = canvas.height;
  if (player.y > canvas.height) player.y = 0;

  // Engine sound
  engineSound(Math.abs(player.speed));

  // Ghost recording
  if (player.recording) {
    if (player.ghostRecord.length % 10 === 0) {
      player.ghostRecord.push({x: player.x, y: player.y, angle: player.angle, speed: player.speed});
    }
  }

  // Ghost replay
  if (player.ghostReplay.length > 0) {
    const ghostIdx = Math.floor(player.ghostRecord.length - player.ghostDelay);
    // simplified: just use recorded positions with delay
  }

  // Checkpoints
  const cp = checkpoints[player.checkpointIndex];
  const dx = player.x - cp.x, dy = player.y - cp.y;
  if (dx*dx + dy*dy < cp.radius*cp.radius) {
    cp.passed = true;
    player.checkpointIndex = (player.checkpointIndex + 1) % checkpoints.length;
    if (player.checkpointIndex === 0) {
      // Lap complete
      player.lapTime = performance.now() - player.lapStart;
      if (player.lapTime < player.bestLap) {
        player.bestLap = player.lapTime;
        player.ghostReplay = [...player.ghostRecord];
        localStorage.setItem('ghostRacerBest', JSON.stringify({time: player.bestLap, ghost: player.ghostReplay}));
      }
      player.ghostRecord = [];
      player.lapStart = performance.now();
      player.lapCount++;
      checkpoints.forEach(c => c.passed = false);
      playTone(800, 0.1, 'square', 0.2);
    } else {
      playTone(600, 0.05, 'sine', 0.1);
    }
  }

  // Update HUD
  const speedPct = Math.abs(player.speed) / player.maxSpeed;
  speedNeedle.style.transform = `rotate(${ -90 + speedPct * 180 }deg)`;
  const minutes = Math.floor(player.lapTime / 60000);
  const seconds = Math.floor((player.lapTime % 60000) / 1000);
  const ms = Math.floor(player.lapTime % 1000);
  lapTimerEl.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}.${ms.toString().padStart(3,'0')}`;
  // Ghost delta
  if (player.bestLap !== Infinity) {
    const delta = (player.lapTime - player.bestLap) / 2500; // range -2.5 to 2.5
    const clamped = Math.max(-1, Math.min(1, delta));
    ghostDeltaBar.style.width = `${50 + clamped * 50}%`;
    ghostDeltaBar.style.background = clamped < 0 ? '#00D4FF' : '#FF0000';
  }
}

function render() {
  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Stars
  ctx.fillStyle = COLORS.star;
  for (let i = 0; i < 100; i++) {
    const x = (i * 1234.5) % canvas.width;
    const y = (i * 5678.9) % canvas.height;
    ctx.fillRect(x, y, 1, 1);
  }

  // Draw track
  ctx.strokeStyle = COLORS.trackMark;
  ctx.lineWidth = 40;
  ctx.beginPath();
  ctx.moveTo(centerline[0].x, centerline[0].y);
  for (const p of centerline) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.stroke();
  // Track edges
  ctx.strokeStyle = COLORS.track;
  ctx.lineWidth = 44;
  ctx.stroke();

  // Draw ghost
  if (player.ghostReplay.length > 0) {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = COLORS.ghost;
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(player.ghostReplay[0].x, player.ghostReplay[0].y);
    for (let i = 1; i < player.ghostReplay.length; i++) {
      ctx.lineTo(player.ghostReplay[i].x, player.ghostReplay[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Draw player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -8);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Mini-map
  miniCtx.fillStyle = COLORS.bg;
  miniCtx.fillRect(0, 0, 120, 120);
  miniCtx.strokeStyle = COLORS.trackMark;
  miniCtx.lineWidth = 2;
  miniCtx.beginPath();
  const scale = 0.1;
  miniCtx.moveTo(centerline[0].x * scale, centerline[0].y * scale);
  for (const p of centerline) miniCtx.lineTo(p.x * scale, p.y * scale);
  miniCtx.closePath();
  miniCtx.stroke();
  // Player dot
  miniCtx.fillStyle = COLORS.player;
  miniCtx.beginPath();
  miniCtx.arc(player.x * scale, player.y * scale, 3, 0, Math.PI*2);
  miniCtx.fill();
  // Ghost dot
  if (player.ghostReplay.length > 0) {
    const g = player.ghostReplay[Math.floor(player.ghostReplay.length/2)];
    miniCtx.fillStyle = COLORS.ghost;
    miniCtx.globalAlpha = 0.6;
    miniCtx.beginPath();
    miniCtx.arc(g.x * scale, g.y * scale, 3, 0, Math.PI*2);
    miniCtx.fill();
    miniCtx.globalAlpha = 1;
  }
}

// Start lap timer
player.lapStart = performance.now();