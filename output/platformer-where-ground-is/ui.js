export class UI {
  constructor(hudElement, audio) {
    this.hud = hudElement;
    this.audio = audio;
    this.highScore = localStorage.getItem('highScore') || 0;
    this.startTime = performance.now();
    this.stepCount = 0;
  }
  update(stepCount, score) {
    this.stepCount = stepCount;
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('highScore', score);
    }
    const elapsed = ((performance.now() - this.startTime)/1000).toFixed(1);
    this.hud.innerHTML = `
      <div>Score: ${score}</div>
      <div>High Score: ${this.highScore}</div>
      <div>Steps: ${this.stepCount}</div>
      <div>Time: ${elapsed}s</div>
    `;
  }
}