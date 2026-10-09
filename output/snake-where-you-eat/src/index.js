import { GameLoop } from './state/GameLoop.js';
import { FSM } from './state/FSM.js';
import { Grid } from './grid/Grid.js';
import { Snake } from './snake/Snake.js';
import { Apple } from './apple/Apple.js';
import { ParticleSystem } from './particles/ParticleSystem.js';
import { UI } from './ui/UI.js';
import { Audio } from './audio/Audio.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
}
window.addEventListener('resize', resize);
resize();

const TILE_SIZE = 24;
const COLS = 40;
const ROWS = 30;

const fsm = new FSM();
const grid = new Grid(COLS, ROWS, TILE_SIZE);
const snake = new Snake();
const apple = new Apple();
const particles = new ParticleSystem();
const ui = new UI(ctx, canvas);
const audio = new Audio();

const game = new GameLoop(fsm, grid, snake, apple, particles, ui, audio, ctx, canvas, TILE_SIZE);
game.start();
