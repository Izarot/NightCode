import { state, setState } from './GameState.js';
import { updatePlayer, player } from '../entities/Player.js';
import { updateParticles } from '../entities/Particle.js';
import { updateTimer, drawTimer } from './Timer.js';
import { drawUI } from './UI.js';
import { drawLevel } from './LevelLoader.js';

export function init() { setState('PLAYING'); }
export function update(dt) {
  if (state === 'PLAYING') {
    updatePlayer(dt);
    updateParticles(dt);
    updateTimer(dt);
  }
}
export function render(ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLevel(ctx);
  if (player) player.render(ctx);
  updateParticles.forEach(p => p.render(ctx));
  drawUI(ctx);
  drawTimer(ctx);
}
