import {GameEngine} from './core/engine.js';
import {InputManager} from './core/input.js';
import {Physics} from './core/physics.js';
import {AudioSystem} from './core/audio.js';
import {Player} from './gameplay/player.js';
import {Projectile} from './gameplay/projectile.js';
import {HUD} from './gameplay/hud.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const engine = new GameEngine(canvas, ctx);
const input = new InputManager();
const physics = new Physics();
const audio = new AudioSystem();

const player1 = new Player(1, width/4, height/2);
const player2 = new Player(2, 3*width/4, height/2);

const hud = new HUD(ctx, width, height);

let projectiles = [];
let particles = [];
let lastTime = 0;
let gameOver = false;
let highScore = localStorage.getItem('resonanceHighScore') || 0;

function gameLoop(timestamp) {
 const dt = (timestamp - lastTime) / 1000;
 lastTime = timestamp;
 
 if (!gameOver) {
  input.update();
  physics.update(dt);
  player1.update(dt, input, physics, audio);
  player2.updateAI(dt, physics, audio);
  
  // Collision detection
  physics.checkCollisions([player1, player2], projectiles);
  
  // Update projectiles
  projectiles = projectiles.filter(p => p.update(dt));
  
  // Update particles
  particles = particles.filter(p => p.update(dt));
  
  // Check win condition
  if (player1.health <= 0 || player2.health <= 0) {
   gameOver = true;
   const score = Math.min(player1.health, player2.health);
   if (score > highScore) {
    highScore = score;
    localStorage.setItem('resonanceHighScore', highScore);
   }
  }
 }
 
 render();
 requestAnimationFrame(gameLoop);
}

function render() {
 ctx.clearRect(0, 0, width, height);
 
 // Draw arena
 drawArena();
 
 // Draw projectiles
 projectiles.forEach(p => p.render(ctx));
 
 // Draw particles
 particles.forEach(p => p.render(ctx));
 
 // Draw players
 player1.render(ctx);
 player2.render(ctx);
 
 // Draw HUD
 hud.render(player1, player2, gameOver, highScore);
}

function drawArena() {
 ctx.strokeStyle = '#444';
 ctx.lineWidth = 2;
 ctx.strokeRect(50, 50, width-100, height-100);
}

window.addEventListener('resize', () => {
 width = window.innerWidth;
 height = window.innerHeight;
 canvas.width = width;
 canvas.height = height;
 hud.updateDimensions(width, height);
});

requestAnimationFrame(gameLoop);