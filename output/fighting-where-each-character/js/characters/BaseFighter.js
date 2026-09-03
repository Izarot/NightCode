import { Physics } from '../engine/Physics.js';

export class BaseFighter {
  constructor(x, id) {
    this.id = id;
    this.x = x;
    this.y = 600;
    this.w = 40;
    this.h = 80;
    this.vx = 0;
    this.vy = 0;
    this.hp = 1000;
    this.maxHp = 1000;
    this.onGround = false;
    this.facing = id === 'P1' ? 1 : -1;
    this.state = 'IDLE';
    this.frame = 0;
    this.roundsWon = 0;
    this.tempo = 0;
    this.controller = null;
    this.physics = new Physics();
    this.cooldown = 0;
    this.color = '#3498DB';
  }

  update(input, dt, players) {
    if (this.cooldown > 0) this.cooldown -= dt * 60;
    if (this.controller) {
      this.controller.update(input, dt);
    } else {
      this.handleInput(input);
    }
    this.physics.applyGravity(this, dt);
    this.physics.applyFriction(this);
    this.frame += dt * 6;
    if (this.frame > 6) this.frame = 0;
  }

  handleInput(input) {
    // Override in subclass
  }

  takeDamage(dmg) {
    this.hp -= dmg;
    this.tempo = Math.max(0, this.tempo - 1);
  }

  render(ctx, camera) {
    ctx.save();
    ctx.translate(this.x - camera.x, this.y - this.h);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.w/2, 0, this.w, this.h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.w/2, 0, this.w, this.h);
    ctx.restore();
  }
}