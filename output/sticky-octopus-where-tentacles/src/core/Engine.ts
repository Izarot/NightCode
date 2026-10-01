import { Player } from '../entities/Player';
import { Platform } from '../entities/Platform';
import { LevelData } from '../levels/LevelTypes';

class Engine {
    private player: Player;
    private platforms: Platform[] = [];
    private level: LevelData | null = null;
    private isRunning: boolean = false;
    private startTime: number = 0;
    private elapsed: number = 0;
    private ink: number = 100;
    private maxInk: number = 100;
    private flow: number = 0;
    private highScore: number = 0;

    constructor(private game: Game) {}

    public loadLevel(data: LevelData) {
        this.level = data;
        this.player = new Player(data.spawn.x, data.spawn.y);
        this.platforms = data.platforms.map(p => new Platform(p));
        this.ink = data.inkBudget || 100;
        this.maxInk = data.inkBudget || 100;
    }

    public startGame() {
        this.isRunning = true;
        this.startTime = performance.now();
        this.updateTimer();
    }

    private updateTimer() {
        if (!this.isRunning) return;
        this.elapsed = (performance.now() - this.startTime) / 1000;
        const mins = Math.floor(this.elapsed / 60).toString().padStart(2, '0');
        const secs = (this.elapsed % 60).toFixed(2).padStart(5, '0');
        document.getElementById('timer')!.textContent = `${mins}:${secs}`;
        requestAnimationFrame(this.updateTimer.bind(this));
    }

    public update(dt: number) {
        if (!this.isRunning) return;
        
        this.player.update(dt, this.input, this.platforms);
        this.platforms.forEach(p => p.update(dt));
        
        // Ink regeneration
        if (this.player.grounded) {
            this.ink = Math.min(this.maxInk, this.ink + 15 * dt);
        } else {
            this.ink = Math.min(this.maxInk, this.ink + 5 * dt);
        }
        
        // Flow meter
        if (this.player.velocity.length() > 100) {
            this.flow = Math.min(100, this.flow + dt * 10);
        } else {
            this.flow = Math.max(0, this.flow - dt * 20);
        }
        
        this.updateHUD();
    }

    private updateHUD() {
        const fill = document.getElementById('ink-fill') as HTMLElement;
        fill.style.height = `${(this.ink / this.maxInk) * 100}%`;
    }

    public get Player() { return this.player; }
    public get Platforms() { return this.platforms; }
    public get Ink() { return this.ink; }
    public set Ink(value: number) { this.ink = Math.max(0, Math.min(this.maxInk, value)); }
    public get Input() { return this.game.input; }
}

export { Engine };