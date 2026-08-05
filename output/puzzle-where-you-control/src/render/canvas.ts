export class Renderer {
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) { 
    this.ctx = this.canvas.getContext('2d')!;
    this.setupHiDPI();
  }
  private setupHiDPI() { 
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }
  public drawImage(src: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) { 
    this.ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  public clear() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  public setTransform(x: number, y: number, scaleX: number, scaleY: number) { 
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scaleX, scaleY);
  }
  public restoreTransform() { this.ctx.restore(); }
}
