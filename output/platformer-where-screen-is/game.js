(function () {
  'use strict';

  // ---- Canvas + responsive scaling ----
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const BASE_W = 480, BASE_H = 720;
  let scale = 1, cssW = BASE_W, cssH = BASE_H;

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / BASE_W, vh / BASE_H);
    scale = s;
    cssW = BASE_W * s;
    cssH = BASE_H * s;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(BASE_W * dpr);
    canvas.height = Math.round(BASE_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- Web Audio sound effects ----
  let audioCtx = null;
  function ac() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }
  function beep(freq, dur, type, vol) {
    try {
      const c = ac();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = vol || 0.15;
      o.connect(g); g.connect(c.destination);
      const t = c.currentTime;
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) {}
  }
  const sfx = {
    catch: function () { beep(660, 0.12, 'triangle', 0.18); setTimeout(function(){beep(990,0.1,'triangle',0.14);},60); },
    bomb: function () { beep(120, 0.35, 'sawtooth', 0.22); beep(80, 0.4, 'square', 0.18); },
    win:  function () { [523,659,784,1047].forEach(function(f,i){setTimeout(function(){beep(f,0.18,'triangle',0.2);},i*120);}); },
    start:function () { beep(440,0.1,'square',0.15); setTimeout(function(){beep(880,0.12,'square',0.15);},100); }
  };

  // ---- Game state ----
  const TARGET = 50;
  const state = {
    running: false, over: false, won: false,
    score: 0, best: 0, startTime: 0, elapsed: 0,
    paddle: { x: BASE_W/2, y: BASE_H - 60, w: 90, h: 16, vx: 0 },
    items: [], spawnT: 0, spawnEvery: 0.55,
    keys: {}, pointerX: null, particles: [], shake: 0
  };

  // ---- High score (localStorage) ----
  const HS_KEY = 'neonCatcher_best';
  const HS_TIME_KEY = 'neonCatcher_bestTime';
  function loadBest() {
    state.best = parseInt(localStorage.getItem(HS_KEY) || '0', 10) || 0;
    document.getElementById('best').textContent = state.best;
  }
  function saveBest() {
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(HS_KEY, String(state.best));
      document.getElementById('best').textContent = state.best;
    }
    if (state.won) {
      const prevBest = parseFloat(localStorage.getItem(HS_TIME_KEY) || '9999');
      if (state.elapsed < prevBest) localStorage.setItem(HS_TIME_KEY, state.elapsed.toFixed(2));
    }
  }
  loadBest();

  // ---- Input ----
  window.addEventListener('keydown', function (e) {
    state.keys[e.key] = true;
    if (e.key === ' ' && !state.running) startGame();
  });
  window.addEventListener('keyup', function (e) { state.keys[e.key] = false; });

  function pointerMove(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width * BASE_W;
    state.pointerX = Math.max(0, Math.min(BASE_W, x));
  }
  canvas.addEventListener('mousemove', function (e) { pointerMove(e.clientX); });
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault(); if (e.touches[0]) pointerMove(e.touches[0].clientX);
  }, { passive: false });
  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault(); if (e.touches[0]) pointerMove(e.touches[0].clientX);
  }, { passive: false });

  document.getElementById('startBtn').addEventListener('click', startGame);

  // ---- Game flow ----
  function startGame() {
    ac();
    sfx.start();
    state.running = true; state.over = false; state.won = false;
    state.score = 0; state.items = []; state.particles = [];
    state.spawnT = 0; state.startTime = performance.now(); state.elapsed = 0;
    state.paddle.x = BASE_W/2; state.shake = 0;
    document.getElementById('score').textContent = '0';
    document.getElementById('overlay').classList.add('hidden');
  }

  function endGame(won) {
    state.running = false; state.over = true; state.won = won;
    saveBest();
    if (won) sfx.win(); else sfx.bomb();
    const ov = document.getElementById('overlay');
    ov.classList.remove('hidden');
    ov.innerHTML = '';
    const h1 = document.createElement('h1');
    h1.textContent = won ? 'YOU WIN! 🌈' : 'BOOM! 💥';
    h1.style.color = won ? '#b8ff5c' : '#ff3b6b';
    h1.style.textShadow = '0 0 20px ' + (won ? '#b8ff5c' : '#ff3b6b');
    ov.appendChild(h1);
    const p = document.createElement('p');
    p.textContent = 'Score: ' + state.score + ' / ' + TARGET;
    ov.appendChild(p);
    const t = document.createElement('p');
    t.textContent = 'Time: ' + state.elapsed.toFixed(2) + 's';
    ov.appendChild(t);
    if (won) {
      const bt = localStorage.getItem(HS_TIME_KEY);
      const bp = document.createElement('p');
      bp.style.color = '#ff5cf4';
      bp.textContent = 'Best Time: ' + (bt ? bt + 's' : state.elapsed.toFixed(2) + 's');
      ov.appendChild(bp);
    }
    const hint = document.createElement('p');
    hint.className = 'hint'; hint.textContent = 'Best Score: ' + state.best;
    ov.appendChild(hint);
    const btn = document.createElement('button');
    btn.textContent = '▶ PLAY AGAIN';
    btn.addEventListener('click', startGame);
    ov.appendChild(btn);
  }

  // ---- Spawning ----
  function spawnItem() {
    const isBomb = Math.random() < 0.22;
    const colors = ['#00f0ff', '#ff5cf4', '#b8ff5c', '#ffea00', '#ff8a3d'];
    state.items.push({
      x: 30 + Math.random() * (BASE_W - 60),
      y: -20,
      r: isBomb ? 16 : 13,
      vy: 130 + Math.random() * 90 + state.score * 4,
      bomb: isBomb,
      color: isBomb ? '#ff3b6b' : colors[(Math.random()*colors.length)|0],
      rot: 0
    });
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 160;
      state.particles.push({
        x: x, y: y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
        life: 0.6, max: 0.6, color: color, size: 2 + Math.random()*3
      });
    }
  }

  // ---- Update ----
  let last = performance.now();
  function update(dt) {
    if (!state.running) return;
    state.elapsed = (performance.now() - state.startTime) / 1000;
    document.getElementById('timer').textContent = state.elapsed.toFixed(2);

    // paddle movement
    const p = state.paddle;
    let target = p.x;
    if (state.pointerX !== null) target = state.pointerX;
    if (state.keys['ArrowLeft'] || state.keys['a']) p.vx = -360;
    else if (state.keys['ArrowRight'] || state.keys['d']) p.vx = 360;
    else p.vx = 0;
    if (state.pointerX !== null) {
      p.x += (target - p.x) * Math.min(1, dt * 14);
    } else {
      p.x += p.vx * dt;
    }
    p.x = Math.max(p.w/2, Math.min(BASE_W - p.w/2, p.x));

    // spawn
    state.spawnT += dt;
    const interval = Math.max(0.28, state.spawnEvery - state.score * 0.004);
    if (state.spawnT >= interval) {
      state.spawnT = 0;
      spawnItem();
    }

    // items
    for (let i = state.items.length - 1; i >= 0; i--) {
      const it = state.items[i];
      it.y += it.vy * dt;
      it.rot += dt * 4;
      // collision with paddle
      if (it.y + it.r > p.y - p.h/2 && it.y - it.r < p.y + p.h/2 &&
          it.x > p.x - p.w/2 - it.r && it.x < p.x + p.w/2 + it.r) {
        if (it.bomb) {
          burst(it.x, it.y, '#ff3b6b', 30);
          state.shake = 14;
          endGame(false);
          return;
        } else {
          state.score++;
          document.getElementById('score').textContent = state.score;
          burst(it.x, it.y, it.color, 14);
          sfx.catch();
          state.items.splice(i, 1);
          if (state.score >= TARGET) { endGame(true); return; }
          continue;
        }
      }
      if (it.y - it.r > BASE_H) {
        if (!it.bomb) {
          // missed an orb — small penalty shake
          state.shake = 4;
        }
        state.items.splice(i, 1);
      }
    }

    // particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const pt = state.particles[i];
      pt.life -= dt;
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      pt.vy += 220 * dt;
      if (pt.life <= 0) state.particles.splice(i, 1);
    }

    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 40);
  }

  // ---- Render ----
  function draw() {
    ctx.clearRect(0, 0, BASE_W, BASE_H);
    ctx.save();
    if (state.shake > 0) {
      ctx.translate((Math.random()-0.5)*state.shake, (Math.random()-0.5)*state.shake);
    }

    // background grid
    ctx.strokeStyle = 'rgba(255, 92, 244, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= BASE_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
    }
    for (let y = 0; y <= BASE_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
    }

    // items
    state.items.forEach(function (it) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.shadowBlur = 18; ctx.shadowColor = it.color;
      if (it.bomb) {
        ctx.font = '26px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 0);
      } else {
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.arc(0, 0, it.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(-it.r*0.3, -it.r*0.3, it.r*0.35, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    });

    // particles
    state.particles.forEach(function (pt) {
      const a = pt.life / pt.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.shadowBlur = 10; ctx.shadowColor = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;

    // paddle
    const p = state.paddle;
    ctx.save();
    ctx.shadowBlur = 22; ctx.shadowColor = '#00f0ff';
    const grad = ctx.createLinearGradient(p.x - p.w/2, 0, p.x + p.w/2, 0);
    grad.addColorStop(0, '#ff5cf4');
    grad.addColorStop(0.5, '#00f0ff');
    grad.addColorStop(1, '#b8ff5c');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(p.x - p.w/2, p.y - p.h/2, p.w, p.h, 8);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // ---- Loop ----
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(function (t) { last = t; requestAnimationFrame(loop); });

  // roundRect polyfill
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      this.beginPath();
      this.moveTo(x+r, y);
      this.arcTo(x+w, y, x+w, y+h, r);
      this.arcTo(x+w, y+h, x, y+h, r);
      this.arcTo(x, y+h, x, y, r);
      this.arcTo(x, y, x+w, y, r);
      this.closePath();
      return this;
    };
  }
})();
