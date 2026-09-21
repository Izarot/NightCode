const CONFIG = {
  GRID_SIZE: 10,
  TILE_PX: 64,
  COLORS: { soil: '#5D4037', grass: '#2E7D32', water: '#0288D1', uiGold: '#FFD600', pink: '#EC407A', teal: '#00ACC1', orange: '#FF9800', white: '#FFF', black: '#000', red: '#F44336', purple: '#AB47BC', brown: '#795548', skyDay: '#87CEEB', skyNight: '#1A1A2E', cloud: '#FFF', rain: '#4FC3F7' },
  PLANT_TYPES: { common: ['Rose', 'Sunflower', 'Tulip'], rare: ['Crystal Bloom', 'Fireweed'], special: ['Pumpkin', 'Venus Flytrap'] },
  STAGES: ['Seedling', 'Budding', 'Blooming', 'Overgrown'],
  WATER_COST: [1, 2, 3, 1],
  GROW_TIME: 15000,
  WILT_TIME: 10000,
  MAX_WATER: 10,
  WATER_REGEN: 0.5,
  MOVE_SPEED: 2,
  ACCEL: 0.5,
  DECEL: 0.7,
  DIAG_PENALTY: 0.85
};

class Audio {
  constructor() { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.muted = false; }
  resume() { if (this.ctx.state === 'suspended') this.ctx.resume(); }
  beep(freq, dur, type='sine', vol=0.1) { if (this.muted) return; const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = vol; o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur); }
  water() { this.beep(800, 0.1, 'triangle', 0.05); this.beep(1200, 0.05, 'triangle', 0.03); }
  grow() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.beep(f, 0.1, 'sine', 0.08), i * 50)); }
  pest() { this.beep(200, 0.3, 'sawtooth', 0.05); }
  rain() { this.beep(400, 0.05, 'noise', 0.02); }
  tick() { this.beep(1000, 0.02, 'square', 0.03); }
}

class Particle {
  constructor(x, y, color, vel, life, size, gravity = 0) { this.x = x; this.y = y; this.color = color; this.vx = vel.x; this.vy = vel.y; this.life = life; this.maxLife = life; this.size = size; this.gravity = gravity; }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vy += this.gravity * dt; this.life -= dt; }
  draw(ctx) { ctx.globalAlpha = this.life / this.maxLife; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  isDead() { return this.life <= 0; }
}

class Plant {
  constructor(x, y, type) { this.x = x; this.y = y; this.type = type; this.stage = 0; this.water = 0; this.lastWatered = Date.now(); this.pests = 0; this.pestTimer = 0; this.bloomTime = 0; }
  getColor() {
    const c = CONFIG.COLORS;
    if (this.type === 'Crystal Bloom') return this.stage === 2 ? c.purple : c.teal;
    if (this.type === 'Fireweed') return c.orange;
    if (this.type === 'Pumpkin') return c.orange;
    if (this.type === 'Venus Flytrap') return c.red;
    return [c.pink, c.teal, c.orange][Math.abs(this.x + this.y * 10) % 3];
  }
  update(dt, game) {
    this.lastWatered += dt;
    if (this.pests > 0) { this.pestTimer += dt; if (this.pestTimer > 5000) { this.stage = Math.max(0, this.stage - 1); this.pests = 0; game.audio.pest(); } }
    if (this.stage < 3 && this.lastWatered > CONFIG.GROW_TIME) { this.stage++; this.lastWatered = 0; game.audio.grow(); game.particles.push(...this.spawnSparkles()); }
    if (this.stage === 3 && this.lastWatered > CONFIG.WILT_TIME) { /* stays overgrown */ }
  }
  water(amount, game) { this.water += amount; this.lastWatered = 0; this.pests = 0; game.particles.push(...this.spawnSplash()); game.audio.water();
    while (this.stage < 3 && this.water >= CONFIG.WATER_COST[this.stage]) { this.water -= CONFIG.WATER_COST[this.stage]; this.stage++; game.audio.grow(); game.particles.push(...this.spawnSparkles()); if (this.stage === 2) { game.score++; game.checkAchievements(); } }
    if (this.stage === 3 && this.water >= 1) { this.water -= 1; this.stage = 2; game.audio.grow(); game.particles.push(...this.spawnSparkles()); }
  }
  spawnSplash() { const p = []; for (let i = 0; i < 8; i++) p.push(new Particle(this.x * CONFIG.TILE_PX + CONFIG.TILE_PX/2, this.y * CONFIG.TILE_PX + CONFIG.TILE_PX, CONFIG.COLORS.water, { x: (Math.random()-0.5)*200, y: -Math.random()*100-50 }, Math.random()*0.5+0.3, Math.random()*3+1, 300)); return p; }
  spawnSparkles() { const p = []; for (let i = 0; i < 12; i++) p.push(new Particle(this.x * CONFIG.TILE_PX + CONFIG.TILE_PX/2, this.y * CONFIG.TILE_PX + CONFIG.TILE_PX/2, this.getColor(), { x: (Math.random()-0.5)*150, y: (Math.random()-0.5)*150 }, Math.random()*0.8+0.5, Math.random()*4+2)); return p; }
  draw(ctx, time, tileSize) {
    const px = this.x * tileSize, py = this.y * tileSize, cs = this.getColor();
    ctx.fillStyle = CONFIG.COLORS.soil; ctx.fillRect(px, py + tileSize * 0.7, tileSize, tileSize * 0.3);
    const sway = Math.sin(time * 3 + this.x * 10) * 2;
    if (this.stage === 0) { ctx.fillStyle = cs; ctx.beginPath(); ctx.moveTo(px + tileSize/2 + sway, py + tileSize); ctx.lineTo(px + tileSize/2 - 5 + sway, py + tileSize * 0.6); ctx.lineTo(px + tileSize/2 + 5 + sway, py + tileSize * 0.6); ctx.fill(); }
    else if (this.stage === 1) { ctx.fillStyle = '#4CAF50'; ctx.fillRect(px + tileSize/2 - 2 + sway, py + tileSize * 0.5, 4, tileSize * 0.5); ctx.fillStyle = cs; ctx.beginPath(); ctx.arc(px + tileSize/2 + sway, py + tileSize * 0.5, 8, 0, Math.PI * 2); ctx.fill(); }
    else if (this.stage === 2) { ctx.fillStyle = '#4CAF50'; ctx.fillRect(px + tileSize/2 - 3 + sway, py + tileSize * 0.4, 6, tileSize * 0.6); const petals = this.type === 'Crystal Bloom' ? 8 : 6; for (let i = 0; i < petals; i++) { const a = (i / petals) * Math.PI * 2 + time * 0.5; ctx.fillStyle = cs; ctx.beginPath(); ctx.ellipse(px + tileSize/2 + Math.cos(a) * 18 + sway, py + tileSize * 0.4 + Math.sin(a) * 18, 10, 6, a, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = '#FFD600'; ctx.beginPath(); ctx.arc(px + tileSize/2 + sway, py + tileSize * 0.4, 6, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = '#795548'; ctx.fillRect(px + tileSize/2 - 2 + sway, py + tileSize * 0.5, 4, tileSize * 0.5); ctx.fillStyle = '#5D4037'; ctx.beginPath(); ctx.moveTo(px + tileSize/2 + sway, py + tileSize); ctx.lineTo(px + tileSize/2 - 10 + sway, py + tileSize * 0.5); ctx.lineTo(px + tileSize/2 + 10 + sway, py + tileSize * 0.5); ctx.fill(); }
    if (this.pests > 0) { ctx.fillStyle = '#000'; for (let i = 0; i < this.pests; i++) ctx.fillRect(px + Math.sin(time*5+i)*10 + tileSize/2, py + Math.cos(time*5+i)*10 + tileSize/2, 3, 3); }
  }
}

class Player {
  constructor() { this.gx = 5; this.gy = 5; this.px = 5 * CONFIG.TILE_PX; this.py = 5 * CONFIG.TILE_PX; this.vx = 0; this.vy = 0; this.water = CONFIG.MAX_WATER; this.maxWater = CONFIG.MAX_WATER; this.state = 'idle'; this.dir = 0; this.animTime = 0; this.carrying = false; }
  update(dt, input, game) {
    let dx = 0, dy = 0; if (input.left) dx--; if (input.right) dx++; if (input.up) dy--; if (input.down) dy++;
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const speed = CONFIG.MOVE_SPEED * (dx !== 0 && dy !== 0 ? CONFIG.DIAG_PENALTY : 1);
      this.vx += dx * CONFIG.ACCEL * dt * 60; this.vy += dy * CONFIG.ACCEL * dt * 60;
      const maxV = speed * CONFIG.TILE_PX; const curV = Math.hypot(this.vx, this.vy); if (curV > maxV) { this.vx = this.vx / curV * maxV; this.vy = this.vy / curV * maxV; }
      this.dir = Math.atan2(dy, dx);
      this.state = 'walk';
    } else { this.vx *= Math.pow(CONFIG.DECEL, dt * 60); this.vy *= Math.pow(CONFIG.DECEL, dt * 60); if (Math.hypot(this.vx, this.vy) < 0.1) { this.vx = 0; this.vy = 0; this.state = 'idle'; } }
    this.px += this.vx * dt; this.py += this.vy * dt;
    const newGx = Math.round(this.px / CONFIG.TILE_PX), newGy = Math.round(this.py / CONFIG.TILE_PX);
    if (newGx >= 0 && newGx < CONFIG.GRID_SIZE && newGy >= 0 && newGy < CONFIG.GRID_SIZE && !game.isBlocked(newGx, newGy)) { this.gx = newGx; this.gy = newGy; } else { this.px -= this.vx * dt; this.py -= this.vy * dt; this.vx = 0; this.vy = 0; }
    this.water = Math.min(this.maxWater, this.water + CONFIG.WATER_REGEN * dt);
    if (input.water && this.water >= 1) { const plant = game.getPlantAt(this.gx, this.gy); if (plant) { plant.water(1, game); this.water--; this.state = 'water'; this.animTime = 0.5; } else { game.audio.beep(200, 0.1); } }
    if (this.animTime > 0) this.animTime -= dt;
    if (input.action) { const barrel = game.getBarrelAt(this.gx, this.gy); if (barrel) { this.water = this.maxWater; game.audio.beep(400, 0.2); game.particles.push(...this.spawnRefill()); } }
    game.checkCloudClick(this.gx, this.gy);
  }
  spawnRefill() { const p = []; for (let i = 0; i < 20; i++) p.push(new Particle(this.px + CONFIG.TILE_PX/2, this.py + CONFIG.TILE_PX/2, CONFIG.COLORS.water, { x: (Math.random()-0.5)*300, y: (Math.random()-0.5)*300 }, Math.random()*1+0.5, Math.random()*4+2)); return p; }
  draw(ctx, tileSize, time) {
    const x = this.px, y = this.py, s = tileSize;
    ctx.save(); ctx.translate(x + s/2, y + s/2);
    if (this.state === 'water' && this.animTime > 0) { ctx.rotate(-Math.PI/4); ctx.fillStyle = CONFIG.COLORS.water; ctx.globalAlpha = this.animTime * 2; for (let i = 0; i < 5; i++) ctx.fillRect(-2, -s - i*10, 4, 8); ctx.globalAlpha = 1; }
    ctx.fillStyle = '#4A148C'; ctx.beginPath(); ctx.arc(0, -s*0.15, s*0.25, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#6D4C41'; ctx.fillRect(-s*0.15, -s*0.1, s*0.3, s*0.5);
    ctx.fillStyle = this.water > 0 ? CONFIG.COLORS.water : '#555'; ctx.beginPath(); ctx.moveTo(s*0.15, -s*0.1); ctx.quadraticCurveTo(s*0.5, -s*0.3, s*0.15, s*0.4); ctx.fill();
    if (this.state === 'walk') { const legOffset = Math.sin(time * 20) * 5; ctx.fillStyle = '#3E2723'; ctx.fillRect(-s*0.2, s*0.4 + legOffset, s*0.15, s*0.2); ctx.fillRect(s*0.05, s*0.4 - legOffset, s*0.15, s*0.2); }
    ctx.restore();
  }
}

class UI {
  constructor(game) { this.game = game; this.font = '16px Arial'; this.notifications = []; }
  addNotification(msg) { this.notifications.push({ msg, time: 3, y: 0 }); if (this.notifications.length > 3) this.notifications.shift(); }
  update(dt) { this.notifications.forEach(n => n.time -= dt); this.notifications = this.notifications.filter(n => n.time > 0); }
  draw(ctx, canvas) {
    const w = canvas.width, h = canvas.height, p = this.game.player;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, w, 80);
    ctx.fillStyle = CONFIG.COLORS.uiGold; ctx.font = 'bold 20px Arial'; ctx.fillText(`🌸 ${this.game.score}`, 20, 30);
    ctx.fillStyle = CONFIG.COLORS.water; const bw = 200, bh = 20; ctx.fillRect(20, 40, bw * (p.water / p.maxWater), bh); ctx.strokeStyle = CONFIG.COLORS.white; ctx.strokeRect(20, 40, bw, bh); ctx.fillStyle = CONFIG.COLORS.white; ctx.font = '14px Arial'; ctx.fillText(`${Math.floor(p.water)}/${p.maxWater}`, 230, 55);
    const timer = this.game.timer; const m = Math.floor(timer/60000).toString().padStart(2,'0'), s = Math.floor((timer%60000)/1000).toString().padStart(2,'0'), ms = Math.floor((timer%1000)/10).toString().padStart(2,'0'); ctx.fillStyle = CONFIG.COLORS.white; ctx.font = 'bold 18px monospace'; ctx.fillText(`${m}:${s}.${ms}`, w - 120, 30);
    ctx.fillStyle = CONFIG.COLORS.white; ctx.font = '14px Arial'; ctx.fillText(`Day ${this.game.day}, ${this.game.season}`, w - 200, 55);
    this.drawMinimap(ctx, w, h);
    this.drawNotifications(ctx, w);
    if (this.game.paused) this.drawPauseMenu(ctx, w, h);
  }
  drawMinimap(ctx, w, h) { const ms = 12, ox = w - 10 - CONFIG.GRID_SIZE * ms, oy = h - 10 - CONFIG.GRID_SIZE * ms; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(ox-2, oy-2, CONFIG.GRID_SIZE*ms+4, CONFIG.GRID_SIZE*ms+4); this.game.plants.forEach(pl => { ctx.fillStyle = pl.getColor(); ctx.fillRect(ox + pl.x*ms, oy + pl.y*ms, ms, ms); }); ctx.fillStyle = CONFIG.COLORS.uiGold; ctx.fillRect(ox + this.game.player.gx*ms, oy + this.game.player.gy*ms, ms, ms); }
  drawNotifications(ctx, w) { this.notifications.forEach((n, i) => { ctx.fillStyle = `rgba(0,0,0,${0.8 * (n.time/3)})`; ctx.fillRect(w/2 - 150, 100 + i*40, 300, 30); ctx.fillStyle = CONFIG.COLORS.white; ctx.textAlign = 'center'; ctx.fillText(n.msg, w/2, 120 + i*40); ctx.textAlign = 'left'; }); }
  drawPauseMenu(ctx, w, h) { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = CONFIG.COLORS.uiGold; ctx.font = '40px Arial'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', w/2, h/2 - 40); ctx.font = '20px Arial'; ctx.fillText('Press ESC or P to Resume', w/2, h/2 + 20); ctx.fillText(`High Score: ${this.game.highScore}`, w/2, h/2 + 60); ctx.textAlign = 'left'; }
}

class Game {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.resize(); window.addEventListener('resize', () => this.resize());
    this.audio = new Audio(); this.input = { left: false, right: false, up: false, down: false, water: false, action: false, click: null };
    this.setupInput();
    this.player = new Player(); this.plants = []; this.barrels = []; this.clouds = []; this.particles = [];
    this.score = 0; this.timer = 0; this.day = 1; this.season = 'Spring'; this.seasonTimer = 0; this.dayNightCycle = 0; this.paused = false; this.highScore = parseInt(localStorage.getItem('bloomHighScore')) || 0;
    this.lastSave = 0; this.lastTime = performance.now();
    this.initWorld();
    requestAnimationFrame(t => this.loop(t));
  }
  resize() { const ratio = Math.min(window.innerWidth / 800, window.innerHeight / 800); this.canvas.width = 800 * ratio; this.canvas.height = 800 * ratio; CONFIG.TILE_PX = this.canvas.width / CONFIG.GRID_SIZE; }
  setupInput() {
    window.addEventListener('keydown', e => { this.audio.resume(); switch(e.code) { case 'ArrowLeft': case 'KeyA': this.input.left = true; break; case 'ArrowRight': case 'KeyD': this.input.right = true; break; case 'ArrowUp': case 'KeyW': this.input.up = true; break; case 'ArrowDown': case 'KeyS': this.input.down = true; break; case 'Space': e.preventDefault(); this.input.water = true; break; case 'KeyE': this.input.action = true; break; case 'Escape': case 'KeyP': this.paused = !this.paused; break; } });
    window.addEventListener('keyup', e => { switch(e.code) { case 'ArrowLeft': case 'KeyA': this.input.left = false; break; case 'ArrowRight': case 'KeyD': this.input.right = false; break; case 'ArrowUp': case 'KeyW': this.input.up = false; break; case 'ArrowDown': case 'KeyS': this.input.down = false; break; case 'Space': this.input.water = false; break; case 'KeyE': this.input.action = false; break; } });
    this.canvas.addEventListener('click', e => { const rect = this.canvas.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width * this.canvas.width; const y = (e.clientY - rect.top) / rect.height * this.canvas.height; this.input.click = { x, y }; });
    this.canvas.addEventListener('touchstart', e => { e.preventDefault(); const t = e.touches[0]; const rect = this.canvas.getBoundingClientRect(); const x = (t.clientX - rect.left) / rect.width * this.canvas.width; const y = (t.clientY - rect.top) / rect.height * this.canvas.height; this.input.click = { x, y }; }, { passive: false });
  }
  initWorld() { for (let i = 0; i < 15; i++) { let x, y; do { x = Math.floor(Math.random()*CONFIG.GRID_SIZE); y = Math.floor(Math.random()*CONFIG.GRID_SIZE); } while (this.getPlantAt(x,y) || (x===5&&y===5)); const types = [...CONFIG.PLANT_TYPES.common, ...CONFIG.PLANT_TYPES.rare]; this.plants.push(new Plant(x, y, types[Math.floor(Math.random()*types.length)])); }
    this.barrels = [{x:0,y:0},{x:9,y:0},{x:0,y:9},{x:9,y:9}];
    setInterval(() => { if (!this.paused && this.clouds.length < 3 && Math.random() < 0.3) this.clouds.push({x:Math.random()*this.canvas.width, y:Math.random()*this.canvas.height*0.5, life:10, collected:false}); }, 10000);
  }
  loop(time) { const dt = Math.min((time - this.lastTime) / 1000, 0.1); this.lastTime = time; if (!this.paused) { this.update(dt); } this.render(time); requestAnimationFrame(t => this.loop(t)); }
  update(dt) { this.timer += dt * 1000; this.dayNightCycle += dt * 0.0001; this.seasonTimer += dt; if (this.seasonTimer > 60) { this.seasonTimer = 0; const seasons = ['Spring','Summer','Autumn','Winter']; this.season = seasons[(seasons.indexOf(this.season)+1)%4]; this.ui.addNotification(`Season changed to ${this.season}!`); }
    if (this.timer > this.day * 86400000 / 100) { this.day++; this.ui.addNotification(`Day ${this.day} begins!`); }
    this.player.update(dt, this.input, this); this.input.click = null;
    this.plants.forEach(p => p.update(dt, this));
    this.particles = this.particles.filter(p => { p.update(dt); return !p.isDead(); });
    this.ui.update(dt);
    if (Math.random() < 0.001 * dt * 60) this.spawnPest();
    this.lastSave += dt; if (this.lastSave > 30) { this.save(); this.lastSave = 0; }
    if (this.score > this.highScore) { this.highScore = this.score; localStorage.setItem('bloomHighScore', this.highScore); }
  }
  spawnPest() { const plant = this.plants[Math.floor(Math.random()*this.plants.length)]; if (plant && plant.stage > 0 && plant.pests === 0) { plant.pests = Math.floor(Math.random()*3)+1; plant.pestTimer = 0; this.audio.pest(); this.ui.addNotification('Pests detected! Water to remove.'); } }
  checkCloudClick(gx, gy) { if (!this.input.click) return; const tileSize = CONFIG.TILE_PX; this.clouds.forEach(c => { if (!c.collected) { const cx = c.x, cy = c.y; const px = gx * tileSize + tileSize/2, py = gy * tileSize + tileSize/2; if (Math.hypot(cx-px, cy-py) < 50) { c.collected = true; this.player.water = Math.min(this.player.maxWater, this.player.water + 3); this.audio.rain(); this.ui.addNotification('Collected rain water +3!'); this.particles.push(...this.spawnRainParticles(cx, cy)); } } }); this.clouds = this.clouds.filter(c => !c.collected && c.life > 0); }
  spawnRainParticles(x, y) { const p = []; for (let i=0;i<20;i++) p.push(new Particle(x,y,CONFIG.COLORS.rain,{x:(Math.random()-0.5)*100,y:Math.random()*100+50},1,2,100)); return p; }
  getPlantAt(x, y) { return this.plants.find(p => p.x === x && p.y === y); }
  getBarrelAt(x, y) { return this.barrels.find(b => b.x === x && b.y === y); }
  isBlocked(x, y) { return this.barrels.some(b => b.x === x && b.y === y); }
  checkAchievements() { if (this.score === 1) this.ui.addNotification('First bloom! 🌸'); if (this.score === 5) this.ui.addNotification('Green thumb! 🌿'); if (this.score === 10) this.ui.addNotification('Master gardener! 🌻'); if (this.score === 20) this.ui.addNotification('Bloom legend! 🏆'); }
  save() { const data = { score: this.score, highScore: this.highScore, day: this.day, season: this.season, plants: this.plants.map(p => ({ x: p.x, y: p.y, type: p.type, stage: p.stage, water: p.water, lastWatered: p.lastWatered, pests: p.pests })), playerWater: this.player.water }; localStorage.setItem('bloomSave', JSON.stringify(data)); }
  load() { const data = JSON.parse(localStorage.getItem('bloomSave') || '{}'); if (data.score) { this.score = data.score; this.highScore = data.highScore; this.day = data.day; this.season = data.season; this.plants = data.plants.map(p => { const plant = new Plant(p.x, p.y, p.type); plant.stage = p.stage; plant.water = p.water; plant.lastWatered = p.lastWatered; plant.pests = p.pests; return plant; }); this.player.water = data.playerWater; this.ui.addNotification('Game loaded!'); } }
  render(time) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height, ts = CONFIG.TILE_PX;
    const night = Math.sin(this.dayNightCycle * Math.PI * 2) * 0.5 + 0.5;
    const sky = night > 0.5 ? CONFIG.COLORS.skyNight : CONFIG.COLORS.skyDay;
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    if (night > 0.5) { ctx.fillStyle = `rgba(255,255,255,${(night-0.5)*2})`; for (let i = 0; i < 50; i++) { const sx = (i * 123) % w, sy = (i * 456) % (h*0.5); ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI*2); ctx.fill(); } }
    for (let y = 0; y < CONFIG.GRID_SIZE; y++) { for (let x = 0; x < CONFIG.GRID_SIZE; x++) { const px = x * ts, py = y * ts; ctx.fillStyle = (x + y) % 2 === 0 ? CONFIG.COLORS.grass : '#388E3C'; ctx.fillRect(px, py, ts, ts); ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.strokeRect(px, py, ts, ts); } }
    this.barrels.forEach(b => { const px = b.x * ts, py = b.y * ts; ctx.fillStyle = CONFIG.COLORS.brown; ctx.fillRect(px + 10, py + 10, ts - 20, ts - 20); ctx.fillStyle = '#4E342E'; ctx.fillRect(px + 10, py + 10, ts - 20, 8); ctx.fillRect(px + 10, py + ts - 18, ts - 20, 8); ctx.fillStyle = CONFIG.COLORS.water; ctx.fillRect(px + 15, py + 20, ts - 30, ts - 40); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px + 15, py + 20, 5, ts - 40); });
    this.plants.forEach(p => p.draw(ctx, time / 1000, ts));
    this.particles.forEach(p => p.draw(ctx));
    this.clouds.forEach(c => { if (!c.collected) { ctx.fillStyle = `rgba(255,255,255,${c.life/10})`; ctx.beginPath(); ctx.ellipse(c.x, c.y, 30, 15, 0, 0, Math.PI*2); ctx.ellipse(c.x + 25, c.y - 5, 20, 12, 0, 0, Math.PI*2); ctx.ellipse(c.x - 25, c.y - 5, 20, 12, 0, 0, Math.PI*2); ctx.fill(); c.life -= 0.01; } });
    this.player.draw(ctx, ts, time / 1000);
    this.ui.draw(ctx, this.canvas);
  }
}

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
game.ui = new UI(game);
game.load();
