import { BaseFighter } from './BaseFighter.js';

export class Flute extends BaseFighter {
  constructor(x, id) {
    super(x, id);
    this.hp = 850;
    this.maxHp = 850;
    this.color = '#3498DB';
  }

  handleInput(input) {
    const keys = this.id === 'P1'
      ? { left: 'KeyA', right: 'KeyD', jump: 'KeyW', attack: 'KeyJ', special: 'KeyK' }
      : { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', attack: 'KeyZ', special: 'KeyX' };
    if (input.isDown(keys.left)) this.vx = -this.physics.walkSpeed;
    if (input.isDown(keys.right)) this.vx = this.physics.walkSpeed;
    if (input.isPressed(keys.jump) && this.onGround) {
      this.vy = this.physics.jumpVel;
      this.onGround = false;
    }
    if (input.isPressed(keys.attack) && this.cooldown <= 0) {
      this.cooldown = 14;
      this.tempo += 2;
    }
    if (input.isPressed(keys.special) && this.tempo >= 50) {
      this.cooldown = 30;
      this.tempo -= 50;
    }
  }
}