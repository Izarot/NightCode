export class SaveManager {
    constructor(game) {
        this.game = game;
        this.storageKey = 'mazeRunner_data';
    }

    loadHighScore() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.highScore || 0;
            }
        } catch (e) {
            console.warn('Failed to load high score:', e);
        }
        return 0;
    }

    saveHighScore(score) {
        try {
            const data = { highScore: score, lastPlayed: Date.now() };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save high score:', e);
        }
    }

    clearData() {
        localStorage.removeItem(this.storageKey);
    }
}