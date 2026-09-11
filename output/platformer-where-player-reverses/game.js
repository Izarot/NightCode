// Game constants
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const GRAVITY = 0.5;
const GRAVITY_REVERSE_INTERVAL = 5000;
const PLAYER_SPEED = 5;
const JUMP_FORCE = -12;
const COLORS = { bg: '#16213e', player: '#e94560', platform: '#0f3460', hazard: '#9b5de5', collectible: '#f15bb5' };

// Setup canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function resizeCanvas() {
 canvas.width = window.innerWidth;
 canvas.height = window.innerHeight;
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration = 0.1) {
 const osc = audioCtx.createOscillator();
 const gain = audioCtx.createGain();
 osc.connect(gain);
 gain.connect(audioCtx.destination);
 osc.frequency.value = frequency;
 gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
 osc.start();
 osc.stop(audioCtx.currentTime + duration);
}

// Game state
let gravityDirection = 1;
let lastGravityChange = Date.now();
let gameRunning = false;
let startTime = 0;
let highScore = localStorage.getItem('highScore') || 0;
let score = 0;
let phase = 'Normal';

// Player
const player = { x: 100, y: 300, width: 30, height: 40, vx: 0, vy: 0, onGround: false };

// Platforms
const platforms = [
 { x: 0, y: canvas.height - 50, width: canvas.width * 2, height: 50 },
 { x: 200, y: canvas.height - 150, width: 200, height: 20 },
 { x: 500, y: canvas.height - 250, width: 200, height: 20 },
 { x: 350, y: canvas.height - 350, width: 200, height: 20 }
];

// Hazards
const hazards = [
 { x: 250, y: canvas.height - 100, width: 30, height: 30 }
];

// Collectibles
const collectibles = [
 { x: 250, y: canvas.height - 180, width: 20, height: 20, collected: false }
];

// Input
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Game loop
function gameLoop(timestamp) {
 if (!gameRunning) {
  gameRunning = true;
  startTime = timestamp;
 }

 const deltaTime = timestamp - (gameLoop.lastTime || timestamp);
 gameLoop.lastTime = timestamp;

 update(deltaTime);
 render();

 requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
 const now = Date.now();
 const elapsed = now - lastGravityChange;

 if (elapsed >= GRAVITY_REVERSE_INTERVAL) {
  gravityDirection *= -1;
  phase = phase === 'Normal' ? 'Inverted' : 'Normal';
  lastGravityChange = now;
  playSound(800, 0.2);
 }

 // Update timer
 const gameTime = (Date.now() - startTime) / 1000;
 document.getElementById('timer').textContent = `Time: ${gameTime.toFixed(2)} | Phase: ${phase}`;

 // Player input
 if (keys['ArrowLeft'] || keys['a']) player.vx = -PLAYER_SPEED;
 else if (keys['ArrowRight'] || keys['d']) player.vx = PLAYER_SPEED;
 else player.vx *= 0.9;

 if ((keys[' '] || keys['ArrowUp'] || keys['w']) && player.onGround) {
  player.vy = JUMP_FORCE;
  player.onGround = false;
  playSound(400, 0.1);
 }

 // Apply gravity
 player.vy += GRAVITY * gravityDirection;
 player.x += player.vx;
 player.y += player.vy;

 // Boundary check
 if (player.x < 0) player.x = 0;
 if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

 // Platform collision
 player.onGround = false;
 platforms.forEach(p => {
  if (player.x < p.x + p.width && player.x + player.width > p.x &&
   player.y < p.y + p.height && player.y + player.height > p.y) {
   if (gravityDirection === 1 && player.vy >= 0) {
    player.y = p.y - player.height;
    player.vy = 0;
    player.onGround = true;
   } else if (gravityDirection === -1 && player.vy <= 0) {
    player.y = p.y + p.height;
    player.vy = 0;
    player.onGround = true;
   }
  }
 });

 // Hazard collision
 hazards.forEach(h => {
  if (player.x < h.x + h.width && player.x + player.width > h.x &&
   player.y < h.y + h.height && player.y + player.height > h.y) {
   gameOver();
  }
 });

 // Collectibles
 collectibles.forEach(c => {
  if (!c.collected && player.x < c.x + c.width && player.x + player.width > c.x &&
   player.y < c.y + c.height && player.y + player.height > c.y) {
   c.collected = true;
   score += 10;
   playSound(1200, 0.1);
  }
 });

 // Check win condition
 if (score >= 10 && player.y > canvas.height + 100) gameOver(true);
}

function render() {
 ctx.fillStyle = COLORS.bg;
 ctx.fillRect(0, 0, canvas.width, canvas.height);

 // Platforms
 ctx.fillStyle = COLORS.platform;
 platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

 // Hazards
 ctx.fillStyle = COLORS.hazard;
 hazards.forEach(h => ctx.fillRect(h.x, h.y, h.width, h.height));

 // Collectibles
 ctx.fillStyle = COLORS.collectible;
 collectibles.forEach(c => {
  if (!c.collected) ctx.fillRect(c.x, c.y, c.width, c.height);
 });

 // Player
 ctx.fillStyle = COLORS.player;
 ctx.fillRect(player.x, player.y, player.width, player.height);

 // Phase indicator
 ctx.fillStyle = '#ffffff';
 ctx.font = '20px sans-serif';
 ctx.fillText(`Phase: ${phase}`, 10, 30);

 // Score
 ctx.fillText(`Score: ${score}`, 10, 60);
}

function gameOver(won = false) {
 gameRunning = false;
 playSound(won ? 1000 : 200, 0.3);

 if (score > parseInt(highScore)) {
  highScore = score;
  localStorage.setItem('highScore', highScore.toString());
  document.getElementById('highScore').textContent = `High Score: ${highScore}`;
 }

 setTimeout(() => {
  alert(won ? 'You Win! 🎉' : 'Game Over!');
  resetGame();
 }, 100);
}

function resetGame() {
 player.x = 100; player.y = 300; player.vx = 0; player.vy = 0;
 score = 0;
 collectibles.forEach(c => c.collected = false);
 lastGravityChange = Date.now();
}

// Start game
requestAnimationFrame(gameLoop);