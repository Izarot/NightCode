export class Renderer {
  constructor(ctx, game) {
    this.ctx = ctx;
    this.game = game;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.offscreen = document.createElement('canvas');
    this.offscreenCtx = this.offscreen.getContext('2d');
  }

  setScale(canvasWidth, canvasHeight) {
    const size = Math.min(canvasWidth, canvasHeight) * 0.8;
    this.scale = size / 10;
    this.offsetX = (canvasWidth - this.scale * 10) / 2;
    this.offsetY = (canvasHeight - this.scale * 10) / 2;
    this.offscreen.width = canvasWidth;
    this.offscreen.height = canvasHeight;
    this.drawStatic();
  }

  drawStatic() {
    const ctx = this.offscreenCtx;
    ctx.clearRect(0,0,this.offscreen.width,this.offscreen.height);
    ctx.fillStyle = '#0B0C10';
    ctx.fillRect(0,0,this.offscreen.width,this.offscreen.height);
    ctx.strokeStyle = '#1F2833';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let i=0; i<=10; i++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX + i*this.scale, this.offsetY);
      ctx.lineTo(this.offsetX + i*this.scale, this.offsetY + 10*this.scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.offsetX, this.offsetY + i*this.scale);
      ctx.lineTo(this.offsetX + 10*this.scale, this.offsetY + i*this.scale);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    this.drawNodes();
    this.drawWalls();
  }

  drawNodes() {
    const ctx = this.offscreenCtx;
    this.game.nodes.forEach(n => {
      const x = this.offsetX + (n.x - 0.5) * this.scale;
      const y = this.offsetY + (n.y - 0.5) * this.scale;
      const radius = this.scale * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI*2);
      ctx.fillStyle = n.type === 'source' ? '#66FCF1' : '#F4A261';
      ctx.fill();
      ctx.shadowColor = n.type === 'source' ? '#66FCF1' : '#F4A261';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (n.powered) {
        ctx.beginPath();
        ctx.arc(x, y, radius*1.5, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    this.game.transformers.forEach(t => {
      const x = this.offsetX + (t.x - 0.5) * this.scale;
      const y = this.offsetY + (t.y - 0.5) * this.scale;
      const size = this.scale * 0.3;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t.rotation * Math.PI/180);
      ctx.beginPath();
      ctx.rect(-size/2, -size, size, size*2);
      ctx.fillStyle = '#45A29E';
      ctx.fill();
      ctx.shadowColor = '#45A29E';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }

  drawWalls() {
    const ctx = this.offscreenCtx;
    this.game.walls.forEach(w => {
      const x = this.offsetX + (w.x - 0.5) * this.scale;
      const y = this.offsetY + (w.y - 0.5) * this.scale;
      const size = this.scale * 0.8;
      ctx.fillStyle = '#1F2833';
      ctx.fillRect(x, y, size, size);
    });
  }

  clear() {
    this.ctx.clearRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
  }

  render() {
    this.ctx.drawImage(this.offscreen,0,0);
    this.drawWires();
    this.drawHUD();
  }

  drawWires() {
    const ctx = this.ctx;
    this.game.wires.forEach(w => {
      const start = this.game.getNodeById(w.startId);
      const end = this.game.getNodeById(w.endId);
      if (!start || !end) return;
      const x1 = this.offsetX + (start.x - 0.5) * this.scale;
      const y1 = this.offsetY + (start.y - 0.5) * this.scale;
      const x2 = this.offsetX + (end.x - 0.5) * this.scale;
      const y2 = this.offsetY + (end.y - 0.5) * this.scale;
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(x2,y2);
      ctx.strokeStyle = this.game.wiresIntersect(w) ? '#E63946' : '#45A29E';
      ctx.lineWidth = this.scale * 0.2;
      ctx.stroke();
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
    if (this.game.activeWire) {
      const x1 = this.offsetX + (this.game.activeWire.start.x - 0.5) * this.scale;
      const y1 = this.offsetY + (this.game.activeWire.start.y - 0.5) * this.scale;
      ctx.beginPath();
      ctx.moveTo(x1,y1);
      ctx.lineTo(this.game.activeWire.end.x, this.game.activeWire.end.y);
      ctx.strokeStyle = '#45A29E';
      ctx.lineWidth = this.scale * 0.2;
      ctx.stroke();
    }
  }

  drawHUD() {
    // HUD is DOM-based, so nothing to draw here
  }
}
