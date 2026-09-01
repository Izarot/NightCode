// Entity creation and pooling for PolyGone

// Player factory
function createPlayer(x, y) {
    return {
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        radius: 15,
        angle: -Math.PI / 2,
        health: 3,
        invulnerable: 0,
        canFire: true,
        speed: 4,
        friction: 0.92
    };
}

// Bullet factory
function createBullet(x, y, angle) {
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * 12,
        vy: Math.sin(angle) * 12,
        radius: 4,
        active: true,
        color: '#fff700'
    };
}

// Enemy factory
function createEnemy(x, y, type, speedMult = 1, angle = null) {
    const configs = {
        hexagon: {
            radius: 40,
            color: '#ff0055',
            sides: 6,
            points: 100,
            baseSpeed: 1.5
        },
        square: {
            radius: 25,
            color: '#bc13fe',
            sides: 4,
            points: 200,
            baseSpeed: 2
        },
        diamond: {
            radius: 15,
            color: '#39ff14',
            sides: 4,
            points: 300,
            baseSpeed: 2.5
        }
    };
    
    const config = configs[type];
    const speed = config.baseSpeed * speedMult;
    
    // Default angle is toward player
    if(angle === null) {
        angle = Math.random() * Math.PI * 2;
    }
    
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: config.radius,
        color: config.color,
        type: type,
        sides: config.sides,
        points: config.points,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        active: true
    };
}

// Particle factory
function createParticle(x, y, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    return {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color: color,
        life: 1,
        decay: 0.02 + Math.random() * 0.02
    };
}

// Update functions
function updatePlayer(player, keys, mouse, screenW, screenH) {
    // Movement
    let ax = 0, ay = 0;
    
    if(keys['w'] || keys['arrowup']) ay -= 1;
    if(keys['s'] || keys['arrowdown']) ay += 1;
    if(keys['a'] || keys['arrowleft']) ax -= 1;
    if(keys['d'] || keys['arrowright']) ax += 1;
    
    // Normalize diagonal movement
    if(ax !== 0 && ay !== 0) {
        ax *= 0.707;
        ay *= 0.707;
    }
    
    player.vx += ax * player.speed * 0.2;
    player.vy += ay * player.speed * 0.2;
    player.vx *= player.friction;
    player.vy *= player.friction;
    
    player.x += player.vx;
    player.y += player.vy;
    
    // Bounds
    player.x = Math.max(player.radius, Math.min(screenW - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(screenH - player.radius, player.y));
    
    // Aim angle
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    // Invulnerability
    if(player.invulnerable > 0) player.invulnerable--;
}

function updateBullet(bullet, screenW, screenH) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    
    // Deactivate if out of bounds
    if(bullet.x < -20 || bullet.x > screenW + 20 ||
       bullet.y < -20 || bullet.y > screenH + 20) {
        bullet.active = false;
    }
}

function updateEnemy(enemy, targetX, targetY) {
    // Slight homing toward player
    const angleToPlayer = Math.atan2(targetY - enemy.y, targetX - enemy.x);
    const homingStrength = enemy.type === 'diamond' ? 0.02 : 0.01;
    
    enemy.vx += Math.cos(angleToPlayer) * homingStrength;
    enemy.vy += Math.sin(angleToPlayer) * homingStrength;
    
    // Apply velocity with damping
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;
    
    // Rotation
    enemy.rotation += enemy.rotationSpeed;
}

function updateParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.life -= particle.decay;
    particle.radius *= 0.97;
}

// Utility
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Drawing functions
function drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    
    // Flicker when invulnerable
    if(player.invulnerable > 0 && Math.floor(player.invulnerable / 4) % 2 === 0) {
        ctx.globalAlpha = 0.3;
    }
    
    ctx.shadowColor = '#00f2ff';
    ctx.shadowBlur = 20;
    
    // Triangle shape
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -12);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    
    ctx.fillStyle = '#00f2ff';
    ctx.fill();
    
    // White core
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function drawBullet(ctx, bullet) {
    ctx.save();
    ctx.shadowColor = bullet.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawEnemy(ctx, enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.rotation);
    
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = enemy.color;
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 2;
    
    const angleOffset = enemy.type === 'diamond' ? Math.PI / 4 : 0;
    
    ctx.beginPath();
    for(let i = 0; i < enemy.sides; i++) {
        const angle = (i / enemy.sides) * Math.PI * 2 + angleOffset;
        const x = Math.cos(angle) * enemy.radius;
        const y = Math.sin(angle) * enemy.radius;
        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Inner glow
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    for(let i = 0; i < enemy.sides; i++) {
        const angle = (i / enemy.sides) * Math.PI * 2 + angleOffset;
        const x = Math.cos(angle) * enemy.radius * 0.4;
        const y = Math.sin(angle) * enemy.radius * 0.4;
        if(i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

function drawParticle(ctx, particle) {
    ctx.save();
    ctx.globalAlpha = particle.life;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}