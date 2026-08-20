const CONFIG = {
    TILE_SIZE: 32,
    PLAYER_SPEED: 160,
    GHOST_SPEED: 130,
    COYOTE_TIME: 150,
    POWER_DURATION: 5000,
    COLORS: {
        PACMAN: '#FFEB3B',
        WALL: '#424242',
        PATH: '#1a1a2e',
        DOT: '#FFFFFF',
        PELLET: '#FFFFFF',
        PORTAL_A: '#303F9F',
        PORTAL_B: '#8E24AA',
        GHOSTS: ['#E53935', '#EC407A', '#00BCD4', '#FF9800'],
        VULNERABLE: '#3498db'
    }
};

const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,2,1,1,0,0,1,0,1,1,1,0,1,0,0,1,1,2,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,2,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,2,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];
// 0: Dot, 1: Wall, 2: PowerPellet, 3: Portal

class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    playTone(freq, type, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    chomp() { this.playTone(400, 'sine', 0.1); }
    power() { this.playTone(600, 'square', 0.3); }
    death() { this.playTone(150, 'sawtooth', 0.5); }
    portal() { this.playTone(800, 'sine', 0.2); }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioEngine();
        
        this.score = 0;
        this.highScore = localStorage.getItem('portalPacHighScore') || 0;
        this.lives = 3;
        this.startTime = Date.now();
        this.isGameOver = false;
        
        this.player = { x: 9*32+16, y: 13*32+16, vx: 0, vy: 0, dir: {x:0, y:0}, nextDir: {x:0, y:0}, radius: 12 };
        this.ghosts = [
            { x: 9*32+16, y: 9*32+16, color: CONFIG.COLORS.GHOSTS[0], dir: {x:1, y:0}, state: 'chase' },
            { x: 9*32+16, y: 9*32+16, color: CONFIG.COLORS.GHOSTS[1], dir: {x:-1, y:0}, state: 'chase' },
            { x: 9*32+16, y: 9*32+16, color: CONFIG.COLORS.GHOSTS[2], dir: {x:0, y:1}, state: 'chase' },
            { x: 9*32+16, y: 9*32+16, color: CONFIG.COLORS.GHOSTS[3], dir: {x:0, y:-1}, state: 'chase' }
        ];
        
        this.dots = [];
        this.pellets = [];
        this.portals = [];
        this.powerTimer = 0;
        
        this.initMaze();
        this.setupInput();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.loop();
    }

    initMaze() {
        for(let y=0; y<MAZE.length; y++) {
            for(let x=0; x<MAZE[y].length; x++) {
                const type = MAZE[y][x];
                if(type === 0) this.dots.push({x: x*32+16, y: y*32+16, eaten: false});
                if(type === 2) this.pellets.push({x: x*32+16, y: y*32+16, eaten: false});
                if(type === 3) this.portals.push({x: x*32+16, y: y*32+16});
            }
        }
    }

    resize() {
        const scale = Math.min(window.innerWidth / (19*32), window.innerHeight / (17*32));
        this.canvas.width = 19 * 32;
        this.canvas.height = 17 * 32;
        this.canvas.style.width = (this.canvas.width * scale) + 'px';
        this.canvas.style.height = (this.canvas.height * scale) + 'px';
    }

    setupInput() {
        window.addEventListener('keydown', e => {
            if(e.key === 'ArrowLeft') this.player.nextDir = {x: -1, y: 0};
            if(e.key === 'ArrowRight') this.player.nextDir = {x: 1, y: 0};
            if(e.key === 'ArrowUp') this.player.nextDir = {x: 0, y: -1};
            if(e.key === 'ArrowDown') this.player.nextDir = {x: 0, y: 1};
        });
    }

    canMove(x, y) {
        const gridX = Math.floor(x / 32);
        const gridY = Math.floor(y / 32);
        if(gridY < 0 || gridY >= MAZE.length || gridX < 0 || gridX >= MAZE[0].length) return false;
        return MAZE[gridY][gridX] !== 1;
    }

    update(dt) {
        if(this.isGameOver) return;

        // Player Movement
        if(this.player.nextDir.x !== 0 || this.player.nextDir.y !== 0) {
            const nextX = this.player.x + this.player.nextDir.x * CONFIG.PLAYER_SPEED * dt;
            const nextY = this.player.y + this.player.nextDir.y * CONFIG.PLAYER_SPEED * dt;
            if(this.canMove(nextX, nextY)) {
                this.player.dir = {...this.player.nextDir};
            }
        }

        const vx = this.player.dir.x * CONFIG.PLAYER_SPEED;
        const vy = this.player.dir.y * CONFIG.PLAYER_SPEED;
        
        if(this.canMove(this.player.x + vx * dt, this.player.y + vy * dt)) {
            this.player.x += vx * dt;
            this.player.y += vy * dt;
        } else {
            this.player.vx = 0; this.player.vy = 0;
        }

        // Portal Teleport
        this.portals.forEach(p => {
            const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
            if(dist < 16) {
                const other = this.portals.find(op => op !== p);
                if(other) {
                    this.player.x = other.x;
                    this.player.y = other.y;
                    this.audio.portal();
                }
            }
        });

        // Collectibles
        this.dots.forEach(d => {
            if(!d.eaten && Math.hypot(this.player.x - d.x, this.player.y - d.y) < 12) {
                d.eaten = true;
                this.score += 10;
                this.audio.chomp();
            }
        });
        this.pellets.forEach(p => {
            if(!p.eaten && Math.hypot(this.player.x - p.x, this.player.y - p.y) < 12) {
                p.eaten = true;
                this.score += 50;
                this.powerTimer = CONFIG.POWER_DURATION;
                this.audio.power();
            }
        });

        if(this.powerTimer > 0) this.powerTimer -= dt * 1000;

        // Ghosts
        this.ghosts.forEach(g => {
            const gx = g.dir.x * CONFIG.GHOST_SPEED * dt;
            const gy = g.dir.y * CONFIG.GHOST_SPEED * dt;
            
            if(!this.canMove(g.x + gx, g.y + gy)) {
                const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
                g.dir = dirs[Math.floor(Math.random()*4)];
            } else {
                g.x += gx;
                g.y += gy;
            }

            // Ghost Portal
            this.portals.forEach(p => {
                if(Math.hypot(g.x - p.x, g.y - p.y) < 16) {
                    const other = this.portals.find(op => op !== p);
                    if(other) { g.x = other.x; g.y = other.y; }
                }
            });

            // Collision
            if(Math.hypot(this.player.x - g.x, this.player.y - g.y) < 20) {
                if(this.powerTimer > 0) {
                    g.x = 9*32+16; g.y = 9*32+16;
                    this.score += 200;
                } else {
                    this.lives--;
                    this.audio.death();
                    this.player.x = 9*32+16; this.player.y = 13*32+16;
                    if(this.lives <= 0) this.gameOver();
                }
            }
        });

        this.updateUI();
    }

    updateUI() {
        document.getElementById('score-display').innerText = `SCORE: ${this.score} | HIGH: ${this.highScore}`;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timer-display').innerText = `TIME: ${m}:${s}`;
        document.getElementById('lives-display').innerText = '❤️'.repeat(this.lives);
    }

    gameOver() {
        this.isGameOver = true;
        if(this.score > this.highScore) localStorage.setItem('portalPacHighScore', this.score);
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('final-score').innerText = `Score: ${this.score}`;
    }

    draw() {
        this.ctx.fillStyle = CONFIG.COLORS.PATH;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for(let y=0; y<MAZE.length; y++) {
            for(let x=0; x<MAZE[y].length; x++) {
                if(MAZE[y][x] === 1) {
                    this.ctx.fillStyle = CONFIG.COLORS.WALL;
                    this.ctx.fillRect(x*32, y*32, 32, 32);
                }
            }
        }

        this.dots.forEach(d => {
            if(!d.eaten) {
                this.ctx.fillStyle = CONFIG.COLORS.DOT;
                this.ctx.beginPath();
                this.ctx.arc(d.x, d.y, 3, 0, Math.PI*2);
                this.ctx.fill();
            }
        });

        this.pellets.forEach(p => {
            if(!p.eaten) {
                this.ctx.fillStyle = CONFIG.COLORS.PELLET;
                const pulse = 6 + Math.sin(Date.now()/100)*2;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, pulse, 0, Math.PI*2);
                this.ctx.fill();
            }
        });

        this.portals.forEach((p, i) => {
            this.ctx.fillStyle = i === 0 ? CONFIG.COLORS.PORTAL_A : CONFIG.COLORS.PORTAL_B;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 12, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Pacman
        this.ctx.fillStyle = CONFIG.COLORS.PACMAN;
        this.ctx.beginPath();
        const angle = Math.atan2(this.player.dir.y, this.player.dir.x);
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.arc(this.player.x, this.player.y, this.player.radius, angle + 0.2, angle + Math.PI*2 - 0.2);
        this.ctx.fill();

        // Ghosts
        this.ghosts.forEach(g => {
            this.ctx.fillStyle = this.powerTimer > 0 ? CONFIG.COLORS.VULNERABLE : g.color;
            this.ctx.beginPath();
            this.ctx.arc(g.x, g.y, 12, Math.PI, 0);
            this.ctx.lineTo(g.x+12, g.y+12);
            this.ctx.lineTo(g.x-12, g.y+12);
            this.ctx.fill();
        });
    }

    loop() {
        const now = performance.now();
        const dt = Math.min((now - (this.lastTime || now)) / 1000, 0.05);
        this.lastTime = now;

        this.update(dt);
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

new Game();