export class Player {
 constructor(id, x, y) {
  this.id = id;
  this.x = x;
  this.y = y;
  this.radius = 20;
  this.health = 100;
  this.speed = 400;
  this.sprintBoost = 1.5;
  this.friction = 0.8;
  this.velocity = {x:0, y:0};
  this.facing = 0;
  this.cooldowns = {burst:0, shield:0, leap:0};
  this.color = id === 1 ? '#00f' : '#f00';
 }
 
 update(dt, input, physics, audio) {
  // Movement
  let targetVel = {x:0, y:0};
  if (input.keys['KeyW']) targetVel.y -= 1;
  if (input.keys['KeyS']) targetVel.y += 1;
  if (input.keys['KeyA']) targetVel.x -= 1;
  if (input.keys['KeyD']) targetVel.x += 1;
  
  const len = Math.hypot(targetVel.x, targetVel.y);
  if (len > 0) {
   targetVel.x = (targetVel.x / len) * this.speed;
   targetVel.y = (targetVel.y / len) * this.speed;
  }
  
  if (input.keys['ShiftLeft']) {
   targetVel.x *= this.sprintBoost;
   targetVel.y *= this.sprintBoost;
  }
  
  this.velocity.x += (targetVel.x - this.velocity.x) * 0.1;
  this.velocity.y += (targetVel.y - this.velocity.y) * 0.1;
  
  this.velocity.x *= this.friction;
  this.velocity.y *= this.friction;
  
  this.x += this.velocity.x * dt;
  this.y += this.velocity.y * dt;
  
  // Update facing direction
  if (len > 0) {
   this.facing = Math.atan2(targetVel.y, targetVel.x);
  }
  
  // Update cooldowns
  if (this.cooldowns.burst > 0) this.cooldowns.burst -= dt;
  if (this.cooldowns.shield > 0) this.cooldowns.shield -= dt;
  if (this.cooldowns.leap > 0) this.cooldowns.leap -= dt;
  
  // Abilities
  if (input.keys['Space'] && this.cooldowns.leap <= 0) {
   this.leap();
   this.cooldowns.leap = 1.5;
  }
  
  if (input.mouse.left && this.cooldowns.shield <= 0) {
   this.shield();
   this.cooldowns.shield = 1.2;
  }
  
  if (input.keys['KeyQ'] && this.health < 30 && this.cooldowns.burst <= 0) {
   this.burst();
   this.cooldowns.burst = 8;
  }
 }
 
 updateAI(dt, physics, audio) {
  // Simple AI logic
  const dx = this.x - physics.players[0].x;
  const dy = this.y - physics.players[0].y;
  const dist = Math.hypot(dx, dy);
  
  if (dist > 100) {
   this.velocity.x = (dx / dist) * this.speed * 0.5;
   this.velocity.y = (dy / dist) * this.speed * 0.5;
  } else {
   this.velocity.x *= 0.9;
   this.velocity.y *= 0.9;
  }
  
  this.velocity.x *= this.friction;
  this.velocity.y *= this.friction;
  
  this.x += this.velocity.x * dt;
  this.y += this.velocity.y * dt;
  
  // AI attacks
  if (Math.random() < 0.01) {
   this.shield();
  }
  
  if (Math.random() < 0.005) {
   this.burst();
  }
 }
 
 shield() {
  if (this.cooldowns.shield > 0) return;
  this.cooldowns.shield = 1.2;
  // Create shield effect
 }
 
 burst() {
  if (this.cooldowns.burst > 0) return;
  this.cooldowns.burst = 8;
  // Create burst effect
 }
 
 leap() {
  if (this.cooldowns.leap > 0) return;
  this.velocity.x += Math.cos(this.facing) * 300;
  this.velocity.y += Math.sin(this.facing) * 300;
 }
 
 takeDamage(damage) {
  this.health = Math.max(0, this.health - damage);
 }
 
 render(ctx) {
  ctx.save();
  ctx.translate(this.x, this.y);
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.arc(0, 0, this.radius, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
 }
}
