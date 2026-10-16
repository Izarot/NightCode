export class Player {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.width = 30;
        this.height = 30;
        this.speed = 300;
        this.velocity = { x: 0, y: 0 };
        this.targetDirection = { x: 0, y: 0 };
        this.currentDirection = { x: 0, y: 0 };
        this.turnSpeed = 10;
        
        this.trail = [];
        this.maxTrailLength = 20;
        
        this.invulnerable = false;
        this.invulnerableTime = 0;
        
        this.colorScheme = null;
        
        this.canvasWidth = game.width;
        this.canvasHeight = game.height;
    }

    onResize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.x = width * 0.15;
        this.y = height / 2;
    }

    reset() {
        this.x = this.canvasWidth * 0.15;
        this.y = this.canvasHeight / 2;
        this.velocity = { x: 0, y: 0 };
        this.targetDirection = { x: 0, y: 0 };
        this.currentDirection = { x: 0, y: 0 };
        this.trail = [];
        this.invulnerable = false;
        this.invulnerableTime = 0;
    }

    fixedUpdate(dt) {
        // Get buffered input
        const buffered = this.game.input.getBufferedDirection();
        if (buffered) {
            this.targetDirection = buffered;
            this.lastDirection = buffered;
        }
        
        // Smooth direction change
        this.currentDirection.x += (this.targetDirection.x - this.currentDirection.x) * this.turnSpeed * dt;
        this.currentDirection.y += (this.targetDirection.y - this.currentDirection.y) * this.turnSpeed * dt;
        
        // Apply velocity
        this.velocity.x = this.currentDirection.x * this.speed;
        this.velocity.y = this.currentDirection.y * this.speed;
        
        // Update position
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        
        // Clamp to screen bounds with margin
        const margin = 20;
        this.x = Math.max(margin + this.width/2, Math.min(this.canvasWidth - margin - this.width/2, this.x));
        this.y = Math.max(margin + this.height/2, Math.min(this.canvasHeight - margin - this.height/2, this.y));
        
        // Add to trail
        this.trail.unshift({ x: this.x, y: this.y, time: Date.now() });
        if (this.trail.length > this.maxTrailLength) this.trail.pop();
        
        // Invulnerability decay
        if (this.invulnerable) {
            this.invulnerableTime -= dt;
            if (this.invulnerableTime <= 0) this.invulnerable = false;
        }
    }

    update(dt) {
        this.colorScheme = this.game.getColorScheme();
    }

    render(ctx) {
        const color = this.settings?.highContrast ? '#fff' : this.colorScheme.player;
        
        // Invulnerability flash
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Rotate to face movement direction
        if (this.currentDirection.x !== 0 || this.currentDirection.y !== 0) {
            const angle = Math.atan2(this.currentDirection.y, this.currentDirection.x);
            ctx.rotate(angle);
        }
        
        // Player body (triangle ship)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(-this.width/2, -this.height/2);
        ctx.lineTo(-this.width/4, 0);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // Outline
        ctx.strokeStyle = this.settings?.highContrast ? '#ff0' : this.colorScheme.accent;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Engine glow
        const gradient = ctx.createRadialGradient(-this.width/2, 0, 0, -this.width/2, 0, this.width);
        gradient.addColorStop(0, this.settings?.highContrast ? '#ff0' : this.colorScheme.accent);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(-this.width/2, 0, this.width * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    renderTrail(ctx) {
        if (this.trail.length < 2) return;
        
        const color = this.settings?.highContrast ? '#fff' : this.colorScheme.trail;
        
        for (let i = 1; i < this.trail.length; i++) {
            const alpha = 1 - i / this.trail.length;
            const size = (this.width * 0.5) * alpha;
            
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    getBounds() {
        return {
            x: this.x - this.width/2,
            y: this.y - this.height/2,
            width: this.width,
            height: this.height
        };
    }

    makeInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerableTime = duration;
    }

    get settings() {
        return this.game.settings;
    }
}