import { loadLevel } from './level.js';
import { initInput, getInput } from './input.js';
import { updatePhysics } from './physics.js';
import { updateUI, showRestart } from './ui.js';
import { playSound } from './audio.js';

export let gameState = {
  level: 1,
  levels: [],
  player: { x: 0, y: 0, vx: 0, vy: 0 },
  blocks: [],
  walls: [],
  targets: [],
  blockCount: 0,
  totalBlocks: 0,
  timer: 0,
  highScore: 0,
  completed: false
};

export function initGame() {
  gameState.highScore = parseInt(localStorage.getItem('iceSokobanHighScore')) || 0;
  loadLevel(gameState.level).then(data => {
    gameState.walls = data.walls;
    gameState.blocks = data.blocks.map(b=>({x:b.x,y:b.y,vx:0,vy:0}));
    gameState.targets = data.targets;
    gameState.player = {x:data.player.x,y:data.player.y,vx:0,vy:0};
    gameState.totalBlocks = data.blocks.length;
    gameState.blockCount = 0;
    gameState.timer = 0;
    gameState.completed = false;
    updateUI();
  });
  initInput();
}

export function update(dt) {
  if(gameState.completed) return;
  gameState.timer += dt;
  const input = getInput();
  updatePhysics(input, dt);
  checkCompletion();
  updateUI();
}

function checkCompletion() {
  const allOnTarget = gameState.blocks.every(b=>
    gameState.targets.some(t=>t.x===b.x && t.y===b.y)
  );
  if(allOnTarget) {
    gameState.completed = true;
    if(gameState.timer < gameState.highScore || gameState.highScore===0) {
      gameState.highScore = gameState.timer;
      localStorage.setItem('iceSokobanHighScore', gameState.highScore.toString());
    }
    showRestart();
    playSound('complete');
  }
}
