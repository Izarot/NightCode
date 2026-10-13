const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let internalWidth = 320;
let internalHeight = 180;
let player = { x: 1, y: 1, lane: 1, node: 1, hasPatty: false, serving: false };
let customer = { x: 3, y: 1, lane: 1, node: 0, patience: 10, maxPatience: 10 }; 
let grillTimer = 0;
let score = 0;
let strikes = 0;
let shiftTime = 300;
let highScore = parseInt(localStorage.getItem('stanchionHighScore') || '0');
let gameOver = false;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / internalWidth, rect.height / internalHeight);
  const scaledWidth = internalWidth * scale;
  const scaledHeight = internalHeight * scale;
  canvas.width = scaledWidth * dpr;
  canvas.height = scaledHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale, 0, 0, scale, (rect.width - scaledWidth) / 2, (rect.height - scaledHeight) / 2);
}

function update() {
  if (gameOver) return;
  shiftTime -= 1/60;
  if (shiftTime <= 0) {
    gameOver = true;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('stanchionHighScore', highScore);
    }
    return;
  }
  customer.patience -= 1/60;
  if (customer.patience <= 0) {
    strikes++;
    customer = { x: 3, y: 1, lane: 1, node: 0, patience: 10, maxPatience: 10 };
    if (strikes >= 3) gameOver = true;
  }
  if (player.lane === customer.lane && player.node === customer.node && player.hasPatty && !player.serving) {
    player.serving = true;
    setTimeout(() => {
      score++;
      player.hasPatty = false;
      player.serving = false;
      customer = { x: 3, y: 1, lane: 1, node: 0, patience: 10, maxPatience: 10 };
    }, 500);
  }
  if (player.lane === 0 && player.node === 0 && !player.hasPatty && !grillTimer) {
    grillTimer = 180;
  }
  if (grillTimer > 0) {
    grillTimer--;
    if (grillTimer === 0) player.hasPatty = true;
  }
}

function render() {
  ctx.fillStyle = '#003B46';
  ctx.fillRect(0, 0, internalWidth, internalHeight);
  ctx.fillStyle = '#E8C58D';
  ctx.fillRect(0, 50, internalWidth, 20);
  ctx.fillStyle = '#FF2E88';
  ctx.fillRect(player.x * 40 + 10, player.y * 40 + 10, 20, 20);
  ctx.fillStyle = player.hasPatty ? '#FFD700' : '#8B4513';
  ctx.fillRect(customer.x * 40 + 10, customer.y * 40 + 10, 20, 20);
  ctx.fillStyle = '#00FFE0';
  ctx.font = '12px VT323';
  ctx.fillText(`Time: ${Math.ceil(shiftTime)}`, 10, 20);
  ctx.fillText(`Score: ${score}`, internalWidth/2 - 20, 20);
  ctx.fillText(`Strikes: ${strikes}/3`, internalWidth - 60, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, internalWidth, internalHeight);
    ctx.fillStyle = '#FF2E88';
    ctx.font = '24px VT323';
    ctx.fillText('GAME OVER', internalWidth/2 - 60, internalHeight/2);
    ctx.fillText(`High Score: ${highScore}`, internalWidth/2 - 60, internalHeight/2 + 30);
  }
}

function gameLoop(timestamp) {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', (e) => {
  if (gameOver) return;
  switch(e.key) {
    case 'ArrowLeft': player.node = Math.max(0, player.node - 1); break;
    case 'ArrowRight': player.node = Math.min(2, player.node + 1); break;
    case 'ArrowUp': player.lane = Math.max(0, player.lane - 1); break;
    case 'ArrowDown': player.lane = Math.min(2, player.lane + 1); break;
    case ' ':
    case 'Enter':
      if (player.lane === 0 && player.node === 0) grillTimer = 180;
      break;
  }
});

resize();
requestAnimationFrame(gameLoop);
}