export class Key {
  constructor(x, y, type, size) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
    this.startX = x;
    this.startY = y;
    this.locked = false;
    const colors = {red:'#e53935', blue:'#1e88e5', green:'#43a047', yellow:'#fdd835'};
    this.color = colors[type] || '#fff';
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.size/2, this.y + this.size/2);
    ctx.fillStyle = this.color;
    if (this.type === 'red') {
      ctx.beginPath();
      ctx.moveTo(0, -this.size/2);
      ctx.lineTo(this.size/2, this.size/2);
      ctx.lineTo(-this.size/2, this.size/2);
      ctx.closePath();
    } else if (this.type === 'blue') {
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    } else if (this.type === 'green') {
      ctx.beginPath();
      ctx.arc(0,0,this.size/2,0,Math.PI*2);
      ctx.fill();
    } else if (this.type === 'yellow') {
      ctx.beginPath();
      ctx.moveTo(0, -this.size/2);
      ctx.lineTo(this.size/2, 0);
      ctx.lineTo(0, this.size/2);
      ctx.lineTo(-this.size/2, 0);
      ctx.closePath();
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(-this.size/4, -this.size/4, this.size/6,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

export class Lock {
  constructor(x, y, type, size) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = size;
    this.isUnlocked = false;
    const colors = {red:'#e53935', blue:'#1e88e5', green:'#43a047', yellow:'#fdd835'};
    this.color = colors[type] || '#555';
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.size/2, this.y + this.size/2);
    ctx.strokeStyle = this.isUnlocked ? '#0f0' : this.color;
    ctx.lineWidth = 3;
    if (this.type === 'red') {
      ctx.beginPath();
      ctx.moveTo(0, -this.size/2*0.8);
      ctx.lineTo(this.size/2*0.8, this.size/2*0.8);
      ctx.lineTo(-this.size/2*0.8, this.size/2*0.8);
      ctx.closePath();
    } else if (this.type === 'blue') {
      ctx.strokeRect(-this.size/2*0.8, -this.size/2*0.8, this.size*0.8, this.size*0.8);
    } else if (this.type === 'green') {
      ctx.beginPath();
      ctx.arc(0,0,this.size/2*0.8,0,Math.PI*2);
    } else if (this.type === 'yellow') {
      ctx.beginPath();
      ctx.moveTo(0, -this.size/2*0.8);
      ctx.lineTo(this.size/2*0.8, 0);
      ctx.lineTo(0, this.size/2*0.8);
      ctx.lineTo(-this.size/2*0.8, 0);
      ctx.closePath();
    }
    ctx.stroke();
    if (this.isUnlocked) {
      ctx.fillStyle = 'rgba(0,255,0,0.2)';
      ctx.fillRect(-this.size/2*0.6, -this.size/2*0.6, this.size*0.6, this.size*0.6);
    }
    ctx.restore();
  }
}