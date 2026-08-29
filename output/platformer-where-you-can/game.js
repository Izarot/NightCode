export default class LumenStrider {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.W = 1280; this.H = 720;
    this.scale = 1; this.offsetX = 0; this.offsetY = 0;
    this.resize(); window.addEventListener('resize', () => this.resize());
    this.keys = {}; this.kprev = {};
    this.setupInput();
    this.state = 'title';
    this.time = 0; this.dt = 0; this.lastTime = 0;
    this.speedrunTime = 0; this.highScore = this.loadHighScore();
    this.initAudio();
    this.initPlayer();
    this.initLevels();
    this.initUI();
    this.maskC = document.createElement('canvas');
    this.maskC.width = 160; this.maskC.height = 90;
    this.maskCtx = this.maskC.getContext('2d', { willReadFrequently: true });
    this.maskData = null;
    this.noiseCanvas = document.createElement('canvas');
    this.noiseC = document.createElement('canvas');
    this.noiseC.width = 256; this.noiseC.height = 256;
    this.noiseCtx = this.noiseC.getContext('2d');
    this.generateNoise();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const sw = this.canvas.width / this.W;
    const sh = this.canvas.height / this.H;
    this.scale = Math.min(sw, sh);
    this.offsetX = (this.canvas.width - this.W * this.scale) / 2;
    this.offsetY = (this.canvas.height - this.H * this.scale) / 2;
  }
  setupInput() {
    const kd = e => { this.keys[e.code] = true; if(['Space','ArrowUp'].includes(e.code)) e.preventDefault(); };
    const ku = e => { this.keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('mousemove', e => { this.mx = e.clientX; this.my = e.clientY; });
    window.addEventListener('mousedown', e => { if(e.button === 0) this.moused = true; if(e.button === 2) this.rmoused = true; });
    window.addEventListener('mouseup', e => { if(e.button === 0) this.moused = false; if(e.button === 2) this.rmoused = false; });
    window.addEventListener('contextmenu', e => e.preventDefault());
    this.mx = 0; this.my = 0; this.moused = false; this.rmoused = false;
    this.setupMobile();
  }
  setupMobile() {
    const joy = document.getElementById('joystick');
    const stk = document.getElementById('jstick');
    if(!joy) return;
    let active = false, ox = 0, oy = 0;
    joy.addEventListener('touchstart', e => { active = true; const r = joy.getBoundingClientRect(); ox = r.left + r.width/2; oy = r.top + r.height/2; e.preventDefault(); });
    joy.addEventListener('touchmove', e => { if(!active) return; const t = e.touches[0]; const dx = t.clientX - ox; const dy = t.clientY - oy; const d = Math.min(Math.sqrt(dx*dx+dy*dy), 40); const a = Math.atan2(dy, dx); const nx = Math.cos(a)*d; const ny = Math.sin(a)*d; stk.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`; this.joyx = nx/40; this.joyy = ny/40; e.preventDefault(); });
    joy.addEventListener('touchend', () => { active = false; stk.style.transform = 'translate(-50%, -50%)'; this.joyx = 0; this.joyy = 0; });
    const jA = document.getElementById('jA');
    const jB = document.getElementById('jB');
    if(jA) { jA.addEventListener('touchstart', () => this.keys['Space'] = true); jA.addEventListener('touchend', () => this.keys['Space'] = false); }
    if(jB) { jB.addEventListener('touchstart', () => this.rmoused = true); jB.addEventListener('touchend', () => this.rmoused = false); }
    this.joyx = 0; this.joyy = 0;
  }
  initAudio() {
    this.audioCtx = null;
    this.sounds = {};
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioCtx.destination);
      this.createSounds();
    } catch(e) { console.log('Audio not supported'); }
  }
  createSounds() {
    if(!this.audioCtx) return;
    const ctx = this.audioCtx;
    const mkTone = (freq, dur, type = 'sine', vol = 0.2) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(this.masterGain);
      o.start(); o.stop(ctx.currentTime + dur);
    };
    this.sounds.jump = () => mkTone(280, 0.15, 'sine', 0.15);
    this.sounds.land = () => mkTone(80, 0.2, 'sine', 0.25);
    this.sounds.collect = () => { mkTone(523, 0.1, 'sine', 0.2); setTimeout(() => mkTone(659, 0.15, 'sine', 0.2), 80); };
    this.sounds.death = () => mkTone(60, 0.8, 'sawtooth', 0.3);
    this.sounds.start = () => { mkTone(220, 0.3, 'triangle', 0.25); mkTone(330, 0.4, 'triangle', 0.2); };
    this.sounds.menu = () => mkTone(440, 0.08, 'sine', 0.1);
    this.sounds.level = () => { mkTone(330, 0.2, 'triangle', 0.2); setTimeout(() => mkTone(440, 0.3, 'triangle', 0.2), 150); };
    this.sounds.hum = () => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 60;
      g.gain.value = 0.04;
      o.connect(g); g.connect(this.masterGain);
      o.start(); this.humOsc = o; this.humGain = g;
    };
  }
  play(s) { if(this.sounds[s] && this.audioCtx) { if(this.audioCtx.state === 'suspended') this.audioCtx.resume(); this.sounds[s](); } }
  initPlayer() {
    this.p = {
      x: 100, y: 400, vx: 0, vy: 0,
      w: 18, h: 28,
      grounded: false, wasG: false,
      coyote: 0, jbuf: 0,
      lampR: 80, lampCore: 1, lampTilt: 0,
      dead: false,
      acc: 0.5, airAcc: 0.3, maxSpd: 3.5, jF: -8.5, grav: 0.45, fric: 0.85
    };
  }
  initLevels() {
    this.levels = [
      { name: "The Awakening", platforms: [{x:50,y:500,w:200,h:20},{x:350,y:480,w:150,h:20},{x:600,y:450,w:120,h:20},{x:850,y:420,w:150,h:20},{x:1100,y:400,w:130,h:20}], lights: [{x:100,y:450,t:'static',r:100},{x:400,y:430,t:'static',r:90},{x:650,y:400,t:'static',r:85}], orbs: [{x:400,y:430},{x:850,y:370}], goal: {x:1150,y:360} },
      { name: "Flickering Ruins", platforms: [{x:80,y:500,w:150,h:20},{x:320,y:470,w:100,h:20},{x:520,y:440,w:100,h:20},{x:720,y:410,w:100,h:20},{x:920,y:380,w:100,h:20},{x:1100,y:350,w:120,h:20}], lights: [{x:150,y:450,t:'timed',r:80,on:2000,off:2000},{x:570,y:390,t:'timed',r:80,on:2000,off:2000},{x:970,y:330,t:'static',r:90}], orbs: [{x:320,y:420},{x:720,y:360}], goal: {x:1150,y:310} },
      { name: "Sunken Gallery", platforms: [{x:60,y:520,w:120,h:20},{x:280,y:490,w:100,h:20},{x:480,y:450,w:100,h:20},{x:680,y:420,w:100,h:20},{x:880,y:390,w:100,h:20},{x:1050,y:360,w:150,h:20}], lights: [{x:100,y:470,t:'static',r:85},{x:520,y:400,t:'moving',r:70,path:{x1:480,y1:400,x2:580,y2:400},spd:1.5},{x:900,y:340,t:'static',r:80}], orbs: [{x:280,y:440},{x:680,y:370}], goal: {x:1100,y:320} },
      { name: "Clockwork Spire", platforms: [{x:50,y:540,w:100,h:20},{x:250,y:500,w:80,h:20},{x:430,y:460,w:80,h:20},{x:610,y:420,w:80,h:20},{x:790,y:380,w:80,h:20},{x:970,y:340,w:80,h:20},{x:1120,y:300,w:100,h:20}], lights: [{x:100,y:490,t:'static',r:75},{x:470,y:410,t:'moving',r:65,path:{x1:430,y1:410,x2:510,y2:410},spd:2},{x:810,y:330,t:'static',r:70},{x:1150,y:250,t:'static',r:80}], orbs: [{x:250,y:450},{x:610,y:370}], goal: {x:1160,y:260} },
      { name: "Eternal Dark", platforms: [{x:40,y:560,w:80,h:20},{x:220,y:520,w:60,h:20},{x:390,y:480,w:60,h:20},{x:560,y:440,w:60,h:20},{x:730,y:400,w:60,h:20},{x:900,y:360,w:60,h:20},{x:1070,y:320,w:140,h:20}], lights: [{x:80,y:510,t:'static',r:65},{x:420,y:430,t:'timed',r:55,on:1500,off:1500},{x:760,y:350,t:'static',r:60},{x:1100,y:270,t:'static',r:70}], orbs: [{x:390,y:430},{x:900,y:310}], goal: {x:1130,y:280} }
    ];
    this.clvl = 0;
    this.collected = [];
  }
  initUI() {
    document.getElementById('title').classList.add('active');
    document.getElementById('hud').classList.remove('active');
    const bres = document.getElementById('bres');
    const brest = document.getElementById('brest');
    if(bres) bres.onclick = () => { this.state = 'play'; document.getElementById('pause').classList.remove('active'); };
    if(brest) brest.onclick = () => { this.state = 'play'; document.getElementById('pause').classList.remove('active'); this.loadLevel(this.clvl); };
    this.updateHighScoreDisplay();
  }
  loadLevel(i) {
    const lv = this.levels[i];
    this.p.x = lv.platforms[0].x + lv.platforms[0].w/2;
    this.p.y = lv.platforms[0].y - 50;
    this.p.vx = 0; this.p.vy = 0;
    this.p.grounded = false; this.p.dead = false; this.p.lampCore = 1;
    this.p.lampR = 80; this.p.lampTilt = 0;
    this.collected = [];
    this.speedrunTime = 0;
    this.lvTime = 0;
    this.updateFragments();
  }
  startGame() {
    this.state = 'play';
    this.clvl = 0;
    document.getElementById('title').classList.remove('active');
    document.getElementById('hud').classList.add('active');
    this.loadLevel(0);
    this.play('start');
    if(this.humOsc && this.audioCtx) { this.humGain.gain.value = 0.04; }
  }
  generateNoise() {
    const img = this.noiseCtx.createImageData(256, 256);
    for(let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v; img.data[i+3] = 20;
    }
    this.noiseCtx.putImageData(img, 0, 0);
  }
  loop(t) {
    this.dt = Math.min((t - this.lastTime) / 1000, 0.05);
    this.lastTime = t;
    this.time += this.dt;
    this.update();
    this.render();
    requestAnimationFrame(this.loop);
  }
  update() {
    this.kprev = {...this.keys};
    if(this.state === 'title') {
      if(this.keys['Space'] || this.moused) { this.startGame(); }
    } else if(this.state === 'play') {
      if(this.keys['Escape']) { this.state = 'pause'; document.getElementById('pause').classList.add('active'); this.play('menu'); }
      else this.updatePlayer();
    } else if(this.state === 'pause') {
      if(this.keys['Escape']) { this.state = 'play'; document.getElementById('pause').classList.remove('active'); }
    } else if(this.state === 'death') {
      this.speedrunTime += this.dt;
      if(this.speedrunTime > 1.5) {
        this.state = 'play';
        document.getElementById('death').classList.remove('active');
        this.loadLevel(this.clvl);
      }
    }
    if(this.state === 'play' || this.state === 'death') {
      this.speedrunTime += this.dt;
      this.lvTime += this.dt;
      this.updateTimer();
    }
  }
  updatePlayer() {
    const p = this.p;
    if(p.dead) return;
    let ix = 0;
    if(this.keys['KeyA'] || this.keys['ArrowLeft']) ix -= 1;
    if(this.keys['KeyD'] || this.keys['ArrowRight']) ix += 1;
    if(this.joyx !== undefined) ix += this.joyx;
    const acc = p.grounded ? p.acc : p.airAcc;
    p.vx += ix * acc;
    if(ix === 0) p.vx *= p.fric;
    p.vx = Math.max(-p.maxSpd, Math.min(p.maxSpd, p.vx));
    if(this.keys['Space'] || this.keys['KeyW'] || this.keys['ArrowUp']) {
      if(p.coyote > 0 || p.jbuf > 0) {
        p.vy = p.jF; p.coyote = 0; p.jbuf = 0;
        this.play('jump');
      } else p.jbuf = 6;
    } else p.jbuf = Math.max(0, p.jbuf - 1);
    if(!this.keys['Space'] && !this.keys['KeyW'] && p.vy < -2) p.vy *= 0.5;
    p.vy += p.grav;
    p.x += p.vx; p.y += p.vy;
    const focus = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.rmoused;
    p.lampR = focus ? 30 : (80 + Math.sin(this.time * 0.1) * 2);
    p.lampTilt = p.vx * 0.12 + (p.grounded ? 0 : Math.min(p.vy * 0.04, 0.45));
    p.wasG = p.grounded; p.grounded = false;
    const lv = this.levels[this.clvl];
    for(const pl of lv.platforms) {
      if(this.checkPlatColl(p, pl)) { p.grounded = true; break; }
    }
    if(!p.grounded) {
      const fy = p.y + p.h/2 + 5;
      if(this.isLit(p.x, fy, 0.3) && this.isLit(p.x, p.y + p.h/2, 0.3)) {
        for(let ty = fy; ty < fy + 60; ty += 2) {
          if(!this.isLit(p.x, ty, 0.3)) { p.y = ty - p.h/2 - 1; p.grounded = true; break; }
        }
      }
    }
    if(p.grounded && !p.wasG && p.vy >= 0) { p.vy = 0; this.play('land'); }
    if(p.grounded) p.coyote = 6; else p.coyote = Math.max(0, p.coyote - 1);
    p.x = Math.max(p.w/2, Math.min(this.W - p.w/2, p.x));
    p.lampCore -= 0.0008;
    for(const orb of lv.orbs) {
      if(!this.collected.includes(orb) && Math.hypot(p.x - orb.x, p.y - orb.y) < 30) {
        this.collected.push(orb);
        p.lampCore = Math.min(1, p.lampCore + 0.4);
        this.play('collect');
        this.updateFragments();
      }
    }
    if(Math.hypot(p.x - lv.goal.x, p.y - lv.goal.y) < 40) {
      this.clvl++;
      if(this.clvl >= this.levels.length) { this.victory(); }
      else { this.play('level'); this.loadLevel(this.clvl); }
    }
    if(p.y > this.H + 50 || p.lampCore <= 0) { this.killPlayer(); }
    if(p.grounded) {
      const fy2 = p.y + p.h/2 + 2;
      if(!this.isLit(p.x, fy2, 0.3)) p.grounded = false;
    }
  }
  checkPlatColl(p, pl) {
    const l = p.x - p.w/2, r = p.x + p.w/2;
    const t = p.y - p.h/2, b = p.y + p.h/2;
    if(r > pl.x && l < pl.x + pl.w && b > pl.y && t < pl.y + pl.h) {
      if(this.isLit(p.x, b, 0.3)) {
        if(p.vy > 0 && b <= pl.y + p.vy + 5) { p.y = pl.y - p.h/2; p.vy = 0; return true; }
      }
    }
    return false;
  }
  renderLightMask() {
    this.maskCtx.fillStyle = '#000';
    this.maskCtx.fillRect(0, 0, 160, 90);
    this.maskCtx.globalCompositeOperation = 'lighter';
    const lv = this.levels[this.clvl];
    const p = this.p;
    if(!p.dead) {
      const lx = (p.x / this.W) * 160;
      const ly = (p.y / this.H) * 90;
      const lr = (p.lampR / this.W) * 160;
      const g = this.maskCtx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.5)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      this.maskCtx.fillStyle = g;
      this.maskCtx.beginPath();
      this.maskCtx.arc(lx, ly, lr, 0, Math.PI * 2);
      this.maskCtx.fill();
    }
    const now = Date.now();
    for(const l of lv.lights) {
      if(l.t === 'static' || (l.t === 'timed' && (now % (l.on + l.off)) < l.on) || l.t === 'moving') {
        let lx2 = l.x, ly2 = l.y;
        if(l.t === 'moving' && l.path) {
          const t = (Math.sin(this.time * l.spd) + 1) / 2;
          lx2 = l.path.x1 + (l.path.x2 - l.path.x1) * t;
          ly2 = l.path.y1 + (l.path.y2 - l.path.y1) * t;
        }
        const px = (lx2 / this.W) * 160;
        const py = (ly2 / this.H) * 90;
        const pr = (l.r / this.W) * 160;
        const g = this.maskCtx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(0.6, 'rgba(255,255,255,0.4)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        this.maskCtx.fillStyle = g;
        this.maskCtx.beginPath();
        this.maskCtx.arc(px, py, pr, 0, Math.PI * 2);
        this.maskCtx.fill();
      }
    }
    this.maskCtx.globalCompositeOperation = 'source-over';
    this.maskData = this.maskCtx.getImageData(0, 0, 160, 90);  }  isLit(x, y, thr) {    if(!this.maskData) return true;    const px = Math.floor((x / this.W) * 160);    const py = Math.floor((y / this.H) * 90);    if(px < 0 || px >= 160 || py < 0 || py >= 90) return false;    const idx = (py * 160 + px) * 4;    const bright = (this.maskData.data[idx] + this.maskData.data[idx + 1] + this.maskData.data[idx + 2]) / 3;    return bright / 255 > thr;  }  render() {    const ctx = this.ctx;    ctx.fillStyle = '#0A0814';    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);    ctx.save();    ctx.translate(this.offsetX, this.offsetY);    ctx.scale(this.scale, this.scale);    ctx.fillStyle = '#1a1525';    ctx.fillRect(0, 0, this.W, this.H);    if(this.state !== 'title') this.renderLevel();    if(this.state === 'play' || this.state === 'death') this.renderPlayer();    ctx.restore();    if(this.state !== 'title') this.applyVignette();  }  renderLevel() {    const ctx = this.ctx;    const lv = this.levels[this.clvl];    for(const pl of lv.platforms) {      if(this.isLit(pl.x + pl.w/2, pl.y + pl.h/2, 0.2)) {        ctx.fillStyle = '#2d2845';        ctx.fillRect(pl.x, pl.y, pl.w, pl.h);        ctx.fillStyle = 'rgba(255,210,122,0.08)';        ctx.fillRect(pl.x, pl.y, pl.w, 3);      }    }    for(const l of lv.lights) {      let lx = l.x, ly = l.y;      if(l.t === 'moving' && l.path) {        const t = (Math.sin(this.time * l.spd) + 1) / 2;        lx = l.path.x1 + (l.path.x2 - l.path.x1) * t;        ly = l.path.y1 + (l.path.y2 - l.path.y1) * t;      }      if(l.t === 'static' || (l.t === 'timed' && (Date.now() % (l.on + l.off)) < l.on)) {        if(this.isLit(lx, ly, 0.1)) {          ctx.save();          ctx.globalAlpha = 0.15;          const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, l.r * 1.5);          g.addColorStop(0, '#FFD27A');          g.addColorStop(1, 'transparent');          ctx.fillStyle = g;          ctx.beginPath();          ctx.arc(lx, ly, l.r * 1.5, 0, Math.PI * 2);          ctx.fill();          ctx.restore();          ctx.fillStyle = '#FFD27A';          ctx.beginPath();          ctx.arc(lx, ly, 4, 0, Math.PI * 2);          ctx.fill();        }      }    }    for(const orb of lv.orbs) {      if(!this.collected.includes(orb) && this.isLit(orb.x, orb.y, 0.15)) {        ctx.save();        ctx.translate(orb.x, orb.y);        ctx.rotate(this.time * 0.8);        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);        g.addColorStop(0, 'rgba(255,255,255,0.9)');        g.addColorStop(0.5, 'rgba(255,210,122,0.5)');        g.addColorStop(1, 'transparent');        ctx.fillStyle = g;        ctx.fillRect(-12, -12, 24, 24);        ctx.fillStyle = '#fff';        ctx.beginPath();        ctx.arc(0, 0, 4, 0, Math.PI * 2);        ctx.fill();        ctx.restore();      }    }    const gx = lv.goal.x, gy = lv.goal.y;    if(this.isLit(gx, gy, 0.1)) {      ctx.save();      ctx.translate(gx, gy);      ctx.rotate(this.time * 0.3);      ctx.strokeStyle = 'rgba(255,255,255,0.6)';      ctx.lineWidth = 2;      for(let i = 0; i < 4; i++) {        ctx.beginPath();        ctx.moveTo(0, -25);        ctx.lineTo(0, -35);        ctx.stroke();        ctx.rotate(Math.PI / 2);      }      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);      g.addColorStop(0, 'rgba(255,255,255,0.4)');      g.addColorStop(1, 'transparent');      ctx.fillStyle = g;      ctx.beginPath();      ctx.arc(0, 0, 25, 0, Math.PI * 2);      ctx.fill();      ctx.restore();    }  }  renderPlayer() {    const ctx = this.ctx;    const p = this.p;    if(p.dead) return;    if(!this.isLit(p.x, p.y, 0.2)) return;    ctx.save();    ctx.translate(p.x, p.y);    const dir = p.vx > 0.1 ? 1 : p.vx < -0.1 ? -1 : 0;    if(dir !== 0) ctx.scale(dir, 1);    ctx.fillStyle = '#e8e0d5';    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h * 0.65);    ctx.fillStyle = '#FFD27A';    ctx.beginPath();    ctx.arc(0, -p.h/2 + 8, 6, 0, Math.PI * 2);    ctx.fill();    ctx.fillStyle = '#3B82F6';    ctx.fillRect(-p.w/2 + 2, -p.h/2 + p.h * 0.6, p.w - 4, p.h * 0.35);    ctx.restore();    ctx.save();    ctx.translate(p.x, p.y);    ctx.rotate(p.lampTilt);    ctx.globalAlpha = 0.25 + p.lampCore * 0.35;    const lg = ctx.createLinearGradient(0, 0, 0, -p.lampR * 1.2);    lg.addColorStop(0, 'rgba(255,210,122,0.9)');    lg.addColorStop(1, 'transparent');    ctx.fillStyle = lg;    ctx.beginPath();    ctx.moveTo(-15, 0);    ctx.lineTo(-8, -p.lampR * 1.2);    ctx.lineTo(8, -p.lampR * 1.2);    ctx.lineTo(15, 0);    ctx.closePath();    ctx.fill();    ctx.restore();    ctx.save();    ctx.globalAlpha = 0.08;    ctx.fillStyle = '#FFD27A';    ctx.beginPath();    ctx.arc(p.x, p.y, p.lampR * 0.4, 0, Math.PI * 2);    ctx.fill();    ctx.restore();  }  applyVignette() {    const ctx = this.ctx;    ctx.save();    ctx.setTransform(1, 0, 0, 1, 0, 0);    const g = ctx.createRadialGradient(this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.3, this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.85);    g.addColorStop(0, 'transparent');    g.addColorStop(1, 'rgba(0,0,0,0.75)');    ctx.fillStyle = g;    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);    ctx.restore();  }  killPlayer() {    if(this.p.dead) return;    this.p.dead = true;    this.play('death');    this.state = 'death';    this.speedrunTime = 0;    document.getElementById('death').classList.add('active');    if(this.humOsc && this.humGain) this.humGain.gain.value = 0.01;  }  victory() {    const total = this.speedrunTime;    if(!this.highScore || total < this.highScore) {      this.highScore = total;      this.saveHighScore();    }    this.updateHighScoreDisplay();    this.clvl = 0;    this.state = 'title';    document.getElementById('hud').classList.remove('active');    document.getElementById('title').classList.add('active');    if(this.humOsc && this.humGain) this.humGain.gain.value = 0;  }  updateTimer() {    const el = document.getElementById('timer');    if(el) el.textContent = this.formatTime(this.speedrunTime);  }  formatTime(s) {    const m = Math.floor(s / 60);    const sec = s % 60;    return `${String(m).padStart(2, '0')}:${sec.toFixed(2).padStart(5, '0')}`;  }  updateFragments() {    const frags = document.querySelectorAll('.frag');    const lv = this.levels[this.clvl];    frags.forEach((f, i) => {      f.classList.toggle('collected', i < this.collected.length);    });  }  loadHighScore() {    try {      const s = localStorage.getItem('lumenstrider_best');      return s ? parseFloat(s) : null;    } catch(e) { return null; }  }  saveHighScore() {    try {      localStorage.setItem('lumenstrider_best', this.highScore);    } catch(e) {}  }  updateHighScoreDisplay() {    const el = document.getElementById('highscore');    if(el) el.textContent = this.highScore ? `BEST: ${this.formatTime(this.highScore)}` : 'BEST: --:--';  }}}