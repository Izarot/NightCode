export class Persistence {
  getHighScore() {
    return parseInt(localStorage.getItem('oceanHighScore') || '0', 10);
  }
  saveHighScore(score) {
    localStorage.setItem('oceanHighScore', score.toString());
  }
  saveScore(score) {
    localStorage.setItem('oceanLastScore', score.toString());
  }
}
