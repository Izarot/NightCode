export class Shield {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.max = 30; this.hp = 30;
    this.hitT = 0;
    this.repairCool = 0;
  }
  reset(x, y) {
    this.x = x; this.y = y; this.hp = this.max; this.hitT = 0;
  }
  update(dt) {
    if (this.hitT > 0) this.hitT -= dt;
    if (this.repairCool > 0) this.repairCool -= dt;
    if (this.hp > 0 && this.hitT <= 0) this.hp = Math.min(this.max, this.hp + 2 * dt);
  }
  hit(dmg) {
    if (this.hp <= 0) return false;
    this.hp -= dmg;
    this.hitT = 0.2;
    if (this.hp < 0) this.hp = 0;
    return true;
  }
  repair() {
    if (this.hp > 0 && this.repairCool <= 0 && this.hp < this.max) {
      this.hp = Math.min(this.max, this.hp + 15);
      this.repairCool = 5;
      return true;
    }
    return false;
  }
  draw(ctx) {
    if (this.hp <= 0) {
      ctx.fillStyle = 'rgba(110,43,255,0.15)';
      ctx.fillRect(this.x, this.y, this.w, this.h);
      return;
    }
    const a = 0.35 + (this.hp/this.max)*0.35;
    ctx.fillStyle = this.hitT > 0 ? `rgba(255,40,80,${a+0.3})` : `rgba(43,240,255,${a})`;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.strokeStyle = '#2bf0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.w, this.h);
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(this.hp), this.x + this.w/2, this.y + 20);
  }
}
