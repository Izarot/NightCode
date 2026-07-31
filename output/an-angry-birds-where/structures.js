class Structure {
  constructor(x, y, w, h, type) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.type = type;
    this.hp = this.getMaxHP();
    this.color = this.getColor();
  }
  getMaxHP() {
    switch(this.type) {
      case 'wood': return 2;
      case 'stone': return 4;
      case 'metal': return 6;
      default: return 2;
    }
  }
  getColor() {
    switch(this.type) {
      case 'wood': return '#8D6E6C';
      case 'stone': return '#9E9E9E';
      case 'metal': return '#B0BEC5';
      default: return '#8D6E6C';
    }
  }
  damage(amount) {
    this.hp -= amount;
    sound.hit();
    return this.hp <= 0;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(this.x, this.y, this.w, this.h);
  }
}
class Pig {
  constructor(x, y, type) {
    this.x = x; this.y = y;
    this.type = type;
    this.r = 15;
    this.color = type === 'stone' ? '#9E9E9E' : type === 'metal' ? '#B0BEC5' : '#FF8A65';
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fill();
  }
}