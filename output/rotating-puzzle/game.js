const cv=document.getElementById('c'),ctx=cv.getContext('2d');
const W=1920,H=1080,CX=960,CY=540,DT=1/60;
const LEVELS=[
{id:'level_01',name:'First Turn',startRotation:0,playerStart:[960,820],orbs:[[700,400],[1200,700],[960,200]],exit:[960,130],geometry:[{t:'s',p1:[100,900],p2:[1820,900]},{t:'s',p1:[100,100],p2:[100,900]},{t:'s',p1:[1820,100],p2:[1820,900]},{t:'s',p1:[100,100],p2:[1820,100]},{t:'spike',p1:[400,900],p2:[460,900],h:40},{t:'p',p1:[600,600],p2:[820,600],cr:1},{t:'p',p1:[1100,600],p2:[1320,600]}]},
{id:'level_02',name:'Sideways',startRotation:0,playerStart:[200,820],orbs:[[400,300],[1500,300],[960,850]],exit:[1720,540],geometry:[{t:'s',p1:[100,900],p2:[1820,900]},{t:'s',p1:[100,100],p2:[100,900]},{t:'s',p1:[1820,100],p2:[1820,900]},{t:'s',p1:[100,100],p2:[1820,100]},{t:'spike',p1:[800,900],p2:[860,900],h:40},{t:'p',p1:[500,500],p2:[700,500],cr:1},{t:'p',p1:[1200,500],p2:[1400,500]}]},
{id:'level_03',name:'Upside Down',startRotation:0,playerStart:[960,820],orbs:[[300,200],[1620,200],[960,500]],exit:[960,130],geometry:[{t:'s',p1:[100,900],p2:[1820,900]},{t:'s',p1:[100,100],p2:[100,900]},{t:'s',p1:[1820,100],p2:[1820,900]},{t:'s',p1:[100,100],p2:[1820,100]},{t:'spike',p1:[900,100],p2:[960,100],h:40},{t:'p',p1:[400,700],p2:[600,700],cr:1},{t:'p',p1:[1300,700],p2:[1500,700],cr:1},{t:'p',p1:[800,400],p2:[1120,400]}]}
];
let AC=null;function beep(f,d,type,vol){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();let o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.value=vol||.12;g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d);}catch(e){}}
function sfx(n){if(n=='jump')beep(520,.12,'square',.08);if(n=='orb'){beep(880,.15,'sine',.12);setTimeout(()=>beep(1320,.2,'sine',.1),70);}if(n=='die')beep(110,.4,'sawtooth',.15);if(n=='exit'){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.25,'sine',.12),i*90));}if(n=='tick')beep(200,.03,'square',.03);}
let state='menu',levelIdx=0,theta=0,rotVel=0,rotDegTotal=0,keys={},player,orbsGot,particles=[],trail=[],shake=0,shakeT=0,time=0,deaths=0,coyote=0,jumpBuf=0,grounded=false,crumble={},completeT=0,paused=false,menuSel=0;
let high=parseFloat(localStorage.getItem('gyre_highscore')||'0');
function rotPt(p){let c=Math.cos(theta),s=Math.sin(theta),x=p[0]-CX,y=p[1]-CY;return[CX+x*c-y*s,CY+x*s+y*c];}
function grav(){return[Math.sin(theta),Math.cos(theta)];}
function loadLevel(i){levelIdx=i;let L=LEVELS[i];theta=L.startRotation*Math.PI/180;rotVel=0;player={x:L.playerStart[0],y:L.playerStart[1],vx:0,vy:0,r:8};orbsGot=0;time=0;deaths=0;rotDegTotal=0;crumble={};particles=[];trail=[];state='playing';paused=false;}
function respawn(){let L=LEVELS[levelIdx];player.x=L.playerStart[0];player.y=L.playerStart[1];player.vx=0;player.vy=0;}
function die(){if(state!='playing')return;deaths++;shake=6;shakeT=.25;sfx('die');for(let i=0;i<20;i++)particles.push({x:player.x,y:player.y,vx:(Math.random()-.5)*400,vy:(Math.random()-.5)*400,life:1,c:'#fff'});setTimeout(()=>{if(state=='playing')respawn();},600);}
function segDist(px,py,a,b){let dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/l2));let cx=a[0]+t*dx,cy=a[1]+t*dy;return{d:Math.hypot(px-cx,py-cy),cx,cy,t};}
function update(dt){
 if(state!='playing'||paused)return;
 time+=dt;
 // rotation input
 let rotIn=0;if(keys['q']||keys['e']){} if(keys['q'])rotIn-=1; if(keys['e'])rotIn+=1; if(keys['arrowleft'])rotIn-=1; if(keys['arrowright'])rotIn+=1; if(touchRot)rotIn+=touchRot;
 let target=rotIn*240*Math.PI/180; rotVel+=(target-rotVel)*Math.min(1,dt*10); if(Math.abs(rotVel)<0.01&&rotIn==0){/*snap*/let deg=((theta*180/Math.PI)%360+360)%360;let card=Math.round(deg/90)*90;let diff=((card-deg+540)%360)-180;if(Math.abs(diff)<5&&Math.abs(diff)>0.01)theta+=diff*Math.PI/180*dt*10;}
 theta+=rotVel*dt; rotDegTotal+=Math.abs(rotVel*180/Math.PI)*dt; if(Math.abs(rotVel)>0.1&&Math.random()<.3)sfx('tick');
 let g=grav(),gx=g[0],gy=g[1];
 let move=0;if(keys['a']||keys['arrowleft'])move-=1; if(keys['d']||keys['arrowright'])move+=1; if(touchMove)move+=touchMove;
 let perp=[-gy,gx]; // ground plane
 let accel=grounded?2000:800; if(Math.abs(rotVel)>5*Math.PI/180)accel*=.5;
 player.vx+=perp[0]*move*accel*dt; player.vy+=perp[1]*move*accel*dt;
 player.vx+=gx*1200*dt; player.vy+=gy*1200*dt;
 if(grounded&&move==0){player.vx*=Math.max(0,1-10*dt);player.vy*=Math.max(0,1-10*dt);}
 // clamp along perp
 let along=player.vx*perp[0]+player.vy*perp[1]; if(Math.abs(along)>300){let excess=along-Math.sign(along)*300;player.vx-=perp[0]*excess;player.vy-=perp[1]*excess;}
 if(jumpBuf>0)jumpBuf-=dt; if(coyote>0)coyote-=dt;
 if(jumpBuf>0&&(grounded||coyote>0)){player.vx-=gx*520;player.vy-=gy*520;grounded=false;coyote=0;jumpBuf=0;sfx('jump');for(let i=0;i<3;i++)particles.push({x:player.x,y:player.y,vx:-gx*100+(Math.random()-.5)*50,vy:-gy*100+(Math.random()-.5)*50,life:.3,c:'#00f2ff'});}
 player.x+=player.vx*dt; player.y+=player.vy*dt;
 grounded=false;
 let L=LEVELS[levelIdx];
 L.geometry.forEach((geo,idx)=>{
   if(geo.cr&&crumble[idx]&&crumble[idx].gone)return;
   let a=rotPt(geo.p1),b=rotPt(geo.p2);let sd=segDist(player.x,player.y,a,b);
   if(geo.t=='spike'){if(sd.d<player.r+4)die();return;}
   if(sd.d<player.r){let nx=(player.x-sd.cx)/(sd.d||1),ny=(player.y-sd.cy)/(sd.d||1);player.x=sd.cx+nx*player.r;player.y=sd.cy+ny*player.r;let vn=player.vx*nx+player.vy*ny;if(vn<0){player.vx-=vn*nx;player.vy-=vn*ny;} if(nx*gx+ny*gy<-0.7){grounded=true;coyote=.08; if(geo.cr){if(!crumble[idx])crumble[idx]={t:0};else{crumble[idx].t+=dt;if(crumble[idx].t>.4){crumble[idx].gone=true;setTimeout(()=>{if(crumble[idx])crumble[idx].gone=false,crumble[idx].t=0;},3000);}}}}}
 });
 // orbs
 L.orbs.forEach((o,i)=>{if(o.got)return;let p=rotPt(o);if(Math.hypot(player.x-p[0],player.y-p[1])<player.r+10){o.got=true;orbsGot++;sfx('orb');for(let k=0;k<12;k++)particles.push({x:p[0],y:p[1],vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,life:.6,c:'#ff00ff'});}});
 // exit
 let ex=rotPt(L.exit); if(orbsGot>=3&&Math.hypot(player.x-ex[0],player.y-ex[1])<30){state='complete';completeT=0;sfx('exit');let t=time;if(!high||t<high){high=t;localStorage.setItem('gyre_highscore',String(t));}}
 trail.unshift({x:player.x,y:player.y}); if(trail.length>8)trail.pop();
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}); particles=particles.filter(p=>p.life>0);
 if(shakeT>0)shakeT-=dt;
}
function draw(){
 ctx.clearRect(0,0,W,H);
 let grd=ctx.createRadialGradient(CX,CY,100,CX,CY,900);grd.addColorStop(0,'#2b1055');grd.addColorStop(.5,'#1a1a2e');grd.addColorStop(1,'#0a0a12');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
 // dust
 ctx.fillStyle='rgba(255,255,255,.15)';for(let i=0;i<40;i++){let x=(i*137+time*20)%W,y=(i*89)%H;ctx.fillRect(x,y,2,2);}
 ctx.save(); if(shakeT>0)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 if(state!='menu'){
  let L=LEVELS[levelIdx];
  // geometry
  L.geometry.forEach((geo,idx)=>{if(geo.cr&&crumble[idx]&&crumble[idx].gone)return;let a=rotPt(geo.p1),b=rotPt(geo.p2);ctx.strokeStyle=geo.t=='spike'?'#ff3333':'#e0e0e0';ctx.lineWidth=3;ctx.shadowBlur=8;ctx.shadowColor=geo.t=='spike'?'#ff3333':'#00f2ff';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.shadowBlur=0;if(geo.t=='spike'){ctx.fillStyle='#ff3333';for(let t=0;t<1;t+=.2){let x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.lineTo(x,y-geo.h);ctx.fill();}}});
  // orbs
  L.orbs.forEach(o=>{if(o.got)return;let p=rotPt(o);ctx.fillStyle='#ff00ff';ctx.shadowBlur=20;ctx.shadowColor='#ff00ff';ctx.beginPath();ctx.arc(p[0],p[1],10+Math.sin(time*5)*2,0,7);ctx.fill();ctx.shadowBlur=0;});
  // exit
  let ex=rotPt(L.exit);ctx.fillStyle=orbsGot>=3?'#00ff88':'#555';ctx.shadowBlur=orbsGot>=3?25:0;ctx.shadowColor='#00ff88';ctx.beginPath();ctx.arc(ex[0],ex[1],orbsGot>=3?22+Math.sin(time*6)*4:16,0,7);ctx.fill();ctx.shadowBlur=0;
  // trail
  trail.forEach((t,i)=>{ctx.globalAlpha=1-i/8;ctx.fillStyle='#00f2ff';ctx.beginPath();ctx.arc(t.x,t.y,player.r*(1-i/10),0,7);ctx.fill();});ctx.globalAlpha=1;
  // player
  ctx.fillStyle='#00f2ff';ctx.shadowBlur=14;ctx.shadowColor='#00f2ff';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,7);ctx.fill();ctx.shadowBlur=0;
  let g=grav();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.lineTo(player.x+g[0]*20,player.y+g[1]*20);ctx.stroke();
  particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,4,4);});ctx.globalAlpha=1;
 }
 ctx.restore();
 // vignette
 let vg=ctx.createRadialGradient(CX,CY,400,CX,CY,1000);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.4)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
 drawHUD();
}
function txt(s,x,y,size,color,align){ctx.font='bold '+size+'px monospace';ctx.textAlign=align||'center';ctx.lineWidth=4;ctx.strokeStyle='#000';ctx.strokeText(s,x,y);ctx.fillStyle=color||'#fff';ctx.fillText(s,x,y);}
function fmt(t){let m=Math.floor(t/60),s=Math.floor(t%60),ms=Math.floor((t%1)*1000);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(ms).padStart(3,'0');}
function drawHUD(){
 if(state=='menu'){txt('GYRE',CX,400,120,'#00f2ff');txt('ROTATIONAL PUZZLE PLATFORMER',CX,460,28,'#ff00ff');txt('A/D Move  SPACE Jump  Q/E Rotate  Drag to Rotate',CX,560,26);txt('Collect 3 orbs, reach the green exit!',CX,600,24);txt('▶ CLICK / PRESS ENTER TO START',CX,680,36,'#00ff88');if(high)txt('HIGH SCORE (BEST TIME): '+fmt(high),CX,740,26,'#ffe600');txt('LEVELS: 1 First Turn  2 Sideways  3 Upside Down — use 1/2/3',CX,800,20);return;}
 let L=LEVELS[levelIdx];txt('LEVEL 0'+(levelIdx+1)+' — '+L.name.toUpperCase(),CX,40,22);txt(Math.round(((theta*180/Math.PI)%360+360)%360)+'°',CX,70,18,'#00f2ff');
 txt('⏱ '+fmt(time),W-20,40,26,'#fff','right');txt('ROT: '+Math.round(rotDegTotal)+'°',W-20,70,18,'#fff','right');txt('✖ '+deaths,W-20,95,18,'#ff6666','right');if(high)txt('BEST '+fmt(high),W-20,120,16,'#ffe600','right');
 txt('ORBS '+orbsGot+'/3',20,1050,24,orbsGot>=3?'#00ff88':'#fff','left');txt('⟲ Restart   ⏸ Pause (P)',W-20,1050,20,'#fff','right');
 if(paused){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);txt('PAUSED',CX,500,64,'#00f2ff');txt('Resume (P)  Restart (R)  Menu (M)',CX,560,28);}
 if(state=='complete'){ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,0,W,H);txt('CLEAR!',CX,450,80,'#00ff88');txt('Time '+fmt(time)+'  Rot '+Math.round(rotDegTotal)+'°  Deaths '+deaths,CX,520,30);txt('HIGH SCORE '+fmt(high),CX,560,26,'#ffe600');txt('Press ENTER for next level',CX,620,28);}
}
let last=performance.now(),acc=0;
function loop(now){requestAnimationFrame(loop);let ft=(now-last)/1000;last=now;if(ft>.1)ft=.1;acc+=ft;while(acc>=DT){update(DT);acc-=DT;}draw();}
requestAnimationFrame(loop);
// input
addEventListener('keydown',e=>{let k=e.key.toLowerCase();keys[k]=true;if(k==' ') {jumpBuf=.1;e.preventDefault();} if(state=='menu'&&k=='enter')loadLevel(0); if(k=='p'&&state=='playing')paused=!paused; if(k=='r')loadLevel(levelIdx); if(k=='m')state='menu'; if(['1','2','3'].includes(k))loadLevel(parseInt(k)-1); if(state=='complete'&&k=='enter')loadLevel((levelIdx+1)%LEVELS.length);});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
cv.addEventListener('pointerdown',e=>{if(state=='menu'){loadLevel(0);return;}drag={x:e.clientX};});
let drag=null,touchRot=0,touchMove=0;
cv.addEventListener('pointermove',e=>{if(drag){let dx=e.clientX-drag.x;touchRot=Math.max(-1,Math.min(1,dx/50));drag.x=e.clientX;}});
addEventListener('pointerup',()=>{drag=null;touchRot=0;});
function bind(id,on,off){let el=document.getElementById(id);el.addEventListener('pointerdown',e=>{e.preventDefault();on();});el.addEventListener('pointerup',off);el.addEventListener('pointerleave',off);}
bind('bL',()=>touchMove=-1,()=>touchMove=0);bind('bR',()=>touchMove=1,()=>touchMove=0);bind('bJ',()=>jumpBuf=.1,()=>{});bind('bRL',()=>touchRot=-1,()=>touchRot=0);bind('bRR',()=>touchRot=1,()=>touchRot=0);
// gamepad
setInterval(()=>{let gp=navigator.getGamepads&&navigator.getGamepads()[0];if(!gp)return;if(Math.abs(gp.axes[0])>.15)touchMove=gp.axes[0];if(gp.buttons[0]&&gp.buttons[0].pressed)jumpBuf=.1;if(gp.buttons[4]&&gp.buttons[4].pressed)touchRot=-1;else if(gp.buttons[5]&&gp.buttons[5].pressed)touchRot=1;},50);
