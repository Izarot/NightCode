import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { AudioEngine } from './audio.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const renderer = new Renderer(ctx, canvas);
const input = new InputHandler(canvas);
const audio = new AudioEngine();

let gameState = 'menu';
let score = 0;
let combo = 0;
let maxCombo = 0;
let health = 5;
let highScore = localStorage.getItem('rhythmHighScore') || 0;
let startTime = 0;
let elapsed = 0;

const LANE_COUNT = 4;
const LANE_WIDTH = 80;
const LANE_GAP = 20;
const HIT_ZONE_Y = 620;
const NOTE_SPEED = 4;
const BPM = 120;
const BEAT_INTERVAL = 60 / BPM;
const NOTES = [];

function spawnNote(lane, time) {
  NOTES.push({ lane, y: 0, time, hit: false });
}

function initNotes() {
  NOTES.length = 0;
  const intervals = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0];
  intervals.forEach((t, i) => spawnNote(i % LANE_COUNT, t));
}

function update(deltaTime) {
  if (gameState !== 'play') return;
  elapsed = (performance.now() - startTime) / 1000;
  NOTES.forEach(n => {
    n.y += NOTE_SPEED;
    if (!n.hit && n.y >= HIT_ZONE_Y - 30 && n.y <= HIT_ZONE_Y + 30) {
      checkHit(n);
    }
    if (n.y > HIT_ZONE_Y + 50 && !n.hit) {
      missNote(n);
    }
  });
}

function checkHit(note) {
  const sliceX = input.cursorX;
  const laneX = getLaneX(note.lane);
  const dist = Math.abs(sliceX - laneX);
  if (dist < 50 && input.isSlicing) {
    note.hit = true;
    const accuracy = Math.abs(note.y - HIT_ZONE_Y);
    let points = 0;
    if (accuracy < 10) { points = 100 * Math.min(combo / 10 + 1, 5); combo++; audio.play('perfect'); }
    else if (accuracy < 30) { points = 75 * Math.min(combo / 10 + 1, 5); combo++; audio.play('good'); }
    else { combo = 0; audio.play('miss'); }
    maxCombo = Math.max(maxCombo, combo);
    score += points;
    highScore = Math.max(highScore, score);
    localStorage.setItem('rhythmHighScore', highScore);
    if (points > 0) health = Math.min(5, health + 0.5);
  }
}

function missNote(note) {
  if (!note.hit) { note.hit = true; combo = 0; health--; audio.play('miss'); }
}

function getLaneX(lane) {
  const totalWidth = LANE_COUNT * LANE_WIDTH + (LANE_COUNT - 1) * LANE_GAP;
  const startX = (canvas.width - totalWidth) / 2;
  return startX + lane * (LANE_WIDTH + LANE_GAP) + LANE_WIDTH / 2;
}

function draw() {
  renderer.clear();
  if (gameState === 'menu') {
    renderer.drawMenu();
    return;
  }
  if (gameState === 'settings') {
    renderer.drawSettings();
    return;
  }
  renderer.drawGame(NOTES, getLaneX, HIT_ZONE_Y, LANE_COUNT, LANE_WIDTH, LANE_GAP);
  renderer.drawHUD(score, combo, maxCombo, health, highScore, elapsed);
  if (input.isSlicing) renderer.drawSlice(input.cursorX, HIT_ZONE_Y);
}

function loop() {
  const now = performance.now();
  const deltaTime = now - (loop.lastTime || now);
  loop.lastTime = now;
  update(deltaTime);
  draw();
  requestAnimationFrame(loop);
}

function startGame() {
  gameState = 'play';
  score = 0; combo = 0; maxCombo = 0; health = 5;
  startTime = performance.now();
  initNotes();
  audio.play('bgm', true);
  document.getElementById('menu').classList.add('hidden');
}

function showSettings() {
  gameState = 'settings';
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('settings').classList.remove('hidden');
}

function backToMenu() {
  gameState = 'menu';
  document.getElementById('settings').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
}

document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('settingsBtn').addEventListener('click', showSettings);
document.getElementById('backBtn').addEventListener('click', backToMenu);

loop();