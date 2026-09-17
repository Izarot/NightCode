import { Physics } from './physics.js';
import { State } from './state.js';

export class Player extends Physics{
  constructor(game){ super(); this.game = game; this.x = 0; this.y = 0; this.r = 16; this.speed = 330; this.velX = 0; this.velY = 0; this.angle = 0; this.hull = 100; this.maxHull = 100; this.shield = 40; this.maxShield = 40; this.dashCooldown = 0; this.dashTimer = 0; this.canDash = true; this.absorbReady = false;
  }
  
  update(dt){
    const g = this.game; const i = g.input; const s = g.state;
    let ax = 0, ay = 0;
    if(i.isDown('KeyW')||i.isDown('ArrowUp')) ay -= 1;
    if(i.isDown('KeyS')||i.isDown('ArrowDown')) ay += 1;
    if(i.isDown('KeyA')||i.isDown('ArrowLeft')) ax -= 1;
    if(i.isDown('KeyD')||i.isDown('ArrowRight')) ax += 1;
    if(ax!==0||ay!==0){ ax/=Math.sqrt(ax*ax+ay*ay); ay/=Math.sqrt(ax*ax+ay*ay); }
    
    const mx = i.mouse.x, my = i.mouse.y;
    const cx = g.canvas.width/g.canvas.clientWidth;
    const cy = g.canvas.height/g.canvas.clientHeight;
    const dx = mx - cx, dy = my - cy;
    this.angle = Math.atan2(dy, dx);
    
    const thrust = 900;
    this.velX += ax * thrust * dt;
    this.velY += ay * thrust * dt;
    
    const drag = Math.exp(-2.2 * dt);
    this.velX *= drag;
    this.velY *= drag;
    
    const maxSpd = [0,330,310,290,270,250][s.stage];
    const spd = Math.sqrt(this.velX*this.velX + this.velY*this.velY);
    if(spd > maxSpd){ this.velX = this.velX/spd*maxSpd; this.velY = this.velY/spd*maxSpd; }
    
    this.x += this.velX * dt * 60;
    this.y += this.velY * dt * 60;
    
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if(this.dashTimer > 0) this.dashTimer -= dt;
  }
}