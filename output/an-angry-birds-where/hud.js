class HUD {
  constructor() {
    this.birdsRemaining = 5;
    this.totalBirds = 5;
    this.score = 0;
    this.highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
    this.startTime = Date.now();
    this.updateDOM();
  }
  updateDOM() {
    document.getElementById('birdCounter').textContent = `${this.birdsRemaining}/${this.totalBirds}`;
    document.getElementById('score').textContent = this.score;
    document.getElementById('highScore').textContent = this.highScore;
  }
  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore);
    }
    this.updateDOM();
  }
  updateTimer() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    document.getElementById('timer').textContent = elapsed;
  }
  launchBird() {
    this.birdsRemaining--;
    this.updateDOM();
  }
}
const hud = new HUD();