export function updateMagnet(gameState, input, deltaTime) {
    const magnet = gameState.magnet;
    const acceleration = 0.5;
    const friction = 0.9;
    const maxSpeed = 8;
    
    // Handle input
    if (input.keys.has('ArrowUp') || input.keys.has('KeyW')) magnet.vy -= acceleration;
    if (input.keys.has('ArrowDown') || input.keys.has('KeyS')) magnet.vy += acceleration;
    if (input.keys.has('ArrowLeft') || input.keys.has('KeyA')) magnet.vx -= acceleration;
    if (input.keys.has('ArrowRight') || input.keys.has('KeyD')) magnet.vx += acceleration;
    
    // Mouse control
    if (input.mouse.x !== null) {
        const dx = input.mouse.x - magnet.x;
        const dy = input.mouse.y - magnet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            magnet.vx += (dx / dist) * acceleration;
            magnet.vy += (dy / dist) * acceleration;
        }
    }
    
    // Apply friction
    magnet.vx *= friction;
    magnet.vy *= friction;
    
    // Clamp speed
    const speed = Math.sqrt(magnet.vx * magnet.vx + magnet.vy * magnet.vy);
    if (speed > maxSpeed) {
        magnet.vx = (magnet.vx / speed) * maxSpeed;
        magnet.vy = (magnet.vy / speed) * maxSpeed;
    }
    
    // Update position
    magnet.x += magnet.vx;
    magnet.y += magnet.vy;
    
    // Boundary constraints
    magnet.x = Math.max(magnet.radius, Math.min(gameState.canvasWidth - magnet.radius, magnet.x));
    magnet.y = Math.max(magnet.radius, Math.min(gameState.canvasHeight - magnet.radius, magnet.y));
}

export function updateObjects(gameState, deltaTime) {
    const magnet = gameState.magnet;
    const baseRange = 150;
    const range = gameState.magnetPower > 150 ? 200 : baseRange;
    
    gameState.objects.forEach(obj => {
        if (obj.collected) return;
        
        const dx = magnet.x - obj.x;
        const dy = magnet.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < range) {
            // Attraction force
            const force = (gameState.magnetPower * obj.mass) / (distance * distance + 1);
            const angle = Math.atan2(dy, dx);
            
            obj.vx += Math.cos(angle) * force * 0.1;
            obj.vy += Math.sin(angle) * force * 0.1;
            
            // Add particle effect
            if (Math.random() < 0.3) {
                gameState.particles.push({
                    x: obj.x,
                    y: obj.y,
                    vx: -Math.cos(angle) * 2,
                    vy: -Math.sin(angle) * 2,
                    life: 20,
                    color: '#00b4ff'
                });
            }
        }
        
        // Apply velocity with friction
        obj.vx *= 0.95;
        obj.vy *= 0.95;
        obj.x += obj.vx;
        obj.y += obj.vy;
        
        // Boundary collision
        if (obj.x < obj.radius || obj.x > gameState.canvasWidth - obj.radius) {
            obj.vx *= -0.7;
            obj.x = Math.max(obj.radius, Math.min(gameState.canvasWidth - obj.radius, obj.x));
        }
        if (obj.y < obj.radius || obj.y > gameState.canvasHeight - obj.radius) {
            obj.vy *= -0.7;
            obj.y = Math.max(obj.radius, Math.min(gameState.canvasHeight - obj.radius, obj.y));
        }
    });
    
    // Update particles
    gameState.particles = gameState.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life--;
        return p.life > 0;
    });
}

export function checkCollisions(gameState, audio) {
    const magnet = gameState.magnet;
    
    // Check object collection
    gameState.objects.forEach(obj => {
        if (obj.collected) return;
        
        const dx = magnet.x - obj.x;
        const dy = magnet.y - obj.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < magnet.radius + obj.radius) {
            obj.collected = true;
            gameState.score += obj.value;
            
            // Combo system
            gameState.comboCount++;
            gameState.comboTimer = 2000; // 2 seconds
            if (gameState.comboCount % 3 === 0) {
                const comboBonus = Math.floor(obj.value * 0.1 * (gameState.comboCount / 3));
                gameState.score += comboBonus;
            }
            
            // Audio feedback
            audio.playCollectionSound();
            
            // Create collection particles
            for (let i = 0; i < 10; i++) {
                gameState.particles.push({
                    x: obj.x,
                    y: obj.y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 30,
                    color: ['#ffcc00', '#00ffcc', '#ff6600'][Math.floor(Math.random() * 3)]
                });
            }
        }
    });
    
    // Check hazard collision
    gameState.hazards.forEach(hazard => {
        const dx = magnet.x - hazard.x;
        const dy = magnet.y - hazard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < magnet.radius + hazard.radius) {
            gameState.isDead = true;
            audio.playHazardSound();
        }
    });
    
    // Check if all objects collected
    const allCollected = gameState.objects.every(obj => obj.collected);
    if (allCollected && gameState.objects.length > 0) {
        const timeBonus = Math.floor(gameState.timer / 1000) * 50;
        gameState.score += timeBonus;
        gameState.objects = []; // Clear for next level (simplified)
    }
}