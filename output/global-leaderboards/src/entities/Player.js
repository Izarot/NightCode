import { palette } from '../assets/palette.js';
export class Player {
  constructor(x, y, input, audio) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.width = 32; this.height = 48;
    this.input = input;
    this.audio = audio;
    this.lives = 3;
    this.invincible = false;
    this.invincTimer = 0;
    this.onGround = false;
    this.wallSlide = false;
    this.doubleJumpReady = false;
    this.constants = {
      GRAVITY: 0.6,
      WALK_SPEED: 2.0,
      RUN_SPEED: 4.5,
      JUMP_POWER: -12.0,
      JUMP_BOOST: -6.0,
      FRICTION: 0.92,
      AIR_RESISTANCE: 0.98,
      SLIDE_SPEED: 2.0
    };
  }
  cloneState() {
    return {
      x: this.x, y: this.y,
      vx: this.vx, vy: this.vy,
      lives: this.lives,
      onGround: this.onGround,
      wallSlide: this.wallSlide,
      doubleJumpReady: this.doubleJumpReady
    };
  }
  restoreState(state) {
    this.x = state.x; this.y = state.y;
    this.vx = state.vx; this.vy = state.vy;
    this.lives = state.lives;
    this.onGround = state.onGround;
    this.wallSlide = state.wallSlide;
    this.doubleJumpReady = state.doubleJumpReady;
  }
  update(dt, platforms, orbs, hazards) {
    const c = this.constants;
    // input
    const left = this.input.isPressedKey('ArrowLeft') || this.input.isPressedKey('KeyA');
    const right = this.input.isPressedKey('ArrowRight') || this.input.isPressedKey('KeyD');
    const run = this.input.isPressedKey('ShiftLeft') || this.input.isPressedKey('ShiftRight');
    const jump = this.input.isJustPressed('ArrowUp') || this.input.isJustPressed('KeyW') || this.input.isJustPressed('Space');
    // horizontal
    const accel = run ? c.RUN_SPEED : c.WALK_SPEED;
    let targetVx = 0;
    if (left) targetVx = -accel;
    if (right) targetVx = accel;
    if (this.onGround) {
      this.vx += (targetVx - this.vx) * 0.2;
      this.vx *= c.FRICTION;
    } else {
      this.vx += (targetVx - this.vx) * 0.05;
      this.vx *= c.AIR_RESISTANCE;
    }
    // vertical
    this.vy += c.GRAVITY * dt;
    if (jump) {
      if (this.onGround) {
        this.vy = c.JUMP_POWER;
        this.doubleJumpReady = true;
        this.audio.playJump ? this.audio.playJump() : null;
      } else if (this.doubleJumpReady) {
        this.vy += c.JUMP_BOOST; // add boost
        this.doubleJumpReady = false;
        this.audio.playDoubleJump ? this.audio.playDoubleJump() : null;
      } else if (this.wallSlide) {
        this.vx = (this.vx > 0) ? -c.WALK_SPEED : c.WALK_SPEED;
        this.vy = c.JUMP_POWER;
        this.wallSlide = false;
        this.audio.playJump ? this.audio.playJump() : null;
      }
    }
    // apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // reset collision flags
    this.onGround = false;
    this.wallSlide = false;
    // platform collision
    for (const p of platforms) {
      if (this.collidesWith(p)) {
        // simple AABB resolve: push out
        if (this.vy > 0 && this.y + this.height/2 < p.y + p.height/2) {
          this.y = p.y - this.height;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0 && this.y - this.height/2 > p.y + p.height/2) {
          this.y = p.y + p.height;
          this.vy = 0;
        } else if (this.vx > 0 && this.x + this.width/2 < p.x + p.width/2) {
          this.x = p.x - this.width;
          this.wallSlide = true;
          this.vy = Math.min(this.vy, c.SLIDE_SPEED);
        } else if (this.vx < 0 && this.x - this.width/2 > p.x + p.width/2) {
          this.x = p.x + p.width;
          this.wallSlide = true;
          this.vy = Math.min(this.vy, c.SLIDE_SPEED);
        }
      }
    }
    // screen bounds
    if (this.x < 0) this.x = 0;
    if (this.x > 1920 - this.width) this.x = 1920 - this.width;
    if (this.y > 1080) {
      this.y = 1080;
      this.vy = 0;
      this.onGround = true;
      this.lives--;
    }
    // invincibility timer
    if (this.invincible) {
      this.invincTimer -= dt;
      if (this.invincTimer <= 0) this.invincible = false;
    }
  }
  collidesWith(rect) {
    return this.x < rect.x + rect.width &&
           this.x + this.width > rect.x &&
           this.y < rect.y + rect.height &&
           this.y + this.height > rect.y;
  }
  takeDamage() {
    if (!this.invincible) {
      this.lives--;
      this.invincible = true;
      this.invincTimer = 2000; // 2s
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width/2, this.y + this.height/2);
    // flashing if invincible
    if (this.invincible && Math.floor(this.invincTimer/100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    // body
    ctx.fillStyle = '#0ff';
    ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    // eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(-this.width/4, -this.height/3, 5, 5);
    ctx.fillRect(this.width/4-5, -this.height/3, 5, 5);
    // rewind aura
    if (this.rewindActive) {
      ctx.strokeStyle = 'rgba(0,255,255,0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0,0,this.width/2+10,0,Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
