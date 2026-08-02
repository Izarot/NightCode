export class Projectile {
 constructor(x, y, radius, damage, speed, angle) {
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.damage = damage;
  this.speed = speed;
  this.angle = angle;
  this.vx = Math.cos(angle) * speed;
  this.vy = Math.sin(angle) * speed;
  this.color = '#ff0';
  this.life = 2;
 }
 
 update(dt) {
  this.x += this.vx * dt;
  this.y += this.vy * dt;
  this.life -= dt;
  return this.life > 0;
 }
 
 destroy() {
  this.life = 0;
 }
 
 render(ctx) {
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.strokeStyle = this.color;
  ctx.beginPath();
  ctx.arc(0, 0, this.radius, 0, Math.PI*2);
  ctx.stroke();
  ctx.restore();
 }
}
