export class GameLoop {
    private accumulator = 0;
    private lastTime = performance.now();
    private running = false;
    
    constructor(private updateFn: (dt: number) => void, private renderFn: (alpha: number) => void) {}
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.frame.bind(this));
    }
    
    stop() { this.running = false; }
    
    private frame(time: number) {
        if (!this.running) return;
        const frameTime = Math.min((time - this.lastTime) / 1000, 0.25);
        this.lastTime = time;
        this.accumulator += frameTime;
        
        const FIXED_DT = 1/60;
        while (this.accumulator >= FIXED_DT) {
            this.updateFn(FIXED_DT);
            this.accumulator -= FIXED_DT;
        }
        
        const alpha = this.accumulator / FIXED_DT;
        this.renderFn(alpha);
        requestAnimationFrame(this.frame.bind(this));
    }
}