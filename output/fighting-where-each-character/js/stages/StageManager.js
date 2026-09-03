export class StageManager {
  constructor() {
    this.stages = {
      ConcertHall: { name: 'The Concert Hall', color: '#2C3E50', width: 2000, hazard: null },
      JazzClub: { name: 'Jazz Club', color: '#8E44AD', width: 2000, hazard: 'spotlight' },
      MetalPit: { name: 'Heavy Metal Pit', color: '#C0392B', width: 2000, hazard: 'pyro' }
    };
  }
  get(name) {
    return this.stages[name] || this.stages.ConcertHall;
  }
  render(ctx, camera) {
    const stage = this.stages.ConcertHall;
    ctx.save();
    ctx.translate(-camera.x, 0);
    ctx.fillStyle = stage.color;
    ctx.fillRect(-500, 680, 3000, 40);
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(-500, 720, 3000, 100);
    ctx.restore();
  }
}