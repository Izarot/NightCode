const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE = 20;
const COLS = 39;
const ROWS = 29;
const MAZE_W = COLS * TILE;
const MAZE_H = ROWS * TILE;

const COLORS = {
  bg: '#0d0d1a',
  wall: '#16213e',
  wallGlow: '#0f3460',
  floor: '#0f3460',
  pellet: '#e94560',
  powerPellet: '#ff6b6b',
  pacman: '#ffd700',
  ghost: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'],
  ghostFright: '#4ecdc4',
  text: '#fff',
  timer: '#ffd700'
};

let width, height, scale;
function resize() {
  const container = document.getElementById('gameContainer');
  const rect = container.getBoundingClientRect();
  scale = Math.min(rect.width / MAZE_W, rect.height / MAZE_H);
  width = MAZE_W * scale;
  height = MAZE_H * scale;
  canvas.width = MAZE_W;
  canvas.height = MAZE_H;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}
window.addEventListener('resize', resize);
resize();

const DIRS = { ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1}, ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0},
  KeyW: {x:0,y:-1}, KeyS: {x:0,y:1}, KeyA: {x:-1,y:0}, KeyD: {x:1,y:0} };
const input = { x: 0, y: 0, next: null };
window.addEventListener('keydown', e => {
  if (DIRS[e.code]) {
    e.preventDefault();
    input.next = DIRS[e.code];
  }
});
window.addEventListener('touchstart', e => {
  if (e.touches.length) {
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
});
window.addEventListener('touchend', e => {
  if (touchStart && e.changedTouches.length) {
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) input.next = dx > 0 ? DIRS.ArrowRight : DIRS.ArrowLeft;
    else input.next = dy > 0 ? DIRS.ArrowDown : DIRS.ArrowUp;
    touchStart = null;
  }
});
let touchStart = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, dur, type='square', vol=0.1) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}
function sndPellet() { beep(800, 0.05, 'sine', 0.08); }
function sndPower() { beep(400, 0.2, 'triangle', 0.1); }
function sndEatGhost() { beep(600, 0.1, 'square', 0.1); beep(800, 0.1, 'square', 0.1); }
function sndDeath() { for(let i=0;i<6;i++) setTimeout(()=>beep(200-i*20,0.1,'sawtooth',0.15),i*60); }
function sndWin() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.2,'sine',0.1),i*150)); }

let maze = [];
let pellets = [];
let powerPellets = [];
let breathingWalls = [];
let breathPhase = 0;
const BREATH_CYCLE = 6;
function generateMaze() {
  maze = Array.from({length: ROWS}, () => Array(COLS).fill(1));
  function carve(x, y) {
    maze[y][x] = 0;
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]].sort(()=>Math.random()-0.5);
    for (const [dx,dy] of dirs) {
      const nx = x + dx*2, ny = y + dy*2;
      if (nx>0 && nx<COLS-1 && ny>0 && ny<ROWS-1 && maze[ny][nx]) {
        maze[y+dy][x+dx] = 0;
        carve(nx, ny);
      }
    }
  }
  carve(1,1);
  maze[1][1] = 0;
  maze[ROWS-2][COLS-2] = 0;
  pellets = []; powerPellets = []; breathingWalls = [];
  for (let y=1; y<ROWS-1; y++) for (let x=1; x<COLS-1; x++) {
    if (!maze[y][x]) {
      const walls = (maze[y-1][x]?1:0)+(maze[y+1][x]?1:0)+(maze[y][x-1]?1:0)+(maze[y][x+1]?1:0);
      if (walls >= 3 && Math.random() < 0.02) powerPellets.push({x,y});
      else if (Math.random() < 0.7) pellets.push({x,y});
    } else if (Math.random() < 0.15) breathingWalls.push({x,y});
  }
}

const pacman = { x: 1.5, y: 1.5, dir: {x:0,y:0}, speed: 0.12, radius: 0.4, mouth: 0, mouthDir: 1, powerTime: 0 };
const ghosts = [];
function spawnGhosts() {
  ghosts.length = 0;
  const starts = [{x:19.5,y:14.5},{x:19.5,y:13.5},{x:18.5,y:14.5},{x:20.5,y:14.5}];
  for (let i=0;i<4;i++) {
    ghosts.push({ x: starts[i].x, y: starts[i].y, dir: {x:0,y:0}, speed: 0.09 + i*0.005, color: COLORS.ghost[i], fright: false, home: starts[i] });
  }
}

let score = 0, hiScore = parseInt(localStorage.getItem('pacmanHiScore')||'0'), lives = 3, gameTime = 0, running = false, gameOver = false, won = false;
document.getElementById('hiScore').textContent = hiScore;

function updateBreath(dt) {
  breathPhase = (breathPhase + dt / 1000) % BREATH_CYCLE;
}
function isWall(x, y) {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
  if (maze[ty][tx] === 0) return false;
  const bw = breathingWalls.find(w => w.x === tx && w.y === ty);
  if (bw) {
    const phase = breathPhase / BREATH_CYCLE;
    return phase < 0.5 || phase > 0.8;
  }
  return true;
}
function canMove(x, y, dir) {
  const nx = x + dir.x * pacman.speed, ny = y + dir.y * pacman.speed;
  const r = pacman.radius;
  if (!isWall(nx - r, ny - r) && !isWall(nx + r, ny - r) && !isWall(nx - r, ny + r) && !isWall(nx + r, ny + r)) return true;
  return false;
}
function tryTurn() {
  if (input.next && canMove(pacman.x, pacman.y, input.next)) {
    pacman.dir = input.next;
    input.next = null;
  }
}
function movePacman() {
  if (canMove(pacman.x, pacman.y, pacman.dir)) {
    pacman.x += pacman.dir.x * pacman.speed;
    pacman.y += pacman.dir.y * pacman.speed;
  } else {
    pacman.dir = {x:0,y:0};
  }
  pacman.mouth += pacman.mouthDir * 0.2;
  if (pacman.mouth > 0.5 || pacman.mouth < 0) pacman.mouthDir *= -1;
}
function checkPellets() {
  const tx = Math.round(pacman.x), ty = Math.round(pacman.y);
  const pi = pellets.findIndex(p => p.x === tx && p.y === ty);
  if (pi >= 0) { pellets.splice(pi,1); score += 10; sndPellet(); }
  const ppi = powerPellets.findIndex(p => p.x === tx && p.y === ty);
  if (ppi >= 0) { powerPellets.splice(ppi,1); score += 50; pacman.powerTime = 5; sndPower(); ghosts.forEach(g => g.fright = true); }
}
function updateGhosts(dt) {
  const speed = pacman.powerTime > 0 ? 0.06 : 0.09;
  for (const g of ghosts) {
    if (g.fright && pacman.powerTime <= 0) g.fright = false;
    const options = [];
    for (const d of Object.values(DIRS)) {
      if (d.x === -g.dir.x && d.y === -g.dir.y) continue;
      if (canMove(g.x, g.y, d)) options.push(d);
    }
    if (options.length) {
      let target = pacman;
      if (g.fright) target = { x: g.home.x, y: g.home.y };
      else if (Math.random() < 0.7) target = pacman;
      else target = { x: Math.random()*COLS, y: Math.random()*ROWS };
      options.sort((a,b) => {
        const da = Math.hypot(g.x+a.x*speed - target.x, g.y+a.y*speed - target.y);
        const db = Math.hypot(g.x+b.x*speed - target.x, g.y+b.y*speed - target.y);
        return g.fright ? db - da : da - db;
      });
      g.dir = options[0];
    }
    g.x += g.dir.x * speed;
    g.y += g.dir.y * speed;
    const dx = g.x - pacman.x, dy = g.y - pacman.y;
    if (Math.hypot(dx, dy) < 0.6) {
      if (pacman.powerTime > 0 && g.fright) { score += 200; sndEatGhost(); g.x = g.home.x; g.y = g.home.y; g.fright = false; }
      else if (pacman.powerTime <= 0) { loseLife(); }
    }
  }
}
function loseLife() {
  lives--; sndDeath();
  if (lives <= 0) { gameOver = true; running = false; showMessage('GAME OVER', 'Press Enter to restart'); }
  else resetPositions();
}
function resetPositions() {
  pacman.x = 1.5; pacman.y = 1.5; pacman.dir = {x:0,y:0}; pacman.powerTime = 0;
  spawnGhosts();
}
function checkWin() {
  if (pellets.length === 0 && powerPellets.length === 0) {
    won = true; running = false; sndWin();
    if (score > hiScore) { hiScore = score; localStorage.setItem('pacmanHiScore', hiScore); document.getElementById('hiScore').textContent = hiScore; }
    showMessage('YOU WIN!', `Time: ${gameTime.toFixed(2)}s\nPress Enter to play again`);
  }
}
function showMessage(title, text) {
  document.getElementById('msgTitle').textContent = title;
  document.getElementById('msgText').innerHTML = text.replace('\n', '<br>');
  document.getElementById('message').classList.remove('hidden');
}
function hideMessage() { document.getElementById('message').classList.add('hidden'); }
window.addEventListener('keydown', e => { if (e.code === 'Enter' && (gameOver || won)) restart(); });
function restart() {
  hideMessage();
  generateMaze();
  resetPositions();
  score = 0; lives = 3; gameTime = 0; gameOver = false; won = false; running = true;
  document.getElementById('score').textContent = score;
  document.getElementById('lives').textContent = lives;
}

let lastTime = 0;
function loop(time) {
  const dt = time - lastTime;
  lastTime = time;
  if (running) {
    gameTime += dt / 1000;
    updateBreath(dt);
    if (pacman.powerTime > 0) pacman.powerTime -= dt / 1000;
    tryTurn();
    movePacman();
    checkPellets();
    updateGhosts(dt);
    checkWin();
  }
  render();
  requestAnimationFrame(loop);
}
function render() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, MAZE_W, MAZE_H);
  ctx.fillStyle = COLORS.floor;
  for (let y=0; y<ROWS; y++) for (let x=0; x<COLS; x++) if (!maze[y][x]) ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
  const breathAlpha = Math.sin(breathPhase / BREATH_CYCLE * Math.PI * 2) * 0.3 + 0.5;
  ctx.fillStyle = `rgba(15, 52, 96, ${breathAlpha})`;
  for (const w of breathingWalls) {
    const phase = breathPhase / BREATH_CYCLE;
    if (phase < 0.5 || phase > 0.8) ctx.fillRect(w.x*TILE, w.y*TILE, TILE, TILE);
    else ctx.strokeRect(w.x*TILE+2, w.y*TILE+2, TILE-4, TILE-4);
  }
  ctx.fillStyle = COLORS.wall;
  for (let y=0; y<ROWS; y++) for (let x=0; x<COLS; x++) if (maze[y][x] && !breathingWalls.find(w=>w.x===x&&w.y===y)) ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
  ctx.fillStyle = COLORS.pellet;
  for (const p of pellets) ctx.beginPath(), ctx.arc((p.x+0.5)*TILE, (p.y+0.5)*TILE, 3, 0, Math.PI*2), ctx.fill();
  ctx.fillStyle = COLORS.powerPellet;
  for (const p of powerPellets) {
    const r = 6 + Math.sin(time/200)*2;
    ctx.beginPath(); ctx.arc((p.x+0.5)*TILE, (p.y+0.5)*TILE, r, 0, Math.PI*2); ctx.fill();
  }
  for (const g of ghosts) {
    ctx.fillStyle = g.fright ? (Math.floor(time/200)%2 ? COLORS.ghostFright : '#fff') : g.color;
    const cx = g.x * TILE, cy = g.y * TILE;
    ctx.beginPath(); ctx.arc(cx, cy, TILE*0.45, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx-4, cy-2, 3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+4, cy-2, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx-4, cy-2, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+4, cy-2, 1.5, 0, Math.PI*2); ctx.fill();
  }
  const px = pacman.x * TILE, py = pacman.y * TILE;
  ctx.fillStyle = COLORS.pacman;
  ctx.beginPath();
  const angle = Math.atan2(pacman.dir.y, pacman.dir.x) || 0;
  const mouth = pacman.mouth * Math.PI;
  ctx.arc(px, py, TILE*0.45, angle + mouth, angle + Math.PI*2 - mouth);
  ctx.lineTo(px, py); ctx.fill();
  ctx.fillStyle = COLORS.timer;
  ctx.font = '16px Courier New';
  ctx.fillText(gameTime.toFixed(2), MAZE_W - 80, 20);
}
requestAnimationFrame(loop);
generateMaze();
spawnGhosts();
showMessage('PAC-MAN: BREATHING LABYRINTH', 'Arrow Keys / WASD to move\nCollect all pellets\nAvoid walls & ghosts\nPress Enter to start');