export class Menus {
  private ctx: CanvasRenderingContext2D;
  constructor(ctx: CanvasRenderingContext2D) { this.ctx = ctx; }
  public showLevelSelect(levels: string[]) { 
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#E0E8F0';
    ctx.font = '48px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL SELECT', ctx.canvas.width / 2, ctx.canvas.height / 2 - 40);
    levels.forEach((lvl, i) => { 
      const y = ctx.canvas.height / 2 + i * 60;
      ctx.fillText(lvl, ctx.canvas.width / 2, y);
    });
  }
  public showWinScreen(stats: any) { 
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#00F3FF';
    ctx.font = '36px JetBrains Mono';
    ctx.fillText('YOU WIN!', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20);
    ctx.fillText(`Time: ${stats.time}`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 10);
    ctx.fillText(`Deaths: ${stats.deaths}`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 40);
  }
}
