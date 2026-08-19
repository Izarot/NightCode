/* Main game script */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthFill = document.getElementById('healthFill');
const treasureCountEl = document.getElementById('treasureCount');
const highScoreEl = document.getElementById('highScoreValue');
const timeEl = document.getElementById('timeValue');

// Responsive canvas scaling
const DESIGN_W = 1280;
const DESIGN_H = 720;
function resizeCanvas() {
  const aspect = DESIGN_W / DESIGN_H;
  let w = window.innerWidth;
  let h = window.innerHeight;
  if (w / h > aspect) {
    w = h * aspect;
  } else {
    h = w / aspect;
  }
  canvas.width = DESIGN_W;
  canvas.height = DESIGN_H;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Matter.js setup
const { Engine, Render, World, Bodies, Body, Events, Vector } = Matter;
const engine = Engine.create();
const world = engine.world;
world.gravity.y = 0.5; // Slight gravity for underwater feel

// Audio setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const audioBuffers = {};
async function loadAudio(name, url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  audioBuffers[name] = await audioCtx.decodeAudioData(arrayBuffer);
}
async function playSound(name) {
  const buffer = audioBuffers[name];
  if (!buffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
}
// Load placeholder sounds (URLs should point to actual files)
loadAudio('bubble', 'assets/sounds/bubble.mp3');
loadAudio('collect', 'assets/sounds/collect.mp3');
loadAudio('heartbeat', 'assets/sounds/heartbeat.mp3');

// Player
const player = Bodies.circle(200, 200, 20, {
  frictionAir: 0.02,
  restitution: 0.8,
  label: 'player'
});
World.add(world, player);
let playerSpeed = 5;
let glideActive = false;
let glideTimer = 0;

// Ground
const ground = Bodies.rectangle(DESIGN_W / 2, DESIGN_H + 50, DESIGN_W, 100, {
  isStatic: true,
  label: 'ground'
});
World.add(world, ground);

// Treasures
const treasures = [];
function spawnTreasure() {
  const x = Math.random() * (DESIGN_W - 100) + 50;
  const y = Math.random() * (DESIGN_H - 200) + 100;
  const t = Bodies.circle(x, y, 10, {
    isSensor: true,
    label: 'treasure'
  });
  World.add(world, t);
  treasures.push(t);
}
for (let i = 0; i < 10; i++) spawnTreasure();

// Game state
let health = 100;
let treasureCount = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreEl.textContent = highScore;
let startTime = Date.now();
let elapsed = 0;

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Collision events
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(pair => {
    const labels = [pair.bodyA.label, pair.bodyB.label];
    if (labels.includes('player') && labels.includes('treasure')) {
      // Collect treasure
      const treasure = pair.bodyA.label === 'treasure' ? pair.bodyA : pair.bodyB;
      World.remove(world, treasure);
      const idx = treasures.indexOf(treasure);
      if (idx > -1) treasures.splice(idx, 1);
      treasureCount++;
      treasureCountEl.textContent = treasureCount;
      playSound('collect');
      if (treasureCount >= 50) {
        if (treasureCount > highScore) {
          highScore = treasureCount;
          localStorage.setItem('highScore', highScore);
          highScoreEl.textContent = highScore;
        }
      }
    }
  });
});

function update() {
  // Player movement
  let force = { x: 0, y: 0 };
  if (keys['ArrowLeft'] || keys['a']) force.x -= playerSpeed;
  if (keys['ArrowRight'] || keys['d']) force.x += playerSpeed;
  if (keys['ArrowUp'] || keys['w']) force.y -= playerSpeed;
  if (keys['ArrowDown'] || keys['s']) force.y += playerSpeed;
  if (keys[' ']) {
    if (!glideActive) {
      glideActive = true;
      glideTimer = 2000; // 2 seconds
      engine.world.gravity.y = 0.1; // Reduced gravity
    }
  }
  Body.applyForce(player, player.position, force);

  // Glide timer
  if (glideActive) {
    glideTimer -= 16.67; // approx ms per frame
    if (glideTimer <= 0) {
      glideActive = false;
      engine.world.gravity.y = 0.5;
    }
  }

  // Health regeneration over time
  if (health < 100) {
    health += 0.05;
    if (health > 100) health = 100;
  }
  healthFill.style.width = health + '%';

  // Timer update
  elapsed = (Date.now() - startTime) / 1000;
  timeEl.textContent = elapsed.toFixed(2);

  Engine.update(engine, 16.67);
}

function render() {
  ctx.clearRect(0, 0, DESIGN_W, DESIGN_H);
  // Draw player
  ctx.fillStyle = '#f1c40f'; // Golden
  ctx.beginPath();
  ctx.arc(player.position.x, player.position.y, 20, 0, Math.PI * 2);
  ctx.fill();

  // Draw treasures
  ctx.fillStyle = '#e74c3c'; // Coral pink
  treasures.forEach(t => {
    ctx.beginPath();
    ctx.arc(t.position.x, t.position.y, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw ground
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(0, DESIGN_H - 50, DESIGN_W, 100);
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Start the game
requestAnimationFrame(gameLoop);
