const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height;
function resize(){
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();
const audioEngine = new AudioEngine();
const physics = new Physics();
const trackGen = new TrackGenerator();
const renderer = new Renderer(ctx);
const gameMgr = new GameManager();
const hud = new HUD();
let keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
function gameLoop(){
  const dt = 1/60;
  physics.update(dt, keys);
  trackGen.update(audioEngine.getWaveformData());
  renderer.render(physics.car, trackGen.track, audioEngine.getWaveformData());
  hud.update(physics.car.speed, gameMgr.getCombo(), audioEngine.getWaveformData());
  requestAnimationFrame(gameLoop);
}
audioEngine.start().then(() => gameLoop());