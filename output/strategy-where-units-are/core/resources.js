export class ResourceManager {
    constructor(game) {
        this.game = game;
    }
    
    update(dt) {
        // Regenerate nutrients over time
        this.game.gameState.nutrients = Math.min(100, this.game.gameState.nutrients + dt * 2);
        
        // Regenerate MP
        this.game.gameState.mp = Math.min(100, this.game.gameState.mp + dt * 5);
    }
}