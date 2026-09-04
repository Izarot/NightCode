import { state } from '../state.js';
import { getTowerType } from '../entities/tower.js';

export function drawPlacementPreview() {
  const { ctx } = state;
  if (!state.selectedTower || state.eraserActive) return;

  const t = getTowerType(state.selectedTower);
  if (!t) return;

  const mx = state.mouse.x;
  const my = state.mouse.y;

  // Find nearest build zone
  let nearest = null;
  let nearestDist = Infinity;
  for (const z of state.buildZones) {
    const d = Math.hypot(z.x - mx, z.y - my);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = z;
    }
  }
  if (!nearest) return;

  const occupied = state.towers.some(tw => Math.hypot(tw.x - nearest.x, tw.y - nearest.y) < 30);
  const canPlace = !occupied && state.energy >= t.cost;

  ctx.save();
  ctx.strokeStyle = canPlace ? t.color : '#FF2244';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(nearest.x, nearest.y, 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Range preview
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(nearest.x, nearest.y, t.range, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}
