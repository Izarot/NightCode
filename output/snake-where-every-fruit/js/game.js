const C = {
  TILE: 32,
  GRID: 20,
  BASE_TICK: 125,
  MIN_TICK: 60,
  SNAKE_LEN: 5,
  COLORS: {
    bg: '#0A0A0F',
    grid: '#1A1A2E',
    head: '#00F2FF',
    headGlow: 'rgba(0,242,255,0.4)',
    bodyStart: '#0088FF',
    bodyEnd: '#003366',
    fruit: '#FF00FF',
    fruitGlow: 'rgba(255,0,255,0.6)',
    wall: '#1A1A2E',
    wallStroke: '#0088FF',
    wallEthereal: '#333344',
    text: '#FFFFFF',
    textDim: '#AAAAAA',
    hudStroke: '#00F2FF',
    hudBg: '#1A1A2E',
    overlay: 'rgba(0,0,0,0.6)',
    death: '#FF00FF'
  }
};

const TILE = {
  EMPTY: 0,
  WALL: 1,
  FRUIT: 2,
  PORTAL_A: 3,
  PORTAL_B: 4,
  CONVEYOR_U: 5,
  CONVEYOR_D: 6,
  CONVEYOR_L: 7,
  CONVEYOR_R: 8
};

const DIR = {
  U: {x:0,y:-1}, D:{x:0,y:1}, L:{x:-1,y:0}, R:{x:1,y:0}
};
const DIR_KEYS = ['U','D','L','R'];
const OPPOSITE = {U:'D',D:'U',L:'R',R:'L'};

const RULES = [
  {id:'SOLID', name:'SOLID', weight:1, init:()=>{}, update:()=>{}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL},
  {id:'ETHEREAL', name:'ETHEREAL', weight:1, init:()=>{}, update:()=>{}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID},
  {id:'WRAPAROUND', name:'WRAPAROUND', weight:1, init:()=>{}, update:()=>{}, checkWall:(x,y)=>grid[y][x]===TILE.WALL, wrap:true},
  {id:'REVERSE', name:'REVERSE', weight:1, init:()=>{}, update:()=>{}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL, reverse:true},
  {id:'SLIPPERY', name:'SLIPPERY', weight:1, init:()=>{slipDir=snake.dir}, update:()=>{if(inputDir)slipDir=inputDir; snake.dir=slipDir}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL},
  {id:'DARKNESS', name:'DARKNESS', weight:1, init:()=>{}, update:()=>{}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL, darkness:true},
  {id:'CONVEYORS', name:'CONVEYORS', weight:1, init:spawnConveyors, update:applyConveyors, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL},
  {id:'PORTALS', name:'PORTALS', weight:1, init:spawnPortals, update:()=>{}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL, portals:true},
  {id:'SPEED_FLUX', name:'SPEED_FLUX', weight:1, init:()=>{}, update:()=>{tickInterval=60+Math.random()*240}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL},
  {id:'GRAVITY_ROTATE', name:'GRAVITY_ROTATE', weight:1, init:()=>{gravRot=0;gravTimer=0}, update:(dt)=>{gravTimer+=dt; if(gravTimer>=5000){gravTimer=0;gravRot=(gravRot+1)%4;}}, checkWall:(x,y)=>x<0||x>=C.GRID||y<0||y>=C.GRID||grid[y][x]===TILE.WALL}
];

let canvas, ctx, state='MENU', lastTime=0, accumulator=0, tickInterval=C.BASE_TICK;
let grid=[], snake={}, fruit={}, score=0, hiScore=0, activeRule=null, ruleAnnounce='', ruleAnnounceTimer=0;
let inputDir=null, inputQueue=[], slipDir=null, gravRot=0, gravTimer=0, shake=0, shakeDecay=0;
let audioCtx, masterGain, muted=false;
let touchZones=[];

function init() {
  canvas=document.getElementById('game');
  ctx=canvas.getContext('2d');
  resize();
  window.addEventListener('resize',resize);
  window.addEventListener('keydown',onKeyDown);
  canvas.addEventListener('touchstart',onTouchStart,{passive:false});
  canvas.addEventListener('touchend',onTouchEnd);
  loadHiScore();
  initAudio();
  requestAnimationFrame(loop);
}

function resize() {
  const size=Math.min(window.innerWidth, window.innerHeight);
  canvas.width=640;
  canvas.height=640;
  canvas.style.width=size+'px';
  canvas.style.height=size+'px';
  setupTouchZones();
}

function setupTouchZones() {
  const s=canvas.width;
  const pad=64;
  touchZones=[
    {x:s/2-pad/2, y:s-pad-10, w:pad, h:pad, dir:'U'},
    {x:s/2-pad/2, y:s-10, w:pad, h:pad, dir:'D'},
    {x:10, y:s-pad*1.5-10, w:pad, h:pad, dir:'L'},
    {x:s-pad-10, y:s-pad*1.5-10, w:pad, h:pad, dir:'R'}
  ];
}

function onKeyDown(e) {
  const map={ArrowUp:'U',ArrowDown:'D',ArrowLeft:'L',ArrowRight:'R',KeyW:'U',KeyS:'D',KeyA:'L',KeyD:'R'};
  if(map[e.code]){e.preventDefault(); queueInput(map[e.code]);}
  if(e.code==='Space'){e.preventDefault(); togglePause();}
  if(e.code==='KeyM'){toggleMute();}
}

function onTouchStart(e) {
  e.preventDefault();
  for(const t of e.changedTouches){
    const rect=canvas.getBoundingClientRect();
    const x=t.clientX-rect.left;
    const y=t.clientY-rect.top;
    for(const z of touchZones){
      if(x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h){queueInput(z.dir);break;}
    }
  }
}

function onTouchEnd(e) {}

function queueInput(dir) {
  if(inputQueue.length===0||inputQueue[inputQueue.length-1]!==dir){
    if(activeRule&&activeRule.reverse) dir=OPPOSITE[dir];
    if(snake.dir&&dir!==OPPOSITE[snake.dir]) inputQueue.push(dir);
  }
}

function togglePause() {
  if(state==='PLAYING') state='PAUSED';
  else if(state==='PAUSED') state='PLAYING';
}

function toggleMute() {
  muted=!muted;
  masterGain.gain.value=muted?0:0.4;
  localStorage.setItem('muted',muted);
}

function initAudio() {
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  masterGain=audioCtx.createGain();
  masterGain.gain.value=0.4;
  masterGain.connect(audioCtx.destination);
  muted=localStorage.getItem('muted')==='true';
  if(muted) masterGain.gain.value=0;
}

function playSound(type) {
  if(muted||!audioCtx) return;
  const now=audioCtx.currentTime;
  if(type==='fruit'){
    [880,1320].forEach((f,i)=>{const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=0.1;o.connect(g);g.connect(masterGain);o.start(now+i*0.1);o.stop(now+i*0.1+0.1);});
  }else if(type==='rule'){
    [220,277,330].forEach(f=>{const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=0.05;o.connect(g);g.connect(masterGain);o.start(now);g.gain.exponentialRampToValueAtTime(0.001,now+0.5);o.stop(now+0.5);});
  }else if(type==='death'){
    const buffer=audioCtx.createBuffer(1,audioCtx.sampleRate*0.4,audioCtx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    const src=audioCtx.createBufferSource();src.buffer=buffer;
    const g=audioCtx.createGain();g.gain.value=0.2;g.gain.exponentialRampToValueAtTime(0.001,now+0.4);
    src.connect(g);g.connect(masterGain);src.start(now);
  }else if(type==='click'){
    const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.type='sine';o.frequency.value=600;g.gain.value=0.05;o.connect(g);g.connect(masterGain);o.start(now);g.gain.exponentialRampToValueAtTime(0.001,now+0.06);o.stop(now+0.06);
  }
}

function loadHiScore() {hiScore=parseInt(localStorage.getItem('hiScore')||'0',10);}
function saveHiScore() {if(score>hiScore){hiScore=score;localStorage.setItem('hiScore',hiScore);}}

function newGame() {
  state='PLAYING';
  score=0;
  tickInterval=C.BASE_TICK;
  accumulator=0;
  shake=0;
  grid=Array.from({length:C.GRID},()=>Array(C.GRID).fill(TILE.EMPTY));
  addWalls();
  snake={body:[{x:10,y:10},{x:9,y:10},{x:8,y:10},{x:7,y:10},{x:6,y:10}],dir:'R',nextDir:'R',lerp:0};
  spawnFruit();
  setRule(RULES[0]);
}

function addWalls() {
  for(let i=0;i<C.GRID;i++){
    grid[0][i]=TILE.WALL;
    grid[C.GRID-1][i]=TILE.WALL;
    grid[i][0]=TILE.WALL;
    grid[i][C.GRID-1]=TILE.WALL;
  }
}

function spawnFruit() {
  const empties=[];
  for(let y=1;y<C.GRID-1;y++)for(let x=1;x<C.GRID-1;x++)if(grid[y][x]===TILE.EMPTY&&!snake.body.some(s=>s.x===x&&s.y===y)) empties.push({x,y});
  if(empties.length===0) return;
  const pos=empties[Math.floor(Math.random()*empties.length)];
  grid[pos.y][pos.x]=TILE.FRUIT;
  fruit={x:pos.x,y:pos.y,pulse:0};
}

function setRule(rule) {
  if(activeRule&&activeRule.id===rule.id) return;
  activeRule=rule;
  ruleAnnounce=rule.name;
  ruleAnnounceTimer=1800;
  playSound('rule');
  if(rule.init) rule.init();
}

function mutateRule() {
  const pool=RULES.filter(r=>r.id!==activeRule.id);
  const total=pool.reduce((s,r)=>s+r.weight,0);
  let r=Math.random()*total;
  for(const rule of pool){r-=rule.weight;if(r<=0){setRule(rule);break;}}
}

function spawnConveyors() {
  for(let y=1;y<C.GRID-1;y++)for(let x=1;x<C.GRID-1;x++)if(grid[y][x]===TILE.EMPTY&&Math.random()<0.1){
    const dirs=[TILE.CONVEYOR_U,TILE.CONVEYOR_D,TILE.CONVEYOR_L,TILE.CONVEYOR_R];
    grid[y][x]=dirs[Math.floor(Math.random()*dirs.length)];
  }
}

function applyConveyors() {
  const head=snake.body[0];
  const tile=grid[head.y][head.x];
  let d=null;
  if(tile===TILE.CONVEYOR_U) d='U';
  else if(tile===TILE.CONVEYOR_D) d='D';
  else if(tile===TILE.CONVEYOR_L) d='L';
  else if(tile===TILE.CONVEYOR_R) d='R';
  if(d&&d!==OPPOSITE[snake.dir]) snake.dir=d;
}

function spawnPortals() {
  const empties=[];
  for(let y=1;y<C.GRID-1;y++)for(let x=1;x<C.GRID-1;x++)if(grid[y][x]===TILE.EMPTY) empties.push({x,y});
  if(empties.length<4) return;
  const a=empties.splice(Math.floor(Math.random()*empties.length),1)[0];
  const b=empties.splice(Math.floor(Math.random()*empties.length),1)[0];
  const c=empties.splice(Math.floor(Math.random()*empties.length),1)[0];
  const d=empties.splice(Math.floor(Math.random()*empties.length),1)[0];
  grid[a.y][a.x]=TILE.PORTAL_A; grid[b.y][b.x]=TILE.PORTAL_A;
  grid[c.y][c.x]=TILE.PORTAL_B; grid[d.y][d.x]=TILE.PORTAL_B;
  portals={a,b,c,d};
}

function handlePortals(head) {
  if(!portals) return head;
  if(head.x===portals.a.x&&head.y===portals.a.y) return {x:portals.b.x,y:portals.b.y};
  if(head.x===portals.b.x&&head.y===portals.b.y) return {x:portals.a.x,y:portals.a.y};
  if(head.x===portals.c.x&&head.y===portals.c.y) return {x:portals.d.x,y:portals.d.y};
  if(head.x===portals.d.x&&head.y===portals.d.y) return {x:portals.c.x,y:portals.c.y};
  return head;
}

function loop(time) {
  const dt=time-lastTime;
  lastTime=time;
  accumulator+=dt;
  
  if(state==='PLAYING'){
    while(accumulator>=tickInterval){
      tick(tickInterval);
      accumulator-=tickInterval;
    }
    snake.lerp=accumulator/tickInterval;
  }
  
  render();
  requestAnimationFrame(loop);
}

function tick(dt) {
  if(inputQueue.length){snake.nextDir=inputQueue.shift();}
  if(activeRule.reverse) snake.nextDir=OPPOSITE[snake.nextDir];
  if(snake.nextDir!==OPPOSITE[snake.dir]) snake.dir=snake.nextDir;
  
  if(activeRule.id==='SLIPPERY'&&slipDir) snake.dir=slipDir;
  if(activeRule.id==='GRAVITY_ROTATE') activeRule.update(dt);
  if(activeRule.id==='CONVEYORS') activeRule.update();
  if(activeRule.id==='SPEED_FLUX') activeRule.update();
  
  const head={...snake.body[0]};
  const d=DIR[snake.dir];
  head.x+=d.x; head.y+=d.y;
  
  if(activeRule.wrap){
    head.x=(head.x+C.GRID)%C.GRID;
    head.y=(head.y+C.GRID)%C.GRID;
  }
  
  if(activeRule.checkWall(head.x,head.y)){gameOver();return;}
  
  head=handlePortals(head);
  
  if(snake.body.some(s=>s.x===head.x&&s.y===head.y)){gameOver();return;}
  
  snake.body.unshift(head);
  snake.body.pop();
  
  if(grid[head.y][head.x]===TILE.FRUIT){
    score++;
    if(score%5===0) tickInterval=Math.max(C.MIN_TICK,tickInterval-5);
    playSound('fruit');
    spawnParticles(head.x,head.y);
    grid[head.y][head.x]=TILE.EMPTY;
    mutateRule();
    spawnFruit();
  }
  
  ruleAnnounceTimer=Math.max(0,ruleAnnounceTimer-dt);
  shake=Math.max(0,shake-shakeDecay);
}

function gameOver() {
  state='GAMEOVER';
  saveHiScore();
  playSound('death');
  shake=4; shakeDecay=4/300;
}

function spawnParticles(x,y) {
  for(let i=0;i<12;i++) particles.push({x:x*C.TILE+C.TILE/2,y:y*C.TILE+C.TILE/2,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8,life:400,color:'#FF00FF'});
}

const particles=[];
function updateParticles(dt) {
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.life-=dt;
    if(p.life<=0) particles.splice(i,1);
  }
}

function render() {
  const s=shake>0?(Math.random()-0.5)*shake:0;
  ctx.save();
  ctx.translate(s,s);
  ctx.fillStyle=C.COLORS.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  
  if(state==='PLAYING'||state==='PAUSED'||state==='GAMEOVER'){
    drawGrid();
    drawWalls();
    drawFruit();
    drawSnake();
    drawParticles();
    drawHUD();
    if(ruleAnnounceTimer>0) drawRuleAnnounce();
    if(state==='PAUSED') drawPauseOverlay();
    if(state==='GAMEOVER') drawGameOver();
    drawTouchControls();
  }else if(state==='MENU'){
    drawMenu();
  }
  ctx.restore();
}

function drawGrid() {
  if(activeRule.darkness) return;
  ctx.strokeStyle=C.COLORS.grid;
  ctx.lineWidth=1;
  ctx.beginPath();
  for(let i=0;i<=C.GRID;i++){
    ctx.moveTo(i*C.TILE,0); ctx.lineTo(i*C.TILE,canvas.height);
    ctx.moveTo(0,i*C.TILE); ctx.lineTo(canvas.width,i*C.TILE);
  }
  ctx.stroke();
}

function drawWalls() {
  for(let y=0;y<C.GRID;y++)for(let x=0;x<C.GRID;x++){
    if(grid[y][x]===TILE.WALL){
      const px=x*C.TILE, py=y*C.TILE;
      if(activeRule.id==='ETHEREAL'){
        ctx.strokeStyle=C.COLORS.wallEthereal;
        ctx.lineWidth=1;
        ctx.setLineDash([4,4]);
        ctx.strokeRect(px+1,py+1,C.TILE-2,C.TILE-2);
        ctx.setLineDash([]);
      }else{
        ctx.fillStyle=C.COLORS.wall;
        ctx.fillRect(px+1,py+1,C.TILE-2,C.TILE-2);
        ctx.strokeStyle=C.COLORS.wallStroke;
        ctx.lineWidth=2;
        ctx.strokeRect(px+1,py+1,C.TILE-2,C.TILE-2);
      }
    }
  }
}

function drawFruit() {
  if(!fruit) return;
  const px=fruit.x*C.TILE+C.TILE/2, py=fruit.y*C.TILE+C.TILE/2;
  fruit.pulse+=0.01;
  const scale=1+Math.sin(fruit.pulse)*0.25;
  ctx.save();
  ctx.translate(px,py);
  ctx.scale(scale,scale);
  ctx.shadowColor=C.COLORS.fruitGlow;
  ctx.shadowBlur=10;
  ctx.fillStyle=C.COLORS.fruit;
  ctx.beginPath();
  ctx.arc(0,0,10,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawSnake() {
  snake.body.forEach((seg,i)=>{const next=snake.body[i+1]||seg;
    const lerp=snake.lerp;
    const x=(seg.x+(next.x-seg.x)*lerp)*C.TILE+C.TILE/2;
    const y=(seg.y+(next.y-seg.y)*lerp)*C.TILE+C.TILE/2;
    const size=i===0?28:26;
    ctx.save();
    ctx.translate(x,y);
    if(i===0){
      ctx.shadowColor=C.COLORS.headGlow;
      ctx.shadowBlur=8;
      ctx.fillStyle=C.COLORS.head;
    }else{
      const t=i/(C.SNAKE_LEN-1);
      const r=Math.round(0x00*(1-t)+0x00*t);
      const g=Math.round(0x88*(1-t)+0x33*t);
      const b=Math.round(0xFF*(1-t)+0x66*t);
      ctx.fillStyle=`rgb(${r},${g},${b})`;
    }
    roundRect(ctx,-size/2,-size/2,size,size,6);
    ctx.fill();
    ctx.restore();
  });
}

function roundRect(ctx,x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

function drawParticles() {
  particles.forEach(p=>{
    ctx.globalAlpha=p.life/400;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-2,p.y-2,4,4);
  });
  ctx.globalAlpha=1;
}

function drawHUD() {
  ctx.fillStyle=C.COLORS.hudBg;
  ctx.fillRect(0,0,canvas.width,48);
  ctx.font='16px Share Tech Mono';
  ctx.fillStyle=C.COLORS.textDim;
  ctx.textAlign='left';
  ctx.fillText('SCORE',16,20);
  ctx.font='24px Share Tech Mono';
  ctx.fillStyle=C.COLORS.head;
  ctx.fillText(score,16,44);
  
  ctx.textAlign='right';
  ctx.fillStyle=C.COLORS.textDim;
  ctx.fillText('HI',canvas.width-16,20);
  ctx.font='24px Share Tech Mono';
  ctx.fillStyle=C.COLORS.fruit;
  ctx.fillText(hiScore,canvas.width-16,44);
  
  ctx.font='12px Share Tech Mono';
  ctx.fillStyle=C.COLORS.textDim;
  ctx.textAlign='center';
  ctx.fillText(activeRule?activeRule.name:'',canvas.width/2,30);
}

function drawRuleAnnounce() {
  const alpha=Math.min(1,ruleAnnounceTimer/1000);
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.font='bold 28px Share Tech Mono';
  ctx.fillStyle=C.COLORS.head;
  ctx.textAlign='center';
  ctx.fillText('RULE: '+ruleAnnounce,canvas.width/2,canvas.height/2-60);
  ctx.restore();
}

function drawPauseOverlay() {
  ctx.fillStyle=C.COLORS.overlay;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font='32px Share Tech Mono';
  ctx.fillStyle=C.COLORS.text;
  ctx.textAlign='center';
  ctx.fillText('PAUSED',canvas.width/2,canvas.height/2);
  ctx.font='14px Share Tech Mono';
  ctx.fillStyle=C.COLORS.textDim;
  ctx.fillText('SPACE to resume',canvas.width/2,canvas.height/2+40);
}

function drawGameOver() {
  ctx.fillStyle=C.COLORS.overlay;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.font='32px Share Tech Mono';
  ctx.fillStyle=C.COLORS.death;
  ctx.textAlign='center';
  ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2-40);
  ctx.font='20px Share Tech Mono';
  ctx.fillStyle=C.COLORS.text;
  ctx.fillText('SCORE: '+score,canvas.width/2,canvas.height/2+10);
  ctx.fillText('HI: '+hiScore,canvas.width/2,canvas.height/2+40);
  ctx.font='14px Share Tech Mono';
  ctx.fillStyle=C.COLORS.textDim;
  ctx.fillText('Click or SPACE to restart',canvas.width/2,canvas.height/2+80);
}

function drawTouchControls() {
  if(window.innerWidth>768) return;
  ctx.save();
  ctx.globalAlpha=0.3;
  touchZones.forEach(z=>{
    ctx.fillStyle=C.COLORS.hudBg;
    roundRect(ctx,z.x,z.y,z.w,z.h,12);
    ctx.fill();
    ctx.strokeStyle=C.COLORS.hudStroke;
    ctx.lineWidth=2;
    ctx.stroke();
    ctx.font='24px Share Tech Mono';
    ctx.fillStyle=C.COLORS.head;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    let tx=z.x+z.w/2, ty=z.y+z.h/2;
    if(z.dir==='U') ctx.fillText('▲',tx,ty);
    else if(z.dir==='D') ctx.fillText('▼',tx,ty);
    else if(z.dir==='L') ctx.fillText('◄',tx,ty);
    else if(z.dir==='R') ctx.fillText('►',tx,ty);
  });
  ctx.restore();
}

function drawMenu() {
  ctx.fillStyle=C.COLORS.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  drawGrid();
  
  ctx.font='48px Share Tech Mono';
  ctx.fillStyle=C.COLORS.head;
  ctx.textAlign='center';
  ctx.shadowColor=C.COLORS.headGlow;
  ctx.shadowBlur=20;
  ctx.fillText('RULE SNAKE',canvas.width/2,canvas.height/2-100);
  ctx.shadowBlur=0;
  
  ctx.font='16px Share Tech Mono';
  ctx.fillStyle=C.COLORS.textDim;
  ctx.fillText('Eat fruit. Rules mutate every 5 points.',canvas.width/2,canvas.height/2-40);
  ctx.fillText('Survive the chaos.',canvas.width/2,canvas.height/2-20);
  
  ctx.font='20px Share Tech Mono';
  ctx.fillStyle=C.COLORS.fruit;
  ctx.fillText('CLICK OR PRESS SPACE',canvas.width/2,canvas.height/2+40);
  
  ctx.font='12px Share Tech Mono';
  ctx.fillStyle=C.COLORS.textDim;
  ctx.fillText('Arrows/WASD • SPACE pause • M mute',canvas.width/2,canvas.height/2+100);
}

canvas.addEventListener('click',()=>{
  if(state==='MENU'){newGame();playSound('click');}
  else if(state==='GAMEOVER'){newGame();playSound('click');}
});

window.addEventListener('keydown',e=>{
  if(e.code==='Space'&&(state==='MENU'||state==='GAMEOVER')){newGame();playSound('click');}
});

init();
