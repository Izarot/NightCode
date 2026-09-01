// Main entry point for PolyGone
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Game states
    const STATES = { MENU: 'MENU', PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' };
    
    // Game variables
    let gameState = STATES.MENU;
    let score = 0;
    let wave = 1;
    let highScore = parseInt(localStorage.getItem('polygoneHighScore')) || 0;
    let startTime = 0;
    let elapsedTime = 0;
    let screenShake = { x: 0, y: 0, intensity: 0 };
    
    // Input state
    const keys = {};
    const mouse = { x: 0, y: 0, down: false };
    
    // Entity pools
    let player = null;
    let bullets = [];
    let enemies = [];
    let particles = [];
    
    // Audio context
    let audioCtx = null;
    
    // Resize handler
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.scale(dpr, dpr);
    }
    
    // Input handlers
    function setupInput() {
        window.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            if(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.key.toLowerCase()] = false;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        
        canvas.addEventListener('mousedown', (e) => {
            if(e.button === 0) {
                mouse.down = true;
                handleClick();
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if(e.button === 0) mouse.down = false;
        });
        
        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            mouse.x = touch.clientX - rect.left;
            mouse.y = touch.clientY - rect.top;
            mouse.down = true;
            handleClick();
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            mouse.x = touch.clientX - rect.left;
            mouse.y = touch.clientY - rect.top;
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            mouse.down = false;
        });
    }
    
    function handleClick() {
        if(gameState === STATES.MENU) {
            startGame();
        } else if(gameState === STATES.GAMEOVER) {
            startGame();
        }
    }
    
    function startGame() {
        gameState = STATES.PLAYING;
        score = 0;
        wave = 1;
        startTime = performance.now();
        elapsedTime = 0;
        
        // Initialize audio on user interaction
        if(!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            initAudio(audioCtx);
        }
        
        // Reset pools
        bullets = [];
        enemies = [];
        particles = [];
        
        // Create player
        player = createPlayer(canvas.width / (window.devicePixelRatio || 1) / 2, 
                             canvas.height / (window.devicePixelRatio || 1) - 100);
        
        // Spawn first wave
        spawnWave();
    }
    
    function spawnWave() {
        const screenW = canvas.width / (window.devicePixelRatio || 1);
        const enemyCount = wave * 5;
        
        for(let i = 0; i < enemyCount; i++) {
            let type;
            const roll = Math.random();
            if(wave < 3) {
                type = 'hexagon';
            } else if(wave < 5) {
                type = roll < 0.6 ? 'hexagon' : 'square';
            } else {
                if(roll < 0.3) type = 'hexagon';
                else if(roll < 0.7) type = 'square';
                else type = 'diamond';
            }
            
            const x = Math.random() * (screenW - 100) + 50;
            const y = -50 - Math.random() * 300;
            const speedMult = 1 + wave * 0.05;
            
            enemies.push(createEnemy(x, y, type, speedMult));
        }
    }
    
    function update() {
        if(gameState !== STATES.PLAYING) return;
        
        const screenW = canvas.width / (window.devicePixelRatio || 1);
        const screenH = canvas.height / (window.devicePixelRatio || 1);
        
        // Update elapsed time
        elapsedTime = performance.now() - startTime;
        
        // Update screen shake
        if(screenShake.intensity > 0) {
            screenShake.x = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.y = (Math.random() - 0.5) * screenShake.intensity * 2;
            screenShake.intensity *= 0.9;
            if(screenShake.intensity < 0.1) screenShake.intensity = 0;
        }
        
        // Update player
        updatePlayer(player, keys, mouse, screenW, screenH);
        
        // Auto-fire when mouse is down
        if(mouse.down) {
            fireBullet();
        }
        
        // Update bullets
        bullets = bullets.filter(bullet => {
            updateBullet(bullet, screenW, screenH);
            return bullet.active;
        });
        
        // Update enemies
        enemies.forEach(enemy => {
            updateEnemy(enemy, player.x, player.y);
        });
        
        // Check collisions
        checkCollisions();
        
        // Update particles
        particles = particles.filter(particle => {
            updateParticle(particle);
            return particle.life > 0;
        });
        
        // Check wave complete
        if(enemies.length === 0) {
            wave++;
            spawnWave();
        }
    }
    
    function fireBullet() {
        if(!player.canFire) return;
        
        player.canFire = false;
        setTimeout(() => player.canFire = true, 100);
        
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        bullets.push(createBullet(player.x, player.y, angle));
        playSound('shoot');
    }
    
    function checkCollisions() {
        // Bullet vs Enemy
        for(let bullet of bullets) {
            if(!bullet.active) continue;
            
            for(let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                if(!enemy.active) continue;
                
                const dist = distance(bullet.x, bullet.y, enemy.x, enemy.y);
                if(dist < bullet.radius + enemy.radius) {
                    bullet.active = false;
                    destroyEnemy(enemy, i);
                    break;
                }
            }
        }
        
        // Player vs Enemy
        if(player.invulnerable <= 0) {
            for(let enemy of enemies) {
                if(!enemy.active) continue;
                
                const dist = distance(player.x, player.y, enemy.x, enemy.y);
                if(dist < player.radius + enemy.radius) {
                    player.health--;
                    player.invulnerable = 60;
                    screenShake.intensity = 5;
                    playSound('hit');
                    
                    if(player.health <= 0) {
                        gameOver();
                    }
                    break;
                }
            }
        }
    }
    
    function destroyEnemy(enemy, index) {
        playSound('split');
        score += enemy.points;
        
        // Spawn particles
        const particleCount = 8 + Math.floor(Math.random() * 8);
        for(let i = 0; i < particleCount; i++) {
            particles.push(createParticle(enemy.x, enemy.y, enemy.color));
        }
        
        // Split logic
        if(enemy.type === 'hexagon') {
            screenShake.intensity = 3;
            for(let i = 0; i < 2; i++) {
                const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x) + (i === 0 ? -0.8 : 0.8);
                enemies.push(createEnemy(enemy.x, enemy.y, 'square', 1.2, angle));
            }
        } else if(enemy.type === 'square') {
            for(let i = 0; i < 2; i++) {
                const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x) + (i === 0 ? -0.6 : 0.6);
                enemies.push(createEnemy(enemy.x, enemy.y, 'diamond', 1.3, angle));
            }
        }
        
        enemies.splice(index, 1);
    }
    
    function gameOver() {
        gameState = STATES.GAMEOVER;
        if(score > highScore) {
            highScore = score;
            localStorage.setItem('polygoneHighScore', highScore);
        }
    }
    
    function render() {
        const screenW = canvas.width / (window.devicePixelRatio || 1);
        const screenH = canvas.height / (window.devicePixelRatio || 1);
        
        ctx.save();
        ctx.translate(screenShake.x, screenShake.y);
        
        // Clear
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(-10, -10, screenW + 20, screenH + 20);
        
        // Draw grid
        drawGrid(ctx, screenW, screenH);
        
        if(gameState === STATES.MENU) {
            drawMenu(ctx, screenW, screenH);
        } else if(gameState === STATES.PLAYING) {
            // Draw particles (behind entities)
            particles.forEach(p => drawParticle(ctx, p));
            
            // Draw bullets
            bullets.forEach(b => drawBullet(ctx, b));
            
            // Draw enemies
            enemies.forEach(e => drawEnemy(ctx, e));
            
            // Draw player
            drawPlayer(ctx, player);
            
            // Draw HUD
            drawHUD(ctx, screenW);
        } else if(gameState === STATES.GAMEOVER) {
            // Still draw particles
            particles.forEach(p => {
                updateParticle(p);
                drawParticle(ctx, p);
            });
            
            drawGameOver(ctx, screenW, screenH);
        }
        
        ctx.restore();
    }
    
    function drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.03)';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        const offset = (performance.now() / 50) % gridSize;
        
        for(let x = -gridSize + offset; x < w + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        
        for(let y = -gridSize + offset; y < h + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }
    
    function drawMenu(ctx, w, h) {
        // Title
        ctx.save();
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#00f2ff';
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('POLYGONE', w/2, h/2 - 60);
        ctx.restore();
        
        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText('CLICK TO START', w/2, h/2 + 20);
        
        // High score
        if(highScore > 0) {
            ctx.fillStyle = '#ff0055';
            ctx.font = '18px "Courier New", monospace';
            ctx.fillText(`HIGH SCORE: ${highScore.toString().padStart(5, '0')}`, w/2, h/2 + 70);
        }
        
        // Controls
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '14px "Courier New", monospace';
        ctx.fillText('WASD/ARROWS: MOVE  |  MOUSE: AIM  |  CLICK: FIRE', w/2, h - 40);
    }
    
    function drawGameOver(ctx, w, h) {
        ctx.fillStyle = 'rgba(10, 10, 12, 0.8)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.save();
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff0055';
        ctx.font = 'bold 64px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', w/2, h/2 - 60);
        ctx.restore();
        
        ctx.fillStyle = '#fff';
        ctx.font = '32px "Courier New", monospace';
        ctx.fillText(`SCORE: ${score.toString().padStart(5, '0')}`, w/2, h/2 + 10);
        
        if(score >= highScore && score > 0) {
            ctx.fillStyle = '#39ff14';
            ctx.font = '20px "Courier New", monospace';
            ctx.fillText('NEW HIGH SCORE!', w/2, h/2 + 50);
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px "Courier New", monospace';
        ctx.fillText('CLICK TO RESTART', w/2, h/2 + 100);
    }
    
    function drawHUD(ctx, w) {
        ctx.save();
        ctx.shadowBlur = 0;
        
        // Score (top left)
        ctx.fillStyle = '#fff';
        ctx.font = '20px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score.toString().padStart(5, '0')}`, 20, 30);
        
        // Timer (top center)
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);
        const ms = Math.floor((elapsedTime % 1000) / 10);
        ctx.fillStyle = '#bc13fe';
        ctx.textAlign = 'center';
        ctx.fillText(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, w/2, 30);
        
        // Wave (top right)
        ctx.fillStyle = '#00f2ff';
        ctx.textAlign = 'right';
        ctx.fillText(`WAVE ${wave.toString().padStart(2, '0')}`, w - 20, 30);
        
        // Health bar (bottom center)
        const healthY = canvas.height / (window.devicePixelRatio || 1) - 30;
        const pipWidth = 40;
        const pipHeight = 12;
        const pipGap = 10;
        const totalWidth = 3 * pipWidth + 2 * pipGap;
        const startX = (w - totalWidth) / 2;
        
        for(let i = 0; i < 3; i++) {
            const x = startX + i * (pipWidth + pipGap);
            ctx.fillStyle = i < player.health ? '#00f2ff' : 'rgba(0, 242, 255, 0.2)';
            ctx.shadowColor = '#00f2ff';
            ctx.shadowBlur = i < player.health ? 10 : 0;
            ctx.fillRect(x, healthY, pipWidth, pipHeight);
        }
        
        ctx.restore();
    }
    
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }
    
    // Initialize
    resize();
    window.addEventListener('resize', resize);
    setupInput();
    gameLoop();
})();