import { state } from '../state.js';
import { playSound } from '../utils/audio.js';

const TOWER_TYPES = {
  pulse: { name: 'PULSE', cost: 100, dmg: 10, range: 120, fireRate: 0.3, color: '#00F0FF', projectile: 'orb' },
  mortar: { name: 'MORTAR', cost: 200, dmg: 25, range: 180, fireRate: 1.2, color: '#00FF88', projectile: 'splash' },
  sniper: { name: 'SNIPER', cost: 250, dmg: 50, range: 400, fireRate: 1.5, color: '#FF0088', projectile: 'laser' },
  slow: { name: 'SLOW', cost: 150, dmg: 2, range: 100, fireRate: 0.5, color: '#4488FF', projectile: 'frost' }
};

export function getTowerType(key) {
  return TOWER_TYPES[key];
}

export function getAllTowerTypes() {
  return TOWER_TYPES;
}

export function createTower(x, y, type) {
  const t = TOWER_TYPES[type];
  return {
    x, y,
    type,
    dmg: t.dmg,
    range: t.range,
    fireRate: t.fireRate,
    color: t.color,
    cooldown: 0,
    angle: 0,
    target: null,
    pulseTime: 0
  };
}

export function drawTower(t) {
  const { ctx } = state;
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.shadowBlur = 20;
  ctx.shadowColor = t.color;
  ctx.strokeStyle = t.color;
  ctx.lineWidth = 2;

  if (t.type === 'pulse') {
    // Tetrahedron
    ctx.rotate(t.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -12);
    ctx.lineTo(-10, 12);
    ctx.closePath();
    ctx.stroke();
  } else if (t.type === 'mortar') {
    // Hex base + rotating top
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      const px = 18 * Math.cos(a);
      const py = 18 * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.rotate(t.angle);
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(14, 0);
    ctx.stroke();
  } else if (t.type === 'sniper') {
    // Tall monolith
    ctx.fillStyle = t.color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-4, -22, 8, 44);
    ctx.globalAlpha = 1;
    ctx.strokeRect(-4, -22, 8, 44);
    ctx.rotate(t.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();
  } else if (t.type === 'slow') {
    // Spinning ring
    t.pulseTime += 0.05;
    ctx.rotate(t.pulseTime);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.rotate(-t.pulseTime * 2);
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

export function towerShoot(t, dt) {
  if (t.cooldown > 0) t.cooldown -= dt;
  // Find target
  let closest = null;
  let closestDist = t.range;
  for (const s of state.scouts) {
    const d = Math.hypot(s.x - t.x, s.y - t.y);
    if (d < closestDist) {
      closestDist = d;
      closest = s;
    }
  }
  t.target = closest;
  if (!closest) return;
  t.angle = Math.atan2(closest.y - t.y, closest.x - t.x);

  if (t.cooldown <= 0) {
    t.cooldown = t.fireRate;
    if (t.type === 'pulse') {
      state.projectiles.push({
        x: t.x, y: t.y,
        vx: Math.cos(t.angle) * 400,
        vy: Math.sin(t.angle) * 400,
        dmg: t.dmg,
        type: 'orb',
        color: t.color,
        life: 2
      });
      playSound('shoot');
    } else if (t.type === 'mortar') {
      const dist = Math.hypot(closest.x - t.x, closest.y - t.y);
      state.projectiles.push({
        x: t.x, y: t.y,
        tx: closest.x, ty: closest.y,
        t: 0,
        duration: Math.max(0.5, dist / 200),
        dmg: t.dmg,
        type: 'splash',
        color: t.color,
        radius: 40,
        life: 2
      });
      playSound('mortar');
    } else if (t.type === 'sniper') {
      // Instant laser hit-scan
      const dmg = t.dmg;
      closest.hp -= dmg;
      state.damageNumbers.push({
        x: closest.x, y: closest.y - 20,
        text: `-${dmg}`,
        size: 18,
        life: 1,
        vy: -30,
        crit: dmg > 30
      });
      // Laser visual
      state.projectiles.push({
        x1: t.x, y1: t.y,
        x2: closest.x, y2: closest.y,
        type: 'laser',
        color: t.color,
        life: 0.15
      });
      playSound('laser');
    } else if (t.type === 'slow') {
      state.projectiles.push({
        x: t.x, y: t.y,
        vx: Math.cos(t.angle) * 250,
        vy: Math.sin(t.angle) * 250,
        dmg: t.dmg,
        type: 'frost',
        color: t.color,
        life: 1.5,
        slowAmount: 0.5,
        slowDuration: 2
      });
      playSound('frost');
    }
  }
}
