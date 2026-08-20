import { World } from './core/World.js';
import { InputSystem } from './systems/InputSystem.js';
import { PlayerIntentSystem } from './systems/PlayerIntentSystem.js';
import { SplitMergeSystem } from './systems/SplitMergeSystem.js';
import { PhysicsSystem } from './systems/PhysicsSystem.js';
import { PlatformerStateSystem } from './systems/PlatformerStateSystem.js';
import { CameraSystem } from './systems/CameraSystem.js';
import { RenderSystem } from './systems/RenderSystem.js';
import { HUD } from './ui/HUD.js';
import { AudioEngine } from './audio/AudioEngine.js';
import { Timer } from './utils/Timer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const timerEl = document.getElementById('timer');
const highscoreEl = document.getElementById('highscore');

// Responsive canvas
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const targetWidth = Math.min(rect.width, window.innerWidth * 0.9);
    const targetHeight = targetWidth * (270/480);
    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game constants
const PHYSICS_DT = 1/60;
let accumulator = 0;
let lastTime = 0;

// Systems
const world = new World();
world.addSystem(new InputSystem());
world.addSystem(new PlayerIntentSystem());
world.addSystem(new SplitMergeSystem());
world.addSystem(new PhysicsSystem());
world.addSystem(new PlatformerStateSystem());
world.addSystem(new CameraSystem());
world.addSystem(new RenderSystem(ctx));

// Initialize world with player and level
world.init();

// HUD, Timer, Audio
const hudInstance = new HUD(hud);
const timer = new Timer(timerEl);
const audio = new AudioEngine();
const highscoreKey = 'mitosis_highscore';
let highscore = parseFloat(localStorage.getItem(highscoreKey)) || 0;

function updateHighscore() {
    if (timer.time > highscore) {
        highscore = timer.time;
        localStorage.setItem(highscoreKey, highscore.toFixed(2));
        highscoreEl.textContent = `Best: ${highscore.toFixed(2)}s`;
    }
}

// Game loop
function gameLoop(timestamp) {
    const frameTime = Math.min((timestamp - lastTime) / 1000, 0.25);
    lastTime = timestamp;
    accumulator += frameTime;
    
    while (accumulator >= PHYSICS_DT) {
        world.update(PHYSICS_DT);
        accumulator -= PHYSICS_DT;
        timer.tick(PHYSICS_DT);
    }
    
    const alpha = accumulator / PHYSICS_DT;
    world.render(alpha);
    hudInstance.update(world.getPlayerData());
    
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Handle visibility change to pause timer
document.addEventListener('visibilitychange', () => {
    if (document.hidden) timer.pause();
    else timer.resume();
});
}