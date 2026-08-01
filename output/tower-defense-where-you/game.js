export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.lastTime = 0;
    this.enemies = [];
    this.turrets = [];
    this.projectiles = [];
    this.spawnTimer = 0;
    this.wave = 1;
    this.cash = 100;
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    this.startTime = null;
    this.soundManager = new SoundManager();
    this.input = new InputHandler(canvas);
    // Load a simple spawn sound (placeholder path)
    this.soundManager.load('spawn', 'assets/sounds/spawn.ogg');
  }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }
  start(ui) {
    this.ui = ui;
    this.ui.setCash(this.cash);
    this.ui.setHighScore(this.highScore);
    this.startTime = performance.now();
    this.loop();
  }
  loop() {
    requestAnimationFrame((t)=>this.loop());
    const dt = (t - this.lastTime)/1000;
    this.lastTime = t;
    this.update(dt);
    this.draw();
    this.ui.updateTimer((t - this.startTime)/1000);
  }
  update(dt) {
    this.spawnTimer -= dt;
    if(this.spawnTimer <= 0){
      this.spawnEnemy();
      this.spawnTimer = 1.5;
    }
    this.enemies.forEach(e=>e.update(dt));
    this.projectiles.forEach(p=>p.update(dt));
    this.turrets.forEach(t=>t.update(dt, this.enemies, this.projectiles));
    this.enemies = this.enemies.filter(e=>!e.dead);
    this.projectiles = this.projectiles.filter(p=>!p.dead);
  }
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    ctx.fillStyle='#444';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    this.enemies.forEach(e=>e.draw(ctx));
    this.projectiles.forEach(p=>p.draw(ctx));
    this.turrets.forEach(t=>t.draw(ctx));
  }
  spawnEnemy(){
    const e = new Enemy(this.canvas.width/2, 0);
    this.enemies.push(e);
    this.soundManager.play('spawn');
  }
}

class Enemy{
  constructor(x,y){
    this.x=x;this.y=y;this.radius=12;this.speed=80;this.dead=false;
  }
  update(dt){
    this.y+=this.speed*dt;
    if(this.y>600){this.dead=true;}
  }
  draw(ctx){
    ctx.fillStyle='#ff4444';
    ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);ctx.fill();
  }
}

class Turret{
  constructor(x,y){this.x=x;this.y=y;this.range=120;this.fireRate=1;this.cooldown=0;}
  update(dt, enemies, projectiles){
    this.cooldown-=dt;
    if(this.cooldown<=0){
      const target=enemies.find(e=>Math.hypot(e.x-this.x,e.y-this.y)<=this.range);
      if(target){
        projectiles.push(new Projectile(this.x,this.y,target));
        this.cooldown=1/this.fireRate;
      }
    }
  }
  draw(ctx){
    ctx.fillStyle='#44ff44';
    ctx.fillRect(this.x-16,this.y-16,32,32);
  }
}

class Projectile{
  constructor(x,y,target){
    this.x=x;this.y=y;this.target=target;this.speed=200;this.dead=false;
  }
  update(dt){
    const dx=this.target.x-this.x;
    const dy=this.target.y-this.y;
    const dist=Math.hypot(dx,dy);
    if(dist<5){this.target.dead=true;this.dead=true;return;}
    const nx=dx/dist, ny=dy/dist;
    this.x+=nx*this.speed*dt;
    this.y+=ny*this.speed*dt;
  }
  draw(ctx){
    ctx.fillStyle='#ffff44';
    ctx.beginPath();ctx.arc(this.x,this.y,4,0,Math.PI*2);ctx.fill();
  }
}

class InputHandler{
  constructor(canvas){
    this.canvas=canvas;
    this.x=0;this.y=0;
    canvas.addEventListener('pointermove',e=>{const rect=canvas.getBoundingClientRect();this.x=e.clientX-rect.left;this.y=e.clientY-rect.top;});
  }
}

class SoundManager{
  constructor(){
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.sounds={};
  }
  load(name,url){
    fetch(url).then(r=>r.arrayBuffer()).then(b=>this.ctx.decodeAudioData(b)).then(buf=>{this.sounds[name]=buf;});
  }
  play(name){
    const buf=this.sounds[name];
    if(buf){
      const src=this.ctx.createBufferSource();src.buffer=buf;src.connect(this.ctx.destination);src.start(0);
    }
  }
}
