const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GAME_W = 960, GAME_H = 540;
const LANES = 3, LANE_W = 120, LANE_START = (GAME_W - LANES * LANE_W) / 2;
const COLORS = { bg: '#1a1a2e', player: '#e94560', obstacle: '#0f3460', powerup: '#ffcc00', text: '#fff', combo: '#ffcc00', timer: '#00ff88' };

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='square', vol=0.2) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
const SFX = {
  jump: () => playTone(440, 0.15, 'sine', 0.3),
  slide: () => playTone(220, 0.2, 'triangle', 0.3),
  hit: () => playTone(100, 0.5, 'sawtooth', 0.4),
  powerup: () => playTone(880, 0.1, 'sine', 0.3),
  gameover: () => playTone(150, 1, 'square', 0.5)
};

// Game State
let running = false, paused = false, gameOver = false;
let score = 0, distance = 0, combo = 1, maxCombo = 1, highScore = parseInt(localStorage.getItem('highScore')) || 0;
let speed = 8, baseSpeed = 8, speedMult = 1;
let spawnTimer = 0, spawnInterval = 1200;
let obstacles = [], particles = [];
let player = { x: LANE_START + LANE_W, y: GAME_H - 80, w: 40, h: 48, lane: 1, vy: 0, jumping: false, sliding: false, slideTimer: 0, jumpTimer: 0, invuln: 0, animFrame: 0, animTimer: 0 };
let keys = {}, lastTime = 0, timer = 0;

// Input
window.addEventListener('keydown', e => { keys[e.code] = true; handleInput(e.code); });
window.addEventListener('keyup', e => keys[e.code] = false);
['leftBtn','rightBtn','jumpBtn','slideBtn'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', e => { e.preventDefault(); handleInput(id); });
});
function handleInput(action) {
  if (gameOver || paused) return;
  const now = performance.now();
  if (player.lastAction && now - player.lastAction < 150) return;
  player.lastAction = now;
  if (action === 'ArrowLeft' || action === 'leftBtn') { if (player.lane > 0) { player.lane--; player.invuln = 100; SFX.jump(); } }
  else if (action === 'ArrowRight' || action === 'rightBtn') { if (player.lane < 2) { player.lane++; player.invuln = 100; SFX.jump(); } }
  else if ((action === 'Space' || action === 'ArrowUp' || action === 'jumpBtn') && !player.jumping) { player.vy = -15; player.jumping = true; player.jumpTimer = 350; SFX.jump(); }
  else if ((action === 'ArrowDown' || action === 'slideBtn') && !player.sliding) { player.sliding = true; player.slideTimer = 600; player.h = 24; player.y = GAME_H - 56; SFX.slide(); }
}

// Obstacle Classes
class Obstacle {
  constructor(type, lane, x) { this.type = type; this.lane = lane; this.x = x; this.w = 40; this.h = 48; this.passed = false; }
  update(dt) { this.x -= speed * dt / 16.67; }
  draw() {
    const lx = LANE_START + this.lane * LANE_W + (LANE_W - this.w)/2;
    ctx.fillStyle = COLORS.obstacle;
    if (this.type === 'spike') { ctx.beginPath(); ctx.moveTo(lx, GAME_H-32); ctx.lineTo(lx+this.w/2, GAME_H-80); ctx.lineTo(lx+this.w, GAME_H-32); ctx.fill(); }
    else if (this.type === 'ball') { ctx.beginPath(); ctx.arc(lx+this.w/2, GAME_H-56, 20, 0, Math.PI*2); ctx.fill(); }
    else if (this.type === 'wall') { ctx.fillRect(lx, GAME_H-80, this.w, 48); }
    else if (this.type === 'gap') { /* no draw */ }
    else if (this.type === 'powerup') { ctx.fillStyle = COLORS.powerup; ctx.fillRect(lx, GAME_H-80, 30, 30); ctx.fillStyle = COLORS.text; ctx.font = '20px Arial'; ctx.fillText('★', lx+5, GAME_H-55); }
  }
  getHitbox() {
    const lx = LANE_START + this.lane * LANE_W + (LANE_W - this.w)/2;
    if (this.type === 'ball') return { x: lx+this.w/2, y: GAME_H-56, r: 20 };
    return { x: lx, y: GAME_H - (this.type==='powerup'?80:80), w: this.w, h: this.h };
  }
}

// Procedural Generation
function spawnObstacle() {
  const types = ['spike'];
  if (distance > 500) types.push('ball', 'gap');
  if (distance > 1500) types.push('wall');
  if (Math.random() < 0.1) types.push('powerup');
  const type = types[Math.floor(Math.random()*types.length)];
  const lane = Math.floor(Math.random()*LANES);
  obstacles.push(new Obstacle(type, lane, GAME_W + 50));
}

// Collision
function checkCollision() {
  if (player.invuln > 0) return;
  const px = LANE_START + player.lane * LANE_W + (LANE_W - player.w)/2;
  const py = player.y;
  for (let obs of obstacles) {
    const hb = obs.getHitbox();
    let hit = false;
    if (obs.type === 'ball') {
      const dx = Math.max(hb.x - hb.r, Math.min(px + player.w/2, hb.x + hb.r)) - (px + player.w/2);
      const dy = Math.max(hb.y - hb.r, Math.min(py + player.h/2, hb.y + hb.r)) - (py + player.h/2);
      hit = dx*dx + dy*dy < hb.r*hb.r;
    } else {
      hit = px < hb.x + hb.w && px + player.w > hb.x && py < hb.y + hb.h && py + player.h > hb.y;
    }
    if (hit) {
      if (obs.type === 'powerup') { collectPowerup(obs); }
      else { gameOver = true; SFX.gameover(); }
    }
  }
}
function collectPowerup(obs) {
  SFX.powerup();
  score += 2000;
  speedMult = 1.5; setTimeout(() => speedMult = 1, 5000);
  obstacles = obstacles.filter(o => o !== obs);
}

// Particles
function addParticles(x, y, color, count) {
  for (let i=0;i<count;i++) particles.push({ x, y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 1, color });
}
function updateParticles(dt) {
  for (let i=particles.length-1;i>=0;i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life -= dt/500;
    if (p.life <= 0) particles.splice(i,1);
  }
}
function drawParticles() {
  particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); });
  ctx.globalAlpha = 1;
}

// Player Update
function updatePlayer(dt) {
  // Lane interpolation
  const targetX = LANE_START + player.lane * LANE_W + (LANE_W - player.w)/2;
  player.x += (targetX - player.x) * 0.2;
  // Jump
  if (player.jumping) {
    player.vy += 0.8; // gravity
    player.y += player.vy;
    player.jumpTimer -= dt;
    if (player.y >= GAME_H - 80) { player.y = GAME_H - 80; player.vy = 0; player.jumping = false; addParticles(player.x+player.w/2, player.y+player.h, COLORS.player, 5); }
  }
  // Slide
  if (player.sliding) {
    player.slideTimer -= dt;
    if (player.slideTimer <= 0) { player.sliding = false; player.h = 48; player.y = GAME_H - 80; }
  }
  // Invuln
  if (player.invuln > 0) player.invuln -= dt;
  // Animation
  player.animTimer += dt;
  if (player.animTimer > 100) { player.animFrame = (player.animFrame+1)%4; player.animTimer = 0; }
}

// Main Loop
function gameLoop(time) {
  if (!lastTime) lastTime = time;
  const dt = time - lastTime;
  lastTime = time;
  if (!paused && !gameOver) {
    timer += dt;
    distance += speed * dt / 1000;
    score = Math.floor(distance * 10 * combo);
    speed = baseSpeed * speedMult * (1 + distance/5000);
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) { spawnObstacle(); spawnTimer = 0; spawnInterval = Math.max(600, 1200 - distance/2); }
    updatePlayer(dt);
    obstacles.forEach(o => o.update(dt));
    obstacles = obstacles.filter(o => o.x > -100);
    checkCollision();
    updateParticles(dt);
    // Combo logic: increase on successful obstacle pass
    obstacles.forEach(o => { if (!o.passed && o.x < player.x) { o.passed = true; combo = Math.min(3, combo+0.1); maxCombo = Math.max(maxCombo, combo); } });
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// Drawing
function draw() {
  ctx.fillStyle = COLORS.bg; ctx.fillRect(0,0,GAME_W,GAME_H);
  // Ground
  ctx.fillStyle = '#0f3460'; ctx.fillRect(0, GAME_H-32, GAME_W, 32);
  // Lanes
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  for (let i=1;i<LANES;i++) { ctx.beginPath(); ctx.moveTo(LANE_START+i*LANE_W, 0); ctx.lineTo(LANE_START+i*LANE_W, GAME_H); ctx.stroke(); }
  // Obstacles
  obstacles.forEach(o => o.draw());
  // Player
  ctx.fillStyle = player.invuln>0 && Math.floor(player.invuln/50)%2 ? 'rgba(233,69,96,0.5)' : COLORS.player;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // Particles
  drawParticles();
  // HUD
  ctx.fillStyle = COLORS.text; ctx.font = '24px Arial'; ctx.textAlign = 'center';
  ctx.fillText(`Score: ${score}`, GAME_W/2, 40);
  ctx.fillText(`Best: ${highScore}`, GAME_W/2, 70);
  ctx.textAlign = 'left'; ctx.fillText(`Distance: ${Math.floor(distance)}m`, 20, 40);
  ctx.fillText(`Combo: x${combo.toFixed(1)}`, 20, 70);
  ctx.textAlign = 'right'; ctx.fillStyle = COLORS.timer; ctx.font = '20px Arial'; ctx.fillText(`Time: ${(timer/1000).toFixed(1)}s`, GAME_W-20, 40);
  if (paused) { drawOverlay('PAUSED', 'Press P to resume'); }
  if (gameOver) { drawOverlay('GAME OVER', `Final Score: ${score}\nBest: ${highScore}\nClick/Tap to restart`); }
}
function drawOverlay(title, msg) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,GAME_W,GAME_H);
  ctx.fillStyle = COLORS.text; ctx.textAlign = 'center';
  ctx.font = '48px Arial'; ctx.fillText(title, GAME_W/2, GAME_H/2 - 40);
  ctx.font = '24px Arial'; msg.split('\n').forEach((line,i) => ctx.fillText(line, GAME_W/2, GAME_H/2 + 20 + i*30));
}

// Restart
canvas.addEventListener('click', () => { if (gameOver) resetGame(); });
canvas.addEventListener('touchstart', () => { if (gameOver) resetGame(); });
window.addEventListener('keydown', e => { if (e.code === 'KeyP') paused = !paused; if (e.code === 'KeyR' && gameOver) resetGame(); });
function resetGame() {
  if (score > highScore) { highScore = score; localStorage.setItem('highScore', highScore); }
  score = 0; distance = 0; combo = 1; maxCombo = 1; speed = baseSpeed; speedMult = 1;
  spawnTimer = 0; spawnInterval = 1200; obstacles = []; particles = []; timer = 0;
  player = { x: LANE_START + LANE_W, y: GAME_H - 80, w: 40, h: 48, lane: 1, vy: 0, jumping: false, sliding: false, slideTimer: 0, jumpTimer: 0, invuln: 0, animFrame: 0, animTimer: 0, lastAction: 0 };
  gameOver = false; paused = false;
}

// Start
requestAnimationFrame(gameLoop);