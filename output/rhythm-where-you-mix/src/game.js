// Main game engine for Alchemical Rhythm
(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    let animationId = null;

    function init() {
        canvas.width = 1280;
        canvas.height = 720;
        state.running = true;
        HUD.setLevel(state.level);
        HUD.updateScore(state.score);
        HUD.showCombo(state.combo);
        gameLoop();
    }

    function update() {
        if (state.running) {
            // Update particles
            particles = particles.filter(p => p.life > 0);
            particles.forEach(p => p.update());
            
            // Update timer
            state.timer += 1/60;
            document.getElementById('timerValue').textContent = Math.floor(state.timer);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw cauldron in center
        ctx.fillStyle = '#2d1b4e';
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 80, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#6b4c9a';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw particles
        particles.forEach(p => p.draw(ctx));
        
        // Draw instructions
        ctx.fillStyle = '#fff';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Click and drag ingredients to the cauldron!', canvas.width/2, 100);
    }

    function gameLoop() {
        update();
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }

    function handleInput(e) {
        if (e.code === 'Space' || e.code === 'ShiftLeft') {
            // Dash action
            console.log('Dash!');
        }
        if (e.code === 'Escape') {
            // Pause action
            state.running = !state.running;
        }
    }

    // Mouse/touch handling for ingredient drag
    let isDragging = false;
    let dragX = 0;
    let dragY = 0;

    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('touchstart', startDrag);
    canvas.addEventListener('touchmove', drag);
    canvas.addEventListener('touchend', endDrag);

    function startDrag(e) {
        isDragging = true;
        const pos = getPos(e);
        dragX = pos.x;
        dragY = pos.y;
    }

    function drag(e) {
        if (isDragging) {
            const pos = getPos(e);
            dragX = pos.x;
            dragY = pos.y;
        }
    }

    function endDrag(e) {
        if (isDragging) {
            // Check if dropped on cauldron
            const cauldronX = canvas.width/2;
            const cauldronY = canvas.height/2;
            const dist = Math.sqrt((dragX - cauldronX)**2 + (dragY - cauldronY)**2);
            
            if (dist < 100) {
                // Successful mix!
                state.score += 100 * (1 + state.combo * 0.1);
                state.combo++;
                HUD.updateScore(Math.floor(state.score));
                HUD.showCombo(state.combo);
                
                // Create particles
                for (let i = 0; i < 20; i++) {
                    particles.push(new Particle(dragX, dragY, '#ff6b6b'));
                }
                
                playSound('mix');
            }
            
            isDragging = false;
        }
    }

    function getPos(e) {
        if (e.touches) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    window.addEventListener('keydown', handleInput);
    
    // Expose init to global scope
    window.initGame = init;
    
    // Auto-init when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
