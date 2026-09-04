import { state } from '../state.js';

export function drawProjectile(p) {
  const { ctx } = state;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowBlur = 15;
  ctx.shadowColor = p.color;
  ctx.strokeStyle = p.color;
  ctx.fillStyle = p.color;

  if (p.type === 'orb') {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'frost') {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (p.type === 'laser') {
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.lineTo(p.x2, p.y2);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.lineTo(p.x2, p.y2);
    ctx.stroke();
  } else if (p.type === 'splash') {
    // arcing shell
    const progress = p.t / p.duration;
    const cx = (p.x + p.tx) / 2;
    const cy = Math.min(p.y, p.ty) - 100 * Math.sin(progress * Math.PI);
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    // trail
    ctx.globalAlpha = 0.5;
    for (let i = 1; i <= 3; i++) {
      const tp = Math.max(0, progress - i * 0.05);
      const tx2 = p.x + (p.tx - p.x) * tp;
      const ty2 = Math.min(p.y, p.ty) - 100 * Math.sin(tp * Math.PI);
      ctx.beginPath();
      ctx.arc(tx2, ty2, 4 - i, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

export function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.life -= dt;
    if (p.life <= 0) {
      state.projectiles.splice(i, 1);
      continue;
    }
    if (p.type === 'orb' || p.type === 'frost') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Collision with scouts
      for (const s of state.scouts) {
        if (Math.hypot(s.x - p.x, s.y - p.y) < s.radius + 5) {
          s.hp -= p.dmg;
          if (p.type === 'frost') {
            s.slowed = Math.max(s.slowed || 0, p.slowDuration);
          }
          state.damageNumbers.push({
            x: s.x, y: s.y - 20,
            text: `-${Math.round(p.dmg)}`,
            size: 16,
            life: 1,
            vy: -30,
            crit: false
          });
          state.particles.push({
            x: p.x, y: p.y, vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
            life: 0.5, color: p.color, size: 3
          });
          p.life = 0;
          break;
        }
      }
    } else if (p.type === 'splash') {
      p.t += dt;
      if (p.t >= p.duration) {
        // Explode
        for (const s of state.scouts) {
          if (Math.hypot(s.x - p.tx, s.y - p.ty) < p.radius) {
            s.hp -= p.dmg;
            state.damageNumbers.push({
              x: s.x, y: s.y - 20,
              text: `-${Math.round(p.dmg)}`,
              size: 18,
              life: 1,
              vy: -30,
              crit: true
            });
          }
        }
        // Explosion particles
        for (let k = 0; k < 20; k++) {
          const a = Math.random() * Math.PI * 2;
          const sp = Math.random() * 200;
          state.particles.push({
            x: p.tx, y: p.ty, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            life: 0.6, color: p.color, size: 4
          });
        }
        p.life = 0;
      }
    }
  }
}
