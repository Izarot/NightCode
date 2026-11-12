export class Player {
  constructor(game){
    this.game = game;
    this.x = game.worldBounds.w/2;
    this.y = game.worldBounds.h/2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.maxSpeed = 180;
    this.accel = 1500;
    this.decel = 1200;
    this.maxHealth = 100;
    this.health = 100;
    this.angle = 0;
    this.invuln = 0;
    this.colorCore = '#00ffff';
    this.colorRing = '#ff0066';
  }
  update(dt){
    const input = this.game.input;
    let ax = 0, ay = 0;
    if(input.keys.w || input.keys.arrowup) ay -= 1;
    if(input.keys.s || input.keys.arrowdown) ay += 1;
    if(input.keys.a || input.keys.arrowleft) ax -= 1;
    if(input.keys.d || input.keys.arrowright) ax += 1;
    if(ax !== 0 || ay !== 0){
      const len = Math.hypot(ax, ay);
      ax /= len; ay /= len;
      this.vx += ax * this.accel * dt;
      this.vy += ay * this.accel * dt;
    }else{
      const speed = Math.hypot(this.vx, this.vy);
      if(speed > 0){
        const dec = this.decel * dt;
        if(speed <= dec){ this.vx = 0; this.vy = 0; }
        else{ this.vx -= (this.vx/speed)*dec; this.vy -= (this.vy/speed)*dec; }
      }
    }
    const speed = Math.hypot(this.vx, this.vy);
    if(speed > this.maxSpeed){
      this.vx = (this.vx/speed)*this.maxSpeed;
      this.vy = (this.vy/speed)*this.maxSpeed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if(this.invuln > 0) this.invuln -= dt;
    const mx = this.game.input.mouseX - (this.game.canvas.width/2 - this.game.offsetX)/this.game.scale + this.game.camera.x;
    const my = this.game.input.mouseY - (this.game.canvas.height/2 - this.game.offsetY)/this.game.scale + this.game.camera.y;
    this.angle = Math.atan2(my - this.y, mx - this.x);
  }
  takeDamage(amount){
    if(this.invuln > 0) return false;
    this.health -= amount;
    this.invuln = 0.3;
    this.game.addScreenShake(6, 0.15);
    this.game.audio.play('hit');
    return true;
  }
  heal(amount){
    this.health = Math.min(this.maxHealth, this.health + amount);
  }
  reset(){
    this.x = this.game.worldBounds.w/2;
    this.y = this.game.worldBounds.h/2;
    this.vx = 0; this.vy = 0;
    this.health = this.maxHealth;
    this.invuln = 0;
  }
}