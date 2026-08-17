class Obstacle {
  constructor(x, y, w, h, type) {
    this.x=x; this.y=y; this.w=w; this.h=h; this.type=type;
    this.drift = type==='cloud' ? 0.2 : 0;
  }
  update(dt) { this.x -= this.drift * dt; }
  draw(ctx) {
    if (this.type==='cloud') {
      ctx.fillStyle = 'rgba(180,160,200,0.85)';
      ctx.beginPath();
      ctx.arc(this.x+this.w*0.3, this.y+this.h*0.5, this.h*0.5, 0, Math.PI*2);
      ctx.arc(this.x+this.w*0.6, this.y+this.h*0.4, this.h*0.6, 0, Math.PI*2);
      ctx.arc(this.x+this.w*0.8, this.y+this.h*0.55, this.h*0.45, 0, Math.PI*2);
      ctx.fill();
    } else if (this.type==='building') {
      ctx.fillStyle = '#5a4a6e';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#ffd23f';
      for(let i=6;i<this.h;i+=14) for(let j=4;j<this.w;j+=10) ctx.fillRect(this.x+j, this.y+i, 4, 6);
    } else { // mountain
      ctx.fillStyle = '#7d5ba6';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y+this.h);
      ctx.lineTo(this.x+this.w/2, this.y);
      ctx.lineTo(this.x+this.w, this.y+this.h);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(this.x+this.w/2-8, this.y+14);
      ctx.lineTo(this.x+this.w/2, this.y);
      ctx.lineTo(this.x+this.w/2+8, this.y+14); ctx.closePath(); ctx.fill();
    }
  }
  hits(b) {
    return b.x < this.x+this.w && b.x+b.w > this.x && b.y < this.y+this.h && b.y+b.h > this.y;
  }
}
