// High Score Management with LocalStorage
class ScoreManager {
  constructor() { this.highScoreKey = 'reactionMasterHighScore'; }
  getHighScore() {
    try { const score = localStorage.getItem(this.highScoreKey); return score ? parseInt(score, 10) : 0; }
    catch (e) { return 0; }
  }
  saveHighScore(score) {
    try { localStorage.setItem(this.highScoreKey, score.toString()); } catch (e) { console.warn('Could not save high score'); }
  }
  updateHighScore(newScore) {
    const currentHigh = this.getHighScore();
    if (newScore > currentHigh) { this.saveHighScore(newScore); return newScore; }
    return currentHigh;
  }
}
export const scoreManager = new ScoreManager();
