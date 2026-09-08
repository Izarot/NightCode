export class Renderer {
  constructor(ctx) { this.ctx = ctx; this.colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e63']; }
  resize(w, h) { this.width = w; this.height = h; }
  clear(w, h) { this.ctx.clearRect(0, 0, w, h); }
  drawBackground(w, h, time) {
    const g = this.ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0d1b2a');
    g.addColorStop(1, '#1b263b');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 73 + time * 20) % (w + 40) - 20;
      const y = (i * 127 + time * 10) % (h + 40) - 20;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1 + Math.sin(time + i) * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  drawTube(tube, time, selected) {
    const { ctx } = this;
    const { x, y, w, h, shake } = tube;
    const shakeX = shake * (Math.random() - 0.5);
    ctx.save();
    ctx.translate(x + shakeX, y);
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 8;
    const glass = ctx.createLinearGradient(0, 0, w, 0);
    glass.addColorStop(0, 'rgba(255,255,255,0.15)');
    glass.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    glass.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.fillStyle = glass;
    this.roundRect(0, 0, w, h, w * 0.15);
    ctx.fill();
    ctx.strokeStyle = selected ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    const unitH = h * 0.22;
    const bottomY = h - 8;
    tube.cols.forEach((colorIdx, i) => {
      const color = this.colors[colorIdx];
      const py = bottomY - i * unitH;
      const wobble = Math.sin(time * 3 + i) * 2;
      const grad = ctx.createLinearGradient(0, py - unitH, 0, py);
      grad.addColorStop(0, color + 'CC');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, color + 'AA');
      ctx.fillStyle = grad;
      this.roundRect(w * 0.12 + wobble, py - unitH + 2, w * 0.76, unitH - 4, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      this.roundRect(w * 0.15 + wobble, py - unitH + 4, w * 0.25, unitH * 0.4, 4);
      ctx.fill();
    });
    ctx.restore();
  }
  drawParticle(p) {
    if (p.life <= 0) return;
    const { ctx } = this;
    const prog = 1 - p.life;
    const x = p.x + (p.tx - p.x) * prog;
    const y = p.y + (p.ty - p.y) * prog + Math.sin(prog * Math.PI) * 20;
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = this.colors[p.color];
    ctx.beginPath();
    ctx.arc(x, y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  roundRect(x, y, w, h, r) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}