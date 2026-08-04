export class HUD {
  constructor() {
    this.turnEl = document.getElementById('turn');
    this.timerEl = document.getElementById('timer');
    this.highScore = localStorage.getItem('tileStratHighScore') || 0;
  }
  setTurn(n) {
    this.turnEl.textContent = `Turn ${n}`;
  }
  setTimer(seconds) {
    const m = Math.floor(seconds/60).toString().padStart(2,'0');
    const s = (seconds%60).toString().padStart(2,'0');
    this.timerEl.textContent = `${m}:${s}`;
  }
  updateHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('tileStratHighScore', score);
    }
    this.turnEl.textContent = `High Score: ${this.highScore}`;
  }
}