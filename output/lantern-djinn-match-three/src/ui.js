// UI Rendering Functions
export class UIManager {
  constructor(canvas, ctx) { this.canvas = canvas; this.ctx = ctx; this.radius = 150; }
  drawCircle(state) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.radius);
    if (state === 'waiting') { gradient.addColorStop(0, '#4299e1'); gradient.addColorStop(1, '#2c5282'); }
    else if (state === 'ready') { gradient.addColorStop(0, '#48bb78'); gradient.addColorStop(1, '#276749'); }
    else { gradient.addColorStop(0, '#f56565'); gradient.addColorStop(1, '#c53030'); }
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
    this.ctx.fill();
  }
  drawText(text, size, color, x, y) {
    this.ctx.fillStyle = color;
    this.ctx.font = size + "px 'Segoe UI', sans-serif";
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x, y);
  }
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight);
    this.canvas.width = size;
    this.canvas.height = size;
    this.radius = size * 0.35;
  }
}
