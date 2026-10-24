class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 300;
        this.acceleration = 150;
        this.deceleration = 200;
        this.minSpeed = 80;
        this.gravity = 90;
        this.terminalVelocity = 400;
        this.boostTime = 0;
        this.maxBoost = 3;
        this.health = 100;
        this.maxHealth = 100;
        this.invulnerable = 0;
        this.width = 64;
        this.height = 48;
        this.rotation = 0;
        this.bankAngle = 0;
    }

    update(dt, input) {
        // Get movement input
        const move = input.getMovementInput();
        
        // Horizontal movement
        if (move.vx !== 0) {
            this.vx += move.vx * this.acceleration * dt;
            this.vx = Utils.clamp(this.vx, -this.maxSpeed, this.maxSpeed);
            this.bankAngle = move.vx * 0.5; // Bank angle based on movement
        } else {
            // Deceleration
            if (this.vx > 0) {
                this.vx = Math.max(0, this.vx - this.deceleration * dt);
            } else if (this.vx < 0) {
                this.vx = Math.min(0, this.vx + this.deceleration * dt);
            }
            this.bankAngle *= 0.9; // Smooth bank return
        }
        
        // Vertical movement
        if (move.vy !== 0) {
            this.vy += move.vy * this.acceleration * dt;
            this.vy = Utils.clamp(this.vy, -this.maxSpeed, this.maxSpeed);
        } else {
            // Apply gravity
            this.vy += this.gravity * dt;
            this.vy = Utils.clamp(this.vy, -this.terminalVelocity, this.terminalVelocity);
        }
        
        // Boost ability
        if (input.isKeyPressed(' ') && this.boostTime < this.maxBoost) {
            this.vy -= 300 * dt;
            this.boostTime += dt;
            // Boost particles
            if (Math.random() < 0.5) {
                Game.particleSystem.createExplosion(
                    this.x - 30, this.y + 20, '#ffffff', 2
                );
            }
        } else {
            this.boostTime = Math.max(0, this.boostTime - dt * 0.5);
        }
        
        // Minimum speed
        const currentSpeed = Math.abs(this.vx);
        if (currentSpeed > 0 && currentSpeed < this.minSpeed) {
            this.vx = Math.sign(this.vx) * this.minSpeed;
        }
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Screen wrapping
        if (this.x < -50) this.x = Game.environment.canvas.width + 50;
        if (this.x > Game.environment.canvas.width + 50) this.x = -50;
        
        // Keep within vertical bounds
        this.y = Utils.clamp(this.y, 50, Game.environment.canvas.height - 150);
        
        // Rotation based on velocity
        this.rotation = Math.atan2(this.vy, this.vx);
        
        // Invulnerability timer
        if (this.invulnerable > 0) {
            this.invulnerable -= dt;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Blink when invulnerable
        if (this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // Bird body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird details
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(this.width/2 + 20, -10);
        ctx.lineTo(this.width/2 + 20, 10);
        ctx.closePath();
        ctx.fill();
        
        // Wings (flapping based on speed)
        const wingFlap = Math.sin(Game.time * 10) * (Math.abs(this.vx) / this.maxSpeed) * 10;
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.moveTo(-this.width/4, 0);
        ctx.quadraticCurveTo(-this.width/2, -this.height/4 + wingFlap, -this.width/4, -this.height/4);
        ctx.quadraticCurveTo(-this.width/2, 0, -this.width/4, this.height/4);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.width/4, 0);
        ctx.quadraticCurveTo(this.width/2, -this.height/4 - wingFlap, this.width/4, -this.height/4);
        ctx.quadraticCurveTo(this.width/2, 0, this.width/4, this.height/4);
        ctx.closePath();
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.width/4, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Health bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(this.x - 30, this.y - 40, 60, 5);
        ctx.fillStyle = '#44ff44';
        ctx.fillRect(this.x - 30, this.y - 40, 60 * (this.health / this.maxHealth), 5);
    }

    takeDamage(damage) {
        if (this.invulnerable > 0) return false;
        this.health -= damage;
        this.invulnerable = 1.0; // 1 second invulnerability
    }
}