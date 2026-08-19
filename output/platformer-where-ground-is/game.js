import { Input } from './input.js';
import { GroundSystem } from './ground.js';
import { UI } from './ui.js';
import { GRAVITY, TERMINAL_VELOCITY, JUMP_FORCE, MAX_SPEED, ACCELERATION, AIR_CONTROL, GROUND_FRICTION, COYOTE_TIME, JUMP_BUFFER, WALL_SLIDE_SPEED, WALL_JUMP_FORCE, DOUBLE_JUMP_FORCE } from './physics.js';

export class Game {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.input = new Input();
    this.ground = new GroundSystem(this.ctx, canvas.width, canvas.height);
    this.ui = new UI(document.getElementById('hud'), audio);
    this.audio = audio;
    this.player = {x:50, y:50, vx:0, vy:0, onGround:false, coyote:0, jumpBuffer:0, doubleJump:true};
    this.stepCount = 0;
    this.score = 0;
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  update() {
    const p = this.player;
    let move = 0;
    if (this.input.isPressed('ArrowLeft') || this.input.isPressed('KeyA')) move = -1;
    if (this.input.isPressed('ArrowRight') || this.input.isPressed('KeyD')) move = 1;
    const accel = move ? ACCELERATION : 0;
    p.vx += accel * move;
    if (p.vx > MAX_SPEED) p.vx = MAX_SPEED;
    if (p.vx < -MAX_SPEED) p.vx = -MAX_SPEED;
    if (!p.onGround) p.vx *= AIR_CONTROL;
    p.vy += GRAVITY;
    if (p.vy > TERMINAL_VELOCITY) p.vy = TERMINAL_VELOCITY;
    if (this.input.isPressed('Space')) p.jumpBuffer = JUMP_BUFFER;
    if (p.jumpBuffer > 0) {
      if (p.onGround || p.coyote > 0) {
        p.vy = JUMP_FORCE;
        p.onGround = false;
        p.coyote = 0;
        p.jumpBuffer = 0;
        this.audio.playFootstep();
      } else if (p.doubleJump) {
        p.vy = DOUBLE_JUMP_FORCE;
        p.doubleJump = false;
        p.jumpBuffer = 0;
        this.audio.playFootstep();
      }
    }
    const groundY = this.canvas.height - 50;
    if (p.y + p.vy + 32 >= groundY) {
      p.y = groundY - 32;
      p.vy = 0;
      if (!p.onGround) {
        p.onGround = true;
        p.doubleJump = true;
        this.stepCount++;
        this.ground.addStep(p.x, groundY, 'hsl(0,80%,90%)');
        this.audio.playFootstep();
      }
    } else {
      p.onGround = false;
      p.coyote = COYOTE_TIME;
    }
    if (p.coyote > 0) p.coyote--;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = 0;
    if (p.x > this.canvas.width - 32) p.x = this.canvas.width - 32;
    this.score = this.stepCount * 10;
  }
  render() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.ground.render();
    this.ctx.fillStyle = 'hsl(120,80%,90%)';
    this.ctx.fillRect(this.player.x, this.player.y, 32, 32);
  }
  loop() {
    this.update();
    this.render();
    this.ui.update(this.stepCount, this.score);
    requestAnimationFrame(() => this.loop());
  }
  start() {
    this.loop();
  }
}