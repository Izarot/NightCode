export class CpuController {
  constructor(entity, target, difficulty) {
    this.entity = entity;
    this.target = target;
    this.difficulty = difficulty;
    this.reactionTime = difficulty === 0 ? 20 : difficulty === 1 ? 12 : 6;
    this.frameCount = 0;
  }
  update(input, dt) {
    this.frameCount++;
    if (this.frameCount % Math.floor(this.reactionTime) !== 0) return;
    const dx = this.target.x - this.entity.x;
    const keys = this.entity.id === 'P1'
      ? { left: 'KeyA', right: 'KeyD', jump: 'KeyW', attack: 'KeyJ', special: 'KeyK' }
      : { left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp', attack: 'KeyZ', special: 'KeyX' };
    if (Math.abs(dx) > 100) {
      if (dx > 0) this.entity.vx = this.entity.physics.walkSpeed;
      else this.entity.vx = -this.entity.physics.walkSpeed;
    } else {
      this.entity.vx = 0;
      if (this.entity.cooldown <= 0) {
        this.entity.cooldown = 15;
        this.entity.tempo += 2;
      }
    }
    if (Math.abs(dx) < 50 && this.entity.onGround) {
      this.entity.vy = this.entity.physics.jumpVel;
      this.entity.onGround = false;
    }
  }
}