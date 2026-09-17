import {C,STATES as S,clamp,startSpeed,powerInfo} from './config.js';
import {freshSeed,stream} from './generation/rng.js';
import {generate} from './generation/level.js';
import {advance,normalize} from './physics.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),overlay=$('overlay');
const storage={get(k,f){try{return JSON.parse(localStorage.getItem(k))??f;}catch{return f;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}};
const settings=storage.get('atlas-settings',{volume:.3,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
let best=storage.get('atlas-best',0),state=S.TITLE,previous=S.READY,seed=freshSeed(),level=1,score=0,lives=3,elapsed=0,levelName='',initialTargets=0,launches=0;
let balls=[],drops=[],particles=[],expand=0,slow=0,record=false,toastTime=0,accumulator=0,last=performance.now(),audio=null;
const game={bricks:[],paddle:{x:480,w:C.PADDLE_W},shield:false,combo:0};
const keys=new Set();let targetX=480,pointerDown=false;
const starsRng=stream('atlas','stars'),stars=Array.from({length:70},()=>({x:starsRng()*960,y:80+starsRng()*640,r:.4+starsRng()*1.2}));
function applySettings(){document.body.classList.toggle('reduced',!!settings.reduced);storage.set('atlas-settings',settings);}
applySettings();
function sound(freq=440,duration=.06){if(!settings.volume)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.6),audio.currentTime+duration);g.gain.setValueAtTime(settings.volume*.12,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
function timeString(t){const minutes=Math.floor(t/60),seconds=Math.floor(t%60),centis=Math.floor(t*100)%100;return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(centis).padStart(2,'0')}`;}
function announce(text){$('announcement').textContent=text;}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastTime=2.3;announce(text);}
function setState(next){state=next;accumulator=0;canvas.classList.toggle('active',state===S.READY||state===S.PLAYING);$('pause').disabled=![S.READY,S.PLAYING,S.PAUSED].includes(state);$('pause').textContent=state===S.PAUSED?'▶':'Ⅱ';$('pause').setAttribute('aria-label',state===S.PAUSED?'Resume game':'Pause game');}
function panel(html){overlay.classList.remove('empty');overlay.innerHTML=`<section class="panel">${html}</section>`;requestAnimationFrame(()=>overlay.querySelector('button,input')?.focus());}
function hidePanel(){overlay.classList.add('empty');overlay.replaceChildren();canvas.focus({preventScroll:true});}
function bind(id,fn){$(id).addEventListener('click',fn);}
function showTitle(){
 setState(S.TITLE);$('hud').hidden=true;game.bricks=generate('NEON-ATLAS',4).bricks;balls=[];drops=[];
 panel('<p class="eyebrow">One seed. Infinite formations.</p><h1>PROCEDURAL<span>BREAKOUT</span></h1><p class="subtitle">Chart your own neon atlas.<br>Deterministic worlds. Classic arcade precision.</p><label class="seed-label">SEED<input id="seed-input" maxlength="64" autocomplete="off" spellcheck="false" aria-label="World seed"></label><button id="start" class="primary">Begin expedition →</button><div class="row"><button id="random">New seed ↻</button><button id="settings">Settings</button></div><p class="micro">Move with arrows, A / D, mouse, or touch.<br>Space or tap to launch. P to pause.<br>Clear every colored brick. Steel cannot be broken.</p>');
 overlay.firstElementChild.classList.add('title-panel');$('seed-input').value=seed;
 bind('random',()=>{$('seed-input').value=freshSeed();});
 const saveSeed=()=>{seed=$('seed-input').value.trim()||freshSeed();};
 bind('start',()=>{saveSeed();startRun();});bind('settings',()=>{saveSeed();showSettings(showTitle);});
 $('seed-input').addEventListener('keydown',e=>{if(e.key==='Enter'){saveSeed();startRun();}});
}
function startRun(){score=0;lives=3;level=1;elapsed=0;launches=0;record=false;$('hud').hidden=false;loadLevel();}
function loadLevel(){
 const generated=generate(seed,level);game.bricks=generated.bricks;levelName=generated.name;initialTargets=game.bricks.filter(b=>b.type!=='steel').length;
 balls=[];drops=[];particles=[];expand=0;slow=0;game.shield=false;game.combo=0;game.paddle.w=C.PADDLE_W;game.paddle.x=targetX=480;
 setState(S.LEVEL_INTRO);
 panel(`<p class="eyebrow">Expedition / ${String(level).padStart(2,'0')}</p><h2>${levelName}</h2><p class="subtitle">${initialTargets} targets · ${Math.round(startSpeed(level))} base speed<br>Find the gaps. Build your combo.</p><p class="seed-display" id="world-seed"></p><button id="enter" class="primary">Enter level →</button><p class="micro">↔ Expand · ◷ Slow · ⁙ Multiball · ⌁ Shield<br>Catch falling upgrades with your paddle.</p>`);
 $('world-seed').textContent=seed;bind('enter',ready);announce(`Level ${level}: ${levelName}`);updateHud();
}
function ready(){setState(S.READY);balls=[{x:game.paddle.x,y:C.PADDLE_Y-C.R-2,vx:0,vy:0,trail:[]}];hidePanel();toast('SPACE or TAP to launch');}
function launch(){if(state!==S.READY)return;const rng=stream(seed,`launch:${level}:${launches++}`),angle=(rng()-.5)*.6,speed=startSpeed(level)*(slow>0?.7:1);for(const b of balls){b.vx=Math.sin(angle)*speed;b.vy=-Math.cos(angle)*speed;}setState(S.PLAYING);sound(600);}
function pause(){if(state===S.PAUSED){resume();return;}if(state!==S.PLAYING&&state!==S.READY)return;previous=state;keys.clear();pointerDown=false;setState(S.PAUSED);showPause();}
function showPause(){panel('<p class="eyebrow">Take a breath</p><h2>Expedition paused</h2><p class="subtitle">Your world will be right here.</p><button id="resume" class="primary">Resume →</button><div class="row"><button id="settings">Settings</button><button id="restart">Restart seed</button></div><button id="exit">Back to title</button>');bind('resume',resume);bind('settings',()=>showSettings(showPause));bind('restart',()=>confirmRestart(startRun));bind('exit',()=>confirmRestart(showTitle));}
function confirmRestart(action){panel('<h2>Leave this run?</h2><p class="subtitle">Current progress will be lost. Your best score is saved.</p><div class="row"><button id="cancel">Keep playing</button><button id="confirm">Leave run</button></div>');bind('cancel',showPause);bind('confirm',action);}
function resume(){setState(previous);hidePanel();}
function showSettings(back){panel('<p class="eyebrow">Flight controls</p><h2>Settings</h2><div class="settings"><label>Sound volume<input id="volume" type="range" min="0" max="1" step=".05"></label><label>Reduced motion<input id="motion" type="checkbox"></label></div><p class="micro">Reduced motion disables particles and ball trails.<br>Settings and best score are saved on this device.</p><div class="secondary-stack"><button id="back" class="primary">Done</button></div>');$('volume').value=settings.volume;$('motion').checked=settings.reduced;$('volume').addEventListener('input',()=>{settings.volume=Number($('volume').value);applySettings();sound();});$('motion').addEventListener('change',()=>{settings.reduced=$('motion').checked;applySettings();});bind('back',back);}
function finishLevel(){setState(S.LEVEL_CLEAR);const bonus=500*level;addScore(bonus);sound(880,.25);panel(`<p class="eyebrow">Formation complete</p><h2>Sector secured.</h2><div class="stats"><div><span>SCORE</span><strong>${score.toLocaleString()}</strong></div><div><span>TIME</span><strong>${timeString(elapsed)}</strong></div></div><p class="record">+${bonus} clear bonus</p><button id="next" class="primary">Continue to level ${level+1} →</button><p class="micro">A fresh formation awaits. Lives carry over.</p>`);bind('next',()=>{level++;loadLevel();});announce(`Level clear. Score ${score}.`);}
function gameOver(){setState(S.GAME_OVER);sound(130,.4);panel(`<p class="eyebrow">Expedition complete</p><h2>One more journey?</h2><div class="stats"><div><span>SCORE</span><strong>${score.toLocaleString()}</strong></div><div><span>LEVEL</span><strong>${level}</strong></div><div><span>TIME</span><strong>${timeString(elapsed)}</strong></div></div>${record?'<p class="record">✦ New personal best</p>':''}<p class="seed-display" id="world-seed"></p><button id="retry" class="primary">Retry this seed ↻</button><div class="row"><button id="new">New expedition</button><button id="copy">Copy seed</button></div><button id="home">Back to title</button>`);$('world-seed').textContent=seed;bind('retry',startRun);bind('new',()=>{seed=freshSeed();startRun();});bind('home',showTitle);bind('copy',async()=>{try{await navigator.clipboard.writeText(seed);$('copy').textContent='Copied!';}catch{$('copy').textContent='Select seed above';}});announce(`Game over. Score ${score}. Level ${level}.`);}
function addScore(value){score+=value;if(score>best){best=score;record=true;storage.set('atlas-best',best);}}
function burst(x,y,color){if(settings.reduced)return;for(let i=0;i<9;i++){const a=i*Math.PI*2/9;particles.push({x,y,vx:Math.cos(a)*(70+i*8),vy:Math.sin(a)*(70+i*8),life:.45,max:.45,color});}if(particles.length>350)particles.splice(0,particles.length-350);}
function hitBrick(brick,ball){
 if(brick.type==='steel'){sound(190,.035);return;}
 brick.hp--;sound(420+Math.min(game.combo,12)*35,.045);
 if(brick.hp<=0){brick.alive=false;game.combo++;addScore(100*Math.min(5,1+Math.floor(game.combo/5)));burst(brick.x+brick.w/2,brick.y+brick.h/2,brick.color);if(brick.drop)drops.push({x:brick.x+brick.w/2,y:brick.y+brick.h/2,type:brick.drop});normalize(ball,Math.min(C.MAX_SPEED*(slow>0?.7:1),Math.hypot(ball.vx,ball.vy)+3));}else addScore(25);
}
function collect(type){
 const info=powerInfo[type];toast(`${info.icon} ${info.label}`);sound(980,.12);addScore(50);
 if(type==='expand'){expand=info.duration;game.paddle.w=C.PADDLE_W*1.5;}
 if(type==='slow'){if(slow<=0)for(const b of balls){b.vx*=.7;b.vy*=.7;}slow=info.duration;}
 if(type==='shield')game.shield=true;
 if(type==='multi'){
  const source=balls[0];if(source)for(const angle of [-.45,.45]){if(balls.length>=5)break;const speed=Math.hypot(source.vx,source.vy),b={x:source.x,y:source.y,vx:source.vx*Math.cos(angle)-source.vy*Math.sin(angle),vy:source.vx*Math.sin(angle)+source.vy*Math.cos(angle),trail:[]};normalize(b,speed);balls.push(b);}
 }
}
function update(dt){
 if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').classList.remove('visible');}
 if(state!==S.READY&&state!==S.PLAYING)return;
 const direction=(keys.has('ArrowRight')||keys.has('d')?1:0)-(keys.has('ArrowLeft')||keys.has('a')?1:0);
 if(direction)targetX=game.paddle.x+direction*850*dt;
 const diff=targetX-game.paddle.x;game.paddle.x=clamp(game.paddle.x+clamp(diff,-1400*dt,1400*dt),C.LEFT+game.paddle.w/2,C.RIGHT-game.paddle.w/2);
 if(state===S.READY){for(const b of balls){b.x=game.paddle.x;b.y=C.PADDLE_Y-C.R-2;}return;}
 elapsed+=dt;
 if(expand>0){expand=Math.max(0,expand-dt);if(!expand)game.paddle.w=C.PADDLE_W;}
 if(slow>0){slow=Math.max(0,slow-dt);if(!slow)for(const b of balls)normalize(b,Math.min(C.MAX_SPEED,Math.hypot(b.vx,b.vy)/.7));}
 for(const b of balls){advance(b,dt,game,hitBrick,kind=>sound(kind==='paddle'?300:210,.03));if(!settings.reduced){b.trail.push({x:b.x,y:b.y});if(b.trail.length>12)b.trail.shift();}else b.trail=[];}
 balls=balls.filter(b=>b.y<C.LOSS);
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.y+=150*dt;if(d.y>=C.PADDLE_Y-12&&d.y<=C.PADDLE_Y+C.PADDLE_H&&Math.abs(d.x-game.paddle.x)<game.paddle.w/2+12){collect(d.type);drops.splice(i,1);}else if(d.y>C.H+20)drops.splice(i,1);}
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
 if(!game.bricks.some(b=>b.alive&&b.type!=='steel')){finishLevel();return;}
 if(!balls.length){lives--;game.combo=0;drops=[];expand=slow=0;game.paddle.w=C.PADDLE_W;game.shield=false;if(lives<=0)gameOver();else{ready();toast('Ball lost · Launch to try again');}}
}
function updateHud(){
 $('timer').textContent=timeString(elapsed);$('score').textContent=score.toLocaleString();$('best').textContent=`BEST ${best.toLocaleString()}`;$('level').textContent=`LEVEL ${String(level).padStart(2,'0')}`;
 const remaining=game.bricks.filter(b=>b.alive&&b.type!=='steel').length;$('remaining').textContent=`${remaining} targets`;$('progress').style.width=`${initialTargets?(1-remaining/initialTargets)*100:0}%`;
 $('lives').textContent=Array(Math.max(0,lives)).fill('●').join(' ');$('lives').setAttribute('aria-label',`${lives} lives`);$('combo').textContent=game.combo>=2?`${game.combo} COMBO · ×${Math.min(5,1+Math.floor(game.combo/5))}`:'';
 const effects=[];for(const [type,value]of [['expand',expand],['slow',slow]])if(value>0)effects.push(`<span class="pill active"><i class="count-ring" style="--amount:${value/powerInfo[type].duration}"></i>${powerInfo[type].label} ${Math.ceil(value)}s</span>`);
 if(game.shield)effects.push('<span class="pill active">⌁ SHIELD</span>');if(balls.length>1)effects.push(`<span class="pill active">⁙ ${balls.length} BALLS</span>`);
 const html=effects.join('')||'<span class="pill">SEED-DRIVEN / SKILL-POWERED</span>';if($('effects').innerHTML!==html)$('effects').innerHTML=html;
}
function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function draw(){
 ctx.clearRect(0,0,C.W,C.H);ctx.fillStyle='#0c1327';ctx.fillRect(0,0,C.W,C.H);
 ctx.strokeStyle='#7294ba09';ctx.lineWidth=1;ctx.beginPath();for(let x=24;x<960;x+=32){ctx.moveTo(x,80);ctx.lineTo(x,720);}for(let y=80;y<720;y+=32){ctx.moveTo(24,y);ctx.lineTo(936,y);}ctx.stroke();
 for(const s of stars){ctx.fillStyle='#a4c7ef44';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='#65f5da30';ctx.beginPath();ctx.moveTo(C.LEFT,625);ctx.lineTo(C.LEFT,C.TOP);ctx.lineTo(C.RIGHT,C.TOP);ctx.lineTo(C.RIGHT,625);ctx.stroke();
 for(const b of game.bricks){if(!b.alive)continue;const steel=b.type==='steel',color=steel?'#5d6d87':b.color;
  ctx.globalAlpha=b.hp<b.maxHp?.65:1;rounded(b.x,b.y,b.w,b.h,4,color);ctx.globalAlpha=1;rounded(b.x+3,b.y+2,b.w-6,2,1,steel?'#9eafc2':'#ffffff60');
  if(steel){ctx.strokeStyle='#293c58';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x+9,b.y+5);ctx.lineTo(b.x+17,b.y+15);ctx.moveTo(b.x+b.w-17,b.y+5);ctx.lineTo(b.x+b.w-9,b.y+15);ctx.stroke();}
  if(b.type==='armor'){ctx.fillStyle='#10223a';for(let i=0;i<b.hp;i++)ctx.fillRect(b.x+b.w/2-5+i*7,b.y+9,3,3);}
 }
 if(state!==S.TITLE){
  if(game.shield){ctx.shadowColor='#a995ff';ctx.shadowBlur=settings.reduced?0:15;rounded(C.LEFT,C.H-22,C.RIGHT-C.LEFT,3,1,'#a995ff');ctx.shadowBlur=0;}
  ctx.shadowColor='#65f5da';ctx.shadowBlur=settings.reduced?0:18;rounded(game.paddle.x-game.paddle.w/2,C.PADDLE_Y,game.paddle.w,C.PADDLE_H,8,'#65f5da');ctx.shadowBlur=0;rounded(game.paddle.x-game.paddle.w/2+10,C.PADDLE_Y+3,game.paddle.w-20,3,2,'#d6fff3');
  for(const b of balls){if(!settings.reduced)b.trail.forEach((p,i)=>{ctx.globalAlpha=i/b.trail.length*.22;ctx.fillStyle='#84e9ff';ctx.beginPath();ctx.arc(p.x,p.y,C.R*i/b.trail.length,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;ctx.shadowColor='#9beaff';ctx.shadowBlur=settings.reduced?0:16;ctx.fillStyle='#efffff';ctx.beginPath();ctx.arc(b.x,b.y,C.R,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  for(const d of drops){rounded(d.x-14,d.y-12,28,24,6,'#193e4b');ctx.strokeStyle='#65f5da';ctx.strokeRect(d.x-14,d.y-12,28,24);ctx.font='20px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#b9ffeb';ctx.fillText(powerInfo[d.type].icon,d.x,d.y);}
  if(!settings.reduced)for(const p of particles){ctx.globalAlpha=p.life/p.max;rounded(p.x-2,p.y-2,4,4,1,p.color);}ctx.globalAlpha=1;
  if(state===S.READY){ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='12px system-ui';ctx.fillStyle='#8eabc5';ctx.fillText('SPACE / TAP TO LAUNCH',game.paddle.x,C.PADDLE_Y+43);ctx.setLineDash([4,7]);ctx.strokeStyle='#65f5da55';ctx.beginPath();ctx.moveTo(game.paddle.x,C.PADDLE_Y-24);ctx.lineTo(game.paddle.x,C.PADDLE_Y-84);ctx.stroke();ctx.setLineDash([]);}
 }
}
function pointerPosition(e){const rect=canvas.getBoundingClientRect();targetX=clamp((e.clientX-rect.left)*C.W/rect.width,C.LEFT,C.RIGHT);}
canvas.addEventListener('pointerdown',e=>{if(state!==S.READY&&state!==S.PLAYING)return;e.preventDefault();pointerDown=true;pointerPosition(e);canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
canvas.addEventListener('pointermove',e=>{if((state===S.READY||state===S.PLAYING)&&(e.pointerType==='mouse'||pointerDown))pointerPosition(e);});
canvas.addEventListener('pointerup',e=>{if(!pointerDown)return;pointerPosition(e);pointerDown=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);launch();});
canvas.addEventListener('pointercancel',()=>{pointerDown=false;});
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement)return;
 const key=e.key.length===1?e.key.toLowerCase():e.key;
 if(['ArrowLeft','ArrowRight','a','d'].includes(key)&&[S.READY,S.PLAYING].includes(state)){e.preventDefault();keys.add(key);}
 if(e.repeat)return;
 if(key==='p'||key==='Escape'){if([S.READY,S.PLAYING,S.PAUSED].includes(state)){e.preventDefault();pause();}}
 if(e.code==='Space'&&[S.READY,S.PLAYING].includes(state)){e.preventDefault();launch();}
});
window.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('blur',()=>{keys.clear();if(state===S.PLAYING||state===S.READY)pause();});
document.addEventListener('visibilitychange',()=>{last=performance.now();accumulator=0;if(document.hidden&&(state===S.PLAYING||state===S.READY))pause();});
bind('pause',pause);
let hudElapsed=0;
function frame(now){const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;accumulator+=dt;while(accumulator>=C.STEP){accumulator-=C.STEP;update(C.STEP);}hudElapsed+=dt;if(hudElapsed>=.05){updateHud();hudElapsed=0;}draw();requestAnimationFrame(frame);}
showTitle();requestAnimationFrame(frame);
