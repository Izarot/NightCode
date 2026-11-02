// Game state management
class GameState {
    constructor() {
        this.states = {
            NAVIGATION: 'navigation',
            AUTHORING: 'authoring',
            PUBLISHING: 'publishing'
        };
        this.currentState = this.states.NAVIGATION;
        this.score = 0;
        this.highScore = 0;
    }
    
    setState(newState) {
        if (this.states[newState.toUpperCase()]) {
            this.currentState = this.states[newState.toUpperCase()];
            return true;
        }
        return false;
    }
    
    calculateScore(assets, engagementBonus) {
        const baseScore = assets.length * 100;
        this.score = baseScore + engagementBonus;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('courseArchitectHighScore', this.highScore);
        }
        
        return this.score;
    }
    
    reset() {
        this.score = 0;
        this.currentState = this.states.NAVIGATION;
    }
}