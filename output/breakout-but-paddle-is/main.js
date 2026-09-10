import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { GameManager } from './gameManager.js';
import { Audio } from './utils.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 500;

// Set canvas drawing buffer size
canvas.width = LOGICAL_WIDTH;
canvas.height = LOGICAL_HEIGHT;

// Responsive scaling
function resize() {
  const aspect = LOGICAL_WIDTH / LOGICAL_HEIGHT;
  let w = window.innerWidth;
  let h = window.innerHeight;
  if (w / h > aspect) {
    w = h * aspect;
  } else {
    h = w / aspect;
  }
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();

// Game state
const STATE = { START: 0, PLAYING: 1, PAUSED: 2, GAME_OVER: 3 };
let state = STATE.START;
let lastTime = 0;
let animationId = null;

const physics = new Physics(LOGICAL_WIDTH, LOGICAL_HEIGHT);
const renderer = new Renderer(ctx, LOGICAL_WIDTH, LOGICAL_HEIGHT);
const gameManager = new GameManager(LOGICAL_WIDTH, LOGICAL_HEIGHT, physics);
const audio = new Audio();

// Input handling
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' && state === STATE.START) startGame();
  if (e.code === 'KeyP' && state === STATE.PLAYING) togglePause();
  if (e.code === 'KeyP' && state === STATE.PAUSED) togglePause();
  if (e.code === 'Space' && state === STATE.GAME_OVER) startGame();
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Touch support for mobile
let touchY = null;
canvas.addEventListener('touchstart', e => {
  if (state === STATE.START || state === STATE.GAME_OVER) startGame();
  touchY = e.touches[0].clientY;
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  if (state !== STATE.PLAYING) return;
  const rect = canvas.getBoundingClientRect();
  const logicalY = (e.touches[0].clientY - rect.top) * (LOGICAL_HEIGHT / rect.height);
  physics.setPaddleTarget(logicalY);
}, { passive: true });
canvas.addEventListener('touchend', () => touchY = null);

function startGame() {
  state = STATE.PLAYING;
  document.getElementById('overlay').classList.remove('visible');
  gameManager.init();
  physics.reset();
  lastTime = performance.now();
  audio.playAmbient();
  loop(lastTime);
}

function togglePause() {
  state = state === STATE.PLAYING ? STATE.PAUSED : STATE.PLAYING;
  if (state === STATE.PLAYING) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animationId);
    renderer.drawPauseOverlay();
  }
}

function gameOver() {
  state = STATE.GAME_OVER;
  cancelAnimationFrame(animationId);
  audio.stopAmbient();
  audio.playGameOver();
  const finalScore = gameManager.score;
  const highScore = gameManager.updateHighScore(finalScore);
  const overlay = document.getElementById('overlay');
  overlay.innerHTML = `
    <h1>Game Over</h1>
    <p>Score: ${finalScore}</p>
    <p>High Score: ${highScore}</p>
    <p>Time: ${gameManager.timer.toFixed(2)}s</p>
    <button id="restartBtn">Play Again</button>
  `;
  overlay.classList.add('visible');
  document.getElementById('restartBtn').addEventListener('click', startGame);
}

function loop(time) {
  if (state !== STATE.PLAYING) return;
  const dt = Math.min((time - lastTime) / 1000, 0.05); // cap dt
  lastTime = time;

  // Input
  if (keys['ArrowLeft'] || keys['KeyA']) physics.movePaddleTarget(-1);
  if (keys['ArrowRight'] || keys['KeyD']) physics.movePaddleTarget(1);
  if (keys['Space'] || keys['KeyW']) physics.launchBall();

  // Update
  physics.update(dt);
  gameManager.update(dt, physics);

  // Check game over
  if (gameManager.lives <= 0) {
    gameOver();
    return;
  }

  // Render
  renderer.clear();
  renderer.drawBackground();
  gameManager.drawBricks(renderer);
  renderer.drawBall(physics.ball);
  renderer.drawPaddle(physics.paddle);
  renderer.drawHUD(gameManager.score, gameManager.lives, gameManager.highScore, gameManager.timer);

  animationId = requestAnimationFrame(loop);
}

// Initial draw
renderer.clear();
renderer.drawBackground();
renderer.drawPaddle(physics.paddle);
renderer.drawHUD(0, 3, gameManager.highScore, 0);