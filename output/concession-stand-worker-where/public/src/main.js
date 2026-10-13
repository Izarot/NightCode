// Core game loop and initialization
import { AssetManager } from './assets.js';
import { World } from './ecs.js';
import { InputSystem } from './systems/input.js';
import { MovementSystem } from './systems/movement.js';
import { InteractionSystem } from './systems/interaction.js';
import { StationLogicSystem } from './systems/stationLogic.js';
import { CustomerAISystem } from './systems/customerAI.js';
import { OrderValidationSystem } from './systems/orderValidation.js';
import { UISystem } from './systems/ui.js';
import { RenderSystem } from './systems/render.js';
import { SaveSystem } from './save.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Responsive canvas setup
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game constants
const FIXED_DT = 1 / 60;
let lastTime = 0;
let accumulator = 0;

// Initialize systems
const world = new World();
world.addSystem(new InputSystem());
world.addSystem(new MovementSystem());
world.addSystem(new InteractionSystem());
world.addSystem(new StationLogicSystem());
world.addSystem(new CustomerAISystem());
world.addSystem(new OrderValidationSystem());
world.addSystem(new UISystem());
world.addSystem(new RenderSystem(ctx));

// Load assets and start game
AssetManager.load().then(() => {
    // Initialize game state
    world.init();
    SaveSystem.load();
    
    // Game loop
    function gameLoop(timestamp) {
        const frameTime = Math.min((timestamp - lastTime) / 1000, 0.25);
        lastTime = timestamp;
        accumulator += frameTime;
        
        while (accumulator >= FIXED_DT) {
            world.update(FIXED_DT);
            accumulator -= FIXED_DT;
        }
        
        const alpha = accumulator / FIXED_DT;
        world.render(alpha);
        
        requestAnimationFrame(gameLoop);
    }
    
    requestAnimationFrame(gameLoop);
});