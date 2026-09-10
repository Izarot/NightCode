export class Renderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.gradientCache = {};
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground() {
    const ctx = this.ctx;
    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(0.5, '#1a1a4e');
    grad.addColorStop(1, '#0d0d2b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    
    // Pocket indicators
    const pocketSize = 150;
    const corners = [
      { x: 200, y: 50 },
      { x: this.width - 200 - pocketSize, y: 50 },
      { x: 200, y: this.height - 50 - pocketSize },
      { x: this.width - 200 - pocketSize, y: this.height - 50 - pocketSize }
    ];
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    corners.forEach(c => {
      ctx.strokeRect(c.x, c.y, pocketSize, pocketSize);
    });
    ctx.setLineDash([]);
  }

  drawPaddle(paddle) {
    const ctx = this.ctx;
    const halfH = paddle.height / 2;
    
    // Spring visualization: line from rest position to current position
    ctx.beginPath();
    ctx.moveTo(paddle.width, paddle.restY);
    ctx.lineTo(paddle.width, paddle.y);
    const grad = ctx.createLinearGradient(paddle.width, paddle.restY, paddle.width, paddle.y);
    grad.addColorStop(0, 'rgba(0, 191, 255, 0.8)');
    grad.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Paddle body
    const paddleGrad = ctx.createLinearGradient(0, paddle.y - halfH, 0, paddle.y + halfH);
    paddleGrad.addColorStop(0, '#00BFFF');
    paddleGrad.addColorStop(0.5, '#00FFFF');
    paddleGrad.addColorStop(1, '#00BFFF');
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.roundRect(0, paddle.y - halfH, paddle.width, paddle.height, 8);
    ctx.fill();
    
    // Paddle glow
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawBall(ball) {
    const ctx = this.ctx;
    
    // Trail
    ball.trail.forEach((pos, i) => {
      const alpha = (i / ball.trail.length) * 0.4;
      const size = ball.radius * (i / ball.trail.length);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.fill();
    });
    
    // Ball glow
    ctx.shadowColor = ball.glowColor;
    ctx.shadowBlur = 20;
    
    // Ball body
    const ballGrad = ctx.createRadialGradient(
      ball.x - 2, ball.y - 2, 0,
      ball.x, ball.y, ball.radius
    );
    ballGrad.addColorStop(0, '#FFF8DC');
    ballGrad.addColorStop(0.5, ball.color);
    ballGrad.addColorStop(1, '#FF8C00');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
  }

  drawBrick(brick) {
    const ctx = this.ctx;
    const halfW = brick.width / 2;
    const halfH = brick.height / 2;
    const x = brick.x;
    const y = brick.y;
    
    // Brick gradient
    const grad = ctx.createLinearGradient(x, y, x, y + brick.height);
    grad.addColorStop(0, brick.color);
    grad.addColorStop(0.5, this.lightenColor(brick.color, 30));
    grad.addColorStop(1, brick.color);
    ctx.fillStyle = grad;
    
    // Rounded rect
    const radius = 4;
    ctx.beginPath();
    ctx.roundRect(x, y, brick.width, brick.height, radius);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, brick.width - 4, halfH - 2, radius);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Hit indicator
    if (brick.hits > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(brick.hits.toString(), brick.x + halfW, brick.y + halfH);
    }
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  }

  drawHUD(score, lives, highScore, timer) {
    // HUD is drawn via HTML overlay, but we can draw mini version here if needed
  }

  drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#00FFFF';
    ctx.font = 'bold 48px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    ctx.font = '20px Segoe UI';
    ctx.fillStyle = '#fff';
    ctx.fillText('Press P to resume', this.width / 2, this.height / 2 + 50);
  }
}