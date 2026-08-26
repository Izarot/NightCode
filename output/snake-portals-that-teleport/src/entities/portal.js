export class PortalSystem {
  constructor() {
    this.portals = [];
    this.entryTimer = 0;
  }

  init() {
    this.portals = [
      { id: 'A', x: 50, y: 200, color: COLORS.PORTAL_A },
      { id: 'B', x: 350, y: 200, color: COLORS.PORTAL_B }
    ];
  }

  draw(ctx) {
    for (const portal of this.portals) {
      ctx.save();
      ctx.translate(portal.x, portal.y);
      const radius = 30 + Math.sin(this.entryTimer * 0.001) * 5;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = portal.color;
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(portal.id, portal.x, portal.y + 5);
    }
  }
}