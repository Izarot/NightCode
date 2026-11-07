const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=640;let scale=1,dpr=1;
function resize(){dpr=Math.min(devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();canvas.width=r.width*dpr;canvas.height=r.height*dpr;scale=Math.min(r.width/W,r.height/H);}
addEventListener('resize',resize);
// Audio
let AC=null,soundOn=true;function ac(){if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();return AC}
function tone(f,d=.12,type='sine',v=.18,when=0){if(!soundOn)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,a.currentTime+when);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+when+d);o.connect(g).connect(a.destination);o.start(a.currentTime+when);o.stop(a.currentTime+when+d)}catch(e){}}
const sfx={select:()=>tone(660,.08,'sine',.12),match:()=>{tone(523,.1);tone(784,.12,'sine',.15,.07);tone(1046,.18,'sine',.12,.14)},bad:()=>tone(180,.15,'sawtooth',.08),win:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,.22,'sine',.16,i*.11)),shuffle:()=>tone(440,.2,'triangle',.12)};
document.getElementById('soundBtn').onclick=e=>{soundOn=!soundOn;e.target.textContent=soundOn?'ON':'OFF'};
// Palette - vibrant: coral, gold, teal, violet
const PAL=['#ff6b9d','#ffd166','#06d6a0','#118ab2','#9b5de5','#f15bb5','#00bbf9','#fee440'];
// Tiles
const SUITS=[{n:'Bamboo',s:'🎋',c:'#06d6a0'},{n:'Characters',s:'万',c:'#ff6b9d'},{n:'Dots',s:'●',c:'#118ab2'}];
function makeDeck(){let d=[];SUITS.forEach((su,si)=>{for(let r=1;r<=9;r++)for(let k=0;k<4;k++)d.push({suit:su.n,rank:r,label:si===0?r:si===1?r+'万':r,symbol:su.s,color:su.c,key:su.n+r})});
['East','South','West','North'].forEach(w=>{for(let k=0;k<4;k++)d.push({suit:'Winds',rank:w,label:w,symbol:w[0],color:'#9b5de5',key:'W'+w})});
['Red','Green','White'].forEach(w=>{for(let k=0;k<4;k++)d.push({suit:'Dragons',rank:w,label:w,symbol:w[0],color:w==='Red'?'#ef476f':w==='Green'?'#06d6a0':'#ffd166',key:'D'+w})});
for(let i=1;i<=4;i++)d.push({suit:'Flowers',rank:i,label:'🌸'+i,symbol:'🌸',color:'#f15bb5',key:'F'});
for(let i=1;i<=4;i++)d.push({suit:'Seasons',rank:i,label:'🍂'+i,symbol:'🍂',color:'#ffb703',key:'S'});
return shuffle(d)}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a}
function canMatch(a,b){if(a.suit==='Flowers'&&b.suit==='Flowers')return true;if(a.suit==='Seasons'&&b.suit==='Seasons')return true;return a.key===b.key}
// Layout slots pyramid
function makeSlots(){let s=[];const rows=[{y:0,n:16,l:0},{y:0,n:14,l:0},{y:0,n:12,l:0}];
// bottom layer 3 rows
for(let r=0;r<3;r++)for(let i=0;i<16-r*2;i++)s.push({x:90+i*50+r*25,y:150+r*62,l:0});
// middle
for(let r=0;r<2;r++)for(let i=0;i<10-r*2;i++)s.push({x:210+i*50+r*25,y:190+r*62,l:1});
// top pyramid
for(let i=0;i<8;i++)s.push({x:290+i*50,y:230,l:2});
for(let i=0;i<6;i++)s.push({x:340+i*50,y:292,l:2});
for(let i=0;i<4;i++)s.push({x:390+i*50,y:354,l:3});
for(let i=0;i<2;i++)s.push({x:440+i*50,y:416,l:3});
s.push({x:465,y:478,l:4});
// adjust to 144: trim/pad
s=s.slice(0,144);while(s.length<144)s.push({x:465,y:478,l:4});return s}
let tiles=[],selected=null,drag=null,score=0,displayScore=0,matches=0,start=0,elapsed=0,timerOn=false,undoStack=[],ripples=[],particles=[],confetti=[],hintPair=null,animating=[];
let high=+(localStorage.getItem('mahjong_high')||0);document.getElementById('highScore').textContent=high;
let best=localStorage.getItem('mahjong_best');if(best)document.getElementById('srBest').textContent='BEST '+fmt(+best);
function fmt(s){return String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function newGame(){let deck=makeDeck(),slots=makeSlots();tiles=slots.map((sl,i)=>({...deck[i],id:i,x:sl.x,y:sl.y,ox:sl.x,oy:sl.y,l:sl.l,w:46,h:60,alive:true,scale:1,rot:0,alpha:1,vx:0,vy:0,spring:false}));
score=0;displayScore=0;matches=0;selected=null;drag=null;undoStack=[];hintPair=null;confetti=[];animating=[];start=Date.now();elapsed=0;timerOn=true;document.getElementById('msg').classList.remove('show');updateHUD();toast('New game — find a pair!');sfx.shuffle()}
window.newGame=newGame;
function overlap(a,b){return Math.abs(a.x-b.x)<a.w&&Math.abs(a.y-b.y)<a.h}
function isFree(t){if(!t.alive)return false;let above=tiles.some(o=>o.alive&&o!==t&&o.l>t.l&&overlap(t,o));if(above)return false;let left=tiles.some(o=>o.alive&&o!==t&&o.l===t.l&&Math.abs(o.y-t.y)<30&&o.x<t.x&&t.x-o.x<55);let right=tiles.some(o=>o.alive&&o!==t&&o.l===t.l&&Math.abs(o.y-t.y)<30&&o.x>t.x&&o.x-t.x<55);return !left||!right}
function findMoves(){let free=tiles.filter(isFree);let m=[];for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)if(canMatch(free[i],free[j]))m.push([free[i],free[j]]);return m}
function updateHUD(){document.getElementById('score').textContent=Math.round(displayScore);document.getElementById('matches').textContent=matches;let left=tiles.filter(t=>t.alive).length;document.getElementById('progText').textContent=left+' left';document.getElementById('barFill').style.width=((144-left)/144*100)+'%';let mv=findMoves();document.getElementById('hints').textContent=mv.length||'0';document.getElementById('shuffleBtn').style.display=(mv.length===0&&left>0)?'inline-block':'none';document.getElementById('highScore').textContent=high}
function toast(t){let e=document.getElementById('toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',1800)}
function doMatch(a,b){undoStack.push({a:{...a},b:{...b}});a.alive=false;b.alive=false;matches++;let pts=100+Math.max(0,300-(elapsed|0));score+=pts;animating.push({t:a,life:1},{t:b,life:1});sfx.match();ripples.push({x:a.x,y:a.y,r:5,a:1},{x:b.x,y:b.y,r:5,a:1});for(let i=0;i<14;i++)particles.push({x:a.x,y:a.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:1,c:a.color});selected=null;hintPair=null;updateHUD();checkWin()}
function checkWin(){if(tiles.every(t=>!t.alive)){timerOn=false;sfx.win();if(score>high){high=score;localStorage.setItem('mahjong_high',high)}if(!best||elapsed<best){best=elapsed;localStorage.setItem('mahjong_best',best)}for(let i=0;i<160;i++)confetti.push({x:W/2,y:H/2,vx:(Math.random()-.5)*12,vy:(Math.random()-.5)*12-4,life:1,c:PAL[i%PAL.length],s:4+Math.random()*6,rot:Math.random()*6});document.getElementById('msgTitle').textContent='🎉 You Win!';document.getElementById('msgText').textContent=`Score ${score} • Time ${fmt(elapsed)} • High Score ${high}`;setTimeout(()=>document.getElementById('msg').classList.add('show'),900)}}
function doShuffle(){let alive=tiles.filter(t=>t.alive);let types=shuffle(alive.map(t=>({suit:t.suit,rank:t.rank,label:t.label,symbol:t.symbol,color:t.color,key:t.key})));alive.forEach((t,i)=>Object.assign(t,types[i]));let tries=0;while(findMoves().length===0&&tries++<20){types=shuffle(types);alive.forEach((t,i)=>Object.assign(t,types[i]))}sfx.shuffle();toast('Shuffled!');updateHUD()}
document.getElementById('shuffleBtn').onclick=doShuffle;
document.getElementById('newBtn').onclick=newGame;
document.getElementById('hintBtn').onclick=()=>{let m=findMoves();if(m.length){hintPair=m[0];toast('Hint: pair highlighted ✨');sfx.select()}else toast('No moves — shuffle!')};
document.getElementById('undoBtn').onclick=()=>{let u=undoStack.pop();if(!u)return toast('Nothing to undo');[u.a,u.b].forEach(s=>{let t=tiles.find(x=>x.id===s.id);if(t){t.alive=true;t.scale=1;t.alpha=1}});matches--;score=Math.max(0,score-100);updateHUD();toast('Undone')};
// Input
function pos(e){let r=canvas.getBoundingClientRect();let cx=(e.touches?e.touches[0].clientX:e.clientX),cy=(e.touches?e.touches[0].clientY:e.clientY);return{x:(cx-r.left)/scale,y:(cy-r.top)/scale}}
function tileAt(p){return [...tiles].filter(t=>t.alive).sort((a,b)=>b.l-a.l).find(t=>Math.abs(t.x-p.x)<t.w/2+4&&Math.abs(t.y-p.y)<t.h/2+4)}
let lastP=null;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);let p=pos(e);lastP=p;ripples.push({x:p.x,y:p.y,r:4,a:1});let t=tileAt(p);if(!t)return;if(!isFree(t)){sfx.bad();toast('Tile is blocked!');return}drag={t,dx:t.x-p.x,dy:t.y-p.y,vx:0,vy:0};t.spring=false;sfx.select()});
canvas.addEventListener('pointermove',e=>{if(!drag)return;let p=pos(e);let nx=p.x+drag.dx,ny=p.y+drag.dy;drag.vx=nx-drag.t.x;drag.vy=ny-drag.t.y;drag.t.x=nx;drag.t.y=ny;lastP=p});
canvas.addEventListener('pointerup',e=>{if(!drag)return;let t=drag.t,p=pos(e);let target=tileAt(p);drag=null;
if(target&&target!==t&&isFree(target)&&canMatch(t,target)){doMatch(t,target);return}
if(selected&&selected!==t&&canMatch(selected,t)&&isFree(selected)){doMatch(selected,t);return}
if(Math.hypot(t.x-t.ox,t.y-t.oy)<8){selected=(selected===t?null:t);if(selected)sfx.select()}else{
// snap / collision: if overlaps occupied, spring back
let blocked=tiles.some(o=>o.alive&&o!==t&&overlap(t,o));
if(blocked){t.spring=true;sfx.bad();toast('Blocked — snapped back!')}else{t.spring=true;selected=t}
}});
// Render
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function drawTile(t){if(!t.alive&&t.scale<=0)return;ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.rot||0);ctx.scale(t.scale,t.scale);ctx.globalAlpha=t.alpha;let isSel=selected===t||(drag&&drag.t===t);let isHint=hintPair&&(hintPair[0]===t||hintPair[1]===t);
ctx.shadowColor=isSel?'#ffd166':'#000a';ctx.shadowBlur=isSel?22:10;ctx.shadowOffsetY=isSel?10:5;
let g=ctx.createLinearGradient(0,-t.h/2,0,t.h/2);g.addColorStop(0,'#fffef5');g.addColorStop(1,'#e8dcc3');ctx.fillStyle=g;roundRect(-t.w/2,-t.h/2,t.w,t.h,8);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=isHint?'#ffd166':isSel?'#ff6b9d':'#b8a88a';ctx.lineWidth=isHint||isSel?3:1.5;ctx.stroke();
ctx.fillStyle=t.color;ctx.font='900 20px Inter,serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t.symbol,0,-10);
ctx.font='800 13px Inter';ctx.fillStyle='#222';ctx.fillText(t.label,0,12);ctx.fillStyle=t.color;ctx.fillRect(-t.w/2+5,t.h/2-6,t.w-10,4);ctx.restore()}
function loop(){requestAnimationFrame(loop);ctx.setTransform(dpr,0,0,dpr,0,0);let cw=canvas.width/dpr,ch=canvas.height/dpr;ctx.clearRect(0,0,cw,ch);ctx.translate((cw-W*scale)/2,(ch-H*scale)/2);ctx.scale(scale,scale);
// bg gradient
let bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0f0c29');bg.addColorStop(.5,'#302b63');bg.addColorStop(1,'#00b09b');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
// particles dust
if(Math.random()<.3)particles.push({x:Math.random()*W,y:H+10,vx:0,vy:-.5-Math.random(),life:1,c:'#ffffff55',dust:true});
particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=.01;ctx.globalAlpha=Math.max(0,p.life)*.6;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.dust?2:4,0,7);ctx.fill()});ctx.globalAlpha=1;
// spring physics
tiles.forEach(t=>{if(t.spring&&t.alive){let k=.12,d=.78;t.vx=(t.vx+(t.ox-t.x)*k)*d;t.vy=(t.vy+(t.oy-t.y)*k)*d;t.x+=t.vx;t.y+=t.vy;if(Math.hypot(t.vx,t.vy)<.3&&Math.hypot(t.ox-t.x,t.oy-t.y)<1){t.x=t.ox;t.y=t.oy;t.spring=false}}});
// match anim
animating=animating.filter(a=>a.life>0);animating.forEach(a=>{a.life-=.06;a.t.scale=Math.max(0,a.life);a.t.rot+=.08;a.t.alpha=a.life});
[...tiles].sort((a,b)=>a.l-b.l).forEach(drawTile);
// ripples
ripples=ripples.filter(r=>r.a>0);ripples.forEach(r=>{r.r+=2;r.a-=.04;ctx.strokeStyle=`rgba(255,209,102,${r.a})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,7);ctx.stroke()});
// confetti
confetti=confetti.filter(c=>c.life>0);confetti.forEach(c=>{c.x+=c.vx;c.y+=c.vy;c.vy+=.15;c.rot+=.1;c.life-=.008;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.rot);ctx.fillStyle=c.c;ctx.fillRect(-c.s/2,-c.s/2,c.s,c.s*.6);ctx.restore()});
// timer
if(timerOn)elapsed=(Date.now()-start)/1000|0;let tm=fmt(elapsed);document.getElementById('timer').textContent=tm;document.getElementById('srTime').textContent=tm;document.getElementById('timer').className='mono'+(elapsed>300?' amber':'');document.getElementById('srTime').style.color=elapsed>300?'#ffb703':'#fff';
if(displayScore<score)displayScore+=Math.max(1,(score-displayScore)*.12);else displayScore=score;document.getElementById('score').textContent=Math.round(displayScore);
if((loop.c=(loop.c||0)+1)%30===0)updateHUD();
}
resize();newGame();loop();
