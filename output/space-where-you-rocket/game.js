const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameState = 'menu';
let highScore = localStorage.getItem('rocketSalvageHighScore') || 0;
let currentScore = 0;
let startTime = 0;
let elapsed = 0;
let animationId = null;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration, type = 'sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Rocket
const rocket = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 0, vy: 0,
  angle: 0,
  thrust: 0.3,
  maxSpeed: 5,
  fuel: 100,
  maxFuel: 100,
  shields: 100,
  cargo: 0,
  maxCargo: 50,
  collecting: false
};

// Scrap
const scrap = [];
function spawnScrap() {
  if (scrap.length < 20) {
    scrap.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      type: Math.floor(Math.random() * 4),
      collected: false
    });
  }
}

// Asteroids
const asteroids = [];
function spawnAsteroid() {
  if (asteroids.length < 10) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 20 + Math.random() * 30,
      angle: Math.random() * Math.PI * 2,
      rotation: (Math.random() - 0.5) * 0.05
    });
  }
}

// Input
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Resize
function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  rocket.x = canvas.width / 2;
  rocket.y = canvas.height / 2;
}
window.addEventListener('resize', resize);
resize();

// Game loop
function update() {
  if (gameState === 'playing') {
    elapsed = (Date.now() - startTime) / 1000;
    document.getElementById('timer').textContent = `Time: ${elapsed.toFixed(2)}s`;
    
    // Thrust
    if (keys['KeyW'] || keys['ArrowUp']) {
      if (rocket.fuel > 0) {
        rocket.vx += Math.sin(rocket.angle) * rocket.thrust;
        rocket.vy += Math.cos(rocket.angle) * rocket.thrust;
        rocket.fuel -= 0.1;
        playSound(100, 0.05, 'square');
      }
    }
    
    // Rotation
    if (keys['KeyA'] || keys['ArrowLeft']) rocket.angle -= 0.05;
    if (keys['KeyD'] || keys['ArrowRight']) rocket.angle += 0.05;
    
    // Boost
    if (keys['Space'] && rocket.fuel > 1) {
      rocket.vx += Math.sin(rocket.angle) * rocket.thrust * 3;
      rocket.vy += Math.cos(rocket.angle) * rocket.thrust * 3;
      rocket.fuel -= 0.5;
      playSound(200, 0.1, 'sawtooth');
    }
    
    // Fine control
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
      rocket.thrust = 0.1;
    } else {
      rocket.thrust = 0.3;
    }
    
    // Apply velocity
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    
    // Wrap screen
    if (rocket.x < 0) rocket.x = canvas.width;
    if (rocket.x > canvas.width) rocket.x = 0;
    if (rocket.y < 0) rocket.y = canvas.height;
    if (rocket.y > canvas.height) rocket.y = 0;
    
    // Collect scrap
    for (let i = scrap.length - 1; i >= 0; i--) {
      const s = scrap[i];
      const dist = Math.hypot(rocket.x - s.x, rocket.y - s.y);
      if (dist < 25) {
        if (rocket.cargo < rocket.maxCargo) {
          rocket.cargo++;
          scrap.splice(i, 1);
          playSound(300, 0.1, 'sine');
          currentScore += 10;
          updateHighScore();
        } else {
          rocket.collecting = true;
          setTimeout(() => rocket.collecting = false, 200);
        }
      }
    }
    
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rotation;
      if (a.x < 0) a.x = canvas.width;
      if (a.x > canvas.width) a.x = 0;
      if (a.y < 0) a.y = canvas.height;
      if (a.y > canvas.height) a.y = 0;
      
      const dist = Math.hypot(rocket.x - a.x, rocket.y - a.y);
      if (dist < a.size + 15) {
        if (rocket.shields > 0) {
          rocket.shields -= 0.5;
          playSound(50, 0.2, 'triangle');
        } else {
          gameState = 'gameover';
          playSound(80, 0.5, 'sawtooth');
        }
      }
    }
    
    // Spawn
    if (Math.random() < 0.02) spawnScrap();
    if (Math.random() < 0.01) spawnAsteroid();
    
    // Update HUD
    document.getElementById('fuelBar').style.width = (rocket.fuel / rocket.maxFuel * 100) + '%';
    document.getElementById('shieldBar').style.width = (rocket.shields / 100 * 100) + '%';
    document.getElementById('cargoBar').style.width = (rocket.cargo / rocket.maxCargo * 100) + '%';
  } else if (gameState === 'booster') {
    // Booster screen logic would go here
  } else if (gameState === 'highscores') {
    // High score screen
  }
  
  draw();
  animationId = requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Starfield
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 100; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  
  // Draw scrap
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'];
  for (const s of scrap) {
    ctx.fillStyle = colors[s.type];
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw asteroids
  ctx.fillStyle = '#8b7355';
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.beginPath();
    ctx.moveTo(0, -a.size);
    ctx.lineTo(a.size, 0);
    ctx.lineTo(0, a.size);
    ctx.lineTo(-a.size, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  // Draw rocket
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.angle);
  
  // Rocket body
  ctx.fillStyle = '#4a9dff';
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(10, 10);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  
  // Engine flame
  if (keys['KeyW'] || keys['ArrowUp']) {
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.lineTo(5, 10);
    ctx.lineTo(0, 25);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
  
  // Game over overlay
  if (gameState === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0e0ff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${currentScore}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 60);
  }
}

function updateHighScore() {
  if (currentScore > highScore) {
    highScore = currentScore;
    localStorage.setItem('rocketSalvageHighScore', highScore);
  }
}

function startGame() {
  gameState = 'playing';
  currentScore = 0;
  rocket.fuel = 100;
  rocket.shields = 100;
  rocket.cargo = 0;
  rocket.vx = 0;
  rocket.vy = 0;
  startTime = Date.now();
  scrap.length = 0;
  asteroids.length = 0;
  document.getElementById('overlay').style.display = 'none';
  playSound(200, 0.3, 'sine');
}

function showBuildScreen() {
  gameState = 'booster';
  document.getElementById('overlay').innerHTML = '<h1>Rocket Builder (Coming Soon)</h1><button onclick="startGame()">Back</button>';
  document.getElementById('overlay').style.display = 'block';
}

function showHighScores() {
  gameState = 'highscores';
  document.getElementById('overlay').innerHTML = `<h1>High Scores</h1><p>Best: ${highScore}</p><button onclick="document.getElementById('overlay').style.display='none'; gameState='menu';">Back</button>`;
  document.getElementById('overlay').style.display = 'block';
}

canvas.addEventListener('click', () => {
  if (gameState === 'gameover') {
    startGame();
  }
});

update();
