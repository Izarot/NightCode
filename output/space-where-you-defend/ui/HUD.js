import { CONFIG } from '../utils/Config.js';
import { Storage } from '../utils/Storage.js';

class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.health = 1000;
    this.energy = 1000;
    this.waveTimer = 0;
    this.wave = 0;
    this.score = 0;
    this.startTime = performance.now();
    this.highScore = Storage.getHighScore();
  }
  update(delta) {
    this.waveTimer += delta;
    this.energy = Math.min(CONFIG.maxEnergy, this.energy + CONFIG.energyRegen * delta);
  }
  render() {
    const ctx = this.ctx;
    const x = 10;
    const y = 20;
    // Health bar
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(x, y, this.health / 10, 20);
    ctx.fillStyle = '#f44336';
    ctx.fillRect(x + this.health / 10, y, (1000 - this.health) / 10, 20);
    // Energy bar
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(x, y + 30, this.energy / 10, 20);
    // Wave timer
    const remaining = Math.max(0, 60 - Math.floor(this.waveTimer / 1000));
    ctx.fillStyle = '#fff';
    ctx.fillText(`Wave ${this.wave} - ${remaining}s`, x, y + 50);
    // Score
    ctx.fillText(`Score: ${this.score}`, x, y + 70);
    // High score
    ctx.fillText(`High Score: ${this.highScore}`, x, y + 85);
  }
}