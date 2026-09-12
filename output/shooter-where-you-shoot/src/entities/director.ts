export class SpawnDirector {
    threat: number = 0;
    score: number = 0;
    multiplier: number = 1.0;
    
    update(dt: number, killed: number) {
        // Increase threat over time and on kills
        this.threat += dt * 0.1;
        if (killed > 0) this.threat += killed * 0.5;
        
        // Multiplier decay
        this.multiplier *= Math.pow(C.MULT_DECAY_RATE, dt);
        if (this.multiplier < 1.0) this.multiplier = 1.0;
    }
    
    addScore(points: number) {
        this.score += points * this.multiplier;
    }
    
    increaseMultiplier() {
        this.multiplier += 0.5;
    }
}