import { Game } from './src/game/state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { willReadFrequently: false });

const game = new Game(canvas, ctx);

game.init();

document.addEventListener('keydown', e => {
  if (e.key === 'z' || e.key === 'Z') game.undo();
  if (e.key === 'r' || e.key === 'R') game.reset();
  if (e.key === 'h' || e.key === 'H') game.hint();
});

window.addEventListener('resize', () => game.resize());