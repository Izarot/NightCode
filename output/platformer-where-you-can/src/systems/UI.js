import { player } from '../entities/Player.js';
export function drawUI(ctx) {
  // Health
  ctx.fillStyle = '#FF0055';
  for (let i = 0; i < 3; i++) ctx.fillRect(10 + i*20, 50, 16, 16);
  // Chips
  ctx.fillStyle = '#00F0FF';
  ctx.fillText(`Chips: ${player.chips}/10`, 10, 80);
  // Cooldown
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(50, 120, 16, 0, Math.PI * 2);
  ctx.stroke();
}
