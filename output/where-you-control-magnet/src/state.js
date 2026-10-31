export class GameState {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.isDead = false;
        this.score = 0;
        this.timer = 60000; // 60 seconds in ms
        this.magnetPower = 100;
        this.powerIncreaseTimer = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        
        this.magnet = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 20,
            mass: 10
        };
        
        this.objects = [];
        this.hazards = [];
        this.particles = [];
    }
    
    startGame() {
        this.isRunning = true;
        this.isPaused = false;
        this.isDead = false;
        this.score = 0;
        this.timer = 60000;
        this.magnetPower = 100;
        this.magnet.x = 600;
        this.magnet.y = 400;
        this.magnet.vx = 0;
        this.magnet.vy = 0;
        this.objects = this.generateObjects();
        this.hazards = this.generateHazards();
    }
    
    generateObjects() {
        const objects = [];
        for (let i = 0; i < 20; i++) {
            objects.push({
                x: Math.random() * 1000 + 100,
                y: Math.random() * 600 + 100,
                vx: 0,
                vy: 0,
                radius: 10 + Math.random() * 10,
                mass: 1 + Math.random() * 4,
                type: Math.floor(Math.random() * 4),
                value: [1, 3, 5, 10][Math.floor(Math.random() * 4)],
                collected: false
            });
        }
        return objects;
    }
    
    generateHazards() {
        const hazards = [];
        for (let i = 0; i < 5; i++) {
            hazards.push({
                x: Math.random() * 1000 + 100,
                y: Math.random() * 600 + 100,
                radius: 30,
                type: 'electromagnet'
            });
        }
        return hazards;
    }
    
    updateTimer(deltaTime) {
        this.timer -= deltaTime;
        this.powerIncreaseTimer += deltaTime;
        
        if (this.powerIncreaseTimer >= 5000) {
            this.magnetPower = Math.min(200, this.magnetPower + 10);
            this.powerIncreaseTimer = 0;
        }
        
        this.comboTimer -= deltaTime;
        if (this.comboTimer <= 0) {
            this.comboCount = 0;
        }
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
}