const particles: any[] = [];
export const MAX_PARTICLES = 400;
export function spawnParticles(x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    particles.push({ x, y, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200, life: 0.6, color, size: 2 });
  }
}
export function updateFX(dt: number) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
export function renderFX(ctx: CanvasRenderingContext2D) {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}