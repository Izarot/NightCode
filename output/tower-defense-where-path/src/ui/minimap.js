import { state } from '../state.js';

const MAP_W = 1920;
const MAP_H = 1080;
const MINIMAP_W = 180;
const MINIMAP_H = 100;

export function drawMinimap() {
  const { ctx } = state;
  const x = state.width - MINIMAP_W - 20;
  const y = 90;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 14, 39, 0.85)';
  ctx.fillRect(x, y, MINIMAP_W, MINIMAP_H);
  ctx.strokeStyle = '#00F0FF';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, MINIMAP_W, MINIMAP_H);

  const sx = MINIMAP_W / MAP_W;
  const sy = MINIMAP_H / MAP_H;

  ctx.scale(sx, sy);
  ctx.translate(x / sx, y / sy);

  // Highways
  ctx.globalCompositeOperation = 'lighter';
  state.highways.forEach(hw => {
    ctx.strokeStyle = '#FF00AA';
    ctx.lineWidth = 8;
    ctx.beginPath();
    hw.nodes.forEach((n, i) => {
      if (i === 0) ctx.moveTo(n.x, n.y);
      else ctx.lineTo(n.x, n.y);
    });
    ctx.stroke();
  });

  // Towers
  state.towers.forEach(t => {
    ctx.fillStyle = t.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
    ctx.fill();
  });

  // Scouts
  state.scouts.forEach(s => {
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Core
  ctx.fillStyle = '#FF00AA';
  ctx.beginPath();
  ctx.arc(state.coreNode.x, state.coreNode.y, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
