import { state } from './state.js';
import { drawHighway } from './systems/highway.js';
import { drawTower } from './entities/tower.js';
import { drawScout } from './entities/scout.js';
import { drawProjectile } from './entities/projectile.js';
import { drawParticles } from './entities/particles.js';
import { drawHUD } from './ui/hud.js';
import { drawMinimap } from './ui/minimap.js';
import { drawPlacementPreview } from './ui/placementPreview.js';

const COLORS = {
  bg: '#0A0E27',
  grid: '#1A1F3A',
  cyan: '#00F0FF',
  magenta: '#FF00AA',
  yellow: '#FFFF00',
  green: '#00FF88',
  pink: '#FF0088',
  red: '#FF2244',
  white: '#FFFFFF'
};

export function render() {
  const { ctx, width, height, camera } = state;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-width / 2 - camera.x, -height / 2 - camera.y);

  drawHexGrid();
  drawBuildZones();
  drawHighway();
  drawCore();

  state.towers.forEach(t => drawTower(t));
  state.scouts.forEach(s => drawScout(s));
  state.projectiles.forEach(p => drawProjectile(p));
  drawParticles();

  drawDamageNumbers();
  drawPlacementPreview();

  ctx.restore();

  // UI Overlay (not affected by camera)
  drawHUD();
  drawMinimap();
}

function drawHexGrid() {
  const { ctx, width, height } = state;
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  const size = 60;
  for (let y = -size; y < height + size; y += size * 1.5) {
    for (let x = -size; x < width + size; x += size * Math.sqrt(3)) {
      const ox = (Math.floor(y / (size * 1.5)) % 2) * size * Math.sqrt(3) / 2;
      drawHex(x + ox, y, size);
    }
  }
  ctx.globalAlpha = 1;
}

function drawHex(x, y, size) {
  const { ctx } = state;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const px = x + size * Math.cos(a);
    const py = y + size * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawBuildZones() {
  const { ctx } = state;
  state.buildZones.forEach(z => {
    ctx.fillStyle = COLORS.cyan;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(z.x, z.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLORS.cyan;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(z.x, z.y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function drawCore() {
  const { ctx } = state;
  const { coreNode } = state;
  ctx.save();
  ctx.translate(coreNode.x, coreNode.y);
  ctx.shadowBlur = 30;
  ctx.shadowColor = COLORS.magenta;
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 3;
  ctx.globalCompositeOperation = 'lighter';
  // Hexagonal core
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    const px = 50 * Math.cos(a);
    const py = 50 * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

function drawDamageNumbers() {
  const { ctx } = state;
  state.damageNumbers.forEach(d => {
    ctx.save();
    ctx.fillStyle = d.crit ? COLORS.red : COLORS.white;
    ctx.font = `bold ${d.size}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.max(0, d.life);
    ctx.shadowBlur = 8;
    ctx.shadowColor = d.crit ? COLORS.red : COLORS.cyan;
    ctx.fillText(d.text, d.x, d.y);
    ctx.restore();
  });
}
