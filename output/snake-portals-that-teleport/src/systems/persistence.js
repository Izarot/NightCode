export class Persistence {
  static saveHighScore(score) {
    localStorage.setItem('portalSnakeHighScore', score);
  }

  static loadHighScore() {
    const stored = localStorage.getItem('portalSnakeHighScore');
    return stored ? parseInt(stored) : 0;
  }
}