// Duality Drift - Fixed Implementation
const CONFIG = {
  LOGICAL_WIDTH: 1280,
  LOGICAL_HEIGHT: 720,
  SPLIT_ORIENTATION: 'HORIZONTAL',
  PLAYER_COUNT: 2,
  MAX_STABILITY: 100,
  GAME_TIME: 180,
  SHARD_SPAWN_INTERVAL: 2.5,
  ECHO_DELAY: 0.5,
  BANK_TIME: 1.2,
  DECAY_RATE: 0.5
};
const PHYS = {
  MAX_SPEED: 420,
  MAX_FALL_SPEED: 900,
  ACCEL_GROUND: 2800,
  ACCEL_AIR: 1400,
  DECEL_GROUND: 3200,
  DECEL_AIR: 200,
  JUMP_VELOCITY: -580,
  GRAVITY: 1600,
  JUMP_VARIABLE_GRAVITY: 1.8,
  COYOTE_TIME: 0.08,
  JUMP_BUFFER: 0.12,
  DASH_SPEED: 1100,
  DASH_DURATION: 0.14,
  DASH_COOLDOWN: 0.85
};
const COLORS = ['#00ffff', '#ff00ff'];
let canvas, ctx, lastTime = 0;
let gameState = {
  players: [], shards: [], echoes: [], pendingEchoes: [],
  stability: [0, 0], carriedShards: [[], []],
  shardTimer: 0, gameStartTime: 0, isOver: false, winner: -1,
  highScore: loadHighScore()
};
const INPUT_STATE = { p1: {x:0,y:0,jump:false,dash:false,bank:false}, p2: {x:0,y:0,jump:false,dash:false,bank:false} };
const keysDown = new Set();
function init(){
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  setupInput();
  createPlayers();
  gameState.gameStartTime = performance.now();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}
function resizeCanvas(){
  if(!canvas) return;
  const scale = Math.min(window.innerWidth / CONFIG.LOGICAL_WIDTH, window.innerHeight / CONFIG.LOGICAL_HEIGHT);
  canvas.width = Math.round(CONFIG.LOGICAL_WIDTH * scale);
  canvas.height = Math.round(CONFIG.LOGICAL_HEIGHT * scale);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  ctx.setTransform(scale,0,0,scale,0,0);
}
function recomputeInput(){
  const k = keysDown;
  INPUT_STATE.p1.x = (k.has('KeyD')?1:0) - (k.has('KeyA')?1:0);
  INPUT_STATE.p1.y = (k.has('KeyS')?1:0) - (k.has('KeyW')?1:0);
  INPUT_STATE.p1.jump = k.has('Space') || k.has('KeyW');
  INPUT_STATE.p1.dash = k.has('ShiftLeft') || k.has('ShiftRight');
  INPUT_STATE.p1.bank = k.has('KeyE');
  INPUT_STATE.p2.x = (k.has('ArrowRight')?1:0) - (k.has('ArrowLeft')?1:0);
  INPUT_STATE.p2.y = (k.has('ArrowDown')?1:0) - (k.has('ArrowUp')?1:0);
  INPUT_STATE.p2.jump = k.has('ArrowUp') || k.has('Numpad0');
  INPUT_STATE.p2.dash = k.has('Numpad1') || k.has('ShiftRight');
  INPUT_STATE.p2.bank = k.has('Numpad2') || k.has('Enter');
}
function setupInput(){
  window.addEventListener('keydown', e=>{
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    if(!e.repeat){ keysDown.add(e.code); recomputeInput(); }
  });
  window.addEventListener('keyup', e=>{ keysDown.delete(e.code); recomputeInput(); });
  window.addEventListener('blur', ()=>{ keysDown.clear(); recomputeInput(); });
  window.addEventListener('gamepadconnected', e=>console.log('Gamepad connected', e.gamepad));
}
function createPlayers(){
  gameState.players = [
    {id:0,x:100,y:100,w:32,h:48,vx:0,vy:0,facing:1,color:COLORS[0],onGround:false,coyote:0,jumpBuffer:0,dashCooldown:0,dashTime:0,invuln:0,bankTimer:0,prevJump:false},
    {id:1,x:CONFIG.LOGICAL_WIDTH-100,y:CONFIG.LOGICAL_HEIGHT-100,w:32,h:48,vx:0,vy:0,facing:-1,color:COLORS[1],onGround:false,coyote:0,jumpBuffer:0,dashCooldown:0,dashTime:0,invuln:0,bankTimer:0,prevJump:false}
  ];
}
function updatePhysics(dt){
  gameState.players.forEach((p,idx)=>{
    const input = INPUT_STATE['p'+(idx+1)];
    const wasOnGround = p.onGround;
    if(wasOnGround) p.coyote = PHYS.COYOTE_TIME; else p.coyote = Math.max(0,p.coyote-dt);
    if(input.jump && !p.prevJump) p.jumpBuffer = PHYS.JUMP_BUFFER; else p.jumpBuffer = Math.max(0,p.jumpBuffer-dt);
    p.prevJump = input.jump;
    if(p.jumpBuffer>0 && (wasOnGround || p.coyote>0)){
      p.vy = PHYS.JUMP_VELOCITY; p.coyote=0; p.jumpBuffer=0; p.onGround=false; playSound('jump');
    }
    if(input.x!==0) p.facing = input.x;
    const accel = wasOnGround ? PHYS.ACCEL_GROUND : PHYS.ACCEL_AIR;
    const decel = wasOnGround ? PHYS.DECEL_GROUND : PHYS.DECEL_AIR;
    if(p.dashTime<=0){
      if(input.x!==0){
        p.vx += accel * input.x * dt;
        p.vx = Math.max(-PHYS.MAX_SPEED, Math.min(PHYS.MAX_SPEED, p.vx));
      } else {
        const sign = Math.sign(p.vx);
        p.vx -= sign * decel * dt;
        if(Math.sign(p.vx)!==sign) p.vx=0;
      }
    }
    if(p.dashCooldown>0) p.dashCooldown-=dt;
    if(input.dash && p.dashCooldown<=0 && p.dashTime<=0){
      p.dashTime = PHYS.DASH_DURATION; p.dashCooldown = PHYS.DASH_COOLDOWN;
      const dirX = input.x!==0 ? input.x : p.facing;
      const dirY = input.y!==0 ? input.y : 0;
      const len = Math.hypot(dirX,dirY)||1;
      p.vx = dirX/len*PHYS.DASH_SPEED; p.vy = dirY/len*PHYS.DASH_SPEED;
      p.invuln = Math.max(p.invuln,0.1); playSound('dash');
    }
    if(p.dashTime>0){ p.dashTime-=dt; if(p.dashTime<=0){ p.vx*=0.8; p.vy*=0.8; } }
    let gravity = PHYS.GRAVITY;
    if(!input.jump && p.vy<0) gravity *= PHYS.JUMP_VARIABLE_GRAVITY;
    if(p.dashTime<=0) p.vy += gravity*dt;
    p.vy = Math.min(p.vy, PHYS.MAX_FALL_SPEED);
    p.x += p.vx*dt; p.y += p.vy*dt;
    const halfW=p.w/2, halfH=p.h/2;
    p.x = Math.max(halfW, Math.min(CONFIG.LOGICAL_WIDTH-halfW, p.x));
    p.y = Math.max(halfH, Math.min(CONFIG.LOGICAL_HEIGHT-halfH, p.y));
    p.onGround=false;
    if(p.y >= CONFIG.LOGICAL_HEIGHT-halfH){ p.y=CONFIG.LOGICAL_HEIGHT-halfH; p.vy=0; p.onGround=true; }
    if(p.invuln>0) p.invuln-=dt;
  });
}
function updateShards(dt){
  gameState.shardTimer-=dt;
  if(gameState.shardTimer<=0){ spawnShard(); gameState.shardTimer=CONFIG.SHARD_SPAWN_INTERVAL+Math.random()*1.5; }
  for(let i=gameState.shards.length-1;i>=0;i--){
    const s=gameState.shards[i];
    s.angle+=s.spin*dt;
    if(s.type==='volatile'){ s.volatileTimer-=dt; if(s.volatileTimer<=0){ gameState.shards.splice(i,1); continue; } }
    for(let pIdx=0;pIdx<gameState.players.length;pIdx++){
      if(rectCircleOverlap(gameState.players[pIdx],s)){ collectShard(i,pIdx); break; }
    }
  }
}
function updateEchoes(dt){
  for(let i=gameState.pendingEchoes.length-1;i>=0;i--){
    const pe=gameState.pendingEchoes[i]; pe.timer-=dt;
    if(pe.timer<=0){ gameState.echoes.push(pe.echo); gameState.pendingEchoes.splice(i,1); }
  }
  for(let i=gameState.echoes.length-1;i>=0;i--){
    const e=gameState.echoes[i]; e.life-=dt;
    if(e.life<=0){ gameState.echoes.splice(i,1); continue; }
    for(let pIdx=0;pIdx<gameState.players.length;pIdx++){
      if(e.targetPlayer!==pIdx && gameState.players[pIdx].invuln<=0 && rectRectOverlapCenter(gameState.players[pIdx],e)){
        hitPlayer(pIdx,e.knockbackX,e.knockbackY); gameState.echoes.splice(i,1); break;
      }
    }
  }
}
function updateStability(dt){
  gameState.stability = gameState.stability.map(s=>Math.max(0,s-CONFIG.DECAY_RATE*dt));
  gameState.players.forEach((p,idx)=>bankShards(idx,dt));
  if(!gameState.isOver){
    const elapsed=(performance.now()-gameState.gameStartTime)/1000;
    if(elapsed>=CONFIG.GAME_TIME || gameState.stability[0]>=CONFIG.MAX_STABILITY || gameState.stability[1]>=CONFIG.MAX_STABILITY) endGame();
  }
}
function spawnShard(){
  const type=Math.random()<0.1?'volatile':'stable';
  gameState.shards.push({x:50+Math.random()*(CONFIG.LOGICAL_WIDTH-100),y:50+Math.random()*(CONFIG.LOGICAL_HEIGHT-100),r:type==='stable'?14:16,angle:0,spin:(Math.random()-0.5)*4,type,volatileTimer:type==='volatile'?1.5:0});
}
function collectShard(shardIdx,playerIdx){
  const shard=gameState.shards[shardIdx]; if(!shard) return;
  gameState.carriedShards[playerIdx].push(shard);
  gameState.shards.splice(shardIdx,1); playSound('collect');
  const oppIdx=1-playerIdx;
  const echo={x:gameState.players[oppIdx].x,y:gameState.players[oppIdx].y,w:20,h:20,life:2,targetPlayer:oppIdx,knockbackX:(Math.random()-0.5)*600,knockbackY:(Math.random()-0.5)*600};
  gameState.pendingEchoes.push({timer:CONFIG.ECHO_DELAY,echo});
}
function bankShards(playerIdx,dt){
  const p=gameState.players[playerIdx];
  const inZone = playerIdx===0 ? p.x<=100 : p.x>=CONFIG.LOGICAL_WIDTH-100;
  const wantsBank = INPUT_STATE['p'+(playerIdx+1)].bank;
  if(inZone && wantsBank && gameState.carriedShards[playerIdx].length>0){
    p.bankTimer+=dt;
    if(p.bankTimer>=CONFIG.BANK_TIME){
      const gained=gameState.carriedShards[playerIdx].reduce((sum,s)=>sum+(s.type==='stable'?5:15),0);
      gameState.stability[playerIdx]=Math.min(CONFIG.MAX_STABILITY,gameState.stability[playerIdx]+gained);
      gameState.carriedShards[playerIdx]=[]; p.bankTimer=0; playSound('bank');
      gameState.echoes=gameState.echoes.filter(e=>e.targetPlayer!==playerIdx);
    }
  } else p.bankTimer=0;
}
function hitPlayer(playerIdx,kx,ky){
  const p=gameState.players[playerIdx];
  p.vx+=kx; p.vy+=ky; p.invuln=0.5;
  gameState.stability[playerIdx]=Math.max(0,gameState.stability[playerIdx]-10); playSound('hit');
}
function endGame(){
  if(gameState.isOver) return;
  gameState.isOver=true;
  gameState.winner = gameState.stability[0]>gameState.stability[1]?0:gameState.stability[1]>gameState.stability[0]?1:-1;
  if(gameState.winner!==-1 && gameState.stability[gameState.winner]>gameState.highScore){
    gameState.highScore=gameState.stability[gameState.winner]; saveHighScore(gameState.highScore);
  }
}
function gameLoop(timestamp){
  const dt=Math.min(1/30, Math.max(0,(timestamp-lastTime)/1000)); lastTime=timestamp;
  if(!gameState.isOver){ updatePhysics(dt); updateShards(dt); updateEchoes(dt); updateStability(dt); }
  render();
  requestAnimationFrame(gameLoop);
}
function render(){
  ctx.clearRect(0,0,CONFIG.LOGICAL_WIDTH,CONFIG.LOGICAL_HEIGHT);
  if(CONFIG.SPLIT_ORIENTATION==='HORIZONTAL'){
    renderViewport(0,0,CONFIG.LOGICAL_WIDTH,CONFIG.LOGICAL_HEIGHT/2,0);
    renderViewport(0,CONFIG.LOGICAL_HEIGHT/2,CONFIG.LOGICAL_WIDTH,CONFIG.LOGICAL_HEIGHT/2,1);
  } else {
    renderViewport(0,0,CONFIG.LOGICAL_WIDTH/2,CONFIG.LOGICAL_HEIGHT,0);
    renderViewport(CONFIG.LOGICAL_WIDTH/2,0,CONFIG.LOGICAL_WIDTH/2,CONFIG.LOGICAL_HEIGHT,1);
  }
  renderHUD();
  const timeLeft=Math.max(0,CONFIG.GAME_TIME-(performance.now()-gameState.gameStartTime)/1000);
  ctx.fillStyle='#fff'; ctx.font='20px monospace'; ctx.textAlign='center';
  ctx.fillText(Math.ceil(timeLeft)+'s',CONFIG.LOGICAL_WIDTH/2,30);
  if(gameState.isOver){
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,CONFIG.LOGICAL_WIDTH,CONFIG.LOGICAL_HEIGHT);
    ctx.fillStyle='#fff'; ctx.font='48px monospace';
    ctx.fillText(gameState.winner===-1?'TIE':'PLAYER '+(gameState.winner+1)+' WINS!',CONFIG.LOGICAL_WIDTH/2,CONFIG.LOGICAL_HEIGHT/2);
    ctx.font='24px monospace'; ctx.fillText('High Score: '+gameState.highScore,CONFIG.LOGICAL_WIDTH/2,CONFIG.LOGICAL_HEIGHT/2+40);
  }
}
function renderViewport(x,y,width,height,playerIdx){
  ctx.save(); ctx.beginPath(); ctx.rect(x,y,width,height); ctx.clip();
  ctx.fillStyle='#050510'; ctx.fillRect(x,y,width,height);
  ctx.globalAlpha=0.15; ctx.fillStyle=COLORS[playerIdx];
  ctx.fillRect(playerIdx===0?x:x+width-100,y,100,height); ctx.globalAlpha=1;
  gameState.shards.forEach(s=>{
    ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.angle);
    ctx.fillStyle=s.type==='stable'?'#00ffff':'#ff0000'; ctx.beginPath();
    const radius=s.type==='stable'?s.r:s.r*(0.5+0.5*Math.sin(performance.now()*0.005));
    for(let i=0;i<8;i++){ const a=i*Math.PI/4+(s.type==='stable'?0:Math.PI/8); const px=Math.cos(a)*radius, py=Math.sin(a)*radius; i===0?ctx.moveTo(px,py):ctx.lineTo(px,py); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
  gameState.echoes.forEach(e=>{ if(e.targetPlayer===playerIdx){ ctx.fillStyle='rgba(255,0,0,0.5)'; ctx.fillRect(e.x-e.w/2,e.y-e.h/2,e.w,e.h); } });
  gameState.players.forEach((p,i)=>{
    if(i!==playerIdx) return;
    ctx.fillStyle=p.color; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(p.x-p.w/2,p.y-p.h/2,p.w,p.h,8); else ctx.rect(p.x-p.w/2,p.y-p.h/2,p.w,p.h);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.fill();
    gameState.carriedShards[i].forEach((shard,idx)=>{
      const a=performance.now()*0.002+idx*(Math.PI*2/3); const r=36-idx*4;
      ctx.fillStyle=shard.type==='stable'?'#00ffff':'#ff0000'; ctx.beginPath(); ctx.arc(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,6,0,Math.PI*2); ctx.fill();
    });
    if(p.dashTime>0){ ctx.strokeStyle=p.color; ctx.globalAlpha=0.5; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(p.x-p.vx*0.02,p.y-p.vy*0.02); ctx.lineTo(p.x,p.y); ctx.stroke(); ctx.globalAlpha=1; }
  });
  ctx.restore();
}
function renderHUD(){
  ctx.font='18px monospace'; ctx.textAlign='left'; ctx.fillStyle=COLORS[0];
  ctx.fillText('P1 Stability: '+Math.floor(gameState.stability[0]),10,20);
  ctx.fillText('Shards: '+gameState.carriedShards[0].length,10,40);
  ctx.textAlign='right'; ctx.fillStyle=COLORS[1];
  ctx.fillText('P2 Stability: '+Math.floor(gameState.stability[1]),CONFIG.LOGICAL_WIDTH-10,20);
  ctx.fillText('Shards: '+gameState.carriedShards[1].length,CONFIG.LOGICAL_WIDTH-10,40);
}
function rectCircleOverlap(rect,circle){
  const cx=rect.x, cy=rect.y;
  const closestX=Math.max(cx-rect.w/2,Math.min(circle.x,cx+rect.w/2));
  const closestY=Math.max(cy-rect.h/2,Math.min(circle.y,cy+rect.h/2));
  const dx=circle.x-closestX, dy=circle.y-closestY;
  return dx*dx+dy*dy<=circle.r*circle.r;
}
function rectRectOverlapCenter(a,b){
  return Math.abs(a.x-b.x) < (a.w+b.w)/2 && Math.abs(a.y-b.y) < (a.h+b.h)/2;
}
function playSound(name){ /* Web Audio placeholder - no-op to avoid autoplay errors */ }
function loadHighScore(){ const v=parseInt(localStorage.getItem('dualityDriftHighScore')||'0',10); return Number.isFinite(v)?v:0; }
function saveHighScore(score){ localStorage.setItem('dualityDriftHighScore',String(score)); }
window.addEventListener('load',init);
