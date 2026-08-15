const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let w, h;

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Placeholder for game logic
function loop() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(w/2, h/2, 50, 0, Math.PI * 2);
    ctx.fill();
    
    requestAnimationFrame(loop);
}

loop();