import { state } from '../state.js';
import { getAllTowerTypes } from '../entities/tower.js';

const COLORS = {
  cyan: '#00F0FF',
  magenta: '#FF00AA',
  yellow: '#FFFF00',
  red: '#FF2244',
  white: '#FFFFFF',
  green: '#00FF88'
};

export function drawHUD() {
  const { ctx } = state;
  ctx.save();

  // Top bar
  ctx.fillStyle = 'rgba(10, 14, 39, 0.85)';
  ctx.fillRect(0, 0, state.width, 70);
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(state.width, 70);
  ctx.stroke();

  ctx.font = "bold 24px 'Share Tech Mono', monospace";
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowBlur = 10;
  ctx.shadowColor = COLORS.cyan;
  ctx.fillText('TRAILBLAZE', 20, 35);

  ctx.font = "18px 'Share Tech Mono', monospace";
  ctx.fillStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  ctx.fillText(`⚡ ${state.energy}`, 220, 35);

  ctx.fillStyle = state.coreHp > 30 ? COLORS.green : COLORS.red;
  ctx.shadowColor = ctx.fillStyle;
  ctx.fillText(`♥ ${state.coreHp}/${state.coreMaxHp}`, 380, 35);

  ctx.fillStyle = COLORS.magenta;
  ctx.shadowColor = COLORS.magenta;
  ctx.fillText(`WAVE ${state.wave}/${state.maxWaves}`, 580, 35);

  ctx.fillStyle = COLORS.white;
  ctx.shadowColor = COLORS.white;
  const mm = Math.floor(state.speedrunTime / 60).toString().padStart(2, '0');
  const ss = (state.speedrunTime % 60).toFixed(1).padStart(4, '0');
  ctx.fillText(`⏱ ${mm}:${ss}`, 780, 35);

  ctx.fillStyle = state.scoutsEscaped > 20 ? COLORS.red : COLORS.white;
  ctx.shadowColor = ctx.fillStyle;
  ctx.fillText(`ESC ${state.scoutsEscaped}/${state.maxEscapes}`, 980, 35);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  ctx.fillText(`HI: ${state.highScore}`, state.width - 20, 35);

  // Wave status
  ctx.font = "bold 28px 'Share Tech Mono', monospace";
  ctx.textAlign = 'center';
  ctx.shadowBlur = 15;
  if (state.waveStatus === 'BUILD PHASE') {
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.fillText(`BUILD PHASE — ${Math.ceil(state.buildPhaseTimer)}s`, state.width / 2, 110);
  } else {
    ctx.fillStyle = COLORS.red;
    ctx.shadowColor = COLORS.red;
    ctx.fillText(state.waveStatus, state.width / 2, 110);
  }

  // Tower shop
  drawTowerShop();

  // Eraser button
  drawEraserButton();

  // Start wave button (during build phase)
  if (state.waveStatus === 'BUILD PHASE') {
    drawStartWaveButton();
  }

  // Game over / Victory screens
  if (state.gameOver) drawGameOver();
  if (state.victory) drawVictory();

  ctx.restore();
}

function drawTowerShop() {
  const { ctx } = state;
  const towers = getAllTowerTypes();
  const keys = Object.keys(towers);
  const startX = 20;
  const startY = state.height - 130;
  ctx.fillStyle = 'rgba(10, 14, 39, 0.85)';
  ctx.fillRect(startX - 10, startY - 10, 540, 120);
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1;
  ctx.strokeRect(startX - 10, startY - 10, 540, 120);

  ctx.font = "bold 14px 'Share Tech Mono', monospace";
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowBlur = 5;
  ctx.shadowColor = COLORS.cyan;
  ctx.textAlign = 'left';
  ctx.fillText('TOWER DEPOT [1-4]', startX, startY + 10);

  keys.forEach((key, i) => {
    const t = towers[key];
    const x = startX + i * 130;
    const y = startY + 30;
    const selected = state.selectedTower === key;
    const affordable = state.energy >= t.cost;

    ctx.fillStyle = selected ? 'rgba(0, 240, 255, 0.3)' : 'rgba(0, 240, 255, 0.05)';
    ctx.fillRect(x, y, 120, 70);
    ctx.strokeStyle = selected ? COLORS.cyan : (affordable ? t.color : '#444444');
    ctx.lineWidth = selected ? 3 : 1;
    ctx.strokeRect(x, y, 120, 70);

    ctx.shadowBlur = 8;
    ctx.shadowColor = t.color;
    ctx.fillStyle = t.color;
    ctx.font = "bold 16px 'Share Tech Mono', monospace";
    ctx.fillText(`${i + 1}. ${t.name}`, x + 8, y + 22);

    ctx.shadowBlur = 0;
    ctx.fillStyle = affordable ? COLORS.yellow : COLORS.red;
    ctx.font = "13px 'Share Tech Mono', monospace";
    ctx.fillText(`⚡ ${t.cost}`, x + 8, y + 42);

    ctx.fillStyle = COLORS.white;
    ctx.font = "11px 'Share Tech Mono', monospace";
    ctx.fillText(`DMG ${t.dmg} RNG ${t.range}`, x + 8, y + 58);
  });
}

function drawEraserButton() {
  const { ctx } = state;
  const x = state.width - 140;
  const y = state.height - 130;
  ctx.fillStyle = state.eraserActive ? 'rgba(255, 34, 68, 0.3)' : 'rgba(10, 14, 39, 0.85)';
  ctx.fillRect(x - 10, y - 10, 140, 120);
  ctx.strokeStyle = state.eraserActive ? COLORS.red : COLORS.cyan;
  ctx.lineWidth = state.eraserActive ? 3 : 1;
  ctx.strokeRect(x - 10, y - 10, 140, 120);

  ctx.shadowBlur = 10;
  ctx.shadowColor = COLORS.red;
  ctx.fillStyle = COLORS.red;
  ctx.font = "bold 18px 'Share Tech Mono', monospace";
  ctx.textAlign = 'center';
  ctx.fillText('ERASER [E]', x + 60, y + 25);

  ctx.shadowBlur = 5;
  ctx.font = "14px 'Share Tech Mono', monospace";
  for (let i = 0; i < state.eraserMaxCharges; i++) {
    ctx.fillStyle = i < state.eraserCharges ? COLORS.red : '#330000';
    ctx.shadowColor = i < state.eraserCharges ? COLORS.red : '#000000';
    ctx.beginPath();
    ctx.arc(x + 30 + i * 20, y + 60, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.white;
  ctx.font = "11px 'Share Tech Mono', monospace";
  ctx.fillText(`Refills in ${Math.ceil(state.eraserRegenInterval - state.eraserRegenTimer)}s`, x + 60, y + 90);
}

function drawStartWaveButton() {
  const { ctx } = state;
  const x = state.width / 2 - 100;
  const y = state.height - 70;
  ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
  ctx.fillRect(x, y, 200, 40);
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = COLORS.green;
  ctx.strokeRect(x, y, 200, 40);

  ctx.fillStyle = COLORS.green;
  ctx.font = "bold 18px 'Share Tech Mono', monospace";
  ctx.textAlign = 'center';
  ctx.fillText('▶ START WAVE [SPACE]', x + 100, y + 26);
}

function drawGameOver() {
  const { ctx } = state;
  ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.textAlign = 'center';
  ctx.shadowBlur = 30;
  ctx.shadowColor = COLORS.red;
  ctx.fillStyle = COLORS.red;
  ctx.font = "bold 96px 'Share Tech Mono', monospace";
  ctx.fillText('SYSTEM BREACH', state.width / 2, state.height / 2 - 60);

  ctx.shadowBlur = 15;
  ctx.shadowColor = COLORS.white;
  ctx.fillStyle = COLORS.white;
  ctx.font = "28px 'Share Tech Mono', monospace";
  const mm = Math.floor(state.speedrunTime / 60).toString().padStart(2, '0');
  const ss = (state.speedrunTime % 60).toFixed(1).padStart(4, '0');
  ctx.fillText(`Time: ${mm}:${ss}`, state.width / 2, state.height / 2 + 20);
  ctx.fillText(`Wave Reached: ${state.wave}`, state.width / 2, state.height / 2 + 60);

  ctx.fillStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  ctx.fillText(`Score: ${Math.floor(state.energy * 100)}`, state.width / 2, state.height / 2 + 100);

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.font = "22px 'Share Tech Mono', monospace";
  ctx.fillText('Press [R] to Restart', state.width / 2, state.height / 2 + 160);
}

function drawVictory() {
  const { ctx } = state;
  ctx.fillStyle = 'rgba(10, 14, 39, 0.9)';
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.textAlign = 'center';
  ctx.shadowBlur = 30;
  ctx.shadowColor = COLORS.green;
  ctx.fillStyle = COLORS.green;
  ctx.font = "bold 96px 'Share Tech Mono', monospace";
  ctx.fillText('TRAIL BLAZED', state.width / 2, state.height / 2 - 60);

  ctx.shadowBlur = 15;
  ctx.shadowColor = COLORS.white;
  ctx.fillStyle = COLORS.white;
  ctx.font = "28px 'Share Tech Mono', monospace";
  const mm = Math.floor(state.speedrunTime / 60).toString().padStart(2, '0');
  const ss = (state.speedrunTime % 60).toFixed(1).padStart(4, '0');
  ctx.fillText(`Time: ${mm}:${ss}`, state.width / 2, state.height / 2 + 20);
  ctx.fillText(`Escapes: ${state.scoutsEscaped}`, state.width / 2, state.height / 2 + 60);

  ctx.fillStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  const score = Math.floor(state.energy * 100 + Math.max(0, 600 - state.speedrunTime));
  ctx.fillText(`Final Score: ${score}`, state.width / 2, state.height / 2 + 100);

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.font = "22px 'Share Tech Mono', monospace";
  ctx.fillText('Press [R] to Restart', state.width / 2, state.height / 2 + 160);
}
