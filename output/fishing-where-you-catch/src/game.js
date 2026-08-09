export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.stateManager = null;
        this.isRunning = false;
        this.lastTime = 0;
        
        // Game objects
        this.vessel = null;
        this.fishingLine = null;
        this.entities = [];
        this.hook = null;
        this.bobber = null;
        
        // Game state
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('cosmicCatchHighScore')) || 0;
        this.gameTime = 0;
        this.isCasting = false;
        this.isReeling = false;
        this.castPower = 0;
        this.castAngle = 0;
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.touchStart = null;
        
        // Upgrades (persisted)
        this.upgrades = {
            lineStrength: parseInt(localStorage.getItem('upgradeLineStrength')) || 0,
            reelSpeed: parseInt(localStorage.getItem('upgradeReelSpeed')) || 0,
            hookSize: parseInt(localStorage.getItem('upgradeHookSize')) || 0
        };
        
        // Audio context
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.init();
    }
    
    init() {
        this.createVessel();
        this.createFishingLine();
        this.createHookAndBobber();
        this.setupInput();
        this.loadUpgradePanel();
    }
    
    createVessel() {
        this.vessel = {
            x: 50,
            y: this.canvas.height / 2,
            width: 40,
            height: 20,
            speed: 100,
            color: '#00ffff'
        };
    }
    
    createFishingLine() {
        this.fishingLine = {
            points: [],
            maxLength: 300 + (this.upgrades.lineStrength * 50),
            currentLength: 0,
            maxTension: 10 + (this.upgrades.lineStrength * 2),
            breakThreshold: 0,
            segments: 20
        };
        this.fishingLine.breakThreshold = this.fishingLine.maxTension * 1.2;
        // Initialize points along vessel position
        for (let i = 0; i <= this.fishingLine.segments; i++) {
            this.fishingLine.points.push({
                x: this.vessel.x,
                y: this.vessel.y,
                oldX: this.vessel.x,
                oldY: this.vessel.y
            });
        }
    }
    
    createHookAndBobber() {
        this.hook = { x: 0, y: 0, radius: 8 + (this.upgrades.hookSize * 2), color: '#ff00ff' };
        this.bobber = { x: 0, y: 0, radius: 5, color: '#00ff00', velocity: { x: 0, y: 0 }, gravity: 0.2, drag: 0.98 };
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
        window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.startCast();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            if (this.mouse.down && this.isCasting) {
                this.updateCast(e.clientX, e.clientY);
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            if (this.isCasting) {
                this.releaseCast();
            } else if (this.isReeling) {
                this.stopReel();
            }
        });
        
        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouse.down = true;
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
            this.touchStart = { x: touch.clientX, y: touch.clientY };
            this.startCast();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                this.mouse.x = touch.clientX;
                this.mouse.y = touch.clientY;
                if (this.touchStart && this.isCasting) {
                    this.updateCast(touch.clientX, touch.clientY);
                }
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouse.down = false;
            this.touchStart = null;
            if (this.isCasting) {
                this.releaseCast();
            } else if (this.isReeling) {
                this.stopReel();
            }
        }, { passive: false });
        
        // Quick cast with spacebar
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isCasting && !this.isReeling) {
                this.quickCast();
            }
        });
    }
    
    startCast() {
        if (!this.isCasting && !this.isReeling && this.fishingLine.currentLength === 0) {
            this.isCasting = true;
            this.castStartX = this.mouse.x;
            this.castStartY = this.mouse.y;
            this.playSound('cast');
        }
    }
    
    updateCast(clientX, clientY) {
        const dx = clientX - this.castStartX;
        const dy = clientY - this.castStartY;
        this.castAngle = Math.atan2(dy, dx);
        this.castPower = Math.min(Math.sqrt(dx*dx + dy*dy) / 2, 100); // Cap power
    }
    
    releaseCast() {
        if (this.isCasting) {
            this.isCasting = false;
            this.isReeling = false;
            // Launch hook with velocity based on angle and power
            const speed = this.castPower * 2;
            this.hook.vx = Math.cos(this.castAngle) * speed;
            this.hook.vy = Math.sin(this.castAngle) * speed;
            this.playSound('whoosh');
            // Start extending line
            this.extendingLine = true;
        }
    }
    
    stopReel() {
        this.isReeling = false;
        // Check if entity is caught
        if (this.hookedEntity) {
            if (this.tugMeter < 1.0) {
                // Successful catch
                this.catchEntity();
            } else {
                // Entity escaped
                this.escapeEntity();
            }
        }
        this.hookedEntity = null;
        this.tugMeter = 0;
    }
    
    quickCast() {
        this.castAngle = -Math.PI / 2; // Straight up
        this.castPower = 50;
        this.releaseCast();
    }
    
    catchEntity() {
        this.score += this.hookedEntity.value;
        this.playSound('catch');
        // Add to inventory
        this.addToInventory(this.hookedEntity.type);
        // Reset hook position
        this.resetHook();
        this.hookedEntity = null;
    }
    
    escapeEntity() {
        this.playSound('escape');
        this.resetHook();
        this.hookedEntity = null;
    }
    
    resetHook() {
        // Reset hook to bobber position
        this.hook.x = this.bobber.x;
        this.hook.y = this.bobber.y;
        this.hook.vx = 0;
        this.hook.vy = 0;
    }
    
    addToInventory(type) {
        const inventory = document.getElementById('inventory');
        const item = document.createElement('div');
        item.className = 'inventoryItem';
        item.title = type;
        // Simple emoji based on type
        const emojis = {
            'Nebula Nymph': '🌌',
            'Pulsar Piranha': '💥',
            'Black Hole Bait': '⚫',
            'Supernova Sprite': '✨'
        };
        item.textContent = emojis[type] || '?';
        inventory.appendChild(item);
    }
    
    update(dt) {
        this.gameTime += dt;
        
        // Update vessel position based on keys
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.vessel.x -= this.vessel.speed * dt / 1000;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.vessel.x += this.vessel.speed * dt / 1000;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            this.vessel.y -= this.vessel.speed * dt / 1000;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            this.vessel.y += this.vessel.speed * dt / 1000;
        }
        
        // Clamp vessel to canvas
        this.vessel.x = Math.max(this.vessel.width/2, Math.min(this.canvas.width - this.vessel.width/2, this.vessel.x));
        this.vessel.y = Math.max(this.vessel.height/2, Math.min(this.canvas.height - this.vessel.height/2, this.vessel.y));
        
        // Update fishing line points (first point follows vessel)
        this.fishingLine.points[0].x = this.vessel.x;
        this.fishingLine.points[0].y = this.vessel.y;
        
        // Extend or retract line
        if (this.extendingLine) {
            // Extend towards hook position
            const targetLength = Math.min(
                this.distance(this.vessel.x, this.vessel.y, this.hook.x, this.hook.y),
                this.fishingLine.maxLength
            );
            this.fishingLine.currentLength = targetLength;
            if (this.fishingLine.currentLength >= this.fishingLine.maxLength) {
                this.extendingLine = false;
                this.isReeling = true;
                this.playSound('reelStart');
            }
        } else if (this.isReeling) {
            // Retract line
            const reelSpeed = 150 + (this.upgrades.reelSpeed * 50);
            this.fishingLine.currentLength = Math.max(0, this.fishingLine.currentLength - reelSpeed * dt / 1000);
            if (this.fishingLine.currentLength <= 0) {
                this.isReeling = false;
                this.resetHook();
                this.playSound('reelStop');
            }
        }
        
        // Update hook position based on line
        this.updateHookPosition();
        
        // Update bobber physics
        this.updateBobber(dt);
        
        // Update entities
        this.updateEntities(dt);
        
        // Check for hook collision with entities
        this.checkHookCollisions();
        
        // Update tug meter if entity is hooked
        if (this.hookedEntity) {
            this.updateTugMeter(dt);
        }
        
        // Spawn entities
        this.spawnTimer += dt;
        if (this.spawnTimer > 2000 + Math.random() * 3000) { // 2-5 seconds
            this.spawnEntity();
            this.spawnTimer = 0;
        }
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    }
    
    updateHookPosition() {
        // Position hook at end of line based on current length
        if (this.fishingLine.currentLength > 0) {
            const ratio = this.fishingLine.currentLength / this.fishingLine.maxLength;
            const lastPoint = this.fishingLine.points[this.fishingLine.points.length - 1];
            // Simple approximation: hook is at end of line
            this.hook.x = lastPoint.x;
            this.hook.y = lastPoint.y;
        }
    }
    
    updateBobber(dt) {
        // Apply gravity
        this.bobber.velocity.y += this.bobber.gravity;
        // Apply drag
        this.bobber.velocity.x *= this.bobber.drag;
        this.bobber.velocity.y *= this.bobber.drag;
        
        // Update position
        this.bobber.x += this.bobber.velocity.x * dt / 1000;
        this.bobber.y += this.bobber.velocity.y * dt / 1000;
        
        // Keep bobber near hook if line is taut
        const dx = this.hook.x - this.bobber.x;
        const dy = this.hook.y - this.bobber.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const maxDist = 20; // Max bobber offset
        if (dist > maxDist) {
            const ratio = maxDist / dist;
            this.bobber.x = this.hook.x - dx * ratio;
            this.bobber.y = this.hook.y - dy * ratio;
        }
    }
    
    updateEntities(dt) {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.x += entity.vx * dt / 1000;
            entity.y += entity.vy * dt / 1000;
            
            // Remove if off screen
            if (entity.x < -50 || entity.x > this.canvas.width + 50 || 
                entity.y < -50 || entity.y > this.canvas.height + 50) {
                this.entities.splice(i, 1);
            }
        }
    }
    
    checkHookCollisions() {
        for (const entity of this.entities) {
            const dx = this.hook.x - entity.x;
            const dy = this.hook.y - entity.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < this.hook.radius + entity.radius) {
                // Hooked!
                this.hookedEntity = entity;
                this.tugMeter = 0;
                // Remove entity from active list
                const index = this.entities.indexOf(entity);
                if (index > -1) this.entities.splice(index, 1);
                // Apply entity-specific effects
                this.applyEntityEffect(entity);
                break;
            }
        }
    }
    
    applyEntityEffect(entity) {
        switch (entity.type) {
            case 'Black Hole Bait':
                // Pulls line - increase tension
                this.fishingLine.currentLength = Math.min(
                    this.fishingLine.currentLength + 2,
                    this.fishingLine.maxLength
                );
                break;
            case 'Supernova Sprite':
                // Explodes on collision - damage line
                this.fishingLine.currentLength = Math.max(0, this.fishingLine.currentLength - 50);
                break;
            default:
                break;
        }
    }
    
    updateTugMeter(dt) {
        // Tug meter fills based on entity strength
        const fillRate = 0.001 + (this.hookedEntity.strength * 0.0005);
        this.tugMeter += fillRate * dt / 1000;
        if (this.tugMeter >= 1.0) {
            // Entity escapes if meter fills while reeling
            if (this.isReeling) {
                this.escapeEntity();
            }
        }
    }
    
    spawnEntity() {
        const types = [
            { type: 'Nebula Nymph', value: 100, strength: 0.2, color: '#00ffff', radius: 15 },
            { type: 'Pulsar Piranha', value: 50, strength: 0.5, color: '#ff00ff', radius: 12 },
            { type: 'Black Hole Bait', value: 75, strength: 0.8, color: '#ffff00', radius: 18 },
            { type: 'Supernova Sprite', value: 200, strength: 0.3, color: '#ff4500', radius: 14 }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        // Spawn ahead of vessel
        const spawnX = this.vessel.x + 200 + Math.random() * 100;
        const spawnY = this.vessel.y + (Math.random() - 0.5) * 100;
        
        // Random drift
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        
        this.entities.push({
            ...type,
            x: spawnX,
            y: spawnY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }
    
    render() {
        // Clear
        this.ctx.fillStyle = '#0a1a2f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw parallax background (simple starfield)
        this.drawStarfield();
        
        // Draw entities
        for (const entity of this.entities) {
            this.ctx.fillStyle = entity.color;
            this.ctx.beginPath();
            this.ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
            this.ctx.fill();
            // Add glow
            this.ctx.shadowColor = entity.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
        
        // Draw fishing line
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.fishingLine.points[0].x, this.fishingLine.points[0].y);
        for (let i = 1; i < this.fishingLine.points.length; i++) {
            const point = this.fishingLine.points[i];
            this.ctx.lineTo(point.x, point.y);
        }
        this.ctx.stroke();
        
        // Draw hook
        this.ctx.fillStyle = this.hook.color;
        this.ctx.beginPath();
        this.ctx.arc(this.hook.x, this.hook.y, this.hook.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw bobber
        this.ctx.fillStyle = this.bobber.color;
        this.ctx.beginPath();
        this.ctx.arc(this.bobber.x, this.bobber.y, this.bobber.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw vessel
        this.ctx.fillStyle = this.vessel.color;
        this.ctx.beginPath();
        this.ctx.moveTo(this.vessel.x - this.vessel.width/2, this.vessel.y);
        this.ctx.lineTo(this.vessel.x, this.vessel.y - this.vessel.height/2);
        this.ctx.lineTo(this.vessel.x + this.vessel.width/2, this.vessel.y);
        this.ctx.lineTo(this.vessel.x, this.vessel.y + this.vessel.height/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw tug meter fill
        const tugFill = document.getElementById('tugFill');
        tugFill.style.width = (this.tugMeter * 100) + '%';
        
        // Draw line length bar
        const lineFill = document.getElementById('lineFill');
        const linePercent = (this.fishingLine.currentLength / this.fishingLine.maxLength) * 100;
        lineFill.style.width = linePercent + '%';
        
        // Draw HUD text
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Score: ${this.score}`, 10, 20);
        this.ctx.fillText(`Time: ${Math.floor(this.gameTime / 1000)}s`, 10, 40);
    }
    
    drawStarfield() {
        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 100; i++) {
            const x = (this.gameTime * 0.01 + i * 13) % this.canvas.width;
            const y = (this.gameTime * 0.005 + i * 17) % this.canvas.height;
            const size = Math.random() * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
   }
}
