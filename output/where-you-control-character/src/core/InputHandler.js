export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.keyBuffer = [];
        this.lastDirection = null;
        
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Touch controls for mobile
        this.setupTouchControls();
    }

    onKeyDown(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = true;
        
        // Prevent default for game keys
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'escape', 'p'].includes(key)) {
            e.preventDefault();
        }
        
        // Buffer direction changes
        const dir = this.getDirectionFromKey(key);
        if (dir) {
            this.keyBuffer.push({ direction: dir, time: performance.now() });
            // Keep only last 3 inputs
            if (this.keyBuffer.length > 3) this.keyBuffer.shift();
        }
        
        // Pause
        if (key === 'escape' || key === 'p') {
            if (this.game.state === 'playing') this.game.pause();
            else if (this.game.state === 'paused') this.game.resume();
        }
        
        // Start game
        if (key === ' ' || key === 'enter') {
            if (this.game.state === 'start') this.game.changeState('playing');
            else if (this.game.state === 'gameover') this.game.changeState('playing');
        }
    }

    onKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
    }

    getDirectionFromKey(key) {
        switch(key) {
            case 'arrowup': case 'w': return { x: 0, y: -1 };
            case 'arrowdown': case 's': return { x: 0, y: 1 };
            case 'arrowleft': case 'a': return { x: -1, y: 0 };
            case 'arrowright': case 'd': return { x: 1, y: 0 };
            default: return null;
        }
    }

    getBufferedDirection() {
        if (this.keyBuffer.length > 0) {
            return this.keyBuffer.shift().direction;
        }
        return null;
    }

    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.game.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: false });
        
        this.game.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) {
                    this.keyBuffer.push({ direction: { x: dx > 0 ? 1 : -1, y: 0 }, time: performance.now() });
                }
            } else {
                if (Math.abs(dy) > 30) {
                    this.keyBuffer.push({ direction: { x: 0, y: dy > 0 ? 1 : -1 }, time: performance.now() });
                }
            }
        }, { passive: false });
        
        // Tap to start/restart
        this.game.canvas.addEventListener('click', () => {
            if (this.game.state === 'start' || this.game.state === 'gameover') {
                this.game.changeState('playing');
            }
        });
    }

    isKeyPressed(key) {
        return this.keys[key.toLowerCase()] || false;
    }
}