export default class Projectile {
    constructor(cannon) {
        this.x = cannon.x;
        this.y = cannon.y;
        this.angle = cannon.angle;
        this.power = cannon.power / 10;
        this.vx = this.power * Math.cos(this.angle * Math.PI / 180);
        this.vy = -this.power * Math.sin(this.angle * Math.PI / 180);
        this.gravity = 0.2;
        this.trail = [];
        this.outOfBounds = false;
        this.hitTarget = false;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) this.trail.shift();
        if (this.y > 720 || this.x > 1280) this.outOfBounds = true;
    }

    draw(ctx) {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            ctx.fillStyle = `rgba(255, ${100 + i*15}, 0, ${i/10})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5 - i/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Projectile
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTrajectory(ctx) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([5,5]);
        ctx.beginPath();
        let x = this.x, y = this.y, vx = this.vx, vy = this.vy;
        for (let i = 0; i < 100; i++) {
            vy += this.gravity;
            x += vx;
            y += vy;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
}