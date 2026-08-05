export class Camera {
  private camPos = { x: 0, y: 0 };
  private velocity = { x: 0, y: 0 };
  private deadzoneW = 200;
  private deadzoneH = 120;
  private splitThreshold = 900;
  private splitMode: 'horizontal' | 'vertical' | null = null;
  constructor(private target: { x: number; y: number }[]) {}
  public update(dt: number) { 
    const midX = (target[0].x + target[1].x) / 2;
    const midY = (target[0].y + target[1].y) / 2;
    const dx = midX - this.camPos.x;
    const dy = midY - this.camPos.y;
    this.velocity.x = dx * 0.12;
    this.velocity.y = dy * 0.12;
    this.camPos.x += this.velocity.x;
    this.camPos.y += this.velocity.y;
    const dist = Math.hypot(midX - this.camPos.x, midY - this.camPos.y);
    if (dist > this.splitThreshold) { 
      this.splitMode = midX > this.camPos.x ? 'horizontal' : 'vertical';
    } else {
      this.splitMode = null;
    }
  }
  public getViewPort() { 
    // returns a viewport rect for rendering
    return { x: this.camPos.x - 960, y: this.camPos.y - 540, width: 1920, height: 1080 };
  }
}
