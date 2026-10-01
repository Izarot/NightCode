export class StorageManager {
  constructor() {
    this.storageKey = 'snap-vanish-highscore';
  }

  getHighScore() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? parseInt(stored, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore(score) {
    try {
      localStorage.setItem(this.storageKey, score.toString());
    } catch (e) {
      console.warn('Could not save high score');
    }
  }
}
