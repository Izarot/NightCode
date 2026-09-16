const VIRTUAL_W = 800, VIRTUAL_H = 600;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let scale = 1, offsetX = 0, offsetY = 0;

const BallType = {
  IGNIS: {id:'IGNIS',name:'Ignis',color:'#ff6b35',glow:'#ff6b35',speed:1.15,desc:'Passes through bricks',trail:'ember'},
  CRYOS: {id:'CRYOS',name:'Cryos',color:'#4ecdc4',glow:'#4ecdc4',speed:.9,desc:'Freezes bricks for 3s',trail:'frost'},
  FRACTIO: {id:'FRACTIO',name:'Fractio',color:'#f7b733',glow:'#f7b733',speed:1,desc:'Splits on impact',trail:'prism'},
  GRAVITON: {id:'GRAVITON',name:'Graviton',color:'#a855f7',glow:'#a855f7',speed:1,desc:'Affected by gravity',trail:'warp'},
  UMBRA: {id:'UMBRA',name:'Umbra',color:'#888',glow:'#aaa',speed:1.25,desc:'Reveals hidden bricks',trail:'wisp'},
  EXPLOSIO: {id:'EXPLOSIO',name:'Explosio',color:'#ff4757',glow:'#ff4757',speed:.8,desc:'Explodes on impact',trail:'spark'},
  PLASMA: {id:'PLASMA',name:'Plasma',color:'#00ffff',glow:'#00ffff',speed:1,desc:'Chains to nearby bricks',trail:'lightning'},
  ELASTIS: {id:'ELASTIS',name:'Elastis',color:'#ffff00',glow:'#ffff00',speed:1,desc:'Gains speed on bounce',trail:'stretch'},
  VACUO: {id:'VACUO',name:'Vacuo',color:'#1a1a2e',glow:'#4ecdc4',speed:1,desc:'Attracts weak bricks',trail:'vortex'},
  NEXUS: {id:'NEXUS',name:'Nexus',color:'#ffd700',glow:'#ffd700',speed:1,desc:'Launches 3 balls/2s',trail:'orbit'}
};
const BallTypes = Object.values(BallType);

const PowerUpType = {
  EXPAND:{id:'EXPAND',color:'#2ed573',icon:'⬜',desc:'Expand Paddle',dur:10},
  SHRINK:{id:'SHRINK',color:'#ff4757',icon:'⬛',desc:'Shrink Paddle',dur:10},
  MULTI:{id:'MULTI',color:'#a855f7',icon:'⚪⚪',desc:'Multi Ball',dur:0},
  SLOW:{id:'SLOW',color:'#4ecdc4',icon:'⏱',desc:'Slow Motion',dur:8},
  FIRE:{id:'FIRE',color:'#ff6b35',icon:'🔥',desc:'Fire Trail',dur:12},
  MAGNET:{id:'MAGNET',color:'#fff',icon:'🧲',desc:'Magnet',dur:10},
  LIFE:{id:'LIFE',color:'#ff4757',icon:'♥',desc:'Extra Life',dur:0},
  STICKY:{id:'STICKY',color:'#f7b733',icon:'🍯',desc:'Sticky Paddle',dur:0}
};

let gameState = 'MENU';
let selectedBall = BallType.IGNIS;
let unlockedBalls = ['IGNIS'];
let level = 1;
let score = 0;
let highScores = JSON.parse(localStorage.getItem('breakoutScores')||'{}');
let progress = JSON.parse(localStorage.getItem('breakoutProgress')||'{"level":1,"unlocked":["IGNIS"]}');
level = progress.level; unlockedBalls = progress.unlocked;

let paddle = {x:VIRTUAL_W/2,y:VIRTUAL_H-40,w:120,h:16,r:8,targetX:VIRTUAL_W/2,vx:0,material:'STANDARD',stickyTimer:0};
let balls = [];
let bricks = [];
let particles = [];
let powerUps = [];
let activePowerUps = {};
let lives = 3;
let combo = 0;
let lastBrickHit = 0;
let screenShake = 0;
let levelStartTime = 0;
let ballsLostThisLevel = 0;
let totalBricks = 0;
let destroyedBricks = 0;

const audioCtx = new (window.AudioContext||webkitAudioContext)();
const masterGain = audioCtx.createGain(); masterGain.connect(audioCtx.destination);
const musicGain = audioCtx.createGain(); musicGain.connect(masterGain);
const sfxGain = audioCtx.createGain(); sfxGain.connect(masterGain);

function resize(){
  const ratio = Math.min(window.innerWidth/VIRTUAL_W, window.innerHeight/VIRTUAL_H);
  scale = ratio;
  canvas.width = VIRTUAL_W * ratio;
  canvas.height = VIRTUAL_H * ratio;
  offsetX = (window.innerWidth - canvas.width)/2;
  offsetY = (window.innerHeight - canvas.height)/2;
  canvas.style.width = canvas.width+'px';
  canvas.style.height = canvas.height+'px';
}
window.addEventListener('resize',resize);
resize();

function playTone(freq, dur, type='sine', gain=sfxGain, vol=.3){
  if(audioCtx.state==='suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.connect(g); g.connect(gain);
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime+dur);
  osc.start(); osc.stop(audioCtx.currentTime+dur);
}
function playChord(freqs, dur, type='sine'){ freqs.forEach((f,i)=>setTimeout(()=>playTone(f,dur,type),i*100)); }
function sfxHit(){ playTone(400,.05,'square',.2) }
function sfxBrick(){ playTone(600,.08,'triangle',.2) }
function sfxDestroy(){ playTone(200,.15,'sawtooth',.3); playTone(150,.2,'sawtooth',.2) }
function sfxLose(){ playTone(400,.3,'sine',.3); playTone(100,.3,'sine',.2) }
function sfxLife(){ playTone(100,.5,'sine',.3) }
function sfxPower(){ playTone(800,.2,'sine',.3) }
function sfxExplosion(){ playTone(60,.5,'sawtooth',.4); playTone(40,.3,'noise',.3) }
function sfxLevel(){ playChord([523,659,784,1047],.2) }
function sfxGameOver(){ playChord([523,494,466,440],.3) }
function sfxCombo(){ playTone(800,.1,'sine',.2); playTone(1000,.1,'sine',.2) }

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  gameState = id.replace('Screen','').toUpperCase();
}

function initBallSelect(){
  const container = document.getElementById('ballSelect');
  container.innerHTML = '';
  BallTypes.forEach(b=>{
    const div = document.createElement('div');
    div.className = 'ball-option' + (unlockedBalls.includes(b.id)?'':' locked') + (selectedBall.id===b.id?' selected':'');
    div.style.background = `radial-gradient(circle at 30% 30%, ${b.color}88, ${b.color}44, transparent)`;
    div.style.boxShadow = `0 0 15px ${b.glow}`;
    div.onclick = ()=>{ if(unlockedBalls.includes(b.id)){ selectedBall=b; document.querySelectorAll('.ball-option').forEach(o=>o.classList.remove('selected')); div.classList.add('selected'); } };
    div.innerHTML = `<span class="ball-desc">${b.desc}</span>` + (unlockedBalls.includes(b.id)?'':`<span class="lock-icon">🔒</span>`);
    container.appendChild(div);
  });
}

function startGame(){
  level = 1;
  lives = 3;
  score = 0;
  ballsLostThisLevel = 0;
  loadLevel(level);
  showScreen('playing');
  gameState = 'PLAYING';
  levelStartTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function loadLevel(lvl){
  bricks = []; destroyedBricks = 0; balls = []; particles = []; powerUps = []; activePowerUps = {};
  paddle.w = 120; paddle.x = paddle.targetX = VIRTUAL_W/2; paddle.vx = 0; paddle.material = 'STANDARD'; paddle.stickyTimer = 0;
  const rows = Math.min(5 + Math.floor((lvl-1)/3), 10);
  const cols = Math.min(8 + (lvl-1)%6, 14);
  const startY = 80;
  const brickW = 40, brickH = 16, gap = 4;
  const totalW = cols * (brickW+gap) - gap;
  const startX = (VIRTUAL_W - totalW)/2;
  
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      let hp = 1, type = 'NORMAL';
      const rand = Math.random();
      if(lvl>5 && rand<.15){ hp=2; type='TOUGH' }
      else if(lvl>15 && rand<.1){ hp=3; type='REINFORCED' }
      else if(lvl>10 && rand<.05){ type='EXPLOSIVE' }
      else if(lvl>20 && rand<.03){ type='INDESTRUCTIBLE'; hp=999 }
      else if(lvl>12 && rand<.08){ type='HIDDEN'; hp=1 }
      bricks.push({
        x:startX+c*(brickW+gap), y:startY+r*(brickH+gap),
        w:brickW, h:brickH, hp, maxHp:hp, type,
        visible: type!=='HIDDEN', frozen:0, burning:0, revealTimer:0
      });
    }
  }
  totalBricks = bricks.filter(b=>b.type!=='INDESTRUCTIBLE').length;
  spawnBall();
  updateHUD();
}

function spawnBall(){
  const b = selectedBall;
  balls.push({
    x:paddle.x, y:paddle.y-16, r:8,
    vx:0, vy:0, speed:5*b.speed, maxSpeed:14,
    type:b.id, color:b.color, glow:b.glow,
    trail:[], stuck:true, aimAngle:0,
    splitCount:0, nexusTimer:0, vacuumSize:1
  });
}

function launchBall(ball){
  ball.stuck = false;
  const angle = ball.aimAngle || -Math.PI/2;
  ball.vx = Math.cos(angle) * ball.speed;
  ball.vy = Math.sin(angle) * ball.speed;
  sfxHit();
}

function updateHUD(){
  document.getElementById('score').textContent = 'SCORE: '+score.toLocaleString();
  document.getElementById('levelInfo').textContent = `LEVEL ${level}/30`;
  const icon = document.getElementById('ballIcon');
  icon.style.background = `radial-gradient(circle at 30% 30%, ${selectedBall.color}88, ${selectedBall.color}44, transparent)`;
  icon.style.boxShadow = `0 0 15px ${selectedBall.glow}`;
  document.getElementById('ballName').textContent = selectedBall.name;
  const livesDiv = document.getElementById('lives');
  livesDiv.innerHTML = '';
  for(let i=0;i<5;i++){
    const h = document.createElement('span');
    h.className = 'heart' + (i>=lives?' lost':'');
    h.textContent = '♥';
    livesDiv.appendChild(h);
  }
  const bar = document.getElementById('powerupBar');
  bar.innerHTML = '';
  Object.entries(activePowerUps).forEach(([id,data])=>{ const p=PowerUpType[id]; if(p){ const b=document.createElement('div'); b.className='powerup-badge'; b.style.borderColor=p.color; b.innerHTML=`<span style="color:${p.color}">${p.icon}</span>${data.time.toFixed(1)}s`; bar.appendChild(b); } });
}

function gameLoop(ts){
  if(gameState!=='PLAYING') return;
  const dt = Math.min(1/30, (ts - (gameLoop.last||ts))/1000);
  gameLoop.last = ts;
  
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt){
  if(screenShake>0) screenShake = Math.max(0, screenShake-dt);
  
  // Paddle
  const lerp = .2;
  paddle.x += (paddle.targetX - paddle.x) * lerp;
  paddle.x = Math.max(paddle.w/2, Math.min(VIRTUAL_W-paddle.w/2, paddle.x));
  
  if(paddle.stickyTimer>0) paddle.stickyTimer -= dt;
  
  Object.keys(activePowerUps).forEach(id=>{ activePowerUps[id].time -= dt; if(activePowerUps[id].time<=0) delete activePowerUps[id]; });
  updateHUD();
  
  // Balls
  for(let i=balls.length-1;i>=0;i--){
    const ball = balls[i];
    
    if(ball.stuck){
      ball.x = paddle.x;
      ball.y = paddle.y - ball.r - 2;
      if(paddle.vx !== 0) ball.aimAngle = Math.atan2(-1, paddle.vx * .1);
      continue;
    }
    
    // Physics
    ball.vx *= .999; // slight air resistance
    if(ball.type === 'GRAVITON') ball.vy += .08 * 60 * dt; // gravity
    if(ball.type === 'ELASTIS'){ ball.speed = Math.min(ball.speed * 1.0005, ball.maxSpeed); }
    
    ball.x += ball.vx * 60 * dt;
    ball.y += ball.vy * 60 * dt;
    
    // Trail
    ball.trail.unshift({x:ball.x,y:ball.y,life:1});
    if(ball.trail.length>15) ball.trail.pop();
    ball.trail.forEach(t=>t.life-=dt*2);
    ball.trail = ball.trail.filter(t=>t.life>0);
    
    // Nexus
    if(ball.type === 'NEXUS'){
      ball.nexusTimer += dt;
      if(ball.nexusTimer >= 2 && balls.length < 6){
        for(let a=-.35;a<=.35;a+=.35){
          const nb = {...ball, vx:Math.cos(-Math.PI/2+a)*ball.speed, vy:Math.sin(-Math.PI/2+a)*ball.speed, stuck:false, type:'STANDARD', color:'#fff', glow:'#fff', nexusTimer:0 };
          balls.push(nb);
        }
        ball.nexusTimer = 0;
      }
    }
    
    // Vacuo attraction
    if(ball.type === 'VACUO'){
      bricks.forEach(b=>{
        if(b.hp===1 && b.visible && b.type!=='INDESTRUCTIBLE'){
          const dx = ball.x - (b.x+b.w/2), dy = ball.y - (b.y+b.h/2);
          const dist = Math.hypot(dx,dy);
          if(dist < 80 * ball.vacuumSize){
            const force = (80-dist)/80 * .5;
            b.x += dx/dist * force * 60 * dt;
            b.y += dy/dist * force * 60 * dt;
            if(dist < ball.r * ball.vacuumSize + 20){
              destroyBrick(b);
              ball.vacuumSize = Math.min(2, ball.vacuumSize + .1);
              ball.r = 8 * ball.vacuumSize;
            }
          }
        }
      });
    }
    
    // Wall collisions
    if(ball.x - ball.r < 0){ ball.x = ball.r; ball.vx *= -1; sfxHit(); }
    if(ball.x + ball.r > VIRTUAL_W){ ball.x = VIRTUAL_W - ball.r; ball.vx *= -1; sfxHit(); }
    if(ball.y - ball.r < 0){ ball.y = ball.r; ball.vy *= -1; sfxHit(); }
    
    // Paddle collision
    if(ball.y + ball.r > paddle.y - paddle.h/2 && ball.y - ball.r < paddle.y + paddle.h/2 &&
       ball.x > paddle.x - paddle.w/2 && ball.x < paddle.x + paddle.w/2 && ball.vy > 0){
      const hitPos = (ball.x - paddle.x) / (paddle.w/2);
      const angle = hitPos * Math.PI/3;
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
      ball.y = paddle.y - paddle.h/2 - ball.r;
      
      if(paddle.material === 'STICKY' || paddle.stickyTimer>0){ ball.stuck=true; paddle.stickyTimer=0; paddle.material='STANDARD'; }
      else if(paddle.material === 'SPEED'){ ball.vx*=1.2; ball.vy*=1.2; }
      else if(paddle.material === 'CURVE'){ ball.vx += paddle.vx * .3; }
      
      sfxHit();
      createParticles(ball.x, ball.y, ball.glow, 5);
    }
    
    // Brick collisions
    bricks.forEach(brick=>{
      if(!brick.visible || brick.hp<=0) return;
      if(circleRectCollide(ball, brick)){
        handleBrickCollision(ball, brick);
      }
    });
    
    // Bottom death
    if(ball.y - ball.r > VIRTUAL_H){
      balls.splice(i,1);
      ballsLostThisLevel++;
      sfxLose();
      screenShake = .3;
      if(balls.length === 0){
        lives--;
        if(lives <= 0){
          gameOver();
        } else {
          spawnBall();
        }
      }
    }
  }
  
  // Power-ups
  for(let i=powerUps.length-1;i>=0;i--){
    const p = powerUps[i];
    p.y += 60 * dt;
    p.rotation += dt * 2;
    if(p.y - p.r > VIRTUAL_H){ powerUps.splice(i,1); continue; }
    if(circleRectCollide(p, {x:paddle.x, y:paddle.y, w:paddle.w, h:paddle.h})){
      applyPowerUp(p.type);
      powerUps.splice(i,1);
      sfxPower();
      createParticles(p.x, p.y, PowerUpType[p.type].color, 10);
    }
  }
  
  // Particles
  particles.forEach(p=>{ p.x += p.vx * 60 * dt; p.y += p.vy * 60 * dt; p.life -= dt; p.alpha = p.life / p.maxLife; });
  particles = particles.filter(p=>p.life>0);
  
  // Check level complete
  if(destroyedBricks >= totalBricks){
    levelComplete();
  }
}

function circleRectCollide(circle, rect){
  const distX = Math.abs(circle.x - rect.x - rect.w/2);
  const distY = Math.abs(circle.y - rect.y - rect.h/2);
  if(distX > rect.w/2 + circle.r) return false;
  if(distY > rect.h/2 + circle.r) return false;
  if(distX <= rect.w/2) return true;
  if(distY <= rect.h/2) return true;
  const dx = distX - rect.w/2;
  const dy = distY - rect.h/2;
  return dx*dx + dy*dy <= circle.r*circle.r;
}

function handleBrickCollision(ball, brick){
  // Determine collision side
  const ballLeft = ball.x - ball.r, ballRight = ball.x + ball.r;
  const ballTop = ball.y - ball.r, ballBottom = ball.y + ball.r;
  const brickLeft = brick.x, brickRight = brick.x + brick.w;
  const brickTop = brick.y, brickBottom = brick.y + brick.h;
  
  const overlapX = Math.min(ballRight, brickRight) - Math.max(ballLeft, brickLeft);
  const overlapY = Math.min(ballBottom, brickBottom) - Math.max(ballTop, brickTop);
  
  if(overlapX < overlapY){
    if(ball.x < brick.x + brick.w/2) ball.x = brickLeft - ball.r;
    else ball.x = brickRight + ball.r;
    ball.vx *= -1;
  } else {
    if(ball.y < brick.y + brick.h/2) ball.y = brickTop - ball.r;
    else ball.y = brickBottom + ball.r;
    ball.vy *= -1;
  }
  
  // Ball type effects
  if(ball.type === 'IGNIS'){
    // Pass through: don't destroy brick, but damage it
    brick.hp--;
    if(brick.hp <= 0) destroyBrick(brick);
    else { sfxHit(); createParticles(ball.x, ball.y, ball.glow, 3); }
    return;
  }
  if(ball.type === 'CRYOS'){
    brick.frozen = 3;
    brick.color = '#4ecdc4';
  }
  if(ball.type === 'FRACTIO' && ball.splitCount < 3){
    const angle = Math.atan2(ball.vy, ball.vx);
    for(const a of [angle + 0.5, angle - 0.5]){
      balls.push({
        x:ball.x, y:ball.y, r:ball.r,
        vx:Math.cos(a)*ball.speed, vy:Math.sin(a)*ball.speed,
        speed:ball.speed, maxSpeed:ball.maxSpeed,
        type:'STANDARD', color:'#fff', glow:'#fff',
        trail:[], stuck:false, aimAngle:0,
        splitCount:ball.splitCount+1, nexusTimer:0, vacuumSize:1
      });
    }
    ball.splitCount++;
  }
  if(ball.type === 'EXPLOSIO'){
    explodeBrick(brick);
    return;
  }
  if(ball.type === 'PLASMA'){
    chainLightning(brick);
  }
  if(ball.type === 'UMBRA'){
    revealHidden();
  }
  
  // Normal brick damage
  brick.hp--;
  if(brick.hp <= 0){
    destroyBrick(brick);
  } else {
    sfxBrick();
    createParticles(ball.x, ball.y, brick.color || '#fff', 3);
  }
  
  // Combo
  const now = performance.now();
  if(now - lastBrickHit < 1000) combo++;
  else combo = 1;
  lastBrickHit = now;
  if(combo > 1) showCombo(combo);
  
  // Score
  score += 10 * combo * (brick.type==='TOUGH'?2:brick.type==='REINFORCED'?3:1);
  
  // Power-up drop chance
  if(Math.random() < 0.08) spawnPowerUp(brick.x + brick.w/2, brick.y + brick.h/2);
}

function destroyBrick(brick){
  brick.visible = false;
  brick.hp = 0;
  destroyedBricks++;
  sfxDestroy();
  createParticles(brick.x+brick.w/2, brick.y+brick.h/2, brick.color || '#fff', 15);
  screenShake = 0.15;
}

function explodeBrick(brick){
  sfxExplosion();
  createParticles(brick.x+brick.w/2, brick.y+brick.h/2, '#ff4757', 30);
  screenShake = 0.4;
  bricks.forEach(b=>{
    if(b.visible && b !== brick){
      const dist = Math.hypot(b.x+brick.w/2 - brick.x - brick.w/2, b.y+brick.h/2 - brick.y - brick.h/2);
      if(dist < 80){
        b.hp = 0;
        destroyBrick(b);
      }
    }
  });
  brick.hp = 0;
  destroyBrick(brick);
}

function chainLightning(brick){
  let count = 3;
  bricks.forEach(b=>{
    if(b.visible && b !== brick && count>0){
      const dist = Math.hypot(b.x+brick.w/2 - brick.x - brick.w/2, b.y+brick.h/2 - brick.y - brick.h/2);
      if(dist < 100){
        b.hp--;
        if(b.hp<=0) destroyBrick(b);
        else { sfxBrick(); createParticles(b.x+b.w/2, b.y+b.h/2, '#00ffff', 5); }
        count--;
        createParticles(brick.x+brick.w/2, brick.y+brick.h/2, '#00ffff', 5);
      }
    }
  });
}

function revealHidden(){
  bricks.forEach(b=>{
    if(b.type==='HIDDEN' && !b.visible){
      b.visible = true;
      b.revealTimer = 5;
      createParticles(b.x+b.w/2, b.y+b.h/2, '#aaa', 10);
    }
  });
}

function spawnPowerUp(x, y){
  const types = Object.keys(PowerUpType);
  const type = types[Math.floor(Math.random()*types.length)];
  powerUps.push({x, y, r:12, type, vy:2, rotation:0});
}

function applyPowerUp(type){
  const p = PowerUpType[type];
  if(!p) return;
  if(p.dur > 0){
    activePowerUps[type] = {time:p.dur};
    if(type==='EXPAND') paddle.w = Math.min(200, paddle.w * 1.5);
    if(type==='SHRINK') paddle.w = Math.max(60, paddle.w * 0.7);
    if(type==='SLOW') { /* global slow handled in render */ }
    if(type==='FIRE') { /* fire trail handled in ball render */ }
    if(type==='MAGNET') { paddle.material = 'MAGNET'; }
    if(type==='STICKY') { paddle.stickyTimer = p.dur; }
  } else {
    if(type==='MULTI'){
      const mainBall = balls[0];
      if(mainBall){
        for(const a of [-0.5, 0.5]){
          balls.push({
            x:mainBall.x, y:mainBall.y, r:mainBall.r,
            vx:Math.cos(-Math.PI/2+a)*mainBall.speed, vy:Math.sin(-Math.PI/2+a)*mainBall.speed,
            speed:mainBall.speed, maxSpeed:mainBall.maxSpeed,
            type:'STANDARD', color:'#fff', glow:'#fff',
            trail:[], stuck:false, aimAngle:0,
            splitCount:0, nexusTimer:0, vacuumSize:1
          });
        }
      }
    }
    if(type==='LIFE'){
      lives = Math.min(5, lives+1);
      sfxLife();
    }
  }
  updateHUD();
}

function createParticles(x, y, color, count){
  for(let i=0;i<count;i++){
    const angle = Math.random()*Math.PI*2;
    const speed = 1 + Math.random()*3;
    particles.push({
      x, y,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed,
      life:0.5+Math.random()*0.5,
      maxLife:1,
      color,
      size:2+Math.random()*3,
      alpha:1
    });
  }
}

function showCombo(c){
  const el = document.getElementById('comboPopup');
  el.textContent = c + 'x COMBO!';
  el.style.animation = 'none';
  el.offsetHeight; // trigger reflow
  el.style.animation = 'comboAnim .8s ease-out forwards';
  sfxCombo();
}

function levelComplete(){
  gameState = 'LEVEL_COMPLETE';
  showScreen('levelCompleteScreen');
  sfxLevel();
  const timeTaken = ((performance.now() - levelStartTime)/1000).toFixed(1);
  document.getElementById('bricksPct').textContent = '100%';
  document.getElementById('timeTaken').textContent = timeTaken+'s';
  document.getElementById('ballsLost').textContent = ballsLostThisLevel;
  document.getElementById('levelScore').textContent = score.toLocaleString();
  
  // Stars
  const starsDiv = document.getElementById('stars');
  starsDiv.innerHTML = '';
  let stars = 1;
  if(ballsLostThisLevel === 0) stars++;
  if(parseFloat(timeTaken) < 30 + level*2) stars++;
  stars = Math.min(3, stars);
  for(let i=0;i<3;i++){
    const s = document.createElement('span');
    s.className = 'star' + (i<stars?' filled':'');
    s.textContent = '★';
    starsDiv.appendChild(s);
  }
  
  // Unlock next level
  if(level < 30 && level >= progress.level){
    progress.level = level+1;
    saveProgress();
  }
  
  // Unlock balls at certain levels
  const unlockMap = {5:'CRYOS',10:'FRACTIO',15:'GRAVITON',20:'UMBRA',25:'EXPLOSIO',26:'PLASMA',27:'ELASTIS',28:'VACUO',29:'NEXUS'};
  if(unlockMap[level] && !unlockedBalls.includes(unlockMap[level])){
    unlockedBalls.push(unlockMap[level]);
    saveProgress();
  }
}

function gameOver(){
  gameState = 'GAME_OVER';
  showScreen('gameOverScreen');
  sfxGameOver();
  document.getElementById('finalScore').textContent = score.toLocaleString();
  const hs = highScores[level] || 0;
  if(score > hs){
    highScores[level] = score;
    localStorage.setItem('breakoutScores', JSON.stringify(highScores));
    document.getElementById('newHighScore').style.display = 'block';
  }
}

function saveProgress(){
  localStorage.setItem('breakoutProgress', JSON.stringify({level:progress.level, unlocked:unlockedBalls}));
}

function render(){
  ctx.save();
  if(screenShake>0){
    ctx.translate((Math.random()-0.5)*screenShake*20, (Math.random()-0.5)*screenShake*20);
  }
  
  // Background
  ctx.fillStyle = '#05081a';
  ctx.fillRect(0,0,VIRTUAL_W,VIRTUAL_H);
  
  // Stars background
  ctx.fillStyle = '#fff';
  for(let i=0;i<50;i++){
    const x = (i*12345 + performance.now()/50) % VIRTUAL_W;
    const y = (i*67890) % VIRTUAL_H;
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + Math.sin(performance.now()/1000 + i)*0.5, 0, Math.PI*2);
    ctx.fill();
  }
  
  // Bricks
  bricks.forEach(brick=>{
    if(!brick.visible) return;
    if(brick.type==='INDESTRUCTIBLE'){
      ctx.fillStyle = '#333';
      ctx.strokeStyle = '#555';
    } else if(brick.type==='TOUGH'){
      ctx.fillStyle = '#888';
      ctx.strokeStyle = '#aaa';
    } else if(brick.type==='REINFORCED'){
      ctx.fillStyle = '#555';
      ctx.strokeStyle = '#777';
    } else if(brick.type==='EXPLOSIVE'){
      ctx.fillStyle = '#ff4757';
      ctx.strokeStyle = '#ff6b35';
    } else if(brick.type==='HIDDEN'){
      if(brick.revealTimer>0){
        ctx.fillStyle = '#888';
        ctx.strokeStyle = '#aaa';
        brick.revealTimer -= 1/60;
      } else {
        return;
      }
    } else {
      ctx.fillStyle = brick.frozen>0 ? '#4ecdc4' : '#4ecdc4';
      ctx.strokeStyle = '#4ecdc4';
    }
    
    if(brick.frozen>0) brick.frozen -= 1/60;
    
    roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 3);
    ctx.fill();
    ctx.stroke();
    
    // HP indicator
    if(brick.maxHp > 1){
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(brick.hp, brick.x+brick.w/2, brick.y+brick.h/2+3);
    }
  });
  
  // Paddle
  const paddleGrad = ctx.createLinearGradient(paddle.x-paddle.w/2, paddle.y-paddle.h/2, paddle.x+paddle.w/2, paddle.y+paddle.h/2);
  if(paddle.material==='MAGNET'){ paddleGrad.addColorStop(0, '#fff'); paddleGrad.addColorStop(1, '#4ecdc4'); }
  else if(paddle.stickyTimer>0){ paddleGrad.addColorStop(0, '#f7b733'); paddleGrad.addColorStop(1, '#ff6b35'); }
  else { paddleGrad.addColorStop(0, '#4ecdc4'); paddleGrad.addColorStop(1, '#1a1a2e'); }
  ctx.fillStyle = paddleGrad;
  roundRect(ctx, paddle.x-paddle.w/2, paddle.y-paddle.h/2, paddle.w, paddle.h, paddle.r);
  ctx.fill();
  ctx.shadowColor = '#4ecdc4';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#4ecdc4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Balls
  balls.forEach(ball=>{
    // Trail
    ball.trail.forEach((t, idx)=>
    {
      ctx.globalAlpha = t.life * 0.5;
      ctx.fillStyle = ball.glow;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ball.r * (1 - idx/ball.trail.length), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // Ball glow
    ctx.shadowColor = ball.glow;
    ctx.shadowBlur = 15;
    
    // Ball body
    const ballGrad = ctx.createRadialGradient(ball.x - ball.r/3, ball.y - ball.r/3, 0, ball.x, ball.y, ball.r);
    ballGrad.addColorStop(0, '#fff');
    ballGrad.addColorStop(0.5, ball.color);
    ballGrad.addColorStop(1, ball.glow);
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Special ball indicators
    if(ball.type==='NEXUS'){
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r+5, 0, Math.PI*2);
      ctx.stroke();
    }
    if(ball.type==='VACUO'){
      ctx.strokeStyle = '#4ecdc4';
      ctx.lineWidth = 1;
      ctx.setLineDash([5,5]);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 80*ball.vacuumSize, 0, Math.PI*2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
  
  // Power-ups
  powerUps.forEach(p=>{
    const pu = PowerUpType[p.type];
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = pu.color;
    ctx.beginPath();
    ctx.arc(0,0,p.r,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(pu.icon, 0, 5);
    ctx.restore();
  });
  
  // Particles
  particles.forEach(p=>{
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// Input
canvas.addEventListener('mousemove', e=>{
  const rect = canvas.getBoundingClientRect();
  paddle.targetX = (e.clientX - rect.left) / scale;
});
canvas.addEventListener('touchmove', e=>{
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  paddle.targetX = (touch.clientX - rect.left) / scale;
}, {passive:false});

canvas.addEventListener('click', e=>{
  if(gameState==='PLAYING'){
    balls.forEach(b=>{ if(b.stuck) launchBall(b); });
  }
});
canvas.addEventListener('touchstart', e=>{
  if(gameState==='PLAYING'){
    balls.forEach(b=>{ if(b.stuck) launchBall(b); });
  }
});

window.addEventListener('keydown', e=>{
  if(e.code==='Escape'){
    if(gameState==='PLAYING'){ pauseGame(); }
    else if(gameState==='PAUSED'){ resumeGame(); }
  }
  if(e.code==='Space' && gameState==='PLAYING'){
    balls.forEach(b=>{ if(b.stuck) launchBall(b); });
  }
});

function pauseGame(){
  gameState = 'PAUSED';
  showScreen('pauseScreen');
}
function resumeGame(){
  gameState = 'PLAYING';
  showScreen('playing');
  requestAnimationFrame(gameLoop);
}
function restartLevel(){
  loadLevel(level);
  resumeGame();
}
function quitToMenu(){
  gameState = 'MENU';
  showScreen('menuScreen');
}
function retryGame(){
  startGame();
}
function nextLevel(){
  level++;
  ballsLostThisLevel = 0;
  loadLevel(level);
  gameState = 'PLAYING';
  showScreen('playing');
  levelStartTime = performance.now();
  requestAnimationFrame(gameLoop);
}
function replayLevel(){
  ballsLostThisLevel = 0;
  loadLevel(level);
  gameState = 'PLAYING';
  showScreen('playing');
  levelStartTime = performance.now();
  requestAnimationFrame(gameLoop);
}
function confirmBallSelect(){
  showScreen('menuScreen');
}
function toggleFullscreen(){
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen().catch(()=>{});
  } else {
    document.exitFullscreen();
  }
}

// Volume controls
document.getElementById('masterVol').addEventListener('input', e=>{ masterGain.gain.value = e.target.value; });
document.getElementById('musicVol').addEventListener('input', e=>{ musicGain.gain.value = e.target.value; });
document.getElementById('sfxVol').addEventListener('input', e=>{ sfxGain.gain.value = e.target.value; });

// High scores
document.getElementById('highScoreScreen').addEventListener('transitionend', ()=>{
  const list = document.getElementById('highScoreList');
  list.innerHTML = '';
  for(let l=1;l<=30;l++){
    if(highScores[l]){
      const div = document.createElement('div');
      div.className = 'stat';
      div.innerHTML = `Level ${l}: <span>${highScores[l].toLocaleString()}</span>`;
      list.appendChild(div);
    }
  }
});

// Initialize
initBallSelect();
updateHUD();

// Start loop when playing
function startLoop(){
  if(gameState==='PLAYING') requestAnimationFrame(gameLoop);
}

// Expose for inline handlers
window.startGame = startGame;
window.showScreen = showScreen;
window.resumeGame = resumeGame;
window.restartLevel = restartLevel;
window.quitToMenu = quitToMenu;
window.retryGame = retryGame;
window.nextLevel = nextLevel;
window.replayLevel = replayLevel;
window.confirmBallSelect = confirmBallSelect;
window.toggleFullscreen = toggleFullscreen;

// Initial screen
showScreen('menuScreen');
</script>
</body>
</html>