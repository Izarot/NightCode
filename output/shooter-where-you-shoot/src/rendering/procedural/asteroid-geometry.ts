import { Vec2 } from '../../utils/math';

export function generateAsteroidVertices(radius: number, segments: number = 10): Vec2[] {
    const vertices: Vec2[] = [];
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const noise = 0.7 + Math.random() * 0.6;
        const r = radius * noise;
        vertices.push(new Vec2(Math.cos(angle) * r, Math.sin(angle) * r));
    }
    return vertices;
}

export function renderAsteroid(ctx: CanvasRenderingContext2D, vertices: Vec2[], rotation: number, pos: Vec2, color: string) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(rotation);
    
    // Fill
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    // Stroke
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.restore();
}