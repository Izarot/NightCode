export class ProjectileManager {
 constructor(config) {
 this.config = config;
 this.projectiles = [];
 this.pool = [];
 }
 
 add(proj) {
 this.projectiles.push({ ...proj, active: true });
 }
 
 remove(proj) {
 proj.active = false;
 }
 
 clear() {
 this.projectiles = [];
 }
 
 getAll() {
 return this.projectiles.filter(p => p.active);
 }
 
 update(dt) {
 for (const p of this.projectiles) {
 if (!p.active) continue;
 p.y -= p.speed * dt;
 p.age += dt;
 if (p.age >= p.lifetime || p.y + p.height < 0) {
 p.active = false;
 }
 }
 this.projectiles = this.projectiles.filter(p => p.active);
 }
 
 render(ctx) {
 ctx.fillStyle = this.config.colors.projectile;
 for (const p of this.projectiles) {
 if (!p.active) continue;
 for (let i = 0; i < 3; i++) {
 const alpha = 0.3 - i * 0.1;
 const trailY = p.y + i * 4;
 ctx.globalAlpha = alpha;
 ctx.beginPath();
 ctx.arc(p.x + p.width/2, trailY + p.height/2, p.width/2, 0, Math.PI*2);
 ctx.fill();
 }
 ctx.globalAlpha = 1;
 ctx.beginPath();
 ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2);
 ctx.fill();
 }
 }
}