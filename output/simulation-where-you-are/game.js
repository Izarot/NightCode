import { Game } from './src/core/Game.js';
import { Config } from './src/data/Config.js';
import { HighScores } from './src/data/HighScores.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let game;

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080, 1.5);
  canvas.width = 1920 * scale;
  canvas.height = 1080 * scale;
  canvas.style.transform = `scale(${scale})`;
  canvas.style.transformOrigin = 'top left';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

game = new Game(canvas, ctx);
game.init();

// High Score persistence
const highScores = new HighScores();
const savedScore = highScores.get();
if (savedScore > 0) {
  game.score = savedScore;
  document.getElementById('score').textContent = savedScore;
}

// Input handling
window.addEventListener('keydown', (e) => {
  if (e.key === '1') game.setBeamColor('white');
  if (e.key === '2') game.setBeamColor('red');
  if (e.key === '3') game.setBeamColor('green');
  if (e.key === 'c') game.setPattern('continuous');
  if (e.key === 'd') game.setPattern('double');
  if (e.key === 'm') game.setPattern('morse');
  if (e.key === ' ') game.superFlash();
  if (e.key === 'Shift') game.slowRotate = true;
  if (e.key === 'Escape') game.pause();
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') game.slowRotate = false;
});

canvas.addEventListener('mousedown', (e) => {
  game.isDragging = true;
  game.focusShip(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
  if (game.isDragging) game.rotateTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mouseup', () => { game.isDragging = false; });

// UI Button handlers
document.getElementById('colorW').addEventListener('click', () => game.setBeamColor('white'));
document.getElementById('colorR').addEventListener('click', () => game.setBeamColor('red'));
document.getElementById('colorG').addEventListener('click', () => game.setBeamColor('green'));
document.getElementById('patternC').addEventListener('click', () => game.setPattern('continuous'));
document.getElementById('patternD').addEventListener('click', () => game.setPattern('double'));
document.getElementById('patternM').addEventListener('click', () => game.setPattern('morse'));
document.getElementById('superFlash').addEventListener('click', () => game.superFlash());

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;

function playSound(frequency, duration, type = 'sine') {
  if (!soundEnabled) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, duration / 1000);
  osc.stop(duration / 1000);
}

function playColorSound(color) {
  const freqs = { white: 523.25, red: 329.63, green: 329.63 };
  playSound(freqs[color] || 440, 200);
}

function playSwitchSound() {
  playSound(880, 100, 'square');
}

function playCrashSound() {
  playSound(100, 500, 'sawtooth');
}

function playGuidedSound() {
  playSound(880, 150, 'sine');
  setTimeout(() => playSound(1046.5, 150, 'sine'), 50);
}

game.audio = { playColorSound, playSwitchSound, playCrashSound, playGuidedSound };

// Main game loop
let lastTime = 0;
let startTime = 0;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (!game.paused) {
    game.update(delta);
    game.render();
    game.updateHUD();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);