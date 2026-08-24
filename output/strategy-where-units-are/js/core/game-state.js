// Game State Manager
const GameState = {
    units: [],
    nutrients: 0,
    mutagen: 0,
    mp: 0,
    maxMp: 100,
    
    time: 0,
    speedrunTimer: 0,
    round: 1,
    
    cameraX: 0,
    cameraY: 0,
    zoom: 1.0,
    
    COLORS: {
        PLAYER: '#00e4ff',
        ENEMY: '#ff0066',
        UNIT_PLAZMA: '#00e4ff',
        UNIT_PHOAGE: '#ff6600',
        UNIT_SPORE: '#ff8844'
    },
    
    init() {
        this.units = [];
    },
    
    getUnit(id) {
        return this.units.find(u => u.id === id);
    },
    
    addUnit(type, position) {
        const unit = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: type,
            x: position.x,
            y: position.y,
            health: 100,
            energy: 50,
            speed: getDefaultSpeed(type),
            maxHealth: 100,
            energyMax: 50,
            maxEnergy: 50,
            mutated: false,
            mutationType: null,
            lastSpawn: Date.now(),
            isAlive: true
        };
        this.units.push(unit);
        return unit;
    },
    
    removeUnit(id) {
        this.units = this.units.filter(u => u.id !== id);
    },
    
    tick() {
        this.time += 1;
        this.speedrunTimer = Math.min(this.speedrunTimer + 1, 300);
        
        const timerEl = document.getElementById('speedrun-timer');
        if (timerEl) {
            timerEl.textContent = this.speedrunTimer.toString().padStart(2, '0');
        }
    },
    
    getAllUnits() {
        return this.units;
    }
};

const DEFAULT_SPEED = {
    Plasmid: 130,
    Phage: 160,
    Spore: 110
};

function getDefaultSpeed(type) {
    if (typeof type === 'string') {
        return DEFAULT_SPEED[type] || 150;
    }
    if (type && typeof type.name === 'string') {
        return DEFAULT_SPEED[type.name] || 150;
    }
    return 150;
}
