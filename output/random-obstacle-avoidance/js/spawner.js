import { W, H, mulberry32 } from './utils.js';
export class Spawner {
  constructor(seed) {
    this.rng = mulberry32(seed);
    this.timer = 0;
    this.elapsed = 0;
  }
  reset(seed) { this.rng = mulberry32(seed); this.timer = 0; this.elapsed = 0; }
  interval() { return Math.max(0.15, 1.2 * Math.pow(0.985, this.elapsed)); }
  speed() { return Math.min(650, 200 + this.elapsed * 8); }
  update(dt) { this.elapsed += dt; this.timer += dt; }
  shouldSpawn() { if (this.timer >= this.interval()) { this.timer = 0; return true; } return false; }
  pickEdge() {
    const e = Math.floor(this.rng() * 4);
    let x, y;
if (e === 0) { x = -40; y = this.rng() * H; }
else if (e === 1) { x = W + 40; y = this.rng() * H; }
else if (e === 2) { x = this.rng() * W; y = -40; }
else { x = this.rng() * W; y = H + 40; }
return { x, y };
  }
  pickType() {
    const t = Math.min(1, this.elapsed / 60);
    const r = this.rng();
    if (t < 0.3) return r < 0.7 ? 'shard' : (r < 0.9 ? 'pulse' : 'tracker');
    if (t < 0.7) return r < 0.5 ? 'shard' : (r < 0.75 ? 'pulse' : (r < 0.9 ? 'tracker' : 'splitter'));
    return r < 0.4 ? 'shard' : (r < 0.65 ? 'pulse' : (r < 0.85 ? 'tracker' : 'splitter'));
  }
  buildBurst() {
    const p = this.pickEdge();
    const cx = W / 2 - p.x, cy = H / 2 - p.y;
    const l = Math.hypot(cx, cy);
    const baseVx = (cx / l) * this.speed();
    const baseVy = (cy / l) * this.speed();
    const type = this.pickType();
    if (type === 'splitter') {
      const count = 5;
      const spawned = [];
      for (let i = 0; i < count; i++) {
        const spread = (i - 2) * 0.18;
        const ca = Math.cos(spread), sa = Math.sin(spread);
        const vx = baseVx * ca - baseVy * sa;
        const vy = baseVx * sa + baseVy * ca;
        spawned.push({ x: p.x, y: p.y, vx, vy, type: 'shard' });
      }
      return spawned;
    }
    return [{ x: p.x, y: p.y, vx: baseVx, vy: baseVy, type }];
  }
}
