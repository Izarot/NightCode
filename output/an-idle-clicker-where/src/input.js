export class InputManager {
    constructor() {
        this.keys = { left: false, right: false, up: false, down: false, dash: false };
        this.mouse = { x: 0, y: 0, down: false };
        this.touch = { x: 0, y: 0, down: false };
        this.dashCooldown = 0;
        this.init();
    }

    init() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
                case 'KeyW': case 'ArrowUp': this.keys.up = true; break;
                case 'KeyS': case 'ArrowDown': this.keys.down = true; break;
                case 'Space': this.keys.dash = true; break;
            }
        });
        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
                case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
                case 'KeyW': case 'ArrowUp': this.keys.up = false; break;
                case 'KeyS': case 'ArrowDown': this.keys.down = false; break;
                case 'Space': this.keys.dash = false; break;
            }
        });

        // Mouse events
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mousedown', () => this.mouse.down = true);
        canvas.addEventListener('mouseup', () => this.mouse.down = false);

        // Touch events
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.touch.x = touch.clientX - rect.left;
            this.touch.y = touch.clientY - rect.top;
            this.touch.down = true;
        });
        canvas.addEventListener('touchend', () => { this.touch.down = false; });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.touch.x = touch.clientX - rect.left;
            this.touch.y = touch.clientY - rect.top;
        });
    }

    update(dt) {
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
    }

    getMovementInput() {
        return {
            dx: (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0),
            dy: (this.keys.down ? 1 : 0) - (this.keys.up ? 1 : 0),
            dash: this.keys.dash && this.dashCooldown <= 0
        };
    }

    getClick() {
        const click = this.mouse.down ? this.mouse : (this.touch.down ? this.touch : null);
        return click;
    }
}