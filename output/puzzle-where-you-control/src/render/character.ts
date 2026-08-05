export class CharacterRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}
  public render(entity: any) { 
    const x = entity.posX;
    const y = entity.posY;
    const w = 32, h = 48;
    // simple rectangle as placeholder
    this.ctx.fillStyle = entity.palette || '#00F3FF';
    this.ctx.fillRect(x, y, w, h);
    // dash trail
    if (entity.dashing) { 
      this.ctx.save();
      this.ctx.globalAlpha = 0.4;
      this.ctx.filter = 'blur(2px)';
      this.ctx.globalCompositeOperation = 'lighter';
      this.ctx.fillRect(x, y, w, h);
      this.ctx.restore();
    }
    // death flash
    if (entity.dead) { 
      this.ctx.save();
      this.ctx.globalAlpha = 0.8;
      this.ctx.filter = 'brightness(2) grayscale(1)';
      this.ctx.fillRect(x, y, w, h);
      this.ctx.restore();
    }
  }
}
