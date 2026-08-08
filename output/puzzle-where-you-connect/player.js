// Player movement physics and input handling
let player = { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, radius: 8 };
const ACCEL = 0.5;
const DEACCEL = 0.3;
const MAX_SPEED = 3;
const CELL_SIZE = 16;
const GRID_SIZE = 16;

let keys = {};
let mousePos = { x: 0, y: 0 };
let mouseDown = false;
let selectedNode = null;
let wirePath = [];

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', () => mouseDown = true);
canvas.addEventListener('mouseup', () => mouseDown = false);

function updatePlayer(delta) {
  // Keyboard input
  if (keys['w'] || keys['arrowup']) player.ay = -ACCEL;
  else if (keys['s'] || keys['arrowdown']) player.ay = ACCEL;
  else player.ay = player.vy > 0 ? -DEACCEL : player.vy < 0 ? DEACCEL : 0;

  if (keys['a'] || keys['arrowleft']) player.ax = -ACCEL;
  else if (keys['d'] || keys['arrowright']) player.ax = ACCEL;
  else player.ax = player.vx > 0 ? -DEACCEL : player.vx < 0 ? DEACCEL : 0;

  player.vx += player.ax;
  player.vy += player.ay;

  // Clamp speed
  if (Math.abs(player.vx) > MAX_SPEED) player.vx = Math.sign(player.vx) * MAX_SPEED;
  if (Math.abs(player.vy) > MAX_SPEED) player.vy = Math.sign(player.vy) * MAX_SPEED;

  player.x += player.vx;
  player.y += player.vy;

  // Boundary collision
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x > canvas.width) { player.x = canvas.width; player.vx = 0; }
  if (player.y < 0) { player.y = 0; player.vy = 0; }
  if (player.y > canvas.height) { player.y = canvas.height; player.vy = 0; }

  // Mouse interaction for wire placement
  if (mouseDown) {
    handleWirePlacement();
  }
}

function handleWirePlacement() {
  const gridX = Math.floor(mousePos.x / CELL_SIZE);
  const gridY = Math.floor(mousePos.y / CELL_SIZE);
  if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) return;

  if (!selectedNode) {
    selectedNode = findNodeAt(gridX, gridY);
    if (selectedNode) {
      wirePath = [{x: selectedNode.x, y: selectedNode.y}];
      playSound(440, 0.1);
    }
  } else {
    const node = findNodeAt(gridX, gridY);
    if (node && node !== selectedNode) {
      if (isValidWirePath(selectedNode, node)) {
        wirePath.push({x: node.x, y: node.y});
        playSound(660, 0.1);
        if (node.type === 'bulb') {
          node.lit = true;
          playSound(880, 0.2);
        }
        selectedNode = node;
      } else {
        playSound(220, 0.1);
      }
    }
  }
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#00ffea';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#00ffea';
  ctx.fill();
  ctx.shadowBlur = 0;
}
