import { Renderer } from './core/Renderer.js';
import { Hud } from './ui/Hud.js';
import { AudioManager } from './core/Audio.js';
import { InputManager } from './core/Input.js';
import { GameEngine } from './core/GameEngine.js';

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const hud = new Hud();
const audio = new AudioManager();
const input = new InputManager(canvas);
const engine = new GameEngine(renderer, hud, audio, input);

// Hook UI buttons
document.getElementById('pause-btn').addEventListener('click', () => engine.togglePause());
document.getElementById('sound-btn').addEventListener('click', () => engine.toggleMute());
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && engine.gameOver) {
    engine.reset();
  }
  if (e.code === 'KeyP' && !engine.gameOver) {
    audio.init();
  }
});

let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;

  if (!engine.paused && !engine.gameOver) {
    audio.init();
    engine.handleActions();
  }
  engine.update(dt);
  if (engine.paused || engine.gameOver) {
    engine.handleActions(); // still allow pause/mute/unpause
  }
  engine.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
