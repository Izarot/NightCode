import { state } from '../state.js';
import { updateProjectiles } from '../entities/projectile.js';
import { updateParticles } from '../entities/particles.js';
import { updateWave } from './waveManager.js';
import { towerShoot } from '../entities/tower.js';

export function update(dt) {
  updateWave(dt);
  state.towers.forEach(t => towerShoot(t, dt));
  updateScouts(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateDamageNumbers(dt);
  updateEraserRegen(dt);
}

function updateScouts(dt) {
  for (let i = state.scouts.length - 1; i >= 0; i--) {
    const s = state.scouts[i];
    if (!s.path || s.path.length < 2) {
      state.scouts.splice(i, 1);
      continue;
    }
    const target = s.path[s.nodeIndex + 1];
    if (!target) {
      // Reached end
      state.coreHp -= 10;
      state.scoutsEscaped++;
      state.scoutsReached++;
      if (state.coreHp <= 0) {
        state.coreHp = 0;
        state.gameOver = true;
      }
      if (state.scoutsEscaped >= state.maxEscapes) {
        state.gameOver = true;
      }
      state.scouts.splice(i, 1);
      continue;
    }
    const dx = target.x - s.x;
    const dy = target.y - s.y;
    const dist = Math.hypot(dx, dy);
    s.angle = Math.atan2(dy, dx);
    const slowFactor = s.slowed > 0 ? 0.5 : 1;
    if (s.slowed > 0) s.slowed -= dt;
    const move = s.speed * slowFactor * dt;
    if (move >= dist) {
      s.x = target.x;
      s.y = target.y;
      s.nodeIndex++;
    } else {
      s.x += (dx / dist) * move;
      s.y += (dy / dist) * move;
    }
    if (s.hp <= 0) {
      state.energy += 10;
      for (let k = 0; k < 8; k++) {
        const a = Math.random() * Math.PI * 2;
        const sp = Math.random() * 150;
        state.particles.push({
          x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: 0.8, color: '#FFFF00', size: 3
        });
      }
      state.scouts.splice(i, 1);
    }
  }
}

function updateDamageNumbers(dt) {
  for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
    const d = state.damageNumbers[i];
    d.y += d.vy * dt;
    d.life -= dt;
    if (d.life <= 0) state.damageNumbers.splice(i, 1);
  }
}

function updateEraserRegen(dt) {
  if (state.eraserCharges < state.eraserMaxCharges) {
    state.eraserRegenTimer += dt;
    if (state.eraserRegenTimer >= state.eraserRegenInterval) {
      state.eraserRegenTimer = 0;
      state.eraserCharges++;
    }
  } else {
    state.eraserRegenTimer = 0;
  }
}
