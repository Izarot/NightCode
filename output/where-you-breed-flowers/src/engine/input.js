export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.clicks = [];
        this.dragging = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (1280 / rect.width);
            const y = (e.clientY - rect.top) * (720 / rect.height);
            this.clicks.push({ x, y, timestamp: Date.now() });
        });

        this.canvas.addEventListener('dragstart', (e) => {
            this.dragging = e.target;
        });
    }

    getClicks() {
        return this.clicks.filter(c => Date.now() - c.timestamp < 100);
    }
}