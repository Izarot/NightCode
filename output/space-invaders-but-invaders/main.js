import { Game } from './core/Game.js';
import { WaveManager } from './core/WaveManager.js';
import { EvolutionEngine } from './core/EvolutionEngine.js';
import { Player } from './physics/Player.js';
import { Enemy } from './physics/Enemy.js';
import { Projectile } from './physics/Projectile.js';
import { Collision } from './physics/Collision.js';
import { Canvas } from './rendering/Canvas.js';
import { VFX } from './rendering/VFX.js';
import { HUD } from './ui/HUD.js';
import { Menu } from './ui/Menu.js';
import { Config } from './utils/Config.js';
import { Pool } from './utils/Pool.js';

const canvas = new Canvas('gameCanvas');
const ctx = canvas.getContext();
const hudCanvas = document.createElement('canvas');
hudCanvas.width = canvas.width;
hudCanvas.height = 60;
const hudCtx = hudCanvas.getContext('2d');

const config = new Config();
const pool = new Pool();
const evolution = new EvolutionEngine();
const waveManager = new WaveManager(canvas, evolution);
const player = new Player(canvas, pool);
const collision = new Collision(canvas);
const vfx = new VFX(canvas);
const hud = new HUD(hudCtx, canvas);
const menu = new Menu(canvas, hud);

let game;
let lastTime = 0;
let speedrunTimer = 0;
let highScore = localStorage.getItem('evoStrikeHighScore') || 0;

function init() {
    game = new Game(canvas, ctx, player, waveManager, collision, vfx, hud, menu, pool, config);
    game.init();
    hud.setHighScore(highScore);
    gameLoop(0);
}

function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    if (game.running) {
        speedrunTimer += dt;
        hud.updateSpeedrun(speedrunTimer);
        game.update(dt);
        game.render();
    }
    
    requestAnimationFrame(gameLoop);
}

window.addEventListener('load', init);
window.addEventListener('resize', () => canvas.resize());

export { game, player, waveManager, collision, vfx, hud, menu, pool, config, speedrunTimer, highScore };