import { state } from '../state.js';

export function createScout(x, y, hp = 50) {
  return {
    x, y,
    hp,
    maxHp: hp,
    speed: 60 * Math.pow(1.05, state.wave - 1),
    nodeIndex: 0,
    bobPhase: Math.random() * Math.PI * 2,
    angle: 0,
    radius: 8,
    slowed: 0
  };
}

export function drawScout(s) {
  const { ctx } = state;
  ctx.save();
  ctx.translate(s.x, s.y + Math.sin(s.bobPhase + performance.now() * 0.005) * 3);
  ctx.rotate(s.angle);
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowBlur = 15;
  ctx.shadowColor = '#FFFF00';
  ctx.strokeStyle = '#FFFF00';
  ctx.lineWidth = 2;
  // Angular robot body
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(6, -6);
  ctx.lineTo(-6, -6);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-6, 6);
  ctx.lineTo(6, 6);
  ctx.closePath();
  ctx.stroke();
  // Eyes
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.arc(4, -3, 1.5, 0, Math.PI * 2);
  ctx.arc(4, 3, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  // HP bar
  if (s.hp < s.maxHp) {
    ctx.save();
    ctx.fillStyle = '#330000';
    ctx.fillRect(s.x - 12, s.y - 16, 24, 4);
    ctx.fillStyle = '#FF2244';
    ctx.fillRect(s.x - 12, s.y - 16, 24 * (s.hp / s.maxHp), 4);
    ctx.restore();
  }
}
