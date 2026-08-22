class WaveInfo {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.wave = 0;
    this.remaining = 60;
    this.asteroidCount = 0;
  }
  update(delta) {
    this.remaining -= delta / 1000;
    if (this.remaining <= 0) {
      this.remaining = 60;
      this.wave++;
      this.asteroidCount = 0;
    }
  }
  render() {
    const ctx = this.ctx;
    const x = 10;
    const y = 20;
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Wave ${this.wave} - ${Math.ceil(this.remaining)}s`, x, y);
    ctx.fillText(`${this.asteroidCount} asteroids`, x, y + 25);
  }
}