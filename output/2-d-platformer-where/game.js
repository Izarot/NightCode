const C = {
  colors: { bg: '#0a0a12', player: '#00ffea', obstacle: '#ff00ff', trail: '#00ffea44', text: '#00ffea', particle: ['#00ffea', '#ff00ff', '#ffff00'] },
  gravity: 0.45, jump: -9.5, speed: 4, gap: 140, spawnRate: 1100
};
const $ = (id) => document.getElementById(id);
const cvs = $('game'), ctx = cvs.getContext('2d');
let W, H, scale, running, player, obstacles, particles, score, hiScore, startTime, animId, audioCtx;

function resize() {
  const ratio = 9/16; W = window.innerWidth; H = window.innerHeight;
  if (W/H > ratio) { W = H * ratio; }
  else { H = W / ratio; }
  cvs.width = W * devicePixelRatio; cvs.height = H * devicePixelRatio;
  cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
  ctx.scale(devicePixelRatio, devicePixelRatio);
  scale = Math.min(W, H) / 400;
}

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function beep(freq, dur, type='square', vol=0.1) { if (!audioCtx) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+dur); }
function sfxJump() { beep(440, 0.08, 'sine', 0.08); beep(880, 0.05, 'sine', 0.04); }
function sfxHit() { beep(150, 0.3, 'sawtooth', 0.15); beep(80, 0.5, 'square', 0.1); }
function sfxPoint() { beep(660, 0.05, 'triangle', 0.06); beep(1320, 0.05, 'triangle', 0.03); }

function reset() {
  player = { x: W*0.2, y: H/2, v: 0, r: 18*scale, trail: [], hue: 180 };
  obstacles = []; particles = []; score = 0; startTime = performance.now();
  $('score').textContent = 'SCORE: 0'; $('timer').textContent = 'TIME: 0.00s';
  $('msg').classList.remove('visible');
}

function spawnObstacle() {
  const minGap = C.gap * scale; const maxH = H - minGap - 40*scale;
  const topH = Math.random() * maxH + 20*scale;
  obstacles.push({ x: W, top: topH, bottom: H - topH - minGap, passed: false, w: 60*scale });
}

function update() {
  if (!running) return;
  player.v += C.gravity * scale; player.y += player.v;
  player.trail.unshift({x: player.x, y: player.y, a: 1}); if (player.trail.length > 8) player.trail.pop();

  if (Math.random() < 0.02) spawnObstacle();

  obstacles.forEach(o => { o.x -= C.speed * scale; });
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  obstacles.forEach(o => {
    if (!o.passed && o.x + o.w < player.x) { o.passed = true; score++; sfxPoint(); $('score').textContent = 'SCORE: ' + score; }
    const px = player.x, py = player.y, pr = player.r;
    if (px + pr > o.x && px - pr < o.x + o.w) {
      if (py - pr < o.top || py + pr > H - o.bottom) { gameOver(); }
    }
  });

  if (player.y - player.r < 0 || player.y + player.r > H) gameOver();

  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.02; p.r *= 0.95; });
  particles = particles.filter(p => p.life > 0);

  const elapsed = (performance.now() - startTime) / 1000;
  $('timer').textContent = 'TIME: ' + elapsed.toFixed(2) + 's';
}

function draw() {
  ctx.fillStyle = C.colors.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1a1a2e'; for(let i=0;i<W;i+=40*scale){ctx.fillRect(i,0,1*scale,H)};

  player.trail.forEach((t,i) => { ctx.beginPath(); ctx.arc(t.x, t.y, player.r*(1-i/8), 0, Math.PI*2); ctx.fillStyle = C.colors.trail.replace('44', Math.floor(68*(1-i/8)).toString(16).padStart(2,'0')); ctx.fill(); });
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r);
  grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, C.colors.player); ctx.fillStyle = grad; ctx.fill();
  ctx.shadowColor = C.colors.player; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;

  obstacles.forEach(o => {
    ctx.fillStyle = C.colors.obstacle; ctx.shadowColor = C.colors.obstacle; ctx.shadowBlur = 10;
    ctx.fillRect(o.x, 0, o.w, o.top); ctx.fillRect(o.x, H - o.bottom, o.w, o.bottom);
    ctx.shadowBlur = 0;
  });

  particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fillStyle = p.c; ctx.globalAlpha = p.life; ctx.fill(); ctx.globalAlpha = 1; });
}

function loop() { update(); draw(); animId = requestAnimationFrame(loop); }

function jump() { if (!running) start(); else { player.v = C.jump * scale; sfxJump(); } }
function start() { initAudio(); running = true; reset(); loop(); }
function gameOver() {
  running = false; cancelAnimationFrame(animId); sfxHit();
  for(let i=0;i<20;i++) particles.push({x:player.x,y:player.y,vx:(Math.random()-1)*8,vy:(Math.random()-1)*8,r:Math.random()*6+2,c:C.colors.particle[Math.floor(Math.random()*3)],life:1});
  if (score > hiScore) { hiScore = score; localStorage.setItem('neonDashHi', hiScore); $('hi').textContent = 'BEST: ' + hiScore; }
  $('msg').innerHTML = `GAME OVER<br>SCORE: ${score}<br>TAP TO RESTART`; $('msg').classList.add('visible');
}

window.addEventListener('resize', resize);
window.addEventListener('click', jump);
window.addEventListener('keydown', e => { if(e.code==='Space'){e.preventDefault(); jump();} });

resize();
hiScore = parseInt(localStorage.getItem('neonDashHi') || '0');
$('hi').textContent = 'BEST: ' + hiScore;
$('msg').classList.add('visible');