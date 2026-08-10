export class Storage {
    constructor() {
        this.key = 'clickerSave';
        this.lastSaveTime = 0;
    }

    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }

    clear() {
        localStorage.removeItem(this.key);
    }

    getHighScore() {
        try {
            return parseFloat(localStorage.getItem('clickerHighScore') || '0');
        } catch (e) {
            return 0;
        }
    }

    setHighScore(score) {
        try {
            localStorage.setItem('clickerHighScore', score.toString());
        } catch (e) {
            console.error('Failed to save high score:', e);
        }
    }
}