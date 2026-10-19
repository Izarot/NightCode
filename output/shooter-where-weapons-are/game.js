const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const weaponEl = document.getElementById('weapon');
const healthEl = document.getElementById('health');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');

let width, height;
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
canvas.addEventListener('mousedown', () => { keys['MouseLeft'] = true; });
canvas.addEventListener('mouseup', () => { keys['MouseLeft'] = false; });
canvas.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
let mouseX = 0, mouseY = 0;

const WEAPONS = [
    { name: 'RIFLE', color: '#0ff', damage: 10, cooldown: 200, speed: 1.0, range: 400 },
    { name: 'SHOTGUN', color: '#f0f', damage: 25, cooldown: 800, speed: 0.7, range: 200 },
    { name: 'LASER', color: '#ff0', damage: 15, cooldown: 100, speed: 1.2, range: 600 }
];
let weaponIdx = 0;

const player = { x: 100, y: 100, vx: 0, vy: 0, hp: 100, maxHp: 100, stamina: 100, maxStamina: 100, angle: 0, invincible: 0 };
const bullets = [];
const enemies = [];
const particles = [];
let score = 0;
let highScore = localStorage.getItem('arsenalShiftHi') || 0;
scoreEl.innerText = `HI: ${highScore}`;
let startTime = Date.now();
let gameOver = false;

function spawnEnemy() {
    enemies.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0, vy: 0,
        hp: 30 + score * 0.1,
        size: 20
    });
}
setInterval(spawnEnemy, 1500);

function shoot() {
    const w = WEAPONS[weaponIdx];
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const dist = Math.hypot(dx, dy);
    const dirX = dx / dist;
    const dirY = dy / dist;
    const count = w.name === 'SHOTGUN' ? 5 : 1;
    for (let i = 0; i < count; i++) {
        const spread = w.name === 'SHOTGUN' ? (Math.random() - 0.5) * 0.5 : 0;
        bullets.push({
            x: player.x, y: player.y,
            vx: (dirX + spread) * 10 * w.speed,
            vy: (dirY + spread) * 10 * w.speed,
            range: w.range,
            color: w.color,
            damage: w.damage
        });
    }
    playSound('shoot');
}

let lastShot = 0;

function playSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'shoot') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        }
    } catch (e) {}
}

function update() {
    if (gameOver) return;

    const now = Date.now();
    const elapsed = Math.floor((now - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    timerEl.innerText = `TIME: ${m}:${s}`;

    const w = WEAPONS[weaponIdx];
    weaponEl.innerText = `WEAPON: ${w.name}`;

    let speed = 5 * w.speed;
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
        if (player.stamina > 0) {
            speed *= 1.6;
            player.stamina -= 0.5;
        }
    } else {
        player.stamina = Math.min(player.maxStamina, player.stamina + 0.3);
    }

    if (keys['KeyW'] || keys['ArrowUp']) player.vy -= speed;
    if (keys['KeyS'] || keys['ArrowDown']) player.vy += speed;
    if (keys['KeyA'] || keys['ArrowLeft']) player.vx -= speed;
    if (keys['KeyD'] || keys['ArrowRight']) player.vx += speed;

    if (keys['Digit1']) weaponIdx = 0;
    if (keys['Digit2']) weaponIdx = 1;
    if (keys['Digit3']) weaponIdx = 2;

    player.vx *= 0.85;
    player.vy *= 0.85;
    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(20, Math.min(width - 20, player.x));
    player.y = Math.max(20, Math.min(height - 20, player.y));

    if (player.invincible > 0) player.invincible--;

    if (keys['MouseLeft'] && now - lastShot > w.cooldown) {
        shoot();
        lastShot = now;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        b.range -= 10;
        if (b.range <= 0) bullets.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dx = player.x - e.x;
        const dy = player.y - e.y;
        const dist = Math.hypot(dx, dy);
        e.vx = (dx / dist) * 2;
        e.vy = (dy / dist) * 2;
        e.x += e.vx;
        e.y += e.vy;

        if (dist < 25 && player.invincible <= 0) {
            player.hp -= 0.5;
            player.invincible = 60;
            healthEl.innerText = `HP: ${Math.floor(player.hp)}`;
            if (player.hp <= 0) endGame();
        }

        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
                e.hp -= b.damage;
                bullets.splice(j, 1);
                playSound('hit');
                for (let k = 0; k < 5; k++) particles.push({ x: e.x, y: e.y, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 20, color: b.color });
            }
        }

        if (e.hp <= 0) {
            score += 100;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('arsenalShiftHi', highScore);
                scoreEl.innerText = `HI: ${highScore}`;
            }
            enemies.splice(i, 1);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function endGame() {
    gameOver = true;
    overlay.style.display = 'block';
    finalScoreEl.innerText = `Score: ${score}`;
}

function draw() {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i += 40) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
    }
    for (let i = 0; i < height; i += 40) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
    }
    ctx.stroke();

    const w = WEAPONS[weaponIdx];
    ctx.fillStyle = w.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = w.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(Math.atan2(mouseY - player.y, mouseX - player.x)) * 20, player.y + Math.sin(Math.atan2(mouseY - player.y, mouseX - player.x)) * 20);
    ctx.stroke();

    bullets.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    enemies.forEach(e => {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1;
    });

    if (!gameOver) requestAnimationFrame(loop);
}

function loop() {
    update();
    draw();
}

loop();