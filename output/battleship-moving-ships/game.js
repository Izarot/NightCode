// Battleship: Naval Warfare - Simplified Canvas Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;});

// Color Palette
const COLORS = {
  water: '#0a1a2f',
  waterHighlight: '#1e3a5f',
  ship1: '#ff6b6b',
  ship2: '#4ecdc4',
  ship3: '#ffe66d',
  ship4: '#a051db',
  projectile: '#ffeb3b',
  explosion: '#ff4757',
  grid: '#1e3a5f',
  ui: '#00ffcc'
};

// Grid
const GRID_SIZE = 15;
const TILE_SIZE = 80;
const grid = Array(GRID_SIZE).fill().map(()=>Array(GRID_SIZE).fill(0));

// Viewport
let camera = {x:0,y:0,zoom:1};
let panStart = null;

// Game State
let ships = [];
let projectiles = [];
let particles = [];
let selectedShip = null;
let gameState = 'setup';
let startTime = 0;
let elapsed = 0;
let highScore = localStorage.getItem('highScore')||0;
let speedrunActive = false;

// Audio
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function playSound(freq,duration,type='sine'){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime+0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration);
  osc.start(); osc.stop(audioCtx.currentTime+duration);
}

// Ship Classes
const SHIP_CLASSES = {
  destroyer: {speed:3.5,turn:180,hp:80,color:COLORS.ship1,size:2},
  cruiser: {speed:2.2,turn:120,hp:120,color:COLORS.ship2,size:3},
  battleship: {speed:1.5,turn:90,hp:200,color:COLORS.ship3,size:4},
  carrier: {speed:0.8,turn:45,hp:150,color:COLORS.ship4,size:5}
};

class Ship {
  constructor(x,y,type,player=true){
    this.x=x;this.y=y;this.type=type;this.player=player;
    this.cfg=SHIP_CLASSES[type];
    this.hp=this.cfg.hp;
    this.maxHp=this.cfg.hp;
    this.vx=0;this.vy=0;this.angle=0;
    this.targetX=x;this.targetY=y;
    this.cooldown=0;
    this.size=this.cfg.size;
    this.sections={bow:25,midship:25,stern:25,superstructure:25};
  }
  update(dt){
    // Momentum-based movement
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx,dy);
    if(dist > 0.1){
      const desiredAngle = Math.atan2(dy,dx);
      let angleDiff = desiredAngle - this.angle;
      while(angleDiff > Math.PI) angleDiff -= 2*Math.PI;
      while(angleDiff < -Math.PI) angleDiff += 2*Math.PI;
      const turnSpeed = this.cfg.turn * dt;
      if(Math.abs(angleDiff) > 0.01){
        this.angle += Math.sign(angleDiff)*Math.min(turnSpeed,Math.abs(angleDiff));
      }
      const speed = this.cfg.speed * dt;
      this.x += Math.cos(this.angle)*speed;
      this.y += Math.sin(this.angle)*speed;
    }
    if(this.cooldown>0) this.cooldown-=dt;
  }
  draw(ctx,camera){
    const sx = (this.x - camera.x)*camera.zoom + W/2;
    const sy = (this.y - camera.y)*camera.zoom + H/2;
    const s = this.size * camera.zoom;
    ctx.save();
    ctx.translate(sx,sy);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.cfg.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2*camera.zoom;
    ctx.beginPath();
    ctx.moveTo(-s/2, -s/4);
    ctx.lineTo(s/2, 0);
    ctx.lineTo(s/2, s/4);
    ctx.lineTo(-s/2, s/4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Wake particles
    if(Math.hypot(this.vx,this.vy)>0.1 && Math.random()<0.1){
      particles.push({x:this.x,y:this.y,vx:-Math.cos(this.angle)*0.5+Math.random()*0.2,vy:-Math.sin(this.angle)*0.5+Math.random()*0.2,life:0.5,size:3});
    }
    ctx.restore();
  }
  takeDamage(dmg,section){
    this.sections[section] -= dmg/4;
    this.hp -= dmg;
    if(this.hp<=0) this.onDestroy();
  }
  onDestroy(){
    for(let i=0;i<20;i++){
      particles.push({x:this.x,y:this.y,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,life:1,size:4,type:'explosion'});
    }
    playSound(100,0.3,'square');
    ships = ships.filter(s=>s!==this);
    if(this.player) endGame();
  }
}

class Projectile {
  constructor(x,y,vx,vy,owner){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.owner=owner;
    this.life=3;
  }
  update(dt){
    this.x+=this.vx*dt;
    this.y+=this.vy*dt;
    this.life-=dt;
    if(this.life<=0) return false;
    // Collision with ships
    for(const ship of ships){
      if(ship===this.owner) continue;
      const dx=ship.x-this.x, dy=ship.y-this.y;
      if(Math.hypot(dx,dy) < ship.size*0.6){
        ship.takeDamage(25,'midship');
        playSound(300,0.1);
        return false;
      }
    }
    return true;
  }
  draw(ctx,camera){
    const sx=(this.x-camera.x)*camera.zoom+W/2;
    const sy=(this.y-camera.y)*camera.zoom+H/2;
    ctx.fillStyle=COLORS.projectile;
    ctx.beginPath();
    ctx.arc(sx,sy,3*camera.zoom,0,Math.PI*2);
    ctx.fill();
  }
}

// Input
canvas.addEventListener('mousedown',(e)=>{handleMouseDown(e);});
canvas.addEventListener('mousemove',(e)=>{handleMouseMove(e);});
canvas.addEventListener('wheel',(e)=>{camera.zoom+=e.deltaY*-0.001;camera.zoom=Math.max(0.5,Math.min(2,camera.zoom));e.preventDefault();});
let keys={};
window.addEventListener('keydown',(e)=>{keys[e.code]=true;handleKeys(e);});
window.addEventListener('keyup',(e)=>{keys[e.code]=false;});

function handleMouseDown(e){
  const rect=canvas.getBoundingClientRect();
  const mx=e.clientX-rect.left, my=e.clientY-rect.top;
  const wx=(mx-W/2)/camera.zoom+camera.x;
  const wy=(my-H/2)/camera.zoom+camera.y;
  if(e.button===0){ // Left click
    if(selectedShip){selectedShip.targetX=wx;selectedShip.targetY=wy;}
  } else if(e.button===2){ // Right click
    panStart={x:mx,y:my};
  }
}
function handleMouseMove(e){
  if(panStart){const rect=canvas.getBoundingClientRect();camera.x+=(panStart.x-(e.clientX-rect.left))/camera.zoom;camera.y+=(panStart.y-(e.clientY-rect.top))/camera.zoom;panStart={x:e.clientX-rect.left,y:e.clientY-rect.top};}
}
canvas.addEventListener('mouseup',()=>{panStart=null;});
canvas.addEventListener('mouseleave',()=>{panStart=null;});
canvas.addEventListener('contextmenu',(e)=>e.preventDefault());

function handleKeys(e){
  if(e.code==='Space'&&selectedShip){selectedShip.targetX=selectedShip.x;selectedShip.targetY=selectedShip.y;}
  if(e.code==='KeyT'&&selectedShip&&selectedShip.cooldown<=0){fireProjectile(selectedShip);}
}

function fireProjectile(ship){
  const speed=8;
  projectiles.push(new Projectile(ship.x,ship.y,Math.cos(ship.angle)*speed,Math.sin(ship.angle)*speed,ship));
  ship.cooldown=3;
  playSound(200,0.15);
}

// Game Init
function initGame(){
  ships.push(new Ship(100,100,'destroyer',true));
  ships.push(new Ship(300,200,'cruiser',false));
  ships.push(new Ship(500,300,'battleship',false));
  ships.push(new Ship(700,400,'carrier',false));
  selectedShip=ships[0];
  gameState='combat';
  startTime=performance.now();
  speedrunActive=true;
  updateHighScore();
}

function updateHighScore(){
  const hsEl=document.getElementById('highScore');
  hsEl.textContent=`High Score: ${parseFloat(highScore).toFixed(2)}s`;
}

function endGame(){
  speedrunActive=false;
  if(elapsed>parseFloat(highScore)){
    highScore=elapsed.toFixed(2);
    localStorage.setItem('highScore',highScore);
  } else {
    highScore=localStorage.getItem('highScore')||0;
  }
  updateHighScore();
  gameState='victory';
}

// Game Loop
let lastTime=0;
function gameLoop(timestamp){
  const dt=(timestamp-lastTime)/1000;lastTime=timestamp;
  if(!isFinite(dt)||dt>0.1)return requestAnimationFrame(gameLoop);
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt){
  if(gameState==='setup'){initGame();return;}
  if(speedrunActive) elapsed=(performance.now()-startTime)/1000;
  document.getElementById('speedrunTimer').textContent=`Time: ${elapsed.toFixed(2)}s`;
  ships.forEach(s=>s.update(dt));
  projectiles=projectiles.filter(p=>p.update(dt));
  particles=particles.filter(p=>{p.life-=dt;return p.life>0;});
}

function render(){
  ctx.clearRect(0,0,W,H);
  // Parallax water background
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,COLORS.water);grad.addColorStop(1,COLORS.waterHighlight);
  ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle=COLORS.grid;ctx.lineWidth=1;
  for(let i=0;i<=GRID_SIZE;i++){
    ctx.beginPath();
    ctx.moveTo((i*TILE_SIZE-camera.x)*camera.zoom+W/2,(-camera.y)*camera.zoom+H/2);
    ctx.lineTo((i*TILE_SIZE-camera.x)*camera.zoom+W/2,(GRID_SIZE*TILE_SIZE-camera.y)*camera.zoom+H/2);
    ctx.moveTo((i*TILE_SIZE-camera.x)*camera.zoom+W/2,(i*TILE_SIZE-camera.y)*camera.zoom+H/2);
    ctx.lineTo((GRID_SIZE*TILE_SIZE-camera.x)*camera.zoom+W/2,(i*TILE_SIZE-camera.y)*camera.zoom+H/2);
    ctx.stroke();
  }
  // Particles
  particles.forEach(p=>{ctx.fillStyle=p.type==="explosion"?COLORS.explosion:COLORS.ui;ctx.globalAlpha=p.life;ctx.fillRect((p.x-camera.x)*camera.zoom+W/2,(p.y-camera.y)*camera.zoom+H/2,p.size*camera.zoom,p.size*camera.zoom);ctx.globalAlpha=1;});
  // Projectiles
  projectiles.forEach(p=>p.draw(ctx,camera));
  // Ships
  ships.forEach(s=>s.draw(ctx,camera));
  // Selected highlight
  if(selectedShip){ctx.strokeStyle=COLORS.ui;ctx.lineWidth=3;const sx=(selectedShip.x-camera.x)*camera.zoom+W/2;const sy=(selectedShip.y-camera.y)*camera.zoom+H/2;ctx.beginPath();ctx.arc(sx,sy,selectedShip.size*10*camera.zoom,0,Math.PI*2);ctx.stroke();}
}

requestAnimationFrame(gameLoop);
