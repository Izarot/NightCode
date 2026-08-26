/* ============================================
   Neon Bounce - Core Game Logic
   ============================================ */
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.running = false;
        this.startTime = 0;
        this.elapsed = 0;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.lastTime = 0;
        this.difficulty = 1;

        // Game objects
        this.player = null;
        this.obstacles = [];
        this.pickups = [];
        this.particles = [];
        this.stars = [];

        // Input
        this.keys = {};
        this.touch = { active: false, x: 0, y: 0 };

        this.resize();
        this.initStars();
        this.bindInput();
    }

    // ============= Persistence (LocalStorage) =============
    loadHighScore() {
        try {
            const stored = localStorage.getItem('neonBounceHighScore');
            const parsed = stored ? parseInt(stored, 10) : 0;
            return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore() {
        try {
            localStorage.setItem('neonBounceHighScore', String(this.highScore));
        } catch (e) {
            // Storage may be disabled - silently fail
        }
    }

    // ============= Responsive Sizing =============
    resize() {
        const container = this.canvas.parentElement;
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const targetRatio = 4 / 3;
        let w = cw, h = cw / targetRatio;
        if (h > ch) { h = ch; w = ch * targetRatio; }
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.style.width = `${w}px`;
        this.canvas.style.height = `${h}px`;
        this.canvas.width = Math.floor(w * dpr);
        this.canvas.height = Math.floor(h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = w;
        this.height = h;
    }

    initStars() {
        this.stars = [];
        const count = Math.floor((this.width * this.height) / 8000);
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 1.5 + 0.3,
                speed: Math.random() * 0.5 + 0.1,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    // ============= Input Handling =============
    bindInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.active = true;
            const rect = this.canvas.getBoundingClientRect();
            const t = e.touches[0];
            this.touch.x = t.clientX - rect.left;
            this.touch.y = t.clientY - rect.top;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const t = e.touches[0];
            this.touch.x = t.clientX - rect.left;
            this.touch.y = t.clientY - rect.top;
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.active = false;
        }, { passive: false });

        window.addEventListener('resize', () => {
            this.resize();
            this.initStars();
        });
    }

    // ============= Game State =============
    start() {
        this.running = true;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.elapsed = 0;
        this.score = 0;
        this.difficulty = 1;
        this.obstacles = [];
        this.pickups = [];
        this.particles = [];
        this.player = {
            x: this.width / 2,
            y: this.height - 60,
            vx: 0,
            vy: 0,
            r: 12,
            trail: []
        };
    }

    stop() {
        this.running = false;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
        }
    }

    // ============= Update Loop =============
    update(dt) {
        if (!this.running) return;
        this.elapsed = (performance.now() - this.startTime) / 1000;
        this.difficulty = 1 + this.elapsed / 15;

        this.updatePlayer(dt);
        this.updateObstacles(dt);
        this.updatePickups(dt);
        this.updateParticles(dt);
        this.checkCollisions();
        this.spawnLogic();
    }

    updatePlayer(dt) {
        const p = this.player;
        const accel = 600;
        const friction = 0.92;
        const maxSpeed = 320;

        let ax = 0, ay = 0;
        if (this.keys['arrowleft'] || this.keys['a']) ax -= 1;
        if (this.keys['arrowright'] || this.keys['d']) ax += 1;
        if (this.keys['arrowup'] || this.keys['w']) ay -= 1;
        if (this.keys['arrowdown'] || this.keys['s']) ay += 1;

        if (this.touch.active) {
            const dx = this.touch.x - p.x;
            const dy = this.touch.y - p.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist > 20) {
                ax = dx / dist;
                ay = dy / dist;
            }
        }

        if (ax !== 0 || ay !== 0) {
            const mag = Math.hypot(ax, ay) || 1;
            p.vx += (ax / mag) * accel * dt;
            p.vy += (ay / mag) * accel * dt;
        }

        p.vx *= friction;
        p.vy *= friction;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > maxSpeed) {
            p.vx = (p.vx / speed) * maxSpeed;
            p.vy = (p.vy / speed) * maxSpeed;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Bounds
        if (p.x < p.r) { p.x = p.r; p.vx = Math.abs(p.vx) * 0.5; AudioEngine.bounce(); }
        if (p.x > this.width - p.r) { p.x = this.width - p.r; p.vx = -Math.abs(p.vx) * 0.5; AudioEngine.bounce(); }
        if (p.y < p.r) { p.y = p.r; p.vy = Math.abs(p.vy) * 0.5; AudioEngine.bounce(); }
        if (p.y > this.height - p.r) { p.y = this.height - p.r; p.vy = -Math.abs(p.vy) * 0.5; AudioEngine.bounce(); }

        // Trail
        p.trail.push({ x: p.x, y: p.y, life: 0.4 });
        if (p.trail.length > 20) p.trail.shift();
        p.trail.forEach(t => t.life -= dt);
        p.trail = p.trail.filter(t => t.life > 0);
    }

    updateObstacles(dt) {
        const baseSpeed = 100 + this.difficulty * 30;
        this.obstacles.forEach(o => {
            o.y += baseSpeed * dt;
            o.angle += o.spin * dt;
        });
        this.obstacles = this.obstacles.filter(o => o.y < this.height + 50);
    }

    updatePickups(dt) {
        const baseSpeed = 100 + this.difficulty * 25;
        this.pickups.forEach(p => {
            p.y += baseSpeed * dt;
            p.bob += dt * 4;
        });
        this.pickups = this.pickups.filter(p => p.y < this.height + 50);
    }

    updateParticles(dt) {
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.98;
            p.vy *= 0.98;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    spawnLogic() {
        // Spawn obstacles at increasing rate
        const spawnRate = Math.max(0.3, 1.2 - this.difficulty * 0.1);
        if (Math.random() < spawnRate * 0.016) {
            this.spawnObstacle();
        }
        if (Math.random() < 0.008) {
            this.spawnPickup();
        }
    }

    spawnObstacle() {
        const size = 20 + Math.random() * 20;
        const types = ['square', 'triangle', 'diamond'];
        this.obstacles.push({
            x: Math.random() * (this.width - 60) + 30,
            y: -size,
            size: size,
            type: types[Math.floor(Math.random() * types.length)],
            angle: 0,
            spin: (Math.random() - 0.5) * 4,
            color: ['#ff2d95', '#b026ff', '#ff6b35'][Math.floor(Math.random() * 3)]
        });
    }

    spawnPickup() {
        this.pickups.push({
            x: Math.random() * (this.width - 40) + 20,
            y: -20,
            r: 8,
            bob: 0
        });
    }

    checkCollisions() {
        const p = this.player;

        // Obstacles
        for (const o of this.obstacles) {
            const dx = p.x - o.x;
            const dy = p.y - o.y;
            const dist = Math.hypot(dx, dy);
            if (dist < p.r + o.size * 0.7) {
                this.gameOver();
                return;
            }
        }

        // Pickups
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pk = this.pickups[i];
            const dist = Math.hypot(p.x - pk.x, p.y - pk.y);
            if (dist < p.r + pk.r + 4) {
                this.score += 10;
                this.spawnParticles(pk.x, pk.y, '#ffea00', 12);
                AudioEngine.pickup();
                this.pickups.splice(i, 1);
            }
        }
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 80 + Math.random() * 120;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.6,
                maxLife: 0.6,
                color,
                size: 2 + Math.random() * 2
            });
        }
    }

    gameOver() {
        this.spawnParticles(this.player.x, this.player.y, '#ff2d95', 30);
        AudioEngine.hit();
        setTimeout(() => AudioEngine.gameOver(), 100);
        this.stop();
        if (this.onGameOver) this.onGameOver();
    }

    // ============= Rendering =============
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // Stars background
        this.stars.forEach(s => {
            s.twinkle += 0.05;
            const alpha = 0.4 + Math.sin(s.twinkle) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Grid floor effect
        ctx.strokeStyle = 'rgba(176, 38, 255, 0.15)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        const offsetY = (this.elapsed * 30) % gridSize;
        for (let y = -gridSize + offsetY; y < this.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }
        for (let x = 0; x < this.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        // Trail
        if (this.player) {
            this.player.trail.forEach((t, i) => {
                const alpha = t.life / 0.4;
                ctx.fillStyle = `rgba(0, 240, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Pickups
        this.pickups.forEach(p => {
            const bobY = p.y + Math.sin(p.bob) * 3;
            ctx.shadowColor = '#ffea00';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ffea00';
            ctx.beginPath();
            ctx.arc(p.x, bobY, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a0118';
            ctx.beginPath();
            ctx.arc(p.x, bobY, p.r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Obstacles
        this.obstacles.forEach(o => {
            ctx.save();
            ctx.translate(o.x, o.y);
            ctx.rotate(o.angle);
            ctx.shadowColor = o.color;
            ctx.shadowBlur = 20;
            ctx.fillStyle = o.color;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            if (o.type === 'square') {
                ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
                ctx.strokeRect(-o.size / 2, -o.size / 2, o.size, o.size);
            } else if (o.type === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(0, -o.size / 2);
                ctx.lineTo(o.size / 2, o.size / 2);
                ctx.lineTo(-o.size / 2, o.size / 2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.moveTo(0, -o.size / 2);
                ctx.lineTo(o.size / 2, 0);
                ctx.lineTo(0, o.size / 2);
                ctx.lineTo(-o.size / 2, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        });

        // Particles
        this.particles.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Player
        if (this.player) {
            const p = this.player;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 25;
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a0118';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ============= Format Timer =============
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const cs = Math.floor((seconds * 100) % 100);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    }
}
