class Paddle {
 constructor() { this.reset(); }
 reset() { this.x = CFG.w/2; this.y = CFG.h - 40; this.targetX = this.x; this.vx = 0; this.w = CFG.paddleW; this.h = CFG.paddleH; this.inv = 0; this.flash = 0; }
 update(input, dt) {
 if (input.keys['ArrowLeft']) this.targetX -= 12;
 if (input.keys['ArrowRight']) this.targetX += 12;
 else this.targetX = input.mouseX;
 const min = CFG.pad + CFG.paddlePad + this.w/2;
 const max = CFG.w - CFG.pad - CFG.paddlePad - this.w/2;
 this.targetX = Math.max(min, Math.min(max, this.targetX));
 this.x += (this.targetX - this.x) * 0.25;
 if (this.inv > 0) this.inv -= dt;
 if (this.flash > 0) this.flash -= dt;
 }
 draw(r) { r.drawPaddle(this); }
}
class Ball {
 constructor() { this.reset(); }
 reset() {
 this.x = CFG.w/2; this.y = CFG.h - 60; this.vx = 0; this.vy = 0;
 this.docked = true; this.speed = CFG.ballBase; this.trail = []; this.boost = 0;
 this.stuckTime = 0; this.lastVy = 0;
 }
 launch() { if (this.docked) { this.vx = (Math.random()-0.5)*4; this.vy = -this.speed; this.docked = false; }}
 update(dt) {
 if (this.docked) return;
 this.trail.push({x:this.x,y:this.y});
 if (this.trail.length > 5) this.trail.shift();
 this.x += this.vx; this.y += this.vy;
 if (this.boost > 0) { this.speed = Math.min(CFG.ballMax, this.speed + 0.3); this.boost -= dt; }
 else this.speed = Math.max(CFG.ballBase, this.speed - 0.01);
 const sp = Math.hypot(this.vx, this.vy);
 this.vx = this.vx/sp * this.speed; this.vy = this.vy/sp * this.speed;
 if (Math.abs(this.vy) < 0.5 && this.lastVy !== 0) this.stuckTime += dt; else this.stuckTime = 0;
 this.lastVy = this.vy;
 if (this.stuckTime > 5) { this.vy += (Math.random()-0.5)*2; this.stuckTime = 0; }
 }
 draw(r) { r.drawBall(this); }
}
class Brick {
 constructor(d) { Object.assign(this, d); }
 hit() { this.hp--; this.flash = 0.15; return this.hp <= 0; }
 update(dt) {
 if (this.flash > 0) this.flash -= dt;
 if (this.recoil > 0) this.recoil -= dt;
 if (this.fire > 0 && this.hp > 0) {
 this.charge += dt;
 if (this.charge >= this.fire) { this.charge = -0.5; this.recoil = 0.1; }
 }
 }
 draw(r) { r.drawBrick(this); }
}
class Laser {
 constructor(x,y) { this.x=x; this.y=y; this.w=3; this.h=14; this.vy=8; }
 update() { this.y += this.vy; }
 draw(r) { r.drawLaser(this); }
}
class Particle {
 constructor(x,y,color) {
 this.x=x; this.y=y; this.vx=(Math.random()-0.5)*8; this.vy=(Math.random()-0.5)*8;
 this.life=1; this.color=color; this.size=Math.random()*3+2;
 }
 update(dt) { this.x+=this.vx; this.y+=this.vy; this.vy+=0.2; this.life-=dt*1.5; }
 draw(r) { r.drawParticle(this); }
}
class Star {
 constructor() { this.x=Math.random()*CFG.w; this.y=Math.random()*CFG.h; this.s=Math.random()*2+0.5; this.v=Math.random()*0.5+0.1; }
 update() { this.y+=this.v; if (this.y>CFG.h) { this.y=0; this.x=Math.random()*CFG.w; }}
}
