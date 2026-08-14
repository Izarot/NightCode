const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const BPM = 120;
const BEAT_MS = 60000 / BPM;
const LANES = 3;
const LANE_POS = [W/4, W/2, W*3/4];
const GRAVITY = 0.5;
const JUMP_VEL = -12;
const OBSTACLE_SPEED = 8;
const SPAWN_INTERVAL = 2; // beats

let beatTime = 0;
let nextBeat = performance.now();
let beatCount = 0;
let obstacles = [];
let player = { lane: 1, x: LANE_POS[1], y: 0, vy: 0, jumping: false, groundY: 0 };
let score = 0;
let combo = 0;
let maxCombo = 0;
let health = 3;
let highScore = parseInt(localStorage.getItem('trrHighScore')) || 0;
let startTime = performance.now();
let gameOver = false;
let lastTap = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type='sine', dur=0.1, vol=0.1) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.value = freq;
  o.type = type;
  g.gain.value = vol;
  o.start();
  o.stop(audioCtx.currentTime + dur);
}
function sfxTap() { playSound(880, 'sine', 0.05, 0.05); }
sfxPerfect = () => playSound(1320, 'sine', 0.1, 0.1);
sfxGood = () => playSound(880, 'sine', 0.1, 0.08);
sfxHit = () => playSound(220, 'square', 0.2, 0.15);
sfxLose = () => playSound(110, 'sawtooth', 0.5, 0.1);

function spawnObstacle() {
  const type = Math.random() < 0.6 ? 'wall' : 'spike';
  const lane = Math.floor(Math.random() * LANES);
  obstacles.push({ type, lane, x: LANE_POS[lane], y: -50, w: 60, h: type==='wall'? 200: 40, beat: beatCount });
}

function updateBeat(now) {
  if (now >= nextBeat) {
    beatTime = nextBeat;
    nextBeat += BEAT_MS;
    beatCount++;
    if (beatCount % SPAWN_INTERVAL === 0) spawnObstacle();
  }
}

function handleInput(e) {
  if (gameOver) { reset(); return; }
  const now = performance.now();
  if (e.type === 'keydown') {
    if (e.code === 'ArrowLeft') { player.lane = Math.max(0, player.lane-1); sfxTap(); }
    else if (e.code === 'ArrowRight') { player.lane = Math.min(LANES-1, player.lane+1); sfxTap(); }
    else if (e.code === 'Space' || e.code === 'ArrowUp') { jump(); }
  } else if (e.type === 'click' || e.type === 'touchstart') {
    lastTap = now;
    jump();
  }
  player.x = LANE_POS[player.lane];
}
function jump() {
  if (!player.jumping) {
    player.vy = JUMP_VEL;
    player.jumping = true;
    sfxTap();
  }
}
window.addEventListener('keydown', handleInput);
window.addEventListener('click', handleInput);
window.addEventListener('touchstart', handleInput);

function updatePlayer() {
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.vy = 0;
    player.jumping = false;
  }
}

function updateObstacles() {
  for (let i = obstacles.length-1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += OBSTACLE_SPEED;
    if (o.y > H + 100) obstacles.splice(i,1);
  }
}

function checkCollisions() {
  const now = performance.now();
  for (let i = obstacles.length-1; i >= 0; i--) {
    const o = obstacles[i];
    if (o.lane !== player.lane) continue;
    const px = player.x, py = player.y;
    const hit = px < o.x + o.w/2 && px > o.x - o.w/2 && py < o.y + o.h/2 && py > o.y - o.h/2;
    if (hit) {
      const diff = Math.abs(now - beatTime);
      if (diff <= 150) {
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        const mult = Math.min(2, 1 + Math.floor(combo/10)*0.1);
        score += Math.round(10 * mult);
        if (diff <= 50) { sfxPerfect(); score += 10; }
        else sfxGood();
      } else {
        health--;
        combo = 0;
        sfxHit();
        if (health <= 0) { gameOver = true; sfxLose(); }
      }
      obstacles.splice(i,1);
    }
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);
  // tunnel
  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H));
  grad.addColorStop(0, '#0ff');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i=0;i<20;i++) ctx.arc(W/2,H/2, Math.max(W,H)/2 - i*15, 0, Math.PI*2);
  ctx.fill();
  // lanes
  ctx.strokeStyle = 'rgba(0,255,255,0.2)';
  ctx.lineWidth = 2;
  LANE_POS.forEach(x => { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); });
  // obstacles
  obstacles.forEach(o => {
    ctx.fillStyle = o.type==='wall' ? '#f00' : '#ff0';
    ctx.fillRect(o.x - o.w/2, o.y - o.h/2, o.w, o.h);
  });
  // player
  ctx.fillStyle = '#f0f';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 20, 0, Math.PI*2);
  ctx.fill();
  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`Combo: x${combo}`, 20, 60);
  ctx.fillText(`Best: ${highScore}`, 20, 90);
  const elapsed = ((performance.now() - startTime)/1000).toFixed(1);
  ctx.fillText(`Time: ${elapsed}s`, W-150, 30);
  ctx.font = '30px Arial';
  ctx.fillText(''.repeat(health), W-100, 70);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W/2, H/2 - 40);
    ctx.font = '30px Arial';
    ctx.fillText(`Final Score: ${score}`, W/2, H/2 + 20);
    ctx.fillText(`High Score: ${highScore}`, W/2, H/2 + 60);
    ctx.fillText('Click to restart', W/2, H/2 + 100);
    ctx.textAlign = 'left';
  }
}

function reset() {
  obstacles = [];
  player = { lane: 1, x: LANE_POS[1], y: 0, vy: 0, jumping: false, groundY: 0 };
  score = 0;
  combo = 0;
  health = 3;
  beatCount = 0;
  nextBeat = performance.now();
  startTime = performance.now();
  gameOver = false;
}

function loop(now) {
  if (!gameOver) {
    updateBeat(now);
    updatePlayer();
    updateObstacles();
    checkCollisions();
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('trrHighScore', highScore);
    }
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);