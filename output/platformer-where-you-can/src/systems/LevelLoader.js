import { player } from '../entities/Player.js';

export const tiles = [];
export const chips = [];

export async function loadLevel(name) {
  // Procedural level
  for (let x = 0; x < 100; x++) {
    tiles.push({ x: x*32, y: 400, w: 32, h: 32, type: 'solid' });
  }
  for (let i = 0; i < 10; i++) {
    chips.push({ x: 100 + i*64, y: 350, collected: false });
  }
  player.x = 50; player.y = 300;
}
export function drawLevel(ctx) {
  ctx.fillStyle = '#00F0FF';
  tiles.forEach(t => ctx.fillRect(t.x, t.y, t.w, t.h));
  ctx.fillStyle = '#FFE600';
  chips.forEach(c => { if (!c.collected) ctx.fillRect(c.x, c.y, 16, 16); });
}
