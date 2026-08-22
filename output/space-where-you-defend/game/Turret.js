class Turret {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.cooldown = 0;
    this.fireRate = 0.1; // seconds
  }
  update(delta) {
    this.cooldown = Math.max(0, this.cooldown - delta);
  }
  tryFire(energy) {
    if (this.cooldown === 0 && energy >= 50) {
      energy.consumeEnergy(50);
      this.cooldown = this.fireRate;
      return true;
    }
    return false;
  }
}