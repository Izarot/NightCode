class Projectile {
    constructor(canvasWidth, canvasHeight, level) {
        this.radius = 20;
        this.x = Math.random() * (canvasWidth - 2 * this.radius) + this.radius;
        this.y = -this.radius;
        this.text = this.generateRandomText();
        this.speed = (2 + Math.random() * 2) * (1 + level * 0.1);
        this.color = this.getRandomColor();
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    generateRandomText() {
        const length = Math.floor(Math.random() * 5) + 3;
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let text = '';
        for (let i = 0; i < length; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return text;
    }

    getRandomColor() {
        const colors = [
            '#00f3ff', '#ff00ff', '#ffff00', '#ff006e', '#00ff88',
            '#ff8800', '#8800ff', '#00ffcc', '#ff3366', '#33ff66'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Border
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.stroke();
        
        // Text
        ctx.font = 'bold 14px Courier New';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, 0, 0);
        
        ctx.restore();
    }

    isOffScreen(canvasHeight) {
        return this.y - this.radius > canvasHeight;
    }
}

// Export for module usage (not needed in browser but kept for clarity)
if (typeof module !== 'undefined') module.exports = Projectile;