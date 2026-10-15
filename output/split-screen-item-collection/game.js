// Duality Drift - Simplified Implementation
const CONFIG = {
  LOGICAL_WIDTH: 1280,
  LOGICAL_HEIGHT: 720,
  SPLIT_ORIENTATION: 'HORIZONTAL', // HORIZONTAL or VERTICAL
  PLAYER_COUNT: 2,
  MAX_STABILITY: 100,
  GAME_TIME: 180, // 3 minutes
  SHARD_SPAWN_INTERVAL: 2500,
  ECHO_DELAY: 500,
  BANK_TIME: 1200,
  DECAY_RATE: 0.5
};

let canvas, ctx;
let gameState = {
  players: [],
  shards: [],
  echoes: [],
  stability: [0, 0],
  carriedShards: [[], []],
  lastShardSpawn: 0,
  lastEchoSpawn: [0, 0],
  gameStartTime: 0,
  isOver: false,
  winner: -1,
  highScore: loadHighScore()
};

const INPUT_STATE = { p1: {x:0, y:0, jump:false, dash:false, bank:false}, p2: {x:0, y:0, jump:false, dash:false, bank:false} };

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  setupInput();
  createPlayers();
  gameState.gameStartTime = performance.now();
  gameLoop(performance.now());
}

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / CONFIG.LOGICAL_WIDTH, window.innerHeight / CONFIG.LOGICAL_HEIGHT);
  canvas.width = CONFIG.LOGICAL_WIDTH * scale;
  canvas.height = CONFIG.LOGICAL_HEIGHT * scale;
  ctx.scale(scale, scale);
}

function setupInput() {
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyW') INPUT_STATE.p1.y = -1;
    if (e.code === 'KeyS') INPUT_STATE.p1.y = 1;
    if (e.code === 'KeyA') INPUT_STATE.p1.x = -1;
    if (e.code === 'KeyD') INPUT_STATE.p1.x = 1;
    if (e.code === 'Space') INPUT_STATE.p1.jump = true;
    if (e.code === 'ShiftLeft') INPUT_STATE.p1.dash = true;
    if (e.code === 'KeyE') INPUT_STATE.p1.bank = true;
    
    if (e.code === 'ArrowUp') INPUT_STATE.p2.y = -1;
    if (e.code === 'ArrowDown') INPUT_STATE.p2.y = 1;
    if (e.code === 'ArrowLeft') INPUT_STATE.p2.x = -1;
    if (e.code === 'ArrowRight') INPUT_STATE.p2.x = 1;
    if (e.code === 'Numpad0') INPUT_STATE.p2.jump = true;
    if (e.code === 'Numpad1') INPUT_STATE.p2.dash = true;
    if (e.code === 'Numpad2') INPUT_STATE.p2.bank = true;
  });
  window.addEventListener('keyup', e => {
    if (['KeyW','KeyS'].includes(e.code)) INPUT_STATE.p1.y = 0;
    if (['KeyA','KeyD'].includes(e.code)) INPUT_STATE.p1.x = 0;
    if (e.code === 'Space') INPUT_STATE.p1.jump = false;
    if (e.code === 'ShiftLeft') INPUT_STATE.p1.dash = false;
    if (e.code === 'KeyE') INPUT_STATE.p1.bank = false;
    
    if (['ArrowUp','ArrowDown'].includes(e.code)) INPUT_STATE.p2.y = 0;
    if (['ArrowLeft','ArrowRight'].includes(e.code)) INPUT_STATE.p2.x = 0;
    if (e.code === 'Numpad0') INPUT_STATE.p2.jump = false;
    if (e.code === 'Numpad1') INPUT_STATE.p2.dash = false;
    if (e.code === 'Numpad2') INPUT_STATE.p2.bank = false;
  });
  window.addEventListener('gamepadconnected', e => console.log('Gamepad connected', e.gamepad));
}

function createPlayers() {
  gameState.players = [
    { id: 0, x: 100, y: 100, w: 32, h: 48, vx: 0, vy: 0, facing: 1, color: 'var(--p1-color)', onGround: false, coyote: 0, jumpBuffer: 0, dashCooldown: 0, dashTime: 0, invuln: 0, carrying: 0 },
    { id: 1, x: CONFIG.LOGICAL_WIDTH - 132, y: CONFIG.LOGICAL_HEIGHT - 148, w: 32, h: 48, vx: 0, vy: 0, facing: -1, color: 'var(--p2-color)', onGround: false, coyote: 0, jumpBuffer: 0, dashCooldown: 0, dashTime: 0, invuln: 0, carrying: 0 }
  ];
}

function updatePhysics(dt) {
  const PHYS = {
    MAX_SPEED: 420,
    ACCEL_GROUND: 2800,
    ACCEL_AIR: 1400,
    DECEL_GROUND: 3200,
    DECEL_AIR: 200,
    JUMP_VELOCITY: -580,
    GRAVITY: 1600,
    COYOTE_TIME: 0.08,
    JUMP_BUFFER: 0.12,
    DASH_SPEED: 1100,
    DASH_DURATION: 0.14,
    DASH_COOLDOWN: 0.85
  };

  gameState.players.forEach((p, idx) => {
    const input = INPUT_STATE[`p${idx+1}`];
    const wasOnGround = p.onGround;
    p.onGround = false;
    
    // Coyote time
    if (wasOnGround) p.coyote = CONFIG.COYOTE_TIME;
    else p.coyote = Math.max(0, p.coyote - dt);
    
    // Jump buffer
    if (input.jump) p.jumpBuffer = CONFIG.JUMP_BUFFER;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    
    // Horizontal movement
    const accel = p.onGround ? PHYS.ACCEL_GROUND : PHYS.ACCEL_AIR;
    const decel = p.onGround ? PHYS.DECEL_GROUND : PHYS.DECEL_AIR;
    const targetVx = input.x * PHYS.MAX_SPEED;
    if (input.x !== 0) {
      p.vx += accel * input.x * dt;
      if (Math.abs(p.vx) > PHYS.MAX_SPEED) p.vx = PHYS.MAX_SPEED * Math.sign(p.vx);
    } else {
      if (p.vx > 0) { p.vx = Math.max(0, p.vx - decel * dt); }
      else if (p.vx < 0) { p.vx = Math.min(0, p.vx + decel * dt); }
    }
    
    // Jump
    if ((p.coyote > 0 || p.jumpBuffer > 0) && !input.jump) {
      p.vy = PHYS.JUMP_VELOCITY;
      p.coyote = 0;
      p.jumpBuffer = 0;
      playSound('jump');
    }
    
    // Variable jump
    if (!input.jump && p.vy < 0) p.vy *= PHYS.JUMP_VARIABLE_GRAVITY;
    
    // Gravity
    p.vy += PHYS.GRAVITY * dt;
    if (p.vy > PHYS.MAX_SPEED) p.vy = PHYS.MAX_SPEED;
    
    // Dash
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (input.dash && p.dashCooldown <= 0 && p.dashTime <= 0) {
      p.dashTime = PHYS.DASH_DURATION;
      p.dashCooldown = PHYS.DASH_COOLDOWN;
      const dirX = input.x !== 0 ? input.x : p.facing;
      const dirY = input.y !== 0 ? input.y : 0;
      const len = Math.sqrt(dirX*dirX + dirY*dirY) || 1;
      p.vx = (dirX/len) * PHYS.DASH_SPEED;
      p.vy = (dirY/len) * PHYS.DASH_SPEED;
      p.invuln = 0.1;
      playSound('dash');
    }
    if (p.dashTime > 0) {
      p.dashTime -= dt;
      if (p.dashTime <= 0) { p.vx *= 0.8; p.vy *= 0.8; }
    }
    
    // Apply velocity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    
    // Screen bounds
    const halfW = p.w/2, halfH = p.h/2;
    p.x = Math.clamp(p.x, halfW, CONFIG.LOGICAL_WIDTH - halfW);
    p.y = Math.clamp(p.y, halfH, CONFIG.LOGICAL_HEIGHT - halfH);
    
    // Ground check (simplified)
    if (p.y >= CONFIG.LOGICAL_HEIGHT - halfH - 10) {
      p.y = CONFIG.LOGICAL_HEIGHT - halfH - 10;
      p.vy = 0;
      p.onGround = true;
    }
    
    // Invulnerability
    if (p.invuln > 0) p.invuln -= dt;
  });
}

function updateShards(dt) {
  gameState.lastShardSpawn -= dt;
  if (gameState.lastShardSpawn <= 0) {
    spawnShard();
    gameState.lastShardSpawn = CONFIG.SHARD_SPAWN_INTERVAL + Math.random()*1500;
  }
  
  gameState.shards.forEach((s, i) => {
    s.angle += s.spin * dt;
    gameState.players.forEach((p, pIdx) => {
      if (rectCircleOverlap(p, s)) {
        collectShard(i, pIdx);
      }
    });
  });
}

function updateEchoes(dt) {
  gameState.echoes.forEach((e, i) => {
    e.life -= dt;
    if (e.life <= 0) gameState.echoes.splice(i,1);
    
    gameState.players.forEach((p, pIdx) => {
      if (e.targetPlayer !== pIdx && rectRectOverlap(p, e)) {
        hitPlayer(pIdx, e.knockbackX, e.knockbackY);
        gameState.echoes.splice(i,1);
        i--;
      }
    });
  });
}

function updateStability(dt) {
  gameState.stability.forEach((s, i) => {
    if (s > 0) {
      gameState.stability[i] = Math.max(0, s - CONFIG.DECAY_RATE * dt);
    }
  });
  
  // Check win condition
  if (!gameState.isOver) {
    const timeElapsed = (performance.now() - gameState.gameStartTime) / 1000;
    if (timeElapsed >= CONFIG.GAME_TIME) {
      endGame();
    } else if (gameState.stability[0] >= CONFIG.MAX_STABILITY || gameState.stability[1] >= CONFIG.MAX_STABILITY) {
      endGame();
    }
  }
}

function spawnShard() {
  const type = Math.random() < 0.1 ? 'volatile' : 'stable';
  gameState.shards.push({
    x: 50 + Math.random() * (CONFIG.LOGICAL_WIDTH - 100),
    y: 50 + Math.random() * (CONFIG.LOGICAL_HEIGHT - 100),
    r: type === 'stable' ? 14 : 16,
    angle: 0,
    spin: (Math.random() - 0.5) * 4,
    type,
    volatileTimer: type === 'volatile' ? 1500 : 0
  });
}

function collectShard(shardIdx, playerIdx) {
  const shard = gameState.shards[shardIdx];
  const gain = shard.type === 'stable' ? 5 : 15;
  gameState.carriedShards[playerIdx].push(shard);
  if (gameState.carriedShards[playerIdx].length > 3) {
    bankShards(playerIdx);
  }
  gameState.shards.splice(shardIdx, 1);
  playSound('collect');
  
  // Spawn echo for opponent
  setTimeout(() => {
    const oppIdx = 1 - playerIdx;
    const echo = {
      x: gameState.players[oppIdx].x,
      y: gameState.players[oppIdx].y,
      w: 20,
      h: 20,
      life: 2000,
      targetPlayer: oppIdx,
      knockbackX: (Math.random() - 0.5) * 1000,
      knockbackY: (Math.random() - 0.5) * 1000
    };
    gameState.echoes.push(echo);
    gameState.lastEchoSpawn[oppIdx] = performance.now();
  }, CONFIG.ECHO_DELAY);
}

function bankShards(playerIdx) {
  const anchorZone = playerIdx === 0 ? {x:0, y:0, w:100, h:CONFIG.LOGICAL_HEIGHT} : 
                    {x:CONFIG.LOGICAL_WIDTH-100, y:0, w:100, h:CONFIG.LOGICAL_HEIGHT};
  const p = gameState.players[playerIdx];
  if (rectRectOverlap(p, anchorZone) && INPUT_STATE[`p${playerIdx+1}`].bank) {
    p.bankTimer = (p.bankTimer || 0) + 16;
    if (p.bankTimer >= CONFIG.BANK_TIME) {
      const gained = gameState.carriedShards[playerIdx].length * (gameState.carriedShards[playerIdx][0].type === 'stable' ? 5 : 15);
      gameState.stability[playerIdx] = Math.min(CONFIG.MAX_STABILITY, gameState.stability[playerIdx] + gained);
      gameState.carriedShards[playerIdx] = [];
      p.bankTimer = 0;
      playSound('bank');
      // Clear own echoes
      gameState.echoes = gameState.echoes.filter(e => e.targetPlayer === playerIdx);
    }
  } else {
    p.bankTimer = 0;
  }
}

function hitPlayer(playerIdx, knockbackX, knockbackY) {
  const p = gameState.players[playerIdx];
  p.vx += knockbackX * 0.001;
  p.vy += knockbackY * 0.001;
  p.invuln = 0.5;
  gameState.stability[playerIdx] = Math.max(0, gameState.stability[playerIdx] - 10);
  playSound('hit');
}

function endGame() {
  gameState.isOver = true;
  if (gameState.stability[0] > gameState.stability[1]) gameState.winner = 0;
  else if (gameState.stability[1] > gameState.stability[0]) gameState.winner = 1;
  else gameState.winner = -1; // Tie
  
  if (gameState.winner !== -1 && gameState.stability[gameState.winner] > gameState.highScore) {
    gameState.highScore = gameState.stability[gameState.winner];
    saveHighScore(gameState.highScore);
  }
}

function gameLoop(timestamp) {
  const dt = Math.min(1/30, (timestamp - lastTime) / 1000);
  lastTime = timestamp;
  
  updatePhysics(dt);
  updateShards(dt);
  updateEchoes(dt);
  updateStability(dt);
  
  render();
  requestAnimationFrame(gameLoop);
}

let lastTime = performance.now();
function render() {
  ctx.clearRect(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT);
  
  // Split screen
  if (CONFIG.SPLIT_ORIENTATION === 'HORIZONTAL') {
    renderViewport(0, 0, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT/2, 0);
    renderViewport(0, CONFIG.LOGICAL_HEIGHT/2, CONFIG.LOGICAL_WIDTH, CONFIG.LOGICAL_HEIGHT/2, 1);
  } else {
    renderViewport(0, 0, CONFIG.LOGICAL_WIDTH/2, CONFIG.LOGICAL_HEIGHT, 0);
    renderViewport(CONFIG.LOGICAL_WIDTH/2, 0, CONFIG.LOGICAL_WIDTH/2, CONFIG.LOGICAL_HEIGHT, 1);
  }
  
  // HUD
  renderHUD();
  
  // Timer
  const timeLeft = Math.max(0, CONFIG.GAME_TIME - (performance.now() - gameState.gameStartTime)/1000);
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil(timeLeft)}s`, CONFIG.LOGICAL_WIDTH/2, 30);
  
  // Game over
  if (gameState.isOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,CONFIG.LOGICAL_WIDTH,CONFIG.LOGICAL_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gameState.winner === -1 ? 'TIE' : `PLAYER ${gameState.winner+1} WINS!`, CONFIG.LOGICAL_WIDTH/2, CONFIG.LOGICAL_HEIGHT/2);
    ctx.font = '24px monospace';
    ctx.fillText(`High Score: ${gameState.highScore}`, CONFIG.LOGICAL_WIDTH/2, CONFIG.LOGICAL_HEIGHT/2 + 40);
  }
}

function renderViewport(x, y, width, height, playerIdx) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  
  // Background
  ctx.fillStyle = 'var(--bg-color)';
  ctx.fillRect(x, y, width, height);
  
  // Anchor zone
  const anchorColor = playerIdx === 0 ? 'var(--p1-color)' : 'var(--p2-color)';
  ctx.fillStyle = anchorColor + '20';
  const anchorX = playerIdx === 0 ? x : x + width - 100;
  ctx.fillRect(anchorX, y, 100, height);
  
  // Shards
  gameState.shards.forEach(s => {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.fillStyle = s.type === 'stable' ? '#00ffff' : '#ff0000';
    ctx.beginPath();
    for (let i=0; i<8; i++) {
      const angle = (i * Math.PI/4) + (s.type === 'stable' ? 0 : Math.PI/8);
      const radius = s.type === 'stable' ? s.r : s.r * (0.5 + 0.5 * Math.sin(performance.now()*0.005));
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i===0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  
  // Echoes
  gameState.echoes.forEach(e => {
    if (e.targetPlayer === playerIdx) {
      ctx.fillStyle = '#ff000080';
      ctx.fillRect(e.x - e.w/2, e.y - e.h/2, e.w, e.h);
    }
  });
  
  // Players
  gameState.players.forEach((p, i) => {
    if (i !== playerIdx) return; // Only render current player in their viewport
    ctx.fillStyle = p.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(p.x - p.w/2, p.y - p.h/2, p.w, p.h, 8);
    ctx.fill();
    ctx.stroke();
    
    // Core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
    ctx.fill();
    
    // Carried shards
    gameState.carriedShards[i].forEach((shard, idx) => {
      const angle = (performance.now()*0.002 + idx) * (Math.PI*2 / 3);
      const radius = 36 - idx*4;
      const sx = p.x + Math.cos(angle) * radius;
      const sy = p.y + Math.sin(angle) * radius;
      ctx.fillStyle = shard.type === 'stable' ? '#00ffff' : '#ff0000';
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI*2);
      ctx.fill();
    });
    
    // Dash trail
    if (p.dashTime > 0) {
      ctx.strokeStyle = p.color + '80';
      ctx.lineWidth = 4;
      ctx.beginPath();
     
      // Draw a line from a point behind the player to current position
      const dashLength = 20 * (p.dashTime / PHYS.DASH_DURATION);
      ctx.moveTo(p.x - p.vx * dashLength, p.y - p.vy * dashLength);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}

function renderHUD() {
  // Player 1 HUD (top left)
  ctx.fillStyle = 'var(--p1-color)';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`P1 Stability: ${gameState.stability[0]}`, 10, 20);
  ctx.fillText(`Shards: ${gameState.carriedShards[0].length}/3`, 10, 40);

  // Player 2 HUD (top right)
  ctx.fillStyle = 'var(--p2-color)';
  ctx.textAlign = 'right';
  ctx.fillText(`P2 Stability: ${gameState.stability[1]}`, CONFIG.LOGICAL_WIDTH - 10, 20);
  ctx.fillText(`Shards: ${gameState.carriedShards[1].length}/3`, CONFIG.LOGICAL_WIDTH - 10, 40);
}

function rectCircleOverlap(rect, circle) {
  const distX = Math.abs(circle.x - rect.x - rect.w/2);
  const distY = Math.abs(circle.y - rect.y - rect.h/2);
  if (distX > rect.w/2 + circle.r) return false;
  if (distY > rect.h/2 + circle.r) return false;
  if (distX <= rect.w/2) return true;
  if (distY <= rect.h/2) return true;
  const dx = distX - rect.w/2;
  const dy = distY - rect.h/2;
  return dx*dx + dy*dy <= circle.r*circle.r;
}

function rectRectOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

function playSound(name) {
  // Placeholder for sound effects; could use Web Audio API or just ignore.
  // For simplicity, we do nothing.
  // Uncomment to use beep via OscillatorNode if desired.
  /*
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = name === 'jump' ? 400 : name === 'dash' ? 600 : name === 'collect' ? 800 : name === 'bank' ? 500 : name === 'hit' ? 200 : 300;
  gain.gain.setValueAtTime(0.0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
  gain.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.2);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
  */
}

function loadHighScore() {
  return parseInt(localStorage.getItem('dualityDriftHighScore') || '0', 10);
}

function saveHighScore(score) {
  localStorage.setItem('dualityDriftHighScore', score.toString());
}

// Start the game
window.addEventListener('load', init);