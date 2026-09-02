export class Engine {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 1920;
        this.height = 1080;
        this.scale = 1;
        this.world = null;
        this.player = null;
        this.entities = [];
        this.particles = [];
        this.cpuCycles = 100;
        this.score = 0;
        this.callStack = ['main', 'renderLoop'];
        this.memoryUsage = 0;
        this.resize(canvas);
    }

    resize(canvas) {
        const windowRatio = window.innerWidth / window.innerHeight;
        const canvasRatio = this.width / this.height;
        
        if (windowRatio > canvasRatio) {
            this.scale = window.innerHeight / this.height;
        } else {
            this.scale = window.innerWidth / this.width;
        }
        
        canvas.style.transform = `scale(${this.scale})`;
    }

    start(world) {
        this.world = world;
        this.player = world.createPlayer();
        this.entities = world.entities;
    }

    update() {
        // CPU Cycles regeneration
        this.cpuCycles = Math.min(100, this.cpuCycles + 8 * 0.016);
        
        // Update entities
        this.entities.forEach(entity => {
            if (entity.update) entity.update(this);
        });
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.life -= 0.016;
            if (p.life <= 0) return false;
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.vy += 0.5 * 0.016; // Gravity
            return true;
        });
        
        // Physics simulation
        this.solvePhysics();
        
        // Check collisions
        this.checkCollisions();
        
        // Update memory usage
        this.updateMemory();
    }

    solvePhysics() {
        // Simple AABB collision resolution
        for (let i = 0; i < this.entities.length; i++) {
            const a = this.entities[i];
            if (!a.rigidbody) continue;
            
            for (let j = i + 1; j < this.entities.length; j++) {
                const b = this.entities[j];
                if (!b.rigidbody) continue;
                
                if (this.checkAABB(a, b)) {
                    this.resolveCollision(a, b);
                }
            }
        }
    }

    checkAABB(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    resolveCollision(a, b) {
        // Simple impulse resolution
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        
        if (overlapX < overlapY) {
            // Resolve on X axis
            if (a.x < b.x) {
                a.x -= overlapX / 2;
                b.x += overlapX / 2;
            } else {
                a.x += overlapX / 2;
                b.x -= overlapX / 2;
            }
        } else {
            // Resolve on Y axis
            if (a.y < b.y) {
                a.y -= overlapY / 2;
                b.y += overlapY / 2;
            } else {
                a.y += overlapY / 2;
                b.y -= overlapY / 2;
            }
        }
    }

    checkCollisions() {
        // Player vs entities
        this.entities.forEach(entity => {
            if (entity.type === 'syntaxError' && this.checkAABB(this.player, entity)) {
                this.gameOver();
            }
            
            if (entity.type === 'varBlock' && this.checkAABB(this.player, entity)) {
                // Push mechanic
                const dx = entity.x - this.player.x;
                entity.x += Math.sign(dx) * 0.1;
            }
        });
    }

    updateMemory() {
        // Simulate memory usage based on entities
        this.memoryUsage = Math.min(100, this.entities.length * 2);
        
        // Check stack overflow
        if (this.memoryUsage > 80) {
            this.callStack.push('StackOverflow');
            this.cpuCycles *= 0.5; // Slow down
        }
    }

    render(ctx) {
        // Clear screen with background
        ctx.fillStyle = '#0D1117';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw grid background
        this.drawGrid(ctx);
        
        // Draw entities
        this.entities.forEach(entity => {
            if (entity.render) entity.render(ctx);
        });
        
        // Draw player
        if (this.player && this.player.render) {
            this.player.render(ctx);
        }
        
        // Draw particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        
        // Apply CRT effect
        this.applyCRTEffect(ctx);
    }

    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(88, 166, 255, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x < this.width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < this.height; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
    }

    applyCRTEffect(ctx) {
        // Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let y = 0; y < this.height; y += 2) {
            ctx.fillRect(0, y, this.width, 1);
        }
        
        // Vignette
        const gradient = ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.height / 2,
            this.width / 2, this.height / 2, this.height * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    garbageCollect() {
        if (this.cpuCycles < 100) return;
        
        this.cpuCycles = 0;
        this.entities = this.entities.filter(e => e.type !== 'memoryLeak');
        this.particles.push({
            x: this.player.x,
            y: this.player.y,
            vx: 0,
            vy: -5,
            life: 1.0,
            size: 10,
            color: '#3FB950'
        });
        
        // Audio effect
        import('./audio.js').then(({ AudioSystem }) => {
            const audio = new AudioSystem();
            audio.playSound('garbageCollect');
        });
    }

    gameOver() {
        // Visual feedback
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: this.player.x + Math.random() * 32,
                y: this.player.y + Math.random() * 32,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                size: Math.random() * 4 + 2,
                color: '#F85149'
            });
        }
        
        // Reset after delay
        setTimeout(() => {
            this.score = 0;
            this.cpuCycles = 100;
            this.entities = [];
            this.callStack = ['main', 'renderLoop'];
            this.world.init();
        }, 2000);
    }

    reset() {
        this.score = 0;
        this.cpuCycles = 100;
        this.entities = [];
        this.particles = [];
        this.callStack = ['main', 'renderLoop'];
        this.world.init();
    }
}