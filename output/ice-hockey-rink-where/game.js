// Ice Hockey Practice Rink - Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniMap = document.getElementById('miniMap');
const miniCtx = miniMap.getContext('2d');

// Responsive sizing
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Logical rink size 800x400, scale to fit
  const scaleX = canvas.width / 800;
  const scaleY = canvas.height / 400;
  window.gameScale = Math.min(scaleX, scaleY);
  window.offsetX = (canvas.width - 800 * window.gameScale) / 2;
  window.offsetY = (canvas.height - 400 * window.gameScale) / 2;
}
window.addEventListener('resize', resize);
resize();

// Color Palette
const COLORS = {
  ice: '#e8f4fd',
  iceDark: '#d0e8f0',
  board: '#ffffff',
  lineRed: '#e53935',
  lineBlue: '#1e88e5',
  circle: '#ffffff88',
  home: '#1565c0',
  away: '#f5f5f5',
  puck: '#212121',
  trail: '#ffffff44',
  spray: '#ffffffaa',
  net: '#ffffff',
  goalFlash: '#ffeb3b',
  uiPrimary: '#00e5ff',
  uiSecondary: '#ff6d00',
  uiBg: '#0d1b2add',
  uiBorder: '#00bcd4'
};

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='sine', vol=0.1, start=0) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + start);
  osc.stop(audioCtx.currentTime + start + dur);
}
function sfxSkate() { playTone(120, 0.05, 'sawtooth', 0.03); }
function sfxPuckHit() { playTone(300, 0.1, 'square', 0.08); playTone(150, 0.15, 'triangle', 0.05, 0.02); }
function sfxBoard() { playTone(80, 0.2, 'sawtooth', 0.1); }
function sfxGoal() { [440, 554, 660, 880].forEach((f,i)=>playTone(f,0.15,'triangle',0.1,i*0.1)); }
function sfxPass() { playTone(400, 0.08, 'sine', 0.06); playTone(600, 0.05, 'sine', 0.04, 0.03); }
function sfxCrowd() { for(let i=0;i<5;i++) playTone(200+Math.random()*300, 0.3, 'triangle', 0.02, i*0.1); }

// Game State
let gameState = 'menu'; // menu, playing, gameover
let currentDrill = 'corner';
let goalieSpeedMult = 1.0;
let highScore = parseInt(localStorage.getItem('hockeyHighScore')) || 0;
document.getElementById('highScore').textContent = highScore;

// Rink Constants
const RINK_W = 800, RINK_H = 400;
const GOAL_W = 120, GOAL_D = 20;
const PLAYER_R = 12, PUCK_R = 6;
const MAX_SPEED = 8, ACCEL = 0.4, FRICTION = 0.96, DRIBBLE_MULT = 0.5;
const TURN_FAST = 6 * Math.PI/180, TURN_SLOW = 12 * Math.PI/180;
const PUCK_FRICTION = 0.98, BOARD_RESTITUTION = 0.8;
const SHOT_POWER_MAX = 24, SHOT_CHARGE_RATE = 1.2;

// Entities
let player, puck, goalie, teammates = [], drillTargets = [];
let shotPower = 0, chargingShot = false, aimingAngle = 0;
let roundTime = 60, roundTimer = 60;
let stats = { shots: 0, goals: 0, passes: 0, passSuccess: 0 };
let speedrunStart = 0, speedrunTime = 0;
let particles = [], screenShake = 0;

// Input
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; if(e.code==='ShiftLeft'||e.code==='ShiftRight') player?.setDribble(true); });
window.addEventListener('keyup', e => { keys[e.code] = false; if(e.code==='ShiftLeft'||e.code==='ShiftRight') player?.setDribble(false); });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left - window.offsetX) / window.gameScale;
  const my = (e.clientY - rect.top - window.offsetY) / window.gameScale;
  if (player) aimingAngle = Math.atan2(my - player.y, mx - player.x);
});
canvas.addEventListener('mousedown', e => { if (gameState==='playing' && e.button===0) chargingShot = true; });
canvas.addEventListener('mouseup', e => { if (gameState==='playing' && e.button===0 && chargingShot) { shoot(); chargingShot = false; } });
canvas.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; handleTouch(t); chargingShot = true; }, {passive:false});
canvas.addEventListener('touchmove', e => { e.preventDefault(); const t = e.touches[0]; handleTouch(t); }, {passive:false});
canvas.addEventListener('touchend', e => { if (chargingShot) { shoot(); chargingShot = false; } });
function handleTouch(t) {
  const rect = canvas.getBoundingClientRect();
  const mx = (t.clientX - rect.left - window.offsetX) / window.gameScale;
  const my = (t.clientY - rect.top - window.offsetY) / window.gameScale;
  if (player) aimingAngle = Math.atan2(my - player.y, mx - player.x);
}

// Menu Buttons
document.querySelectorAll('.drillBtn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.drillBtn').forEach(x=>x.style.background='');
  b.style.background = 'linear-gradient(135deg, #0097a7, #006064)';
  currentDrill = b.dataset.drill;
}));
document.querySelectorAll('.difficultyBtn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.difficultyBtn').forEach(x=>x.classList.remove('selected'));
  b.classList.add('selected');
  goalieSpeedMult = parseFloat(b.dataset.speed);
}));
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', () => { gameState='menu'; document.getElementById('gameOverScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden'); });

// Classes
class Player {
  constructor(x,y) { this.x=x; this.y=y; this.vx=0; this.vy=0; this.angle=0; this.dribble=false; this.stickLen=25; }
  setDribble(d) { this.dribble=d; }
  update() {
    let ax=0, ay=0;
    if(keys['KeyW']||keys['ArrowUp']) ay=-1;
    if(keys['KeyS']||keys['ArrowDown']) ay=1;
    if(keys['KeyA']||keys['ArrowLeft']) ax=-1;
    if(keys['KeyD']||keys['ArrowRight']) ax=1;
    if(ax||ay) {
      const mag = Math.hypot(ax,ay);
      ax/=mag; ay/=mag;
      const targetAngle = Math.atan2(ay,ax);
      let diff = targetAngle - this.angle;
      while(diff > Math.PI) diff -= 2*Math.PI;
      while(diff < -Math.PI) diff += 2*Math.PI;
      const turnRate = (Math.hypot(this.vx,this.vy) > 2) ? TURN_FAST : TURN_SLOW;
      if(Math.abs(diff) > turnRate) this.angle += Math.sign(diff)*turnRate;
      else this.angle = targetAngle;
      const acc = ACCEL * (this.dribble ? DRIBBLE_MULT : 1);
      this.vx += Math.cos(this.angle)*acc;
      this.vy += Math.sin(this.angle)*acc;
      if (Math.random() < 0.3) sfxSkate();
    }
    this.vx *= FRICTION; this.vy *= FRICTION;
    const speed = Math.hypot(this.vx,this.vy);
    if(speed > MAX_SPEED*(this.dribble?DRIBBLE_MULT:1)) { this.vx/=speed; this.vy/=speed; this.vx*=MAX_SPEED*(this.dribble?DRIBBLE_MULT:1); this.vy*=MAX_SPEED*(this.dribble?DRIBBLE_MULT:1); }
    this.x += this.vx; this.y += this.vy;
    // Board collision
    const margin = PLAYER_R + 10;
    if(this.x < margin) { this.x = margin; this.vx *= -0.5; sfxBoard(); }
    if(this.x > RINK_W - margin) { this.x = RINK_W - margin; this.vx *= -0.5; sfxBoard(); }
    if(this.y < margin) { this.y = margin; this.vy *= -0.5; sfxBoard(); }
    if(this.y > RINK_H - margin) { this.y = RINK_H - margin; this.vy *= -0.5; sfxBoard(); }
    // Puck stick handling
    if(puck && !puck.free) {
      const stickX = this.x + Math.cos(this.angle)*this.stickLen;
      const stickY = this.y + Math.sin(this.angle)*this.stickLen;
      puck.x += (stickX - puck.x)*0.15;
      puck.y += (stickY - puck.y)*0.15;
      puck.vx = this.vx; puck.vy = this.vy;
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    // Body
    ctx.fillStyle = COLORS.home;
    ctx.beginPath();
    ctx.ellipse(0,0,14,10,0,0,Math.PI*2);
    ctx.fill();
    // Helmet
    ctx.fillStyle = '#0d1b2a';
    ctx.beginPath();
    ctx.ellipse(16,0,8,7,0,0,Math.PI*2);
    ctx.fill();
    // Stick
    ctx.strokeStyle = '#8d6e63';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(18,2);
    ctx.lineTo(this.stickLen, 2);
    ctx.stroke();
    // Blade
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(this.stickLen-6, -1, 12, 4);
    ctx.restore();
  }
}

class Puck {
  constructor(x,y) { this.x=x; this.y=y; this.vx=0; this.vy=0; this.free=false; this.trail=[]; }
  update() {
    if(this.free) {
      this.x += this.vx; this.y += this.vy;
      this.vx *= PUCK_FRICTION; this.vy *= PUCK_FRICTION;
      if(Math.hypot(this.vx,this.vy) < 0.05) { this.vx=this.vy=0; }
      // Trail
      this.trail.unshift({x:this.x, y:this.y, life:1});
      if(this.trail.length > 15) this.trail.pop();
      this.trail.forEach(p=>p.life-=0.07);
      // Board collision
      if(this.x < PUCK_R+10) { this.x = PUCK_R+10; this.vx *= -BOARD_RESTITUTION; sfxPuckHit(); this.spawnSpray(); }
      if(this.x > RINK_W-PUCK_R-10) { this.x = RINK_W-PUCK_R-10; this.vx *= -BOARD_RESTITUTION; sfxPuckHit(); this.spawnSpray(); }
      if(this.y < PUCK_R+10) { this.y = PUCK_R+10; this.vy *= -BOARD_RESTITUTION; sfxPuckHit(); this.spawnSpray(); }
      if(this.y > RINK_H-PUCK_R-10) { this.y = RINK_H-PUCK_R-10; this.vy *= -BOARD_RESTITUTION; sfxPuckHit(); this.spawnSpray(); }
      // Goal detection
      this.checkGoal();
      // Goalie collision
      if(goalie) this.checkGoalie();
      // Teammate pass reception
      teammates.forEach(t=>t.checkPass(this));
    }
  }
  spawnSpray() {
    for(let i=0;i<5;i++) particles.push(new Particle(this.x, this.y, COLORS.spray, Math.random()*Math.PI*2, 2+Math.random()*3, 0.3));
  }
  checkGoal() {
    // Left goal (player shoots left? Actually player is home team, shoots on right goal? Let's assume player shoots on right goal)
    const goalY = RINK_H/2;
    const goalHalf = GOAL_W/2;
    // Right goal
    if(this.x > RINK_W - 10 - GOAL_D && Math.abs(this.y - goalY) < goalHalf) {
      if(this.vx > 0) { scoreGoal(); }
    }
    // Left goal (own goal? ignore)
  }
  checkGoalie() {
    const dx = this.x - goalie.x;
    const dy = this.y - goalie.y;
    const dist = Math.hypot(dx,dy);
    if(dist < PLAYER_R + PUCK_R + 5) {
      // Save
      const angle = Math.atan2(dy,dx);
      this.vx = Math.cos(angle) * Math.hypot(this.vx,this.vy) * 0.5;
      this.vy = Math.sin(angle) * Math.hypot(this.vx,this.vy) * 0.5;
      sfxPuckHit();
      goalie.triggerDive(angle);
      screenShake = 5;
    }
  }
  draw() {
    // Trail
    this.trail.forEach((p,i) => {
      ctx.globalAlpha = p.life * 0.3;
      ctx.fillStyle = COLORS.trail;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PUCK_R * (0.5 + 0.5*p.life), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Puck
    ctx.fillStyle = COLORS.puck;
    ctx.beginPath();
    ctx.arc(this.x, this.y, PUCK_R, 0, Math.PI*2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = '#424242';
    ctx.beginPath();
    ctx.arc(this.x-1, this.y-1, PUCK_R*0.4, 0, Math.PI*2);
    ctx.fill();
  }
}

class Goalie {
  constructor() { this.x = RINK_W - 30; this.y = RINK_H/2; this.targetY = RINK_H/2; this.diveAngle=0; this.diveTime=0; this.width=20; this.height=40; }
  update() {
    if(this.diveTime > 0) { this.diveTime--; return; }
    // Predict puck position
    if(puck && puck.free && puck.vx > 0) {
      const timeToGoal = (RINK_W - 10 - GOAL_D - puck.x) / puck.vx;
      if(timeToGoal > 0 && timeToGoal < 120) {
        const predY = puck.y + puck.vy * timeToGoal;
        this.targetY = predY;
      }
    }
    // Reaction delay
    const dy = this.targetY - this.y;
    this.y += dy * 0.08 * goalieSpeedMult;
    // Clamp
    const limit = GOAL_W/2 - 15;
    this.y = Math.max(RINK_H/2 - limit, Math.min(RINK_H/2 + limit, this.y));
  }
  triggerDive(angle) { this.diveAngle = angle; this.diveTime = 20; }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    if(this.diveTime > 0) ctx.rotate(this.diveAngle);
    // Pads
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    // Details
    ctx.fillStyle = COLORS.home;
    ctx.fillRect(-this.width/2, -this.height/2, this.width, 8);
    ctx.fillRect(-this.width/2, this.height/2-8, this.width, 8);
    // Glove/Blocker
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath(); ctx.arc(-this.width/2-5, 0, 10, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.width/2+5, 0, 10, 0, Math.PI*2); ctx.fill();
    // Mask
    ctx.fillStyle = '#212121';
    ctx.beginPath(); ctx.ellipse(0, -this.height/2-5, 12, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

class Teammate {
  constructor(x,y, isTarget=false) { this.x=x; this.y=y; this.isTarget=isTarget; this.r=PLAYER_R; this.color=COLORS.home; }
  checkPass(p) {
    if(!p.free) return;
    const dx = this.x - p.x, dy = this.y - p.y;
    const dist = Math.hypot(dx,dy);
    if(dist < this.r + PUCK_R + 5 && this.isTarget) {
      // Receive pass
      p.free = false;
      p.vx = p.vy = 0;
      stats.passes++; stats.passSuccess++;
      updatePassAccuracy();
      sfxPass();
this.isTarget = false; // Target reached, maybe change drill logic
      // For drills that require multiple passes, we might need to set a new target
      if (currentDrill === 'passMove' || currentDrill === 'crossPass') {
        // Find next target or reset
        const targets = teammates.filter(t => t.isTarget);
        if (targets.length === 0) {
          // All targets hit, maybe create new target or end drill
          // For simplicity, we'll just make a random teammate a target again after a delay
          setTimeout(() => {
            const available = teammates.filter(t => !t.isTarget);
            if (available.length) available[Math.floor(Math.random()*available.length)].isTarget = true;
          }, 1000);
        }
      }
    }
  }
  update() {
    // Teammates can move slightly or stay static depending on drill
    if (currentDrill === 'passMove') {
      // Move in a small pattern
      this.x += Math.sin(Date.now()/1000 + this.x) * 0.5;
      this.y += Math.cos(Date.now()/1000 + this.y) * 0.5;
      // Keep within bounds
      this.x = Math.max(50, Math.min(RINK_W-50, this.x));
      this.y = Math.max(50, Math.min(RINK_H-50, this.y));
    }
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0,0,14,10,0,0,Math.PI*2);
    ctx.fill();
    // Helmet
    ctx.fillStyle = '#0d1b2a';
    ctx.beginPath();
    ctx.ellipse(16,0,8,7,0,0,Math.PI*2);
    ctx.fill();
    // Target indicator
    if (this.isTarget) {
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -25, 15, 0, Math.PI*2);
      ctx.stroke();
      // Pulsing ring
      const pulse = 10 + Math.sin(Date.now()/200)*5;
      ctx.beginPath();
      ctx.arc(0, -25, pulse, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

class Particle {
  constructor(x, y, color, angle, speed, life) {
    this.x = x; this.y = y; this.color = color;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = life; this.maxLife = life;
    this.size = 2 + Math.random()*3;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.95; this.vy *= 0.95;
    this.life -= 0.02;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (this.life/this.maxLife), 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Drill Setup
function setupDrill(drill) {
  teammates = [];
  drillTargets = [];
  player = new Player(150, RINK_H/2);
  puck = new Puck(player.x + 30, player.y);
  puck.free = false;
  goalie = new Goalie();
  roundTimer = roundTime;
  stats = { shots: 0, goals: 0, passes: 0, passSuccess: 0 };
  updateUI();
  speedrunStart = Date.now();
  speedrunTime = 0;

  switch(drill) {
    case 'corner':
      // Player starts in corner, shoot on goal
      player.x = 100; player.y = 100;
      puck.x = player.x + 30; puck.y = player.y;
      break;
    case 'passMove':
      // Two teammates, pass between them then shoot
      player.x = 150; player.y = RINK_H/2;
      puck.x = player.x + 30; puck.y = player.y;
      teammates.push(new Teammate(400, 150, true));
      teammates.push(new Teammate(600, 250, false));
      break;
    case 'oneTimer':
      // Teammate passes to player for one-timer
      player.x = 400; player.y = RINK_H/2;
      puck.x = 200; puck.y = 100;
      puck.free = true;
      puck.vx = 8; puck.vy = 4;
      teammates.push(new Teammate(200, 100, false));
      break;
    case 'breakaway':
      // Player vs goalie, no teammates
      player.x = 100; player.y = RINK_H/2;
      puck.x = player.x + 30; puck.y = player.y;
      break;
    case 'crossPass':
      // Cross-ice pass to teammate then shoot
      player.x = 100; player.y = 100;
      puck.x = player.x + 30; puck.y = player.y;
      teammates.push(new Teammate(700, 300, true));
      break;
  }
}

function shoot() {
  if (!puck || puck.free) return;
  const power = Math.min(shotPower, SHOT_POWER_MAX);
  puck.free = true;
  puck.vx = Math.cos(aimingAngle) * power;
  puck.vy = Math.sin(aimingAngle) * power;
  shotPower = 0;
  stats.shots++;
  updateUI();
  sfxPuckHit();
  // Screen shake on shot
  screenShake = 3;
}

function scoreGoal() {
  stats.goals++;
  updateUI();
  sfxGoal();
  sfxCrowd();
  screenShake = 15;
  // Goal flash particles
  for(let i=0;i<30;i++) particles.push(new Particle(RINK_W-20, RINK_H/2, COLORS.goalFlash, Math.random()*Math.PI*2, 2+Math.random()*8, 1));
  // Reset puck to player after a short delay
  setTimeout(() => {
    puck.free = false;
    puck.x = player.x + 30;
    puck.y = player.y;
    puck.vx = puck.vy = 0;
    puck.trail = [];
    // For drills with targets, maybe move player or change target
    if (currentDrill === 'corner' || currentDrill === 'breakaway') {
      // Move player to a new random position
      player.x = 50 + Math.random() * 300;
      player.y = 50 + Math.random() * 300;
    }
  }, 1000);
}

function updatePassAccuracy() {
  const acc = stats.passes > 0 ? Math.round((stats.passSuccess / stats.passes) * 100) : 100;
  document.getElementById('passAcc').textContent = acc;
}

function updateUI() {
  document.getElementById('shots').textContent = stats.shots;
  document.getElementById('goals').textContent = stats.goals;
  updatePassAccuracy();
  document.getElementById('drillName').textContent = 'DRILL: ' + currentDrill.toUpperCase().replace('-', ' ');
  document.getElementById('roundTimer').textContent = 'TIME: ' + roundTimer.toFixed(1) + 's';
  // Power meter
  document.getElementById('powerFill').style.width = (shotPower / SHOT_POWER_MAX * 100) + '%';
  // Pass ring
  const ring = document.getElementById('passRing');
  if (teammates.some(t => t.isTarget)) {
    ring.style.display = 'block';
    const before = ring.style.getPropertyValue('--before-size') || '0';
    // We'll use a pseudo-element via CSS, but we can't set pseudo-element via JS easily.
    // Instead, we'll use a child element or just change the border color.
    ring.style.borderColor = '#ffeb3b';
  } else {
    ring.style.display = 'none';
  }
}

// Main Loop
function gameLoop() {
  // Screen shake
  let shakeX = 0, shakeY = 0;
  if (screenShake > 0) {
    shakeX = (Math.random()-0.5)*screenShake;
    shakeY = (Math.random()-0.5)*screenShake;
    screenShake *= 0.9;
    if (screenShake < 0.5) screenShake = 0;
  }

  // Clear
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Apply scale and offset with shake
  ctx.translate(window.offsetX + shakeX, window.offsetY + shakeY);
  ctx.scale(window.gameScale, window.gameScale);

  // Draw Rink
  drawRink();

  if (gameState === 'playing') {
    // Update
    roundTimer -= 1/60;
    if (roundTimer <= 0) {
      roundTimer = 0;
      endDrill();
    }
    speedrunTime = (Date.now() - speedrunStart) / 1000;
    document.getElementById('speedrunTimer').textContent = formatTime(speedrunTime);
    document.getElementById('roundTimer').textContent = 'TIME: ' + roundTimer.toFixed(1) + 's';

    player.update();
    puck.update();
    goalie.update();
    teammates.forEach(t => t.update());
    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);

    // Charge shot
    if (chargingShot && !puck.free) {
      shotPower = Math.min(SHOT_POWER_MAX, shotPower + SHOT_CHARGE_RATE);
    } else {
      shotPower = 0;
    }
    updateUI();
  }

  // Draw entities
  goalie.draw();
  teammates.forEach(t => t.draw());
  puck.draw();
  player.draw();
  particles.forEach(p => p.draw());

  // Draw aiming line when charging
  if (chargingShot && !puck.free && gameState === 'playing') {
    ctx.strokeStyle = '#ffeb3b88';
    ctx.lineWidth = 2;
    ctx.setLineDash([10,5]);
    ctx.beginPath();
    ctx.moveTo(puck.x, puck.y);
    const len = 50 + shotPower * 5;
    ctx.lineTo(puck.x + Math.cos(aimingAngle)*len, puck.y + Math.sin(aimingAngle)*len);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Mini-map
  drawMiniMap();

  requestAnimationFrame(gameLoop);
}

function drawRink() {
  // Ice surface
  const gradient = ctx.createLinearGradient(0,0,0,RINK_H);
  gradient.addColorStop(0, COLORS.ice);
  gradient.addColorStop(1, COLORS.iceDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(10,10,RINK_W-20,RINK_H-20);

  // Center line
  ctx.strokeStyle = COLORS.lineRed;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(RINK_W/2, 10);
  ctx.lineTo(RINK_W/2, RINK_H-10);
  ctx.stroke();

  // Center circle
  ctx.strokeStyle = COLORS.circle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(RINK_W/2, RINK_H/2, 45, 0, Math.PI*2);
  ctx.stroke();
  // Center dot
  ctx.fillStyle = COLORS.lineRed;
  ctx.beginPath();
  ctx.arc(RINK_W/2, RINK_H/2, 3, 0, Math.PI*2);
  ctx.fill();

  // Blue lines
  ctx.strokeStyle = COLORS.lineBlue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(200, 10); ctx.lineTo(200, RINK_H-10);
  ctx.moveTo(600, 10); ctx.lineTo(600, RINK_H-10);
  ctx.stroke();

  // Faceoff circles
  const faceoffSpots = [
    {x:200, y:150}, {x:200, y:250},
    {x:600, y:150}, {x:600, y:250}
  ];
  faceoffSpots.forEach(spot => {
    ctx.strokeStyle = COLORS.circle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 30, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = COLORS.lineRed;
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 2, 0, Math.PI*2);
    ctx.fill();
  });

  // Goal creases
  ctx.fillStyle = '#1e88e544';
  // Left crease
  ctx.beginPath();
  ctx.moveTo(10, RINK_H/2 - GOAL_W/2);
  ctx.lineTo(10+GOAL_D, RINK_H/2 - GOAL_W/2);
  ctx.quadraticCurveTo(10+GOAL_D+10, RINK_H/2, 10+GOAL_D, RINK_H/2 + GOAL_W/2);
  ctx.lineTo(10, RINK_H/2 + GOAL_W/2);
  ctx.closePath();
  ctx.fill();
  // Right crease
  ctx.beginPath();
  ctx.moveTo(RINK_W-10, RINK_H/2 - GOAL_W/2);
  ctx.lineTo(RINK_W-10-GOAL_D, RINK_H/2 - GOAL_W/2);
  ctx.quadraticCurveTo(RINK_W-10-GOAL_D-10, RINK_H/2, RINK_W-10-GOAL_D, RINK_H/2 + GOAL_W/2);
  ctx.lineTo(RINK_W-10, RINK_H/2 + GOAL_W/2);
  ctx.closePath();
  ctx.fill();

  // Goal nets
  ctx.strokeStyle = COLORS.net;
  ctx.lineWidth = 2;
  // Left net
  ctx.beginPath();
  ctx.moveTo(10, RINK_H/2 - GOAL_W/2);
  ctx.lineTo(10-GOAL_D, RINK_H/2 - GOAL_W/2);
  ctx.lineTo(10-GOAL_D, RINK_H/2 + GOAL_W/2);
  ctx.lineTo(10, RINK_H/2 + GOAL_W/2);
  ctx.stroke();
  // Net mesh
  for(let i=0;i<5;i++) {
    const y = RINK_H/2 - GOAL_W/2 + i*(GOAL_W/4);
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(10-GOAL_D, y);
    ctx.stroke();
  }
  for(let i=0;i<3;i++) {
    const x = 10 - i*(GOAL_D/2);
    ctx.beginPath();
    ctx.moveTo(x, RINK_H/2 - GOAL_W/2);
    ctx.lineTo(x, RINK_H/2 + GOAL_W/2);
    ctx.stroke();
  }
  // Right net
  ctx.beginPath();
  ctx.moveTo(RINK_W-10, RINK_H/2 - GOAL_W/2);
  ctx.lineTo(RINK_W-10+GOAL_D, RINK_H/2 - GOAL_W/2);
  ctx.lineTo(RINK_W-10+GOAL_D, RINK_H/2 + GOAL_W/2);
  ctx.lineTo(RINK_W-10, RINK_H/2 + GOAL_W/2);
  ctx.stroke();
  for(let i=0;i<5;i++) {
    const y = RINK_H/2 - GOAL_W/2 + i*(GOAL_W/4);
    ctx.beginPath();
    ctx.moveTo(RINK_W-10, y);
    ctx.lineTo(RINK_W-10+GOAL_D, y);
    ctx.stroke();
  }
  for(let i=0;i<3;i++) {
    const x = RINK_W-10 + i*(GOAL_D/2);
    ctx.beginPath();
    ctx.moveTo(x, RINK_H/2 - GOAL_W/2);
    ctx.lineTo(x, RINK_H/2 + GOAL_W/2);
    ctx.stroke();
  }

  // Boards
  ctx.strokeStyle = COLORS.board;
  ctx.lineWidth = 20;
  ctx.strokeRect(10,10,RINK_W-20,RINK_H-20);
  ctx.lineWidth = 2;
  ctx.strokeRect(10,10,RINK_W-20,RINK_H-20);
}

function drawMiniMap() {
  miniCtx.clearRect(0,0,120,60);
  const scale = 120/800;
  // Ice
  miniCtx.fillStyle = COLORS.ice;
  miniCtx.fillRect(0,0,120,60);
  // Center line
  miniCtx.strokeStyle = COLORS.lineRed;
  miniCtx.lineWidth = 1;
  miniCtx.beginPath();
  miniCtx.moveTo(60,0); miniCtx.lineTo(60,60); miniCtx.stroke();
  // Blue lines
  miniCtx.strokeStyle = COLORS.lineBlue;
  miniCtx.beginPath();
  miniCtx.moveTo(200*scale,0); miniCtx.lineTo(200*scale,60);
  miniCtx.moveTo(600*scale,0); miniCtx.lineTo(600*scale,60);
  miniCtx.stroke();
  // Goals
  miniCtx.strokeStyle = COLORS.net;
  miniCtx.strokeRect(0, 60/2 - (GOAL_W/2)*scale, GOAL_D*scale, GOAL_W*scale);
  miniCtx.strokeRect(120-GOAL_D*scale, 60/2 - (GOAL_W/2)*scale, GOAL_D*scale, GOAL_W*scale);
  // Player
  miniCtx.fillStyle = COLORS.home;
  miniCtx.beginPath();
  miniCtx.arc(player.x*scale, player.y*scale, 3, 0, Math.PI*2);
  miniCtx.fill();
  // Puck
  miniCtx.fillStyle = COLORS.puck;
  miniCtx.beginPath();
  miniCtx.arc(puck.x*scale, puck.y*scale, 2, 0, Math.PI*2);
  miniCtx.fill();
  // Goalie
  miniCtx.fillStyle = '#fff';
  miniCtx.fillRect((goalie.x-10)*scale, (goalie.y-20)*scale, 20*scale, 40*scale);
  // Teammates
  teammates.forEach(t => {
    miniCtx.fillStyle = t.isTarget ? '#ffeb3b' : COLORS.home;
    miniCtx.beginPath();
    miniCtx.arc(t.x*scale, t.y*scale, 3, 0, Math.PI*2);
    miniCtx.fill();
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds/60);
  const secs = Math.floor(seconds%60);
  const ms = Math.floor((seconds*100)%100);
  return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
}

function startGame() {
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.add('hidden');
  gameState = 'playing';
  setupDrill(currentDrill);
}

function endDrill() {
  gameState = 'gameover';
  const finalScore = stats.goals * 100 + stats.passSuccess * 10 - stats.shots * 5 + Math.max(0, 60 - speedrunTime) * 2;
  if (finalScore > highScore) {
    highScore = finalScore;
    localStorage.setItem('hockeyHighScore', highScore);
    document.getElementById('highScore').textContent = highScore;
  }
  const statsDiv = document.getElementById('finalStats');
  statsDiv.innerHTML = `
    <div class="statRow"><span class="statLabel">DRILL</span><span class="statValue">${currentDrill.toUpperCase()}</span></div>
    <div class="statRow"><span class="statLabel">GOALS</span><span class="statValue">${stats.goals}</span></div>
    <div class="statRow"><span class="statLabel">SHOTS</span><span class="statValue">${stats.shots}</span></div>
    <div class="statRow"><span class="statLabel">PASS ACCURACY</span><span class="statValue">${document.getElementById('passAcc').textContent}%</span></div>
    <div class="statRow"><span class="statLabel">TIME</span><span class="statValue">${formatTime(speedrunTime)}</span></div>
    <div class="statRow"><span class="statLabel">SCORE</span><span class="statValue">${finalScore}</span></div>
    <div class="statRow"><span class="statLabel">HIGH SCORE</span><span class="statValue">${highScore}</span></div>
  `;
  document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Start loop
gameLoop();
