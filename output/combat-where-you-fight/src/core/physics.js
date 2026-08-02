export class Physics {
 constructor() {
  this.gravity = 0;
 }
 
 update(dt) {
  // Physics update
 }
 
 checkCollisions(players, projectiles) {
  players.forEach(p => {
   projectiles.forEach(prj => {
    const dx = prj.x - p.x;
    const dy = prj.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < prj.radius + p.radius) {
     p.takeDamage(prj.damage);
     prj.destroy();
    }
   });
  });
 }
}
