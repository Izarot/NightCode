export class Timer {
    constructor(displayElement) {
        this.display = displayElement;
        this.elapsed = 0;
        this.running = false;
        this.last = 0;
    }
    tick(dt) {
        if (!this.running) return;
        this.elapsed += dt;
        this.updateDisplay();
    }
    pause() {
        this.running = false;
    }
    resume() {
        this.running = true;
        this.last = performance.now();
    }
    get time() {
        return this.elapsed;
    }
    updateDisplay() {
        this.display.textContent = `Time: ${this.elapsed.toFixed(2)}s`;
    }
}
