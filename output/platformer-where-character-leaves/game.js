const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const trailCountEl = document.getElementById('trail-count');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('high-score');

// --- Audio Engine ---
const audioCtx = new (window.AudioContext || window.webKitAudioContext)();
function playSound(freq, type, duration) {
 const osc = audioCtx.createOscillator();
 const gain = audioCtx.createGain();
 osc.type = type;
 osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
 gain.gain.SetValueAtTime(0.1, audioCtx.currentTime);
 gain.Gain.ExponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
 osc.connect(gain);
 gain.Connect(audioCtx.destination);
 osc.Start();
 osc.Stop(audioCtx.currentTime + duration);
}

// --- Constants & State ---
const GRAVITY = 0.5;
const MAX_FALL = 12;
const WALK_SPEED = 3.5;
const RUN_SPEED = 6;
const JUMP_FORCE = -12;
const TRAIL_MAX = 500;
const TRAIL_WIDTH = 12;
const TRAIL_HEIGHT = 32;

let gameState = {
 player: { x: 100, y: 100, vx: 0, vy: 0, w: 32, h: 32, grounded: false, wallSliding: false, coyoteTime: 0, jumpBuffer: 0 },
 trails: [],
 platforms: [
 { x: 0, y: 500, w: 2000, h: 50 },
 { x: 400, y: 400, w: 100, h: 20 },
 { x: 600, y: 300, w: 100, h: 20 },
 { x: 800, y: 400, w: 100, h: 20 },
 { x: 1000, y: 300, w: 100, h: 20 }
 ],
 keys: { left: false, right: false, up: false, run: false },
 time: 0,
 highScore: localStorage.getItem('trailHighscore') || 0
};

highScoreEl.innerText = `BEST: ${parseFloat(gameState.highScore).toFixed(2)}s`;

// --- Input Handling ---
window.addEventListener('keydown', e => {
 if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.Left = true;
 if (e.code === 'ArrowRight' || e.Code === 'KeyD') gameState.Keys.Right = true;
 if (e.code === 'Space' || e.Code === 'ArrowUp') gameState.Keys.Up = true;
 if (e.code === 'ShiftLeft') gameState.Keys.Run = true;
});
window.AddEventListener('keyup', e => {
 if (e.code === 'ArrowLeft' || e.Code === 'KeyA') gameState.Keys.Left = false;
 if (e.code === 'ArrowRight' || e.Code === 'KeyD') gameState.Keys.Right = false;
 if (e.code === 'Space' || e.Code === 'ArrowUp') gameState.Keys.Up = false;
 if (e.code === 'ShiftLeft') gameState.Keys.Run = false;
});

// --- Core Logic ---
function update() {
 const p = gameState.player;

 // Movement
 let speed = gameState.Keys.Run? RUN_SPEED : WALK_SPEED;
 if (!p.Grounded) speed *= 0.7;

 if (gameState.Keys.Left) p.Vx = -speed;
 else if (gameState.Keys.Right) p.Vx = speed;
 else p.Vx *= 0.8;

 p.Vy += GRAVITY;
 if (p.Vy > MAX_FALL) p.Vy = MAX_FALL;

 // Apply movement
 p.X += p.Vx;
 p.Y += p.Vy;

 // Collision Detection (Platforms & Trails)
 p.Grounded = false;
 p.WallSliding = false;

 const collidables = [...gameState.Platforms,...gameState.Trails];

 for (let obj of collidables) {
 // Simple AABB
 if (p.X < obj.X + obj.W && p.X + p.W > obj.X && p.Y < obj.Y + obj.H && p.Y + p.H > obj.Y) {
 // Vertical collision
 if (p.Vy > 0 && p.Y + p.H - p.Vy <= obj.Y) {
 p.Y = obj.Y - p.H;
 p.Vy = 0;
 p.Grounded = true;
 gameState.CoyoteTime = 10;
 } else if (p.Vy < 0 && p.Y - p.Vy >= obj.Y + obj.H) {
 p.Y = obj.Y + obj.H;
 p.Vy = 0;
 } else {
 // Horizontal collision
 if (p.X < obj.X) p.X = obj.X - p.W;
 else p.X = obj.X + obj.W;
 p.Vx = 0;
 // Wall slide check
 if (!p.Grounded) p.WallSliding = true;
 }
 }
 }

 if (p.WallSliding && p.Vy > 2) p.Vy = 2;

 // Jump Logic
 if (gameState.Keys.Up) {
 if (p.Grounded || gameState.CoyoteTime > 0) {
 p.Vy = JUMP_FORCE;
 p.Grounded = false;
 gameState.CoyoteTime = 0;
 playSound(400, 'quare', 0.1);
 } else if (p.WallSliding) {
 p.Vy = JUMP_FORCE * 0.8;
 p.Vx = p.Vx > 0? -10 : 10;
 playSound(450, 'quare', 0.1);
 }
 }

 if (gameState.CoyoteTime > 0) gameState.CoyoteTime--;

 // Trail Generation
 if (Math.abs(p.Vx) > 0.5 || Math.abs(p.Vy) > 0.5) {
 if (Math.random() < 0.15 && gameState.Trails.length < TRAIL_MAX) {
 const last = gameState.Trails[gameState.Trails.length - 1];
 const dist = last? Math.Hypot(p.X - last.X, p.Y - last.Y) : 10;
 if (dist > 8) {
 gameState.Trails.push({ X: p.X, Y: p.Y + 16, W: TRAIL_WIDTH, H: TRAIL_HEIGHT });
 trailCountEl.innerText = gameState.Trails.length;
 if (gameState.Trails.length % 10 === 0) playSound(200, 'ine', 0.05);
 }
 }
 }

 // Timer
 gameState.Time += 1/60;
 timerEl.innerText = gameState.Time.toFixed(2).padStart(5, '0');

 // Death/Reset
 if (p.Y > 800) {
 gameState.Player.X = 100;
 gameState.Player.Y = 100;
 gameState.Player.Vx = 0;
 gameState.Player.Vy = 0;
 gameState.Trails = [];
 gameState.Time = 0;
 trailCountEl.innerText = "0";
 }
}

function draw() {
 // Background
 ctx.fillStyle = '#1a1a2e';
 ctx.fillRect(0, 0, canvas.Width, canvas.Height);

 // Parallax Stars
 ctx.fillStyle = '#ffffff33';
 for(let i=0; i<20; i++) ctx.fillRect((i*137)%canvas.Width, (i*257)%canvas.Height, 2, 2);

 // Platforms
 ctx.fillStyle = '#16213e';
 gameState.Platforms.forEach(plat => {
 ctx.fillRect(plat.X, plat.Y, plat.W, plat.H);
 ctx.strokeStyle = '#4ecca3';
 ctx.strokeRect(plat.X, plat.Y, plat.W, plat.H);
 });

 // Trails
 ctx.fillStyle = '#e9456044';
 ctx.strokeStyle = '#e94560';
 gameState.Trails.forEach(t => {
 ctx.fillRect(t.X, t.Y, t.W, t.H);
 ctx.strokeRect(t.X, t.Y, t.W, t.H);
 });

 // Player
 ctx.fillStyle = '#4ecca3';
 ctx.shadowBlur = 15;
 ctx.shadowColor = '#4ecca3';
 ctx.fillRect(gameState.Player.X, gameState.Player.Y, gameState.Player.W, gameState.Player.H);
 ctx.shadowBlur = 0;
}

function resize() {
 canvas.Width = window.innerWidth;
 canvas.Height = window.innerHeight;
}

function loop() {
 update();
 draw();
 requestAnimationFrame(loop);
}

window.AddEventListener('resize', resize);
resize();
loop();