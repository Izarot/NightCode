// Main game loop
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup with responsive scaling
function resizeCanvas() {
  const container = document.getElementById('game-container');
  const ratio = 1280 / 720;
  let width = Math.min(window.innerWidth, container.clientWidth);
  let height = Math.min(window.innerHeight, container.clientHeight);
  
  if (width / height > ratio) {
    width = height * ratio;
  } else {
    height = width / ratio;
  }
  
  canvas.width = 1280;
  canvas.height = 720;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Color palette
const PALETTE = {
  bg: '#0d1117',
  player: '#00ffff',
  projectile: '#ff6b6b',
  enemy: '#785ce9',
  shield: '#00ffcc',
  healthOrb: '#00ff00',
  speedOrb: '#ffff00',
  ammoOrb: '#ff8800',
  background: '#0d1117',
  stars: '#ffffff'
};

// Simple player
const player = {
  x: canvas.width/2,
  y: canvas.height - 50,
  width: 40,
  height: 40,
  color: '#ff6b6b'
};

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function update(){
  // Basic update logic for the player
  // Handles movement, rotation, and basic physics
  if (keys['w'] || keys['ArrowUp']) player.vy -= 0.8;
  if (keys['s'] || keys['ArrowDown']) player.vy += 0.8;
  if (keys['a'] || keys['ArrowLeft']) player.vx -= 0.8;
  if (keys['d'] || keys['ArrowRight']) player.vx += 0.8;
  const spd = Math.sqrt(player.vx*player.vx+player.vy*player.vy);
  if (spd > 5) { player.vx = player.vx/spd*5; player.vy = player.vy/spd*5; }
  player.x += player.vx; player.y += player.vy;
  player.x = (player.x + canvas.width) % canvas.width - player.width/2;
  player.y = (player.y + canvas.height) % canvas.height - player.height/2;
}

function gameLoop(timestamp){
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);