export class UI {
  constructor(ctx) {
    this.ctx = ctx;
    this.font = '18px Arial';
    this.speed = 0;
    this.gears = 0;
    this.lapTime = 0;
    this.highScore = 0;
    this.paused = false;
  }

  update(dt) {
    if (!this.paused) {
      this.lapTime += dt;
    }
    const ms = Math.floor(this.lapTime * 100);
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    const hundredths = ms % 100;
    this.timerDisplay = `${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${hundredths.toString().padStart(2, '0')}`;
  }

  draw() {
    this.ctx.save();
    this.ctx.font = this.font;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(`Speed: ${Math.round(this.speed)} px/frame`, this.ctx.canvas.width - 150, 30);
    this.ctx.fillText(`Gears: ${this.gears}`, this.ctx.canvas.width - 150, 50);
    this.ctx.fillText(`Lap: ${this.timerDisplay}`, this.ctx.canvas.width / 2 - 60, 30);
    if (this.highScore > 0) {
      this.ctx.fillText(`Best: ${this.highScore}`, this.ctx.canvas.width / 2 - 60, 50);
    }
    this.ctx.restore();
  }

  setSpeed(s) { this.speed = s; }
  setGearCount(n) { this.gears = n; }
  setHighScore(score) { this.highScore = score; }
  togglePause(show) { this.paused = show; }
}