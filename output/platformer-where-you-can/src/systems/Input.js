import { player } from '../entities/Player.js';

export function setupInput(canvas) {
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);
  canvas.addEventListener('touchstart', e => {
    const t = e.touches[0];
    // Simple touch zones
    const w = canvas.width / (window.devicePixelRatio || 1);
    if (t.clientX < w / 2) player.jump();
    else player.toggleScale();
  });
  // Map keys to player actions
  setInterval(() => {
    if (keys['ArrowLeft'] || keys['KeyA']) player.move(-1);
    if (keys['ArrowRight'] || keys['KeyD']) player.move(1);
    if (keys['ArrowUp'] || keys['Space'] || keys['ArrowUp']) player.jump();
    if (keys['ShiftLeft'] || keys['ShiftRight']) player.toggleScale();
  }, 1000/60);
}
