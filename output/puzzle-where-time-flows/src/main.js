const c=document.getElementById('c'),x=c.getContext('2d');
let W=960,H=600,S=1,OX=0,OY=0;
function resize(){c.width=innerWidth;c.height=innerHeight;S=Math.min(c.width/W,c.height/H);OX=(c.width-W*S)/2;OY=(c.height-H*S)/2}
addEventListener('resize',resize);resize();
let AC;function beep(f,d){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();let o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;o.type='square';g.gain.value=0.07;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}
let room=0,clocks=[0,0,0],scales=[1,1,1],trans=0,win=false,paused=false,start=Date.now(),elapsed=0,parts=[],keys={},target=null,trail=[];
let high=localStorage.getItem('chronosphere_highscore')||'—';
let P={x:60,y:300,vx:0,vy:0,w:26,h:26};
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function portalsFor(r){if(r===0)return[{x:910,y:250,w:40,h:100,to:1,tx:60,ty:300}];if(r===1)return[{x:10,y:250,w:40,h:100,to:0,tx:860,ty:300},{x:910,y:250,w:40,h:100,to:2,tx:60,ty:300}];return[{x:10,y:250,w:40,h:100,to:1,tx:860,ty:300}]}
function doorOpen(){return (clocks[0]%1)<0.5||scales[0]<0}
function plat(){return{x:320+Math.sin(clocks[1]*6.283)*190,y:285,w:95,h:18}}
function cycle(){let seq=[1,2,0.5,-1];let i=seq.indexOf(scales[room]);scales[room]=seq[(i+1)%seq.length];beep(scales[room]<0?180:750,0.15);for(let i=0;i<18;i++)parts.push({x:P.x+13,y:P.y+13,vx:(Math.random()-0.5)*220,vy:(Math.random()-0.5)*220,l:0.6})}
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key==='Shift'&&!e.repeat)cycle();if(e.key===' '){paused=!paused;beep(320,0.1)}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
c.addEventListener('pointerdown',e=>{target={x:(e.clientX-OX)/S,y:(e.clientY-OY)/S};beep(620,0.05)});
let last=performance.now();
function loop(t){let dt=Math.min(0.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function update(dt){elapsed=(Date.now()-start)/1000;if(trans>0)trans-=dt;if(!paused&&!win){for(let i=0;i<3;i++){clocks[i]+=dt*scales[i]*(i===room?1:0.25);clocks[i]=((clocks[i]%1)+1)%1}}
let ax=0,ay=0;if(keys['w']||keys['arrowup'])ay-=1;if(keys['s']||keys['arrowdown'])ay+=1;if(keys['a']||keys['arrowleft'])ax-=1;if(keys['d']||keys['arrowright'])ax+=1;
if(!ax&&!ay&&target){let dx=target.x-P.x,dy=target.y-P.y,d=Math.hypot(dx,dy);if(d>8){ax=dx/d;ay=dy/d}else target=null}
let mult=paused?0:Math.abs(scales[room])||0.1,effMax=280*Math.sqrt(mult),effAcc=1200*mult;
if(ax||ay){let l=Math.hypot(ax,ay);P.vx+=ax/l*effAcc*dt;P.vy+=ay/l*effAcc*dt}else{let f=1800*mult*dt;P.vx=Math.abs(P.vx)<=f?0:P.vx-Math.sign(P.vx)*f;P.vy=Math.abs(P.vy)<=f?0:P.vy-Math.sign(P.vy)*f}
let sp=Math.hypot(P.vx,P.vy);if(sp>effMax){P.vx=P.vx/sp*effMax;P.vy=P.vy/sp*effMax}
let oldPlat=plat();P.x+=P.vx*dt;P.y+=P.vy*dt;P.x=Math.max(10,Math.min(W-10-P.w,P.x));P.y=Math.max(10,Math.min(H-10-P.h,P.y));
if(room===0&&!doorOpen()&&hit(P,{x:868,y:190,w:22,h:220})){P.x=868-P.w;P.vx=0}
if(room===1){let pl=plat();if(hit(P,pl)&&P.vy>=0){P.x+=pl.x-oldPlat.x;P.y=pl.y-P.h}let spikes={x:250,y:330,w:460,h:36};if(hit(P,spikes)&&!hit(P,pl)){beep(120,0.3);P.x=60;P.y=300;P.vx=0;P.vy=0;parts.push({x:P.x,y:P.y,vx:0,vy:-50,l:0.5})}}
for(let p of portalsFor(room)){if(hit(P,p)){room=p.to;P.x=p.tx;P.y=p.ty;P.vx=0;P.vy=0;trans=0.5;beep(900,0.2);break}}
if(room===2&&hit(P,{x:845,y:285,w:34,h:34})){win=true;beep(880,0.2);setTimeout(()=>beep(1100,0.3),150);if(high==='—'||elapsed<parseFloat(high)){high=elapsed.toFixed(1);localStorage.setItem('chronosphere_highscore',high)}}
for(let i=parts.length-1;i>=0;i--){let p=parts[i];p.l-=dt;p.x+=p.vx*dt*scales[room];p.y+=p.vy*dt*scales[room];if(p.l<=0)parts.splice(i,1)}
if(Math.random()<0.3)parts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*20,vy:(Math.random()-0.5)*20,l:1.2});
trail.push({x:P.x,y:P.y});if(trail.length>12)trail.shift();
document.getElementById('hud').innerHTML='⏱ '+elapsed.toFixed(1)+'s<br>🏆 Best: '+high+'s<br>Room '+(room+1)+'/3 | '+scales[room]+'x'+(paused?' PAUSED':'');}
function col(){let s=scales[room];return paused?'#9d4edd':s<0?'#ffb300':s===2?'#ff2ea6':'#00e5ff'}
function draw(){x.setTransform(1,0,0,1,0,0);x.fillStyle='#07070f';x.fillRect(0,0,c.width,c.height);x.setTransform(S,0,0,S,OX,OY);let cl=col();
x.fillStyle='#0a0a14';x.fillRect(0,0,W,H);x.strokeStyle='rgba(255,255,255,0.05)';for(let i=0;i<W;i+=40){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke()}for(let i=0;i<H;i+=40){x.beginPath();x.moveTo(0,i);x.lineTo(W,i);x.stroke()}
if(trans>0){x.globalAlpha=0.5;x.fillStyle='#ff2ea6';x.fillRect(4,0,W,H);x.fillStyle='#00e5ff';x.fillRect(-4,0,W,H);x.globalAlpha=1}
x.strokeStyle=cl;x.lineWidth=4;x.shadowColor=cl;x.shadowBlur=16;x.strokeRect(8,8,W-16,H-16);x.shadowBlur=0;
x.fillStyle=cl;x.fillRect(0,0,W*(clocks[room]%1),6);
for(let p of portalsFor(room)){x.fillStyle='#00ffcc';x.shadowColor='#00ffcc';x.shadowBlur=14;x.fillRect(p.x,p.y,p.w,p.h);x.shadowBlur=0;x.fillStyle='#003';x.font='20px monospace';x.fillText('◉',p.x+8,p.y+55)}
if(room===0){x.fillStyle=doorOpen()?'#00ff88':'#ff3355';x.fillRect(868,190,22,220);x.fillStyle='#ffb300';x.fillRect(830,180+ (clocks[0]%1)*40,30,14);x.fillStyle='#fff';x.font='12px monospace';x.fillText(doorOpen()?'LATCH UP - DOOR OPEN':'LATCH DROPPED - REWIND!',700,170)}
if(room===1){let pl=plat();x.fillStyle='#ff2ea6';x.fillRect(pl.x,pl.y,pl.w,pl.h);x.fillStyle='#ff3355';for(let i=0;i<23;i++){x.beginPath();x.moveTo(250+i*20,366);x.lineTo(260+i*20,330);x.lineTo(270+i*20,366);x.fill()}x.fillStyle='#fff';x.font='12px monospace';x.fillText('SPIKES - ride platform at 2x!',380,320)}
if(room===2){x.fillStyle='#ffe600';x.shadowColor='#ffe600';x.shadowBlur=20;x.beginPath();x.arc(862,302,17,0,7);x.fill();x.shadowBlur=0;x.fillStyle='#fff';x.font='14px monospace';x.fillText('GOAL ORB',820,270)}
for(let p of parts){x.fillStyle=cl;x.globalAlpha=Math.max(0,p.l);x.fillRect(p.x,p.y,4,4);x.globalAlpha=1}
if(scales[room]<0){x.globalAlpha=0.4;for(let t of trail){x.fillStyle='#ffb300';x.fillRect(t.x,t.y,P.w,P.h)}x.globalAlpha=1}
x.fillStyle='#00e5ff';x.shadowColor='#00e5ff';x.shadowBlur=12;x.fillRect(P.x,P.y,P.w,P.h);x.shadowBlur=0;x.fillStyle='#001';x.fillRect(P.x+6,P.y+6,14,14);
x.fillStyle='#fff';x.font='bold 16px monospace';x.fillText('CHRONOSPHERE - Room '+(room+1),16,32);x.font='12px monospace';x.fillText('Clock '+(clocks[room]%1).toFixed(2)+'  Scale '+scales[room]+'x',16,52);
let cx=W/2,cy=H-52;x.strokeStyle=cl;x.lineWidth=3;x.beginPath();x.arc(cx,cy,34,0,7);x.stroke();x.fillStyle=cl;x.font='bold 14px monospace';x.textAlign='center';x.fillText(scales[room]<0?'REWIND':scales[room]+'x',cx,cy+5);x.textAlign='left';
for(let i=0;i<3;i++){x.fillStyle=i===room?col():'#333';x.fillRect(W-130+i*42,16,36,22);x.fillStyle='#fff';x.font='10px monospace';x.fillText('R'+(i+1),W-122+i*42,31)}
if(win){x.fillStyle='rgba(0,0,0,0.75)';x.fillRect(0,0,W,H);x.fillStyle='#ffe600';x.font='bold 36px monospace';x.textAlign='center';x.fillText('🏆 YOU WIN! '+elapsed.toFixed(1)+'s',W/2,H/2);x.font='16px monospace';x.fillText('Best: '+high+'s - Refresh to play again',W/2,H/2+36);x.textAlign='left'}}
