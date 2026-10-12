export class Game {
  constructor(renderer, input, audio, resize) {
    this.renderer = renderer;
    this.input = input;
    this.audio = audio;
    this.resize = resize;
    this.scale = 1;
    this.reset();
  }
  
  reset() {
    this.time = 0;
    this.score = 0;
    this.phase = 1;
    this.directors = [];
    this.player = { x: 960, y: 540, vx: 0, vy: 0, r: 3, lives: 3, focus: false, pulse: 100 };
    this.seeds = [];
    this.shards = [];
    this.particles = [];
    this.grazePopups = [];
    this.highScore = localStorage.getItem('highScore') || 0;
    this.gameOver = false;
  }
  
  update(dt) {
    if (this.gameOver) return;
    
    this.time += dt;
    this.score = Math.floor(this.time * 100);
    
    if (this.time > this.highScore) {
      this.highScore = this.time;
      localStorage.setItem('highScore', this.highScore);
    }
    
    this.updatePhase();
    this.updatePlayer(dt);
    this.updateDirectors(dt);
    this.updateProjectiles(dt);
    this.checkCollisions();
    this.updateParticles(dt);
  }
  
  updatePhase() {
    if (this.time > 180) this.phase = 4;
    else if (this.time > 90) this.phase = 3;
    else if (this.time > 30) this.phase = 2;
  }
  
  updatePlayer(dt) {
    const keys = this.input.getKeys();
    const focus = keys.shift || this.input.getFocus();
    const targetVel = focus ? 200 : 450;
    
    let ax = 0, ay = 0;
    if (keys.ArrowUp || keys.W) ay -= 1;
    if (keys.ArrowDown || keys.S) ay += 1;
    if (keys.ArrowLeft || keys.A) ax -= 1;
    if (keys.ArrowRight || keys.D) ax += 1;
    
    const mag = Math.sqrt(ax*ax + ay*ay);
    if (mag > 0) {
      ax = ax / mag * targetVel;
      ay = ay / mag * targetVel;
    }
    
    this.player.vx += ax * dt * 10;
    this.player.vy += ay * dt * 10;
    
    const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
    if (speed > targetVel) {
      this.player.vx = this.player.vx / speed * targetVel;
      this.player.vy = this.player.vy / speed * targetVel;
    }
    
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    
    this.player.x = Math.max(100, Math.min(1820, this.player.x));
    this.player.y = Math.max(100, Math.min(980, this.player.y));
    
    if (focus) this.player.pulse += 10 * dt;
    this.player.pulse = Math.min(100, this.player.pulse);
  }
  
  updateDirectors(dt) {
    const spawnRate = this.phase === 4 ? 0.7 : this.phase === 3 ? 1.2 : this.phase === 2 ? 1.8 : 2.5;
    
    if (this.time % spawnRate < dt) {
      const dirs = ['top','bottom','left','right'];
      const dir = dirs[Math.floor(Math.random()*dirs.length)];
      this.seeds.push({ x:0, y:0, vx:0, vy:0, life:0, maxLife:3, fractured:false });
    }
  }
  
  updateProjectiles(dt) {
    for (let i = this.seeds.length-1; i >= 0; i--) {
      const s = this.seeds[i];
      s.life += dt;
      if (s.life > s.maxLife || s.fractured) {
        this.fractureSeed(i);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    
    for (let i = this.shards.length-1; i >= 0; i--) {
      const h = this.shards[i];
      h.life += dt;
      if (h.life > 4) { this.shards.splice(i,1); continue; }
      
      const dx = this.player.x - h.x;
      const dy = this.player.y - h.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 0 && h.homing > 0) {
        h.vx += dx/dist * h.homing * dt;
        h.vy += dy/dist * h.homing * dt;
        h.homing = Math.max(0, h.homing - 800*dt);
      }
      
      h.x += h.vx * dt;
      h.y += h.vy * dt;
    }
  }
  
  fractureSeed(seedIdx) {
    const s = this.seeds[seedIdx];
    this.seeds.splice(seedIdx,1);
    
    for (let i=0; i<7; i++) {
      const angle = (i/7)*Math.PI*2;
      this.shards.push({
        x: s.x, y: s.y,
        vx: Math.cos(angle)*200, vy: Math.sin(angle)*200,
        life: 0, homing: 400
      });
    }
  }
  
  checkCollisions() {
    for (const s of this.seeds) {
      const dx = s.x - this.player.x;
      const dy = s.y - this.player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < s.r + this.player.r) {
        this.player.lives--;
        this.player.x = 960; this.player.y = 540;
        this.player.vx = 0; this.player.vy = 0;
        if (this.player.lives <= 0) this.gameOver = true;
      }
    }
  }
  
  updateParticles(dt) {
    for (let i = this.particles.length-1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i,1);
      else {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
  }
  
  render() {
    this.renderer.clear();
    this.renderer.drawGrid(this.player.x, this.player.y);
    this.renderer.drawProjectiles(this.seeds, this.shards);
    this.renderer.drawPlayer(this.player);
    this.renderer.drawParticles(this.particles);
    this.renderer.drawHUD(this);
  }
}
