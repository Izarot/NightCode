// Resource Manager - Nutrients and Mutagen
const ResourceManager = {
    nutrients: 0,
    mutagen: 0,
    
    UNIT_COSTS: {
        Plasmid: 10,
        Phage: 20,
        Spore: 30
    },
    
    spawnUnit(type, position) {
        const cost = this.UNIT_COSTS[type] || 10;
        if (this.nutrients >= cost) {
            this.nutrients -= cost;
            const unit = GameState.addUnit(type, position);
            return unit;
        }
        throw new Error('Insufficient nutrients: ' + cost);
    },
    
    collectNutrients(duration) {
        this.nutrients = Math.min(9999, this.nutrients + 2 * duration);
    },
    
    collectMutagen() {
        this.mutagen += 5;
        console.log('Mutagen collected:', this.mutagen);
    },
    
    getHighScore() {
        try {
            const saved = localStorage.getItem('bactaria_highscore');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    },
    
    saveHighScore(score) {
        try {
            localStorage.setItem('bactaria_highscore', score);
            return true;
        } catch (e) {
            console.error('Failed to save high score:', e);
            return false;
        }
    },
    
    reset() {
        this.nutrients = 0;
        this.mutagen = 0;
    }
};
