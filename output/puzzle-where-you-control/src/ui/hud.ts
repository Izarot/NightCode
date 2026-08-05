export class HUD {
  private ctx: CanvasRenderingContext2D;
  private syncMeterHeight = 0;
  constructor(ctx: CanvasRenderingContext2D) { this.ctx = ctx; }
  public update(prime: any, echo: any, distance: number) { 
    const maxDist = 1500;
    const fill = 1 - Math.min(distance, maxDist) / maxDist;
    const h = 100 * fill;
    this.syncMeterHeight = h;
    // draw prime bar
    this.ctx.fillStyle = '#00F3FF';
    this.ctx.fillRect(10, 10, 20, h);
    // draw echo bar
    this.ctx.fillStyle = '#FF2D7A';
    this.ctx.fillRect(30 + h, 10, 20, h);
    // draw dash cooldowns (simple circles)
    const dashX = 10; const dashY = 40;
    const dashRadius = 12;
    this.ctx.strokeStyle = '#00F3FF';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(dashX, dashY, dashRadius, 0, 2 * Math.PI, false);
    this.ctx.stroke();
    // repeat for echo
    this.ctx.beginPath();
    this.ctx.arc(dashX + 30, dashY, dashRadius, 0, 2 * Math.PI, false);
    this.ctx.stroke();
  }
}
