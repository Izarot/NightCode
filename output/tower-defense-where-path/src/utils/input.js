import { state } from '../state.js';
import { getTowerType } from '../entities/tower.js';
import { startWave } from '../systems/waveManager.js';

export function initInput(canvas) {
  const updateMouse = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = state.width / rect.width;
    const scaleY = state.height / rect.height;
    state.mouse.screenX = clientX - rect.left;
    state.mouse.screenY = clientY - rect.top;
    state.mouse.x = state.mouse.screenX * scaleX;
    state.mouse.y = state.mouse.screenY * scaleY;
  };

  canvas.addEventListener('mousemove', e => {
    updateMouse(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    state.mouse.down = true;
    handleClick();
  });

  canvas.addEventListener('mouseup', () => {
    state.mouse.down = false;
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    updateMouse(t.clientX, t.clientY);
    state.mouse.down = true;
    handleClick();
  }, { passive: false });

  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    updateMouse(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    state.mouse.down = false;
  }, { passive: false });

  window.addEventListener('keydown', e => {
    state.keys[e.key.toLowerCase()] = true;
    if (e.key === '1') state.selectedTower = 'pulse';
    else if (e.key === '2') state.selectedTower = 'mortar';
    else if (e.key === '3') state.selectedTower = 'sniper';
    else if (e.key === '4') state.selectedTower = 'slow';
    else if (e.key.toLowerCase() === 'e') state.eraserActive = !state.eraserActive;
    else if (e.key === ' ') {
      if (state.waveStatus === 'BUILD PHASE') startWave();
    } else if (e.key.toLowerCase() === 'r') {
      if (state.gameOver || state.victory) location.reload();
    } else if (e.key.toLowerCase() === 'p') {
      state.paused = !state.paused;
    }
  });

  window.addEventListener('keyup', e => {
    state.keys[e.key.toLowerCase()] = false;
  });
}

function handleClick() {
  const mx = state.mouse.x;
  const my = state.mouse.y;

  if (state.eraserActive && state.eraserCharges > 0) {
    // Erase tower at click position
    for (let i = state.towers.length - 1; i >= 0; i--) {
      const t = state.towers[i];
      if (Math.hypot(t.x - mx, t.y - my) < 40) {
        const refund = Math.floor(getTowerType(t.type).cost * 0.5);
        state.energy += refund;
        state.towers.splice(i, 1);
        state.eraserCharges--;
        return;
      }
    }
    return;
  }

  if (!state.selectedTower) return;
  const t = getTowerType(state.selectedTower);
  if (!t) return;
  if (state.energy < t.cost) return;

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
  if (!nearest || nearestDist > 40) return;

  // Check occupancy
  for (const tw of state.towers) {
    if (Math.hypot(tw.x - nearest.x, tw.y - nearest.y) < 30) return;
  }

  // Place tower
  const tower = {
    x: nearest.x,
    y: nearest.y,
    type: state.selectedTower,
    dmg: t.dmg,
    range: t.range,
    fireRate: t.fireRate,
    color: t.color,
    cooldown: 0,
    angle: 0,
    target: null,
    pulseTime: 0
  };
  state.towers.push(tower);
  state.energy -= t.cost;
}
