export class Projectile {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.width = 6;
        this.height = 12;
        this.active = false;
        this.isPlayer = true;
        this.color = '#FFBF00';
    }
    
    init(x, y, vx, vy, isPlayer) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
        this.isPlayer = isPlayer;
        this.color = isPlayer ? '#FFBF00' : '#FF4500';
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        if (this.x < -10 || this.x > 810 || this.y < -10 || this.y > 610) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}