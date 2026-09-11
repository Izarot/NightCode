// Web Audio API sound system
const audio = {
    ctx: null,
    buffers: {},
    
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.generateSounds();
    },
    
    generateSounds() {
        // Shoot sound
        this.buffers.shoot = this.createTone(200, 0.1, 'square', 0.3);
        // Hit sound
        this.buffers.hit = this.createTone(400, 0.05, 'sine', 0.4);
        // Pickup sound
        this.buffers.pickup = this.createTone(600, 0.1, 'triangle', 0.3);
        // Explosion
        this.buffers.explosion = this.createNoise(0.3, 0.5);
        // Victory
        this.buffers.victory = this.createMelody([523, 659, 784, 1047], 0.15);
        // Defeat
        this.buffers.defeat = this.createMelody([300, 250, 200,, 150], 0.2);
        // Zone warning
        this.buffers.zoneWarn = this.createTone(150, 1, 'sawtooth', 0.2);
    },
    
    createTone(freq, duration, type, volume) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10);
            let wave = 0;
            switch(type) {
                case 'sine': wave = Math.sin(2 * Math.PI * freq * t); break;
                case 'square': wave = Math.sign(Math.sin(2 * Math.PI * freq * t)); break;
                case 'sawtooth': wave = 2 * (t * freq - Math.floor(t * freq + 0.5)); break;
                case 'triangle': wave = 2 * Math.abs(2 * (t * freq - Math.floor(t * freq + 0.5))) - 1; break;
            }
            data[i] = wave * envelope * volume;
        }
        return buffer;
    },
    
    createNoise(duration, volume) {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const envelope = Math.exp(-i / sampleRate * 5);
            data[i] = (Math.random() * 2 - 1) * envelope * volume;
        }
        return buffer;
    },
    
    createMelody(frequencies, noteDuration) {
        const sampleRate = this.ctx.sampleRate;
        const totalDuration = frequencies.length * noteDuration;
        const length = sampleRate * totalDuration;
        const buffer = this.ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t / noteDuration);
            if (noteIndex >= frequencies.length) break;
            const noteTime = t - noteIndex * noteDuration;
            const envelope = Math.exp(-noteTime * 8);
            const freq = frequencies[noteIndex];
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }
        return buffer;
    },
    
    play(name) {
        if (!this.ctx || !this.buffers[name]) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[name];
        source.connect(this.ctx.destination);
        source.start(0);
    }
};

// Player class
class Player {
    constructor(x, y, isLocal) {
        this.x = x;
        this.y = y;
        this.isLocal = isLocal;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.armor = 0;
        this.maxArmor = 100;
        this.radius = 16;
        this.color = isLocal ? PALETTE.player : PALETTE.enemy;
        this.name = isLocal ? 'You' : `Enemy ${Math.floor(Math.random() * 1000)}`;
        this.kills = 0;
        this.score = 0;
        this.damageDealt = 0;
        this.lastShot = 0;
        this.inventory = [
            { type: 'weapon', icon: '🔫', ammo: 30, maxAmmo: 30, fireRate: 150, spread: 0.05, damage: 25 },
            null, null, null, null, null, null, null
        ];
        this.selectedSlot = 0;
        this.reloading = false;
        this.reloadTime = 0;
    }
    
    update(delta, keys, mouse) {
        if (this.isLocal) {
            this.handleInput(delta, keys, mouse);
        }
        this.updatePhysics(delta);
        this.updateWeapon(delta);
    }
    
    handleInput(delta, keys, mouse) {
        // Movement
        let ax = 0, ay = 0;
        if (keys['KeyW'] || keys['ArrowUp']) ay -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) ay += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) ax -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) ax += 1;
        
        if (ax !== 0 || ay !== 0) {
            const len = Math.sqrt(ax * ax + ay * ay);
            ax /= len; ay /= len;
            this.vx += ax * CONFIG.acceleration * 60 * delta;
            this.vy += ay * CONFIG.acceleration * 60 * delta;
        }
        
        // Aim
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        
        // Shoot
        if (mouse.down && !this.reloading) {
            this.shoot();
        }
        
        // Reload
        if (keys['KeyR']) {
            this.reload();
        }
        
        // Slot selection
        for (let i = 0; i < 8; i++) {
            if (keys[`Digit${i + 1}`]) {
                this.selectedSlot = i;
            }
        }
    }
    
    updateAI(delta, players, zone, loot) {
        // Simple AI behavior
        const alivePlayers = players.filter(p => p.health > 0 && !p.isLocal);
        const target = players.find(p => p.isLocal);
        
        if (!target) return;
        
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Move towards zone center if outside
        if (!zone.isInside(this.x, this.y)) {
            const zoneDx = zone.x - this.x;
            const zoneDy = zone.y - this.y;
            const zoneDist = Math.sqrt(zoneDx * zoneDx + zoneDy * zoneDy);
            if (zoneDist > 0) {
                this.vx += (zoneDx / zoneDist) * CONFIG.acceleration * 60 * delta * 0.5;
                this.vy += (zoneDy / zoneDist) * CONFIG.acceleration * 60 * delta * 0.5;
            }
        } else if (dist > 400) {
            // Move towards player if far
            this.vx += (dx / dist) * CONFIG.acceleration * 60 * delta * 0.3;
            this.vy += (dy / dist) * CONFIG.acceleration * 60 * delta * 0.3;
        } else if (dist < 200) {
            // Strafe if close
            this.vx += (-dy / dist) * CONFIG.acceleration * 60 * delta * 0.4;
            this.vy += (dx / dist) * CONFIG.acceleration * 60 * delta * 0.4;
        }
        
        // Aim at player
        this.angle = Math.atan2(dy, dx);
        
        // Shoot occasionally
        if (dist < 500 && Math.random() < 0.02) {
            this.shoot();
        }
        
        // Pick up nearby loot
        loot.forEach(item => {
            const ldx = item.x - this.x;
            const ldy = item.y - this.y;
            if (ldx * ldx + ldy * ldy < 2500) {
                this.vx += (ldx / Math.sqrt(ldx * ldx + ldy * ldy)) * CONFIG.acceleration * 60 * delta * 0.5;
                this.vy += (ldy / Math.sqrt(ldx * ldx + ldy * ldy)) * CONFIG.acceleration * 60 * delta * 0.5;
            }
        });
    }
    
    updatePhysics(delta) {
        // Apply friction
        this.vx *= CONFIG.friction;
        this.vy *= CONFIG.friction;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > CONFIG.maxSpeed) {
            this.vx = (this.vx / speed) * CONFIG.maxSpeed;
            this.vy = (this.vy / speed) * CONFIG.maxSpeed;
        }
        
        // Update position
        this.x += this.vx * 60 * delta;
        this.y += this.vy * 60 * delta;
        
        // Boundary collision
        this.x = Math.max(this.radius, Math.min(CONFIG.mapSize - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(CONFIG.mapSize - this.radius, this.y));
    }
    
    updateWeapon(delta) {
        if (this.reloading) {
            this.reloadTime -= delta;
            if (this.reloadTime <= 0) {
                this.reloading = false;
                const weapon = this.inventory[this.selectedSlot];
                if (weapon) weapon.ammo = weapon.maxAmmo;
            }
        }
        
        if (this.lastShot > 0) this.lastShot -= delta;
    }
    
    shoot() {
        const weapon = this.inventory[this.selectedSlot];
        if (!weapon || weapon.type !== 'weapon') return;
        if (weapon.ammo <= 0) { this.reload(); return; }
        if (this.lastShot > 0) return;
        
        weapon.ammo--;
        this.lastShot = weapon.fireRate / 1000;
        
        const spread = (Math.random() - 0.5) * weapon.spread;
        const bulletAngle = this.angle + spread;
        
        bullets.push(new Bullet(
            this.x + Math.cos(this.angle) * 20,
            this.y + Math.sin(this.angle) * 20,
            bulletAngle,
            this,
            weapon.damage
        ));
        
        audio.play('shoot');
        
        if (weapon.ammo <= 0) this.reload();
    }
    
    reload() {
        const weapon = this.inventory[this.selectedSlot];
        if (!weapon || weapon.type !== 'weapon' || weapon.ammo === weapon.maxAmmo || this.reloading) return;
        this.reloading = true;
        this.reloadTime = 2.0;
    }
    
    takeDamage(amount, source) {
        let damage = amount;
        if (this.armor > 0) {
            const armorAbsorb = Math.min(this.armor, damage * 0.7);
            this.armor -= armorAbsorb;
            damage -= armorAbsorb;
        }
        this.health -= damage;
        this.health = Math.max(0, this.health);
        
        if (source === 'bullet') {
            audio.play('hit');
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        audio.play('pickup');
    }
    
    addArmor(amount) {
        this.armor = Math.min(this.maxArmor, this.armor + amount);
        audio.play('pickup');
    }
    
    addAmmo(amount) {
        const weapon = this.inventory[this.selectedSlot];
        if (weapon && weapon.type === 'weapon') {
            weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + amount);
            audio.play('pickup');
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Gun
        ctx.fillStyle = '#333';
        ctx.fillRect(this.radius, -3, 20, 6);
        
        // Health bar above head
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#333';
            ctx.fillRect(-20, -this.radius - 10, 40, 4);
            ctx.fillStyle = this.health > 30 ? PALETTE.health : PALETTE.uiDanger;
            ctx.fillRect(-20, -this.radius - 10, 40 * (this.health / this.maxHealth), 4);
        }
        
        // Name
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 0, -this.radius - 15);
        
        ctx.restore();
    }
}

// Bullet class
class Bullet {
    constructor(x, y, angle, owner, damage) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * CONFIG.bulletSpeed;
        this.vy = Math.sin(angle) * CONFIG.bulletSpeed;
        this.owner = owner;
        this.damage = damage;
        this.life = 2;
        this.shouldRemove = false;
        this.trail = [];
    }
    
    update(delta) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
        
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.life -= delta;
        
        // Check collision with players
        for (const player of players) {
            if (player === this.owner || player.health <= 0) continue;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            if (dx * dx + dy * dy < player.radius * player.radius) {
                player.takeDamage(this.damage, 'bullet');
                this.owner.damageDealt += this.damage;
                particles.push(new Particle(this.x, this.y, PALETTE.bullet));
                audio.play('hit');
                this.shouldRemove = true;
                break;
            }
        }
        
        // Check bounds
        if (this.x < 0 || this.x > CONFIG.mapSize || this.y < 0 || this.y > CONFIG.mapSize || this.life <= 0) {
            this.shouldRemove = true;
        }
    }
    
    render(ctx) {
        // Trail
        ctx.strokeStyle = PALETTE.bullet;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.trail[0]?.x || this.x, this.trail[0]?.y || this.y);
        for (const point of this.trail) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        
        // Bullet
        ctx.fillStyle = PALETTE.bullet;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// LootItem class
class LootItem {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 0: ammo, 1: armor, 2: health, 3: grenade
        this.radius = 12;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.collected = false;
        this.icons = ['🔫', '🛡️', '💊', '💥'];
        this.colors = ['#ffcc00', '#00ffff', '#00ff44', '#ff6600'];
    }
    
    update(delta) {
        this.bobOffset += delta * 3;
        
        // Check collection by local player
        const dx = localPlayer.x - this.x;
        const dy = localPlayer.y - this.y;
        if (dx * dx + dy * dy < (localPlayer.radius + this.radius) ** 2) {
            this.collect();
        }
    }
    
    collect() {
        switch(this.type) {
            case 0: localPlayer.addAmmo(30); break;
            case 1: localPlayer.addArmor(25); break;
            case 2: localPlayer.heal(25); break;
            case 3: localPlayer.inventory[3] = { type: 'grenade', icon: '💥', count: (localPlayer.inventory[3]?.count || 0) + 1 }; break;
        }
        this.collected = true;
    }
    
    render(ctx) {
        const bob = Math.sin(this.bobOffset) * 3;
        ctx.save();
        ctx.translate(this.x, this.y + bob);
        
        // Glow
        ctx.shadowColor = this.colors[this.type];
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = this.colors[this.type];
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(this.icons[this.type], 0, 5);
        
        ctx.restore();
    }
}

// Zone class
class Zone {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.targetRadius = radius;
        this.targetX = x;
        this.targetY = y;
        this.shrinkProgress = 0;
        this.timeToShrink = 60;
        this.shrinkPhase = 0;
        this.damagePerSecond = 5;
    }
    
    update(delta, playersAlive) {
        this.timeToShrink -= delta;
        
        if (this.timeToShrink <= 0) {
            this.startShrink();
        }
        
        if (this.shrinkProgress < 1) {
            this.shrinkProgress += delta / 10;
            this.shrinkProgress = Math.min(1, this.shrinkProgress);
            
            this.radius = this.targetRadius + (this.radius - this.targetRadius) * (1 - this.shrinkProgress);
            this.x = this.targetX + (this.x - this.targetX) * (1 - this.shrinkProgress);
            this.y = this.targetY + (this.y - this.targetY) * (1 - this.shrinkProgress);
        }
        
        // Increase damage as zone shrinks
        this.damagePerSecond = 5 + (1 - this.radius / (CONFIG.mapSize * 0.4)) * 20;
    }
    
    startShrink() {
        this.targetRadius = Math.max(50, this.radius * CONFIG.zoneShrinkRate);
        const margin = this.targetRadius + 100;
        this.targetX = Math.random() * (CONFIG.mapSize - margin * 2) + margin;
        this.targetY = Math.random() * (CONFIG.mapSize - margin * 2) + margin;
        this.shrinkProgress = 0;
        this.timeToShrink = 30 + Math.random() * 30;
        this.shrinkPhase++;
        audio.play('zoneWarn');
    }
    
    isInside(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return dx * dx + dy * dy < this.radius * this.radius;
    }
    
    render(ctx) {
        // Zone boundary
        ctx.strokeStyle = PALETTE.zone;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Danger zone outside
        const gradient = ctx.createRadialGradient(this.x, this.y, this.radius, this.x, this.y, this.radius + 200);
        gradient.addColorStop(0, 'rgba(255,0,100,0)');
        gradient.addColorStop(1, 'rgba(255,0,100,0.1)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 200, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200;
        this.life = 1;
        this.maxLife = 1;
        this.color = color;
        this.size = 3 + Math.random() * 3;
    }
    
    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= delta;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
