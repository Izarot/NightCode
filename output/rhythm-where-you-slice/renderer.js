export class Renderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'];
  }

  clear() {
    this.ctx.fillStyle = '#0f0f2a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMenu() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RHYTHM SLICE', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = '24px sans-serif';
    ctx.fillText('High Score: ' + (localStorage.getItem('rhythmHighScore') || 0), canvas.width / 2, canvas.height / 2 - 20);
  }

  drawSettings() {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SETTINGS', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '20px sans-serif';
    ctx.fillText('Adjust volume sliders below', canvas.width / 2, canvas.height / 2);
  }

  drawGame(notes, getLaneX, hitZoneY, laneCount, laneWidth, laneGap) {
    const { ctx, canvas } = this;
    const totalWidth = laneCount * laneWidth + (laneCount - 1) * laneGap;
    const startX = (canvas.width - totalWidth) / 2;

    // Draw lanes
    for (let i = 0; i < laneCount; i++) {
      const x = startX + i * (laneWidth + laneGap);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, 0, laneWidth, canvas.height);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(x, 0, laneWidth, canvas.height);
    }

    // Draw hit zone
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(startX, hitZoneY - 10, totalWidth, 20);

    // Draw notes
    notes.forEach(n => {
      const x = getLaneX(n.lane);
      ctx.fillStyle = this.colors[n.lane % this.colors.length];
      ctx.beginPath();
      ctx.arc(x, n.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  drawSlice(x, y) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = 'rgba(255,105,180,0.7)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 40, Math.PI * 0.25, Math.PI * 0.75, false);
    ctx.stroke();
    ctx.restore();
  }

  drawHUD(score, combo, maxCombo, health, highScore, time) {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 20, 40);
    ctx.textAlign = 'center';
    ctx.fillText('Combo: ' + combo, canvas.width / 2, 40);
    ctx.textAlign = 'right';
    ctx.fillText('High Score: ' + highScore, canvas.width - 20, 40);
    ctx.fillText('Time: ' + time.toFixed(2) + 's', canvas.width - 20, 70);

    // Health hearts
    ctx.textAlign = 'right';
    for (let i = 0; i < 5; i++) {
      ctx.fillText(i < health ? '❤️' : '🖤', canvas.width - 20 - i * 30, 100);
    }
  }
}