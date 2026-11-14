'use strict';
var cv=document.getElementById('c'),ctx=cv.getContext('2d');
var W=800,H=600,DPR=1;
function resize(){var r=cv.getBoundingClientRect();DPR=Math.min(window.devicePixelRatio||1,2);cv.width=Math.max(1,Math.floor(r.width*DPR));cv.height=Math.max(1,Math.floor(r.height*DPR));W=r.width;H=r.height;ctx.setTransform(DPR,0,0,DPR,0,0);}
window.addEventListener('resize',resize);
window.addEventListener('orientationchange',function(){setTimeout(resize,120);});

var AC=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){AC=null;}}if(AC&&AC.state==='suspended'){AC.resume();}return AC;}
function beep(freq,dur,type,vol){var a=ac();if(!a)return;var o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.value=freq;g.gain.value=0.0001;o.connect(g);g.connect(a.destination);var t=a.currentTime;g.gain.linearRampToValueAtTime(vol||0.07,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.start(t);o.stop(t+dur+0.03);}

var PHASES=[
 {n:'CALIBRATION',amp:0.45,f:0.12},
 {n:'OSCILLATION',amp:0.70,f:0.22},
 {n:'STOCHASTIC',amp:0.85,f:0.30},
 {n:'INVERSION',amp:0.95,f:0.35},
 {n:'CASCADE',amp:1.10,f:0.50},
 {n:'ENTROPY PEAK',amp:1.30,f:0.60}
];
var TOTAL=180;
var meterValue=0.5,meterVelocity=0,elapsed=0,score=0,mult=1,breachTimer=0,phase=0,state='menu',invert=false,invertT=0,shake=0,flash=0,best=0,clutchT=0;
try{best=parseFloat(localStorage.getItem('eq_best')||'0')||0;}catch(e){best=0;}

var keys={},axis=0,touchX=null,pointerActive=false;
window.addEventListener('keydown',function(e){var k=e.key.toLowerCase();if(k==='arrowleft'||k==='arrowright'||k==='a'||k==='d'||k===' '){e.preventDefault();}keys[k]=true;if(k===' '&&state!=='play'){start();}});
window.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false;});
cv.addEventListener('pointerdown',function(e){pointerActive=true;touchX=e.clientX;ac();if(state!=='play'){start();}});
cv.addEventListener('pointermove',function(e){if(pointerActive){touchX=e.clientX;}});
window.addEventListener('pointerup',function(){pointerActive=false;touchX=null;});
window.addEventListener('pointercancel',function(){pointerActive=false;touchX=null;});

function getAxis(dt){
 var target=0;
 if(keys['arrowleft']||keys['a'])target-=1;
 if(keys['arrowright']||keys['d'])target+=1;
 if(touchX!==null){var r=cv.getBoundingClientRect();var d=(touchX-(r.left+r.width/2))/(r.width*0.32);target=Math.max(-1,Math.min(1,d));}
 var rate=(target===0)?0.05:0.15;
 axis+=(target-axis)*Math.min(1,dt/rate);
 return Math.max(-1,Math.min(1,axis));
}

var P=[];
for(var i=0;i<160;i++){P.push({x:0,y:0,vx:0,vy:0,l:0,ml:1,s:1});}
function spawnP(x,y,vx,vy,life,size){for(var i=0;i<P.length;i++){var p=P[i];if(p.l<=0){p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.l=life;p.ml=life;p.s=size;return;}}}

function start(){
 meterValue=0.5;meterVelocity=0;elapsed=0;score=0;mult=1;breachTimer=0;phase=0;invert=false;invertT=0;shake=0;flash=0;clutchT=0;axis=0;
 state='play';ac();beep(440,0.15,'triangle',0.09);
}
function gameOver(){
 state='over';
 if(score>best){best=score;try{localStorage.setItem('eq_best',String(Math.floor(best)));}catch(e){}}
 beep(110,1.2,'sine',0.14);
}

function update(dt){
 if(state!=='play')return;
 elapsed+=dt;
 var t=elapsed;
 var ph=Math.min(5,Math.floor(t/30));
 if(ph!==phase){phase=ph;flash=1;beep(660,0.2,'square',0.08);}
 var cfg=PHASES[phase];
 var e=Math.sin(t*cfg.f*Math.PI*2)*cfg.amp;
 if(phase>=2){e+=(Math.random()-0.5)*cfg.amp*0.9;}
 if(phase>=4){e+=Math.sin(t*31.4)*cfg.amp*0.35;}
 if(phase===3){invertT-=dt;if(invertT<=0){invert=!invert;invertT=8+Math.random()*6;flash=1;beep(invert?300:520,0.12,'sawtooth',0.07);}}
 if(invert){e=-e;}
 var ax=getAxis(dt);
 meterVelocity+=(e+ax*1.9)*dt;
 meterVelocity*=(1-2.5*dt);
 meterValue+=meterVelocity*dt;
 if(meterValue<0)meterValue=0;
 if(meterValue>1)meterValue=1;

 var dev=Math.abs(meterValue-0.5);
 if(meterValue<=0.02||meterValue>=0.98){
  breachTimer+=dt;shake=Math.min(1,shake+dt*3);
  if(breachTimer>0.5){gameOver();return;}
 }else{
  if(breachTimer>0){breachTimer=Math.max(0,breachTimer-dt*2);}
  score+=dt*(1+dev*2)*mult;
  if(dev<0.07){clutchT+=dt;if(clutchT>1.2){clutchT=0;score+=20;beep(880,0.07,'sine',0.05);}}else{clutchT=0;}
 }
 mult=1+Math.floor(elapsed/30)*0.5;
 if(dev>0.44){mult=Math.max(1,mult-0.75);}
 if(dev<0.12){mult=Math.min(5,mult+dt*0.15);}
 for(var i=0;i<P.length;i++){var p=P[i];if(p.l>0){p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;p.vx*=0.99;}}
 if(Math.random()<dt*30){var ang=Math.random()*Math.PI*2,sp=40+Math.random()*120;spawnP(W/2,H*0.5,Math.cos(ang)*sp,Math.sin(ang)*sp,0.6+Math.random()*0.6,1+Math.random()*2);}
 shake=Math.max(0,shake-dt*2);flash=Math.max(0,flash-dt*3);
}
function drawMeter(){
 var cx=W/2,cy=H*0.56,r=Math.min(W,H)*0.28;
 ctx.save();
 ctx.translate(cx,cy);
 var ang=Math.PI*0.75+meterValue*Math.PI*1.5;
 ctx.strokeStyle='rgba(120,200,255,0.18)';ctx.lineWidth=Math.max(6,r*0.06);ctx.beginPath();ctx.arc(0,0,r,Math.PI*0.75,Math.PI*2.25);ctx.stroke();
 var grad=ctx.createLinearGradient(-r,0,r,0);grad.addColorStop(0,'#ff3b6b');grad.addColorStop(0.5,'#39ffb0');grad.addColorStop(1,'#ff3b6b');
 ctx.strokeStyle=grad;ctx.lineWidth=Math.max(3,r*0.025);ctx.beginPath();ctx.arc(0,0,r,Math.PI*0.75,ang);ctx.stroke();
 ctx.strokeStyle='rgba(255,255,255,0.85)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(ang)*r*0.86,Math.sin(ang)*r*0.86);ctx.stroke();
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,Math.max(3,r*0.035),0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function draw(){
 ctx.save();
 var sx=(Math.random()-0.5)*shake*18,sy=(Math.random()-0.5)*shake*18;
 ctx.translate(sx,sy);
 ctx.fillStyle='#050510';ctx.fillRect(-20,-20,W+40,H+40);
 var g=ctx.createRadialGradient(W/2,H*0.5,0,W/2,H*0.5,Math.max(W,H)*0.7);
 g.addColorStop(0,'rgba(30,80,140,0.22)');g.addColorStop(1,'rgba(5,5,16,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(var i=0;i<P.length;i++){var p=P[i];if(p.l>0){var a=p.l/p.ml;ctx.globalAlpha=a*0.8;ctx.fillStyle='#7fe7ff';ctx.fillRect(p.x,p.y,p.s,p.s);}}
 ctx.globalAlpha=1;
 drawMeter();
 ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillStyle='rgba(180,220,255,0.65)';ctx.font='600 '+Math.max(10,Math.min(16,W*0.022))+'px ui-monospace,monospace';
 ctx.fillText(PHASES[phase].n,W/2,H*0.16);
 ctx.fillStyle='#fff';ctx.font='700 '+Math.max(18,Math.min(34,W*0.045))+'px ui-monospace,monospace';
 ctx.fillText(Math.floor(score).toString().padStart(6,'0'),W/2,H*0.24);
 ctx.fillStyle='rgba(180,220,255,0.55)';ctx.font='500 '+Math.max(9,Math.min(13,W*0.018))+'px ui-monospace,monospace';
 ctx.fillText('MULT x'+mult.toFixed(1)+'   BEST '+Math.floor(best),W/2,H*0.30);
 var dev=Math.abs(meterValue-0.5);
 if(dev>0.42){ctx.fillStyle='rgba(255,60,90,'+(0.15+0.25*Math.sin(elapsed*20))+')';ctx.fillRect(0,0,W,H);}
 if(flash>0){ctx.fillStyle='rgba(255,255,255,'+(flash*0.18)+')';ctx.fillRect(0,0,W,H);}
 if(state==='menu'){
  ctx.fillStyle='rgba(5,5,16,0.72)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#fff';ctx.font='800 '+Math.max(28,Math.min(64,W*0.085))+'px ui-monospace,monospace';ctx.fillText('EQUILIBRIUM',W/2,H*0.40);
  ctx.fillStyle='rgba(180,220,255,0.8)';ctx.font='500 '+Math.max(11,Math.min(16,W*0.022))+'px ui-monospace,monospace';
  ctx.fillText('HOLD THE CENTER',W/2,H*0.50);
  ctx.fillStyle='#39ffb0';ctx.font='600 '+Math.max(12,Math.min(18,W*0.024))+'px ui-monospace,monospace';
  ctx.fillText('TAP OR PRESS SPACE',W/2,H*0.62);
  ctx.fillStyle='rgba(180,220,255,0.5)';ctx.font='500 '+Math.max(9,Math.min(13,W*0.018))+'px ui-monospace,monospace';
  ctx.fillText('DRAG / ARROWS TO COUNTER',W/2,H*0.70);
 }
 if(state==='over'){
  ctx.fillStyle='rgba(5,5,16,0.78)';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#ff3b6b';ctx.font='800 '+Math.max(24,Math.min(52,W*0.07))+'px ui-monospace,monospace';ctx.fillText('BREACH',W/2,H*0.38);
  ctx.fillStyle='#fff';ctx.font='700 '+Math.max(18,Math.min(34,W*0.045))+'px ui-monospace,monospace';ctx.fillText('SCORE '+Math.floor(score),W/2,H*0.50);
  ctx.fillStyle='rgba(180,220,255,0.7)';ctx.font='500 '+Math.max(10,Math.min(15,W*0.02))+'px ui-monospace,monospace';ctx.fillText('BEST '+Math.floor(best),W/2,H*0.58);
  ctx.fillStyle='#39ffb0';ctx.font='600 '+Math.max(12,Math.min(18,W*0.024))+'px ui-monospace,monospace';ctx.fillText('TAP TO RETRY',W/2,H*0.70);
 }
 ctx.restore();
}
var last=0;
function loop(ts){
 if(!last)last=ts;
 var dt=Math.min(0.05,(ts-last)/1000);last=ts;
 update(dt);draw();
 requestAnimationFrame(loop);
}
resize();requestAnimationFrame(loop);
