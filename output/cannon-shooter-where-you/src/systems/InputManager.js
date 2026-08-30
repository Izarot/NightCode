export class InputManager {
    constructor() {
        this.keys = {};
        this.isClick = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('mousedown', (e) => {
            this.isClick = true;
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }
}