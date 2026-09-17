'use strict';
/* ORBITFALL — open index.html locally. Optional reproducible pattern seed: ?seed=123.
   ?debug=1 or F3 enables diagnostics. Simulation is 120 Hz; rendering interpolates.
   All hazards and their warnings are screen-space entities, never chamber children. */
(() => {
const W=720,H=960,CX=360,CY=485,R=270,ORBIT=250,TAU=Math.PI*2,STEP=1/120;
const C={bg:'#080d18',edge:'#405575',cyan:'#5cf2e8',amber:'#ffbe55',red:'#ff5d73',text:'#f1f6ff'};
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d');
const params=new URLSearchParams(location.search);
let debug=params.get('debug')==='1',stored={};
try{stored=JSON.parse(localStorage.getItem('orbitfall.v1')||'{}')||{};}catch(e){}
const settings={sound:stored.sound!==false,reduced:typeof stored.reduced==='boolean'?stored.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,haptics:stored.haptics===true};
let best=Number(stored.best)||0,taught=!!stored.taught;
function save(){try{localStorage.setItem('orbitfall.v1',JSON.stringify({...settings,best,taught}));}catch(e){}}
let audio;
function wakeAudio(){try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(e){}}
function tone(freq=440,duration=.08,type='sine',volume=.06){if(!settings.sound||!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function buzz(ms){if(settings.haptics&&navigator.vibrate)navigator.vibrate(ms);}
function syncSettings(){document.querySelectorAll('[data-setting]').forEach(b=>{const on=settings[b.dataset.setting];b.setAttribute('aria-pressed',String(on));b.querySelector('b').textContent=on?'ON':'OFF';});$('stage').classList.toggle('reduced',settings.reduced);}
document.querySelectorAll('[data-setting]').forEach(b=>b.addEventListener('click',()=>{wakeAudio();settings[b.dataset.setting]=!settings[b.dataset.setting];syncSettings();save();tone(600);}));
syncSettings();
let seed=1;
function rand(){seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;}
let state='title',angle=Math.PI/2,previousAngle=angle,time=0,score=0,bonus=0,near=0,combo=0,comboLeft=0;
let rocks=[],warnings=[],particles=[],labels=[],spawnClock=.9,shake=0,deathDelay=0,countLeft=0,tutorialTime=0,tutorialActive=false,moved=0;
let accumulator=0,lastStamp=0,frames=0,fps=0,fpsClock=0,uiClock=0;
const keys=new Set();let pointer=null,pendingRotation=0;
function clearInput(){keys.clear();pointer=null;pendingRotation=0;}
function announce(text){$('announcer').textContent=text;}
function formatTime(t,precise=false){const min=Math.floor(t/60),sec=Math.floor(t%60);return String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0')+(precise?'.'+String(Math.floor(t*100)%100).padStart(2,'0'):'');}
function panels(name){['titlePanel','helpPanel','pausePanel','overPanel'].forEach(id=>$(id).hidden=id!==name);$('scrim').hidden=!name||name==='titlePanel';}
function updateBest(){ $('titleBest').querySelector('strong').textContent=best;$('personalBest').textContent='BEST '+best;}
function focus(id){$(id).focus({preventScroll:true});}
function start(){wakeAudio();seed=params.has('seed')?(Number(params.get('seed'))>>>0):(Date.now()>>>0);angle=Math.PI/2;previousAngle=angle;time=score=bonus=near=combo=comboLeft=shake=deathDelay=tutorialTime=moved=0;rocks=[];warnings=[];particles=[];labels=[];spawnClock=1.1;tutorialActive=!taught;state='playing';clearInput();accumulator=0;panels(null);$('countdown').hidden=true;$('hud').hidden=false;$('tutorial').hidden=!tutorialActive;$('guidance').hidden=tutorialActive;updateBest();updateHUD();focus('canvas');announce('Run started. Rotate with A and D, arrow keys, or a horizontal swipe.');tone(520,.12);}
function menu(){state='title';clearInput();panels('titlePanel');$('hud').hidden=true;$('tutorial').hidden=true;$('guidance').hidden=true;$('countdown').hidden=true;updateBest();focus('playButton');}
function pause(){if(state!=='playing'&&state!=='countdown')return;state='paused';clearInput();$('countdown').hidden=true;panels('pausePanel');focus('resumeButton');announce('Paused.');}
function resume(){if(state!=='paused')return;wakeAudio();state='countdown';countLeft=3;clearInput();panels(null);$('countdown').textContent='3';$('countdown').hidden=false;focus('canvas');tone(360);}
function skipTutorial(){tutorialActive=false;taught=true;save();$('tutorial').hidden=true;$('guidance').hidden=false;}
$('playButton').onclick=start;$('againButton').onclick=start;$('restartButton').onclick=start;$('pauseButton').onclick=pause;$('resumeButton').onclick=resume;$('skipButton').onclick=skipTutorial;
$('helpButton').onclick=()=>{state='help';panels('helpPanel');focus('helpBack');};$('helpBack').onclick=menu;
document.querySelectorAll('.menuButton').forEach(b=>b.onclick=menu);
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();clearInput();}lastStamp=0;accumulator=0;});window.addEventListener('blur',()=>{pause();clearInput();});
window.addEventListener('keydown',e=>{if(e.code==='F3'){e.preventDefault();debug=!debug;return;}if(e.code==='Escape'||e.code==='KeyP'){if(e.target.tagName==='BUTTON'&&e.code==='KeyP')return;e.preventDefault();if(e.repeat)return;if(state==='playing'||state==='countdown')pause();else if(state==='paused')resume();else if(state==='help')menu();return;}if(['ArrowLeft','ArrowRight','KeyA','KeyD'].includes(e.code)&&(state==='playing'||state==='countdown')){e.preventDefault();keys.add(e.code);}});
window.addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('pointerdown',e=>{if(state!=='playing'||pointer)return;wakeAudio();pointer={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);focus('canvas');});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||state!=='playing')return;const dx=(e.clientX-pointer.x)*W/canvas.getBoundingClientRect().width;pointer.x=e.clientX;pendingRotation+=dx*.008;});
function releasePointer(e){if(pointer&&pointer.id===e.pointerId)pointer=null;}
canvas.addEventListener('pointerup',releasePointer);canvas.addEventListener('pointercancel',releasePointer);canvas.addEventListener('lostpointercapture',releasePointer);
function resize(){const vp=$('viewport'),s=Math.min(vp.clientWidth/W,vp.clientHeight/H);$('stage').style.width=W*s+'px';$('stage').style.height=H*s+'px';$('stage').style.setProperty('--u',s+'px');const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(W*s*dpr);canvas.height=Math.round(H*s*dpr);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);}
window.addEventListener('resize',resize);resize();
function player(a=angle){return {x:CX+Math.cos(a)*ORBIT,y:CY+Math.sin(a)*ORBIT};}
function spawnWarning(){const x=CX+(rand()*2-1)*225,r=12+rand()*13;const top=CY-Math.sqrt(R*R-(x-CX)*(x-CX));warnings.push({x,y:top,r,left:.95,total:.95,speed:125+Math.min(time*2.4,160)+rand()*40,spin:rand()*TAU});}
function emit(x,y,color,n=12){if(settings.reduced)return;for(let i=0;i<n;i++){const a=rand()*TAU,v=35+rand()*170;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.35+rand()*.4,max:.75,color});}if(particles.length>160)particles.splice(0,particles.length-160);}
function nearMiss(r){r.awarded=true;near++;combo=comboLeft>0?Math.min(5,combo+1):1;comboLeft=3;const points=25*combo;bonus+=points;labels.push({x:r.x,y:r.y,text:'CLOSE +'+points,life:1});const p=player();emit(p.x,p.y,C.cyan,8);tone(660+combo*95,.09);buzz(12);}
function die(){state='dying';deathDelay=.65;clearInput();const p=player();emit(p.x,p.y,C.red,42);shake=settings.reduced?0:12;tone(85,.35,'sawtooth',.08);buzz(100);$('tutorial').hidden=true;$('guidance').hidden=true;}
function finish(){state='over';score=Math.floor(time*10)+bonus;const record=score>best;if(record){best=score;save();}$('newBest').textContent=record?'NEW PERSONAL BEST':'SIGNAL LOST';$('finalScore').textContent=score;$('finalTime').textContent=formatTime(time);$('finalNear').textContent=near;$('finalBest').textContent=best;panels('overPanel');updateBest();focus('againButton');announce('Run over. Score '+score+'. Survived '+formatTime(time)+'. '+near+' near misses.');}
function segmentDistance(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;const t=l?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)):0;return Math.hypot(px-ax-dx*t,py-ay-dy*t);}
function effects(dt){shake=Math.max(0,shake-dt*35);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=90*dt;}particles=particles.filter(p=>p.life>0);for(const l of labels){l.life-=dt;l.y-=dt*25;}labels=labels.filter(l=>l.life>0);}
function step(dt){previousAngle=angle;if(state==='countdown'){const old=Math.ceil(countLeft);countLeft-=dt;if(countLeft<=0){state='playing';$('countdown').hidden=true;tone(760,.12);announce('Go.');}else if(Math.ceil(countLeft)!==old){$('countdown').textContent=Math.ceil(countLeft);tone(360);}return;}if(state==='dying'){effects(dt);deathDelay-=dt;if(deathDelay<=0)finish();return;}if(state!=='playing')return;
const before=player();const dir=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);const swipe=Math.max(-.055,Math.min(.055,pendingRotation));pendingRotation-=swipe;const turn=dir*2.7*dt+swipe;angle+=turn;moved+=Math.abs(turn);const after=player();
time+=dt;tutorialTime+=dt;comboLeft=Math.max(0,comboLeft-dt);if(!comboLeft)combo=0;
if(tutorialActive){$('tutorialText').textContent=tutorialTime<3?'Swipe ← / → or use A / D to rotate.':tutorialTime<6?'Amber hatches warn you. Rocks always fall down.':'Pass close to a rock to earn a near-miss bonus.';if(tutorialTime>10)skipTutorial();}
spawnClock-=dt;if(spawnClock<=0){spawnWarning();spawnClock=Math.max(.38,1.25-time*.009)+(rand()-.5)*.15;}
for(const w of warnings){w.left-=dt;if(w.left<=0){rocks.push({x:w.x,y:w.y,py:w.y,r:w.r,speed:w.speed,spin:w.spin,closest:Infinity,awarded:false,shape:Array.from({length:7},()=>.78+rand()*.22)});tone(145,.05,'triangle',.025);}}
warnings=warnings.filter(w=>w.left>0);
for(const r of rocks){r.py=r.y;r.y+=r.speed*dt;r.spin+=dt*.45;const d=segmentDistance(0,0,before.x-r.x,before.y-r.py,after.x-r.x,after.y-r.y);r.closest=Math.min(r.closest,d);if(d<r.r+10){die();break;}const current=Math.hypot(after.x-r.x,after.y-r.y);if(!r.awarded&&r.closest<r.r+35&&current>r.closest+6)nearMiss(r);}
rocks=rocks.filter(r=>{const bottom=CY+Math.sqrt(Math.max(0,R*R-(r.x-CX)*(r.x-CX)));if(r.y-r.r>bottom){if(state==='playing'&&!r.awarded&&r.closest<r.r+35)nearMiss(r);return false;}return true;});
score=Math.floor(time*10)+bonus;effects(dt);uiClock+=dt;if(uiClock>.05){uiClock=0;updateHUD();}}
function updateHUD(){$('score').textContent=score;$('time').textContent=formatTime(time);$('speedrun').textContent=formatTime(time,true);$('combo').hidden=comboLeft<=0;$('comboText').textContent='CLOSE ×'+combo;$('comboFill').style.transform='scaleX('+(comboLeft/3)+')';$('guidance').style.opacity=time>9?'0':'1';}
function circle(x,y,r,fill,stroke,width=1){ctx.beginPath();ctx.arc(x,y,r,0,TAU);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function draw(alpha,stamp){ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);const background=ctx.createRadialGradient(CX,CY,30,CX,CY,480);background.addColorStop(0,'#142138');background.addColorStop(1,C.bg);ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
ctx.save();if(shake&&!settings.reduced){ctx.translate(Math.sin(stamp*.081)*shake,Math.cos(stamp*.067)*shake);}
const a=previousAngle+(angle-previousAngle)*alpha;const menuScene=state==='title'||state==='help';const chamberAngle=menuScene?(settings.reduced?0:stamp*.000035):a;
circle(CX,CY,R+18,null,'#263952',1);circle(CX,CY,R+9,null,'#14243a',6);circle(CX,CY,R,'#0b1423',C.edge,3);
ctx.save();ctx.beginPath();ctx.arc(CX,CY,R-2,0,TAU);ctx.clip();
for(let x=CX-R;x<CX+R;x+=30)line(x,CY-R,x,CY+R,'#162338',.7);for(let y=CY-R;y<CY+R;y+=30)line(CX-R,y,CX+R,y,'#162338',.7);
circle(CX,CY,170,null,'#1b2b42',1);circle(CX,CY,80,null,'#1b2b42',1);line(CX-14,CY,CX+14,CY,'#354961');line(CX,CY-14,CX,CY+14,'#354961');
if(!menuScene){for(const w of warnings){const bottom=CY+Math.sqrt(R*R-(w.x-CX)*(w.x-CX));ctx.save();ctx.globalAlpha=.45;ctx.setLineDash([3,9]);line(w.x,w.y,w.x,bottom,C.amber,1);ctx.restore();ctx.globalAlpha=.07;ctx.fillStyle=C.amber;ctx.fillRect(w.x-w.r,w.y,w.r*2,bottom-w.y);ctx.globalAlpha=1;}
for(const r of rocks){const y=r.py+(r.y-r.py)*alpha;ctx.save();ctx.translate(r.x,y);ctx.rotate(r.spin);ctx.beginPath();r.shape.forEach((v,i)=>{const t=i/r.shape.length*TAU,x=Math.cos(t)*r.r*v,yy=Math.sin(t)*r.r*v;if(i)ctx.lineTo(x,yy);else ctx.moveTo(x,yy);});ctx.closePath();ctx.fillStyle='#64728a';ctx.fill();ctx.strokeStyle='#a2aec0';ctx.lineWidth=1.5;ctx.stroke();line(-r.r*.45,-r.r*.2,r.r*.2,-r.r*.45,'#bdc6d5',1.5);line(r.r*.2,-r.r*.45,r.r*.4,r.r*.12,'#bdc6d5',1);ctx.restore();if(debug)circle(r.x,y,r.r+10,null,C.red);}}
ctx.restore();
ctx.save();ctx.translate(CX,CY);ctx.rotate(chamberAngle);for(let i=0;i<48;i++){const t=i/48*TAU,major=i%4===0;line(Math.cos(t)*(R+2),Math.sin(t)*(R+2),Math.cos(t)*(R+(major?13:7)),Math.sin(t)*(R+(major?13:7)),major?'#7186a4':'#354b69',major?2:1);}for(let i=0;i<8;i++){const t=i/8*TAU;circle(Math.cos(t)*(R-9),Math.sin(t)*(R-9),3,'#546e91');}ctx.restore();
if(!menuScene){for(const w of warnings){const pulse=settings.reduced?1:.6+.4*Math.sin(w.left*22);ctx.save();ctx.translate(w.x,w.y);ctx.rotate(Math.atan2(w.y-CY,w.x-CX)+Math.PI/2);ctx.globalAlpha=pulse;ctx.fillStyle=C.amber;ctx.fillRect(-w.r,-5,w.r*2,10);ctx.fillStyle='#2c2518';for(let i=-w.r;i<w.r-3;i+=8)ctx.fillRect(i,-5,3,10);ctx.restore();circle(w.x,w.y,6*(1-w.left/w.total)+3,null,C.amber,1);}}
if(state!=='dying'&&state!=='over'){const p=player(menuScene?Math.PI*.72:a);if(!settings.reduced){ctx.shadowColor=C.cyan;ctx.shadowBlur=18;}circle(p.x,p.y,11,C.cyan,'#dafffa',2);ctx.shadowBlur=0;circle(p.x-2,p.y-2,3,'#ffffff');circle(p.x,p.y,18,null,'#5cf2e82a',1);if(debug)circle(p.x,p.y,10,null,C.red);}
for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);circle(p.x,p.y,2,p.color);}ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='bold 15px system-ui';for(const l of labels){ctx.globalAlpha=Math.min(1,l.life*2);ctx.fillStyle=C.cyan;ctx.fillText(l.text,l.x,l.y);}ctx.globalAlpha=1;
ctx.restore();if(menuScene){const fade=ctx.createLinearGradient(0,220,0,850);fade.addColorStop(0,'#080d1810');fade.addColorStop(.3,'#080d18cd');fade.addColorStop(1,'#080d18ed');ctx.fillStyle=fade;ctx.fillRect(0,200,W,670);}
if(debug){ctx.fillStyle=C.cyan;ctx.font='12px monospace';ctx.textAlign='left';ctx.fillText('FPS '+fps+' | 120 Hz | '+state+' | rocks '+rocks.length+' | seed '+seed,20,925);}}
function frame(stamp){if(!lastStamp)lastStamp=stamp;const elapsed=Math.min(.1,(stamp-lastStamp)/1000);lastStamp=stamp;accumulator+=elapsed;let steps=0;while(accumulator>=STEP&&steps<12){step(STEP);accumulator-=STEP;steps++;}if(steps===12)accumulator=Math.min(accumulator,STEP);frames++;fpsClock+=elapsed;if(fpsClock>=1){fps=Math.round(frames/fpsClock);frames=0;fpsClock=0;}draw(accumulator/STEP,stamp);requestAnimationFrame(frame);}
// Keep keyboard focus inside open dialogs without changing the canvas input model.
document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const panel=['helpPanel','pausePanel','overPanel'].map($).find(p=>!p.hidden);if(!panel)return;const buttons=Array.from(panel.querySelectorAll('button')).filter(b=>!b.disabled),first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&(document.activeElement===first||!panel.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!panel.contains(document.activeElement))){e.preventDefault();first.focus();}});
updateBest();requestAnimationFrame(frame);
})();
