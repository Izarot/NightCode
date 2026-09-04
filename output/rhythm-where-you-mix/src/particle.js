// Particle system for visual effects
(function() {
    window.Particle = Particle;
    
    function Particle(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color || '#ffffff';
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 4;
    }

    Particle.prototype.update = function() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // gravity
        this.life -= this.decay;
        this.vx *= 0.98; // friction
        this.vy *= 0.98;
    };

    Particle.prototype.draw = function(ctx) {
        if (this.life <= 0) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    };
})();
