export class Cannon {
 constructor(config) {
 this.config = config;
 this.width = config.cannon.width;
 this.height = config.cannon.height;
 this.x = (config.canvasWidth - this.width) / 2;
 this.targetX = this.x;
 this.y = config.canvasHeight - this.height - 10;
 this.speed = config.cannon.speed;
 this.accelTime = config.cannon.accelTime;
 this.currentSpeed = 0;
 this.fireCooldown = config.cannon.fireCooldown;
 this.lastFire = -this.fireCooldown;
 this.lives = 3;
 this.maxLives = 3;
 }
 
 setTargetX(x) {
 this.targetX = Math.max(0, Math.min(this.config.canvasWidth - this.width, x - this.width/2));
 }
 
 update(dt) {
 const dx = this.targetX - this.x;
 const direction = Math.sign(dx);
 const targetSpeed = Math.abs(dx) > 1 ? this.speed : 0;
 
 const accel = this.speed / this.accelTime;
 if (targetSpeed > this.currentSpeed) {
 this.currentSpeed = Math.min(targetSpeed, this.currentSpeed + accel * dt);
 } else {
 this.currentSpeed = Math.max(targetSpeed, this.currentSpeed - accel * dt);
 }
 
 this.x += direction * this.currentSpeed * dt;
 
 this.x = Math.max(0, Math.min(this.config.canvasWidth - this.width, this.x));
 
 if (Math.abs(this.targetX - this.x) < 0.5) this.x = this.targetX;
 }
 
 fire() {
 const now = performance.now() / 1000;
 if (now - this.lastFire >= this.fireCooldown) {
 this.lastFire = now;
 return {
 x: this.x + this.width/2 - this.config.projectile.width/2,
 y: this.y,
 width: this.config.projectile.width,
 height: this.config.projectile.height,
 speed: this.config.projectile.speed,
 lifetime: this.config.projectile.lifetime,
 age: 0
 };
 }
 return null;
 }
 
 render(ctx) {
 const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
 grad.addColorStop(0, this.config.colors.cannonGrad[0]);
 grad.addColorStop(1, this.config.colors.cannonGrad[1]);
 ctx.fillStyle = grad;
 ctx.beginPath();
 const r = 8;
 ctx.roundRect(this.x, this.y, this.width, this.height, r);
 ctx.fill();
 
 const now = performance.now() / 1000;
 if (now - this.lastFire < 0.05) {
 ctx.fillStyle = 'rgba(0,255,255,0.8)';
 ctx.beginPath();
 ctx.arc(this.x + this.width/2, this.y, 8, 0, Math.PI*2);
 ctx.fill();
 }
 }
 
 reset() {
 this.x = (this.config.canvasWidth - this.width) / 2;
 this.targetX = this.x;
 this.currentSpeed = 0;
 this.lives = this.maxLives;
 this.lastFire = -this.fireCooldown;
 }

 getAABB() {
 return { x: this.x, y: this.y, width: this.width, height: this.height };
 }
}