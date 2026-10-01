import { Engine } from './Engine';
import { Renderer } from '../rendering/Renderer';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { InputManager } from '../input/InputManager';
import { levelData } from '../levels/level_01';

class Game {
    private engine: Engine;
    private renderer: Renderer;
    private physics: PhysicsEngine;
    private input: InputManager;
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly timestep: number = 1/60;

    constructor(private canvas: HTMLCanvasElement) {
        this.engine = new Engine(this);
        this.renderer = new Renderer(canvas);
        this.physics = new PhysicsEngine();
        this.input = new InputManager(canvas);
        this.engine.loadLevel(levelData);
        this.setupUI();
    }

    private setupUI() {
        document.getElementById('start-btn')?.addEventListener('click', () => {
            (document.getElementById('menu') as HTMLElement).style.display = 'none';
            this.engine.startGame();
        });
    }

    public start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    private loop(currentTime: number) {
        if (!this.lastTime) this.lastTime = currentTime;
        const delta = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.accumulator += delta;
        while (this.accumulator >= this.timestep) {
            this.engine.update(this.timestep);
            this.accumulator -= this.timestep;
        }
        
        this.renderer.render(this.engine);
        requestAnimationFrame(this.loop.bind(this));
    }
}

export { Game };