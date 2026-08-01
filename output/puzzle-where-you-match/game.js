/**
 * Chromatic Shadows: A Puzzle Match Game
 * Core Engine
 */

const CONFIG = {
    colors: {
        bg: '#050510',
        red: '#ff4757',
        blue: '#5352ed',
        green: '#2ed573',
        yellow: '#eccc68',
        shadow: 'rgba(0, 0, 0, 0.8)'
    },
    levels: [
        {
            target: { x: 0.7, y: 0.7, color: '#ff4757', radius: 40 },
            objects: [
                { x: 0.3, y: 0.5, size: 40, color: '#ff4757', rotation: 0, type: 'quare' }
            ],
            moves: 5
        },
        {
            target: { x: 0.2, y: 0.8, color: '#5352ed', radius: 45 },
            objects: [
                { x: 0.5, y: 0.5, size: 30, color: '#5352ed', rotation: 0, type: 'circle' },
                { x: 0.5, y: 0.2, size: 50, color: '#5352ed', rotation: 45, type: 'triangle' }
            ],
            moves: 8
        },
        {
            target: { x: 0.5, y: 0.8, color: '#2ed573', radius: 50 },
            objects: [
                { x: 0.5, y: 0.4, size: 40, color: '#2ed573', rotation: 0, type: 'quare' },
                { x: 0.3, y: 0.3, size: 30, color: '#2ed573', rotation: 0, type: 'circle' }
            ],
            moves: 10
        }
    ]
};

class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playChime() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'ine';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }

    playError() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'awtooth';
        osc.frequency.setValueAtTime(110, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioEngine();
        this.levelIdx = 0;
        this.moves = 0;
        this.startTime = 0;
        this.timerInterval = null;
        this.elapsedTime = 0;
        this.selectedObject = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.init();
        this.setupListeners();
        this.loadHighScore();
        this.animate();
    }

    init() {
        this.resize();
        this.loadLevel(this.levelIdx);
    }

    resize() {
        const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.style.width = `${800 * scale}px`;
        this.canvas.style.height = `${600 * scale}px`;
    }

    loadLevel(idx) {
        const levelData = CONFIG.levels[idx];
        this.levelIdx = idx;
        this.moves = levelData.moves;
        this.elapsedTime = 0;
        this.objects = levelData.objects.map(obj => ({...obj }));
        this.target = {...levelData.target };
        this.startTime = Date.now();
        
        document.getElementById('level-title').innerText = `LEVEL ${idx + 1}`;
        document.getElementById('moves').innerText = `MOVES: ${this.moves}/${levelData.moves}`;
        document.getElementById('overlay').style.display = 'none';
        
        if(this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            const mins = Math.floor(this.elapsedTime / 60).toString().padStart(2, '0');
            const secs = (this.elapsedTime % 60).toString().padStart(2, '0');
            document.getElementById('timer').innerText = `${mins}:${secs}`;
        }, 1000);
    }

    setupListeners() {
        window.addEventListener('resize', () => this.resize());
        
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const clientX = e.touches? e.touches[0].clientX : e.clientX;
            const clientY = e.touches? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const startAction = (e) => {
            const pos = getPos(e);
            for (let obj of this.objects) {
                const dx = pos.x - obj.x * this.canvas.width;
                const dy = pos.y - obj.y * this.canvas.height;
                if (Math.sqrt(dx*dx + dy*dy) < obj.size) {
                    this.selectedObject = obj;
                    this.isDragging = true;
                    this.dragOffset = { x: pos.x - obj.x * this.canvas.width, y: pos.y - obj.y * this.canvas.height };
                    return;
                }
            }
        };

        const moveAction = (e) => {
            if (!this.isDragging ||!this.selectedObject) return;
            const pos = getPos(e);
            this.selectedObject.x = (pos.x - this.dragOffset.x) / this.canvas.width;
            this.selectedObject.y = (pos.y - this.dragOffset.y) / this.canvas.height;
            this.checkWinCondition();
        };
        
        const endAction = () => {
            if (this.isDragging) {
                this.moves--;
                document.getElementById('moves').innerText = `MOVES: ${this.moves}/${CONFIG.levels[this.levelIdx].moves}`;
                if (this.moves <= 0) this.gameOver(false);
            }
            this.isDragging = false;
            this.selectedObject = null;
        };

        this.canvas.addEventListener('mousedown', startAction);
        window.addEventListener('mousemove', moveAction);
        window.addEventListener('mouseup', endAction);

        this.canvas.addEventListener('touchstart', startAction);
        window.addEventListener('touchmove', moveAction);
        window.addEventListener('touchend', endAction);

        // Rotation (Double Click / Right Click)
        this.canvas.addEventListener('dblclick', (e) => {
            if (this.selectedObject) {
                this.selectedObject.rotation = (this.selectedObject.rotation + 45) % 360;
                this.checkWinCondition();
            }
        });

        document.getElementById('restart-btn').onclick = () => this.loadLevel(this.levelIdx);
        document.getElementById('next-btn').onclick = () => {
            if (this.levelIdx < CONFIG.levels.length - 1) {
                this.loadLevel(this.levelIdx + 1);
            } else {
                this.gameOver(true);
            }
        };
    }

    checkWinCondition() {
        let matched = false;
        const targetX = this.target.x * this.canvas.width;
        const targetY = this.target.y * this.canvas.height;

        for (let obj of this.objects) {
            const objX = obj.x * this.canvas.width;
            const objY = obj.y * this.canvas.height;
            const dist = Math.sqrt(Math.pow(objX - targetX, 2) + Math.pow(objY - targetY, 2));
            
            if (dist < obj.size + this.target.radius && obj.color === this.target.color) {
                matched = true;
                break;
            }
        }

        if (matched) {
            this.audio.playChime();
            this.gameOver(true);
        }
    }

    gameOver(win) {
        clearInterval(this.timerInterval);
        const overlay = document.getElementById('overlay');
        const title = document.getElementById('overlay-title');
        const nextBtn = document.getElementById('next-btn');
        
        overlay.style.display = 'flex';
        if (win) {
            title.innerText = "LEVEL COMPLETE!";
            title.style.color = CONFIG.colors.green;
            nextBtn.style.display = 'block';
            this.saveHighScore();
        } else {
            title.innerText = "GAME OVER";
            title.style.color = CONFIG.colors.red;
            nextBtn.style.display = 'none';
        }
    }

    saveHighScore() {
        const best = localStorage.getItem('chromatic_best');
        if (!best || this.elapsedTime < parseInt(best)) {
            localStorage.setItem('chromatic_best', this.elapsedTime);
            this.loadHighScore();
        }
    }

    loadHighScore() {
        const best = localStorage.getItem('chromatic_best');
        document.getElementById('best-time').innerText = best? this.formatTime(parseInt(best)) : '--';
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    draw() {
        this.ctx.fillStyle = CONFIG.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Target Zone
        const tx = this.target.x * this.canvas.width;
        const ty = this.target.y * this.canvas.height;
        this.ctx.beginPath();
        this.ctx.arc(tx, ty, this.target.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.target.color;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.fillStyle = this.target.color + '33';
        this.ctx.fill();
        
        // Glow effect for target
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.target.color;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Draw Shadows
        this.objects.forEach(obj => {
            const ox = obj.x * this.canvas.width;
            const oy = obj.y * this.canvas.height;
            
            this.ctx.save();
            this.ctx.translate(ox, oy);
            this.ctx.rotate(obj.rotation * Math.PI / 180);
            this.ctx.fillStyle = obj.color + '66';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = obj.color;
            
            this.ctx.beginPath();
            if (obj.type === 'quare') {
                this.ctx.rect(-obj.size/2, -obj.size/2, obj.size, obj.size);
            } else if (obj.type === 'circle') {
                this.ctx.arc(0, 0, obj.size/2, 0, Math.PI * 2);
            } else {
                this.ctx.moveTo(0, -obj.size/2);
                this.ctx.lineTo(obj.size/2, obj.size/2);
                this.ctx.lineTo(-obj.size/2, obj.size/2);
                this.ctx.closePath();
            }
            this.ctx.fill();
            this.ctx.restore();
        });

        // Draw Objects
        this.objects.forEach(obj => {
            const ox = obj.x * this.canvas.width;
            const oy = obj.y * this.canvas.height;
            
            this.ctx.save();
            this.ctx.translate(ox, oy);
            this.ctx.rotate(obj.rotation * Math.PI / 180);
            this.ctx.fillStyle = obj.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#fff';
            
            this.ctx.beginPath();
            if (obj.type === 'quare') {
                this.ctx.rect(-obj.size/2, -obj.size/2, obj.size, obj.size);
            } else if (obj.type === 'circle') {
                this.ctx.arc(0, 0, obj.size/2, 0, Math.PI * 2);
            } else {
                this.ctx.moveTo(0, -obj.size/2);
                this.ctx.lineTo(obj.size/2, obj.size/2);
                this.ctx.lineTo(-obj.size/2, obj.size/2);
                this.ctx.closePath();
            }
            this.ctx.fill();
            
            // Highlight if selected
            if (this.selectedObject === obj) {
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

window.onload = () => {
    new Game();
};