export function renderGame(ctx, gameState, canvas) {
    // Set canvas dimensions
    gameState.canvasWidth = canvas.width;
    gameState.canvasHeight = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground(ctx, canvas);
    
    // Draw hazards
    gameState.hazards.forEach(hazard => {
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Draw objects
    gameState.objects.forEach(obj => {
        if (obj.collected) return;
        
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
        
        // Different colors for different types
        const colors = ['#888', '#666', '#ffcc00', '#00ffcc'];
        ctx.fillStyle = colors[obj.type];
        ctx.fill();
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
    
    // Draw magnet
    const magnet = gameState.magnet;
    const range = gameState.magnetPower > 150 ? 200 : 150;
    
    // Attraction range indicator
    ctx.beginPath();
    ctx.arc(magnet.x, magnet.y, range, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Magnet body
    ctx.beginPath();
    ctx.arc(magnet.x, magnet.y, magnet.radius, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(magnet.x, magnet.y, 5, magnet.x, magnet.y, magnet.radius);
    gradient.addColorStop(0, '#00b4ff');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw particles
    gameState.particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
    
    // Draw timer if low
    if (gameState.timer < 10000) {
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('WARNING: TIME LOW!', 20, canvas.height - 20);
    }
}

function drawBackground(ctx, canvas) {
    // Simple parallax background
    const layers = 3;
    for (let i = 0; i < layers; i++) {
        const offset = (i + 1) * 50;
        const x = (offset) % canvas.width;
        
        ctx.strokeStyle = `rgba(15, 52, 96, ${0.1 + i * 0.1})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 123) % canvas.width;
        const y = (i * 67) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }
}