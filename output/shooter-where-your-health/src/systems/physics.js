export class Physics {
  integrate(entity, dt){
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
  }
  applyFriction(entity, friction, dt){
    const speed = Math.hypot(entity.vx, entity.vy);
    if(speed > 0){
      const dec = friction * dt;
      if(speed <= dec){ entity.vx = 0; entity.vy = 0; }
      else{ entity.vx -= (entity.vx/speed)*dec; entity.vy -= (entity.vy/speed)*dec; }
    }
  }
}