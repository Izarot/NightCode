const canvas = document.getElementById('gameCanvas');
const uiCanvas = document.getElementById('uiCanvas');
const ctx = canvas.getContext('2d');
const uiCtx = uiCanvas.getContext('2d');

let lastTime = performance.now();
let game;

function loop(now) {
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  if (game) {
    game.update(delta);
    game.render();
  }
  requestAnimationFrame(loop);
}

window.addEventListener('load', () => {
  game = new Game();
  requestAnimationFrame(loop);
});

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  uiCanvas.width = window.innerWidth;
  uiCanvas.height = window.innerHeight;
});