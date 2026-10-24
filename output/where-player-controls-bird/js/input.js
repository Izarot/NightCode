class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mousedown', () => this.mouse.clicked = true);
        canvas.addEventListener('mouseup', () => this.mouse.clicked = false);
        
        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = touch.clientX - rect.left;
            this.mouse.y = touch.clientY - rect.top;
            this.mouse.clicked = true;
        });
        
        canvas.addEventListener('touchend', () => this.mouse.clicked = false);
    }

    isKeyPressed(key) { return this.keys[key] || false; }
    getMovementInput() {
        let vx = 0, vy = 0;
        if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) vy = -1;
        if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) vy = 1;
        if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) vx = -1;
        if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) vx = 1;
        return { vx, vy };
    }
}