export class Storage {
  static getHighScore() {
    return JSON.parse(localStorage.getItem('highScore') || '0');
  }
  static setHighScore(score) {
    localStorage.setItem('highScore', JSON.stringify(score));
  }
}