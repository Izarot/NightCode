import { state } from './state.js';
import { update } from './systems/update.js';
import { render } from './renderer.js';
import { loadMap } from './systems/map.js';
import { startWave } from './systems/waveManager.js';

let started = false;

export function initGameLoop() {
  loadMap();
  // Initial build phase before wave 1
  state.wave = 0;
  state.waveStatus = 'BUILD PHASE';
  state.buildPhaseTimer = 15;

  function loop(timestamp) {
    if (!state.lastTime) state.lastTime = timestamp;
    const dt = Math.min((timestamp - state.lastTime) / 1000, 0.1);
    state.lastTime = timestamp;

    if (!state.paused && !state.gameOver && !state.victory) {
      state.speedrunTime += dt;
      update(dt);
    }

    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
