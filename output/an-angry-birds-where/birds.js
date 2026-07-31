class Bird {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.w = 30;
    this.h = 30;
    this.vx = 0;
    this.vy = 0;
    this.launched = false;
    this.falling = false;
    this.rotation = 0;
    this.color = this.getColor();
    this.abilityUsed = false;
  }
  getColor() {
    switch(this.type) {
      case 'basic': return '#FF6B35';
      case 'egg': return '#FFD23F';
      case 'boomerang': return '#6BCB77';
      case 'ice': return '#4D96FF';
      case 'poison': return '#9C27B0';
      default: return '#FF6B35';
    }
  }
  launch(vx, vy) {
    this.vx = vx;
    this.vy = vy;
    this.launched = true;
    sound.launch();
  }
  update() {
    physics.update(this);
    if (this.y > 600) this.falling = false;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w/2, this.y + this.h/2);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(-this.w/2, -this.h/2, this.w/2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  activateAbility() {
    if (this.abilityUsed) return;
    this.abilityUsed = true;
    switch(this.type) {
      case 'egg': sound.explode(); break;
      case 'ice': sound.freeze(); break;
      case 'poison': sound.poison(); break;
    }
  }
}
const birdTypes = ['basic','egg','boomerang','ice','poison'];