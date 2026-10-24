class Physics{
  constructor(){
    this.car = {
      x: 0, y: 0, angle: 0,
      vx: 0, vy: 0,
      rotation: 0,
      speed: 0,
      maxSpeed: 5,
      acceleration: 0.1,
      friction: 0.98,
      drift: false
    };
  }
  update(dt, keys){
    const c = this.car;
    if(keys['KeyW']){
      c.vx += Math.cos(c.angle) * c.acceleration;
      c.vy += Math.sin(c.angle) * c.acceleration;
    }
    if(keys['KeyS']){
      c.vx -= Math.cos(c.angle) * c.acceleration * 0.5;
      c.vy -= Math.sin(c.angle) * c.acceleration * 0.5;
    }
    if(keys['ArrowLeft']){
      c.angle -= 0.05;
    }
    if(keys['ArrowRight']){
      c.angle += 0.05;
    }
    if(keys['Space']){
      c.drift = true;
    } else {
      c.drift = false;
    }
    c.vx *= c.friction;
    c.vy *= c.friction;
    c.x += c.vx;
    c.y += c.vy;
    c.speed = Math.sqrt(c.vx*c.vx + c.vy*c.vy);
  }
}