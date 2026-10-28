class GravitySystem {
  constructor(){
    this.angle = 0;
  }
  getVector(){
    const r = this.angle * Math.PI / 180;
    return new Vector2D(-Math.sin(r) * GRAVITY, Math.cos(r) * GRAVITY);
  }
  rotate(dir){
    const delta = ROTATIONS[dir] || 0;
    this.angle = (this.angle + delta) % 360;
  }