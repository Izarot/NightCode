class Controls {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // Prevent default for game keys
            if (['w', 'a', 's', 'd', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            const rect = e.target.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        window.addEventListener('mousedown', (e) => {
            this.mouse.clicked = true;
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouse.clicked = false;
        });
    }

    getInput() {
        return {
            left: this.keys['a'] || this.keys['ArrowLeft'],
            right: this.keys['d'] || this.keys['ArrowRight'],
            up: this.keys['w'] || this.keys['ArrowUp'],
            down: this.keys['s'] || this.keys['ArrowDown'],
            jump: this.keys[' '] || this.keys['ArrowUp'],
            mouse: this.mouse
        };
    }
}

export { Controls };
