import { GameEngine } from './core/GameEngine.js';
import { StateMachine } from './core/StateMachine.js';
import { InputHandler } from './systems/InputHandler.js';
import { AudioManager } from './systems/AudioManager.js';
import { LevelLoader } from './levels/LevelLoader.js';
import { HUD } from './ui/HUD.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{width=canvas.width=window.innerWidth;height=canvas.height=window.innerHeight});

const engine = new GameEngine(ctx);
const input = new InputHandler(canvas);
const audio = new AudioManager();
const state = new StateMachine();
const hud = new HUD();
const loader = new LevelLoader();

let currentLevel = 0;
let levels = [];
let gameState = 'menu';
let moveCount = 0;
let startTime = 0;
let timerInterval = null;

function updateTimer(){const elapsed=(performance.now()-startTime)/1000;document.getElementById('timer').textContent=elapsed.toFixed(2)};

function startTimer(){startTime=performance.now();clearInterval(timerInterval);timerInterval=setInterval(updateTimer,100);updateTimer()}
function stopTimer(){clearInterval(timerInterval)}

function loadLevel(idx){const lvl=levels[idx];engine.loadLevel(lvl);moveCount=0;hud.updateMoves(0);document.getElementById('level').textContent=`LEVEL ${idx+1}`;startTimer()}

function nextLevel(){currentLevel++;if(currentLevel<levels.length){loadLevel(currentLevel)}else{alert('YOU WIN!')}stopTimer()}

function resetLevel(){loadLevel(currentLevel)}

document.getElementById('reset').addEventListener('click',resetLevel);
document.getElementById('pause').addEventListener('click',()=>{state.push('pause');document.getElementById('pauseModal').classList.add('active')});
document.getElementById('resume').addEventListener('click',()=>{state.pop();document.getElementById('pauseModal').classList.remove('active')});
document.getElementById('nextLevel').addEventListener('click',()=>{document.getElementById('completeModal').classList.remove('active');nextLevel()});

input.onMove((dx,dy)=>{if(state.current!=='gameplay')return;const moved=engine.tryMovePlayer(dx,dy);if(moved){moveCount++;hud.updateMoves(moveCount);audio.play('move')}else{audio.play('error');engine.shake()}});

engine.onComplete(()=>{stopTimer();document.getElementById('completeMoves').textContent=`Moves: ${moveCount}`;document.getElementById('completeModal').classList.add('active')});

loader.loadAll().then(l=>{levels=l;loadLevel(currentLevel);state.push('gameplay')});

engine.start();