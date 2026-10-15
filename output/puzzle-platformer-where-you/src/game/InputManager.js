export class InputManager {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    update() {
        // Could be used for continuous input handling
    }

    isPressed(code) {
        return this.keys[code] || false;
    }
}
