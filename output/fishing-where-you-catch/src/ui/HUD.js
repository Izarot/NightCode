export class UIManager {
  constructor(ctx) {
    this.ctx = ctx;
  }
  render(ctx, data) {
    // Ocean Health
    ctx.fillStyle = '#444';
    ctx.fillRect(340, 20, 600, 20);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(340, 20, data.oceanHealth * 6, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Ocean Health: ' + Math.round(data.oceanHealth) + '%', 640, 35);

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Score: ' + data.score, 1240, 30);
    ctx.fillText('High Score: ' + data.highScore, 1240, 50);

    // Timer
    const mins = Math.floor(data.timer / 60);
    const secs = Math.floor(data.timer % 60);
    ctx.fillText('Time: ' + mins + ':' + String(secs).padStart(2, '0'), 1240, 70);

    // Speedrun Timer
    ctx.fillText('Speedrun: ' + data.speedrunTime.toFixed(2) + 's', 1240, 90);

    // Vessel Status
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(20, 680, 100, 10);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Hull: 100%', 20, 675);
    ctx.fillText('Line: ' + data.ship.size + 'px', 20, 690);
  }
}
