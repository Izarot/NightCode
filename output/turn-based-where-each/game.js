import { Grid } from './core/grid.js';
import { SpatialHash } from './core/spatialHash.js';
import { PlacementSystem } from './systems/PlacementSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { UISystem } from './ui/UISystem.js';
import { HUD } from './ui/HUD.js';

// color palette
const PALETTE = {
  forest: '#2E7D32',
  water: '#1565C0',
  mountain: '#6D4C41',
  grass: '#8BC34A',
  default: '#424242',
};

// sound effect generator
function createSynth() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const api = {
    playNote: (note, duration=0.2) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = note;
      gain.gain.value = 0.2;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    },
    playSuccess: () => api.playNote(440,0.3),
    playFail: () => api.playNote(220,0.3),
  };
  return api;
}
const audio = createSynth();

// responsive canvas setup
const canvas = document.getElementById('canvas');
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  canvas.getContext('2d').scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// game state
const boardWidth = 20;
const boardHeight = 20;
const grid = new Grid(boardWidth, boardHeight, 40);
const placement = new PlacementSystem(grid);
const render = new RenderSystem(canvas, {cells: grid.cells, width: boardWidth, height: boardHeight});
const hud = new HUD();
let turn = 0;
let timerSeconds = 0;
let timerInterval = null;

// timer start
function startTimer() {
  timerSeconds = 0;
  hud.setTimer(0);
  timerInterval = setInterval(() => {
    timerSeconds++;
    hud.setTimer(timerSeconds);
  }, 1000);
}
startTimer();

// tile tray population
function populateTileTray() {
  const tray = document.getElementById('tileTray');
  tray.innerHTML = '';
  const types = ['forest','water','mountain','grass'];
  types.forEach(type => {
    const div = document.createElement('div');
    div.className = 'tile';
    div.textContent = type[0].toUpperCase();
    div.dataset.type = type;
    div.onclick = () => {
      placement.setSelected(type);
      // highlight
      const tiles = document.querySelectorAll('.tile');
      tiles.forEach(t=>t.style.opacity='1');
      div.style.opacity='0.7';
    };
    tray.appendChild(div);
  });
}
populateTileTray();

// mouse handling
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / render.tileSize);
  const y = Math.floor((e.clientY - rect.top) / render.tileSize);
  if (placement.selectedTileType) {
    const placed = placement.place(x, y);
    if (placed) {
      // update turn
      turn++;
      hud.setTurn(turn);
      // play success sound
      audio.playSuccess();
      // check win condition (simple: turn > 100)
      if (turn > 100) {
        alert('Victory! Time: ' + Math.floor(timerSeconds/60) + ':' + (timerSeconds%60));
        clearInterval(timerInterval);
      }
    } else {
      // play fail sound
      audio.playFail();
    }
  }
});

// initial render
function gameLoop() {
  render.draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();