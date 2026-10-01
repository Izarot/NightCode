class InputManager {
    private keys: Map<string, boolean> = new Map();
    private mouse = { x: 0, y: 0, clicked: false };
    private canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        window.addEventListener('keydown', (e) => this.keys.set(e.code, true));
        window.addEventListener('keyup', (e) => this.keys.set(e.code, false));
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (1920 / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (1080 / rect.height);
        });
        
        canvas.addEventListener('mousedown', () => this.mouse.clicked = true);
        canvas.addEventListener('mouseup', () => this.mouse.clicked = false);
    }

    public isKeyDown(code: string): boolean {
        return this.keys.get(code) || false;
    }

    public getMouse() { return this.mouse; }
}

export { InputManager };