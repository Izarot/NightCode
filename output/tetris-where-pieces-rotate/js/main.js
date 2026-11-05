'use strict';
const c=document.getElementById('c'),x=c.getContext('2d'),nc=document.getElementById('n'),nx=nc.getContext('2d');
const W=10,H=20,S=30;
const SHAPES={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]]};
const COL={I:'#00f2ff',J:'#0000ff',L:'#ff6b00',O:'#f9f871',S:'#7cfc00',T:'#ff00ea',Z:'#ff0000'};
const KEYS=Object.keys(SHAPES);
let board,cur,next,score=0,lines=0,level=1,state='MENU',fallT=0,rotT=0,lockT=0,shake=0,parts=[],rotAnim=0,startT=0,elapsed=0,high=+localStorage.getItem('ar_high')||0;
document.getElementById('high').textContent='High '+high;
let AC;function beep(f,d,t){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();let o=AC.createOscillator(),g=AC.createGain();o.type=t||'square';o.frequency.value=f;g.gain.setValueAtTime(.15,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}catch(e){}}
function snd(n){if(n=='m')beep(80,.08);if(n=='h')beep(120,.15,'sine');if(n=='c')[523,659,784].forEach((f,i)=>setTimeout(()=>beep(f,.12),i*60));if(n=='g'){beep(400,.5,'sawtooth');setTimeout(()=>beep(100,.5,'sawtooth'),200);}}
function rot(m){return m[0].map((_,i)=>m.map(r=>r[i]).reverse());}
function newBoard(){board=Array.from({length:H},()=>Array(W).fill(0));}
function spawn(){let k=KEYS[Math.random()*7|0];cur={k,shape:SHAPES[k],x:3,y:0};next=next||KEYS[Math.random()*7|0];fallT=0;lockT=0;if(collide(cur.shape,cur.x,cur.y))gameOver();}
function collide(s,px,py){for(let r=0;r<s.length;r++)for(let col=0;col<s[r].length;col++)if(s[r][col]){let bx=px+col,by=py+r;if(bx<0||bx>=W||by>=H||(by>=0&&board[by][bx]))return true;}return false;}
function merge(){cur.shape.forEach((r,y)=>r.forEach((v,xx)=>{if(v&&cur.y+y>=0)board[cur.y+y][cur.x+xx]=cur.k;}));clear();}
function clear(){let n=0;for(let y=H-1;y>=0;y--){if(board[y].every(v=>v)){board.splice(y,1);board.unshift(Array(W).fill(0));n++;y++;for(let i=0;i<12;i++)parts.push({x:Math.random()*W,y:y,vx:(Math.random()-.5)*6,vy:-Math.random()*5,l:1});}}if(n){lines+=n;score+=n*100;level=1+(lines/10|0);shake=5;snd('c');}}
function gameOver(){state='GAME_OVER';snd('g');if(score>high){high=score;localStorage.setItem('ar_high',high);}show('GAME OVER','Score '+score+' High '+high);}
function show(t,s){document.getElementById('ot').textContent=t;document.getElementById('os').textContent=s;document.getElementById('ov').style.display='flex';document.getElementById('btn').textContent=state=='GAME_OVER'?'RETRY':'PLAY';}
function start(){newBoard();score=0;lines=0;level=1;parts=[];shake=0;next=null;rotT=0;spawn();state='PLAYING';startT=performance.now();elapsed=0;document.getElementById('ov').style.display='none';}
document.getElementById('btn').onclick=start;document.getElementById('start').onclick=start;
let keys={};
addEventListener('keydown',e=>{keys[e.key]=true;if(e.key=='p'||e.key=='P'){if(state=='PLAYING'){state='PAUSED';show('PAUSED','');}else if(state=='PAUSED'){state='PLAYING';document.getElementById('ov').style.display='none';}}if(state!='PLAYING')return;if(e.key==' '||e.key=='ArrowUp'){hard();e.preventDefault();}if(e.key=='ArrowLeft')move(-1);if(e.key=='ArrowRight')move(1);});
addEventListener('keyup',e=>keys[e.key]=false);
function move(d){if(!collide(cur.shape,cur.x+d,cur.y)){cur.x+=d;snd('m');}}
function hard(){while(!collide(cur.shape,cur.x,cur.y+1))cur.y++;snd('h');merge();spawn();}
function ghostY(){let y=cur.y;while(!collide(cur.shape,cur.x,y+1))y++;return y;}
let last=performance.now();
function loop(now){requestAnimationFrame(loop);let dt=Math.min(50,now-last);last=now;if(state=='PLAYING'){elapsed=now-startT;fallT+=dt;rotT+=dt;let sp=keys['ArrowDown']?66:500;if(fallT>sp){fallT=0;if(!collide(cur.shape,cur.x,cur.y+1))cur.y++;else{lockT+=dt;if(lockT>500){merge();spawn();}}}if(rotT>=4000){rotT=0;rotAnim=150;let ns=rot(cur.shape);if(!collide(ns,cur.x,cur.y))cur.shape=ns;else if(!collide(ns,cur.x-1,cur.y)){cur.shape=ns;cur.x--;}else if(!collide(ns,cur.x+1,cur.y)){cur.shape=ns;cur.x++;}snd('m');}if(rotAnim>0)rotAnim-=dt;}draw();}
function fmt(ms){let s=ms/1000;return String(s/60|0).padStart(2,'0')+':'+String(s%60|0).padStart(2,'0')+'.'+(s*10%10|0);}
function draw(){x.save();if(shake>0){x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.9;if(shake<.5)shake=0;}x.fillStyle='#05050a';x.fillRect(0,0,300,600);x.strokeStyle='#1a1a2e';for(let i=0;i<=W;i++){x.beginPath();x.moveTo(i*S,0);x.lineTo(i*S,600);x.stroke();}for(let i=0;i<=H;i++){x.beginPath();x.moveTo(0,i*S);x.lineTo(300,i*S);x.stroke();}
function cell(bx,by,col,g){x.fillStyle=g?'rgba(128,128,128,.3)':col;x.shadowBlur=g?0:12;x.shadowColor=col;x.fillRect(bx*S+1,by*S+1,S-2,S-2);x.shadowBlur=0;}
for(let y=0;y<H;y++)for(let xx=0;xx<W;xx++)if(board&&board[y][xx])cell(xx,y,COL[board[y][xx]]);
if(cur&&state!='MENU'){let gy=ghostY();cur.shape.forEach((r,y)=>r.forEach((v,xx)=>{if(v)cell(cur.x+xx,gy+y,'#888',true);}));cur.shape.forEach((r,y)=>r.forEach((v,xx)=>{if(v)cell(cur.x+xx,cur.y+y,COL[cur.k]);}));}
parts.forEach(p=>{p.x+=p.vx*.016;p.y+=p.vy*.016;p.vy+=.2;p.l-=.02;x.fillStyle='#0ff';x.fillRect(p.x*S,p.y*S,4,4);});parts=parts.filter(p=>p.l>0);x.restore();
document.getElementById('score').textContent=score;document.getElementById('level').textContent='LV '+level;document.getElementById('lines').textContent='Lines '+lines;document.getElementById('timer').textContent='⏱ '+fmt(elapsed||0);
nx.fillStyle='#05050a';nx.fillRect(0,0,120,120);if(next){let s=SHAPES[next];let rs=rotT>=2000?rot(s):s;nx.fillStyle=COL[next];nx.shadowBlur=10;nx.shadowColor=COL[next];rs.forEach((r,y)=>r.forEach((v,xx)=>{if(v)nx.fillRect(30+xx*20,30+y*20,18,18);}));}}
newBoard();requestAnimationFrame(loop);