export class GameEngine {
    constructor() {
        this.lastTimestamp = 0;
        this.accumulator = 0;
        this.physicsTimeStep = 1 / 60;
        this.running = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.state = 'PLAYING';
    }

    init() {
        this.lastTimestamp = 0;
        this.accumulator = 0;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.state = 'PLAYING';
    }

    gameLoop(timestamp, updateCallback, renderCallback, saveCallback) {
        if (!this.running) return;

        const dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        this.accumulator += dt;
        this.elapsedTime = (timestamp - this.startTime) / 1000;

        while (this.accumulator >= this.physicsTimeStep) {
            updateCallback(this.physicsTimeStep);
            this.accumulator -= this.physicsTimeStep;
        }

        renderCallback();
        saveCallback && saveCallback();

        requestAnimationFrame((ts) => this.gameLoop(ts, updateCallback, renderCallback, saveCallback));
    }
}