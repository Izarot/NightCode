// Rendering functions
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let screenShake = 0;
let swayOffset = 0;
const particles = [];
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
function drawBackground() {
    ctx.fillStyle = '#0B0C2A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#00F0FF';
    for (let i = 0; i < 50; i++) {
        const x = (i * 123) % canvas.width;
        const y = (i * 456) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }
}
function drawWords() {
    ctx.font = '20px "Press Start 2P", monospace';
    words.forEach(w => {
        if (w.typed > 0) {
            ctx.fillStyle = '#F2FF00';
            ctx.fillText(w.text.substring(0, w.typed), w.x, w.y);
            ctx.fillStyle = '#FF0055';
            ctx.fillText(w.text.substring(w.typed), w.x + ctx.measureText(w.text.substring(0, w.typed)).width, w.y);
        } else {
            ctx.fillStyle = '#00F0FF';
            ctx.fillText(w.text, w.x, w.y);
        }
    });
}
function drawCursor() {
    const activeWord = words.find(w => w.active);
    if (activeWord) {
        const x = activeWord.x + ctx.measureText(activeWord.text.substring(0, activeWord.typed)).width;
        const y = activeWord.y;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.fillRect(x, y - 20, 2, 25);
        // Input buffer
        const buffer = document.getElementById('input-buffer');
        buffer.style.display = 'block';
        buffer.style.left = (x + window.scrollX) + 'px';
        buffer.style.top = (y - 40 + window.scrollY) + 'px';
        buffer.textContent = activeWord.text.substring(0, activeWord.typed);
    }
}
function drawParticles() {
    particles.forEach((p, i) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    });
}
function render() {
    ctx.save();
    // Apply screen shake
    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }
    // Apply sway
    swayOffset += 0.01;
    ctx.translate(Math.sin(swayOffset) * 5, 0);
    drawBackground();
    drawWords();
    drawCursor();
    drawParticles();
    ctx.restore();
    // Update progress bar
    const maxWordY = Math.max(...words.map(w => w.y), 0);
    const progress = Math.min(maxWordY / canvas.height, 1);
    document.getElementById('progress-bar').style.width = (progress * 100) + '%';
}
function explodeParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x, y,
            size: Math.random() * 3 + 1,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            color,
            life: 30
        });
    }
}
function triggerScreenShake() {
    screenShake = 5;
}