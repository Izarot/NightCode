// Rhythm Slice: Katana Fruit - Minimal Implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;});

// Palette
const COLORS = {bg:'#0f0c29', fruit:'#ff2a6d', melon:'#00f3ff', pine:'#ffd700', bomb:'#ff006e', katana:'#00ffea', text:'#ffffff'};

// Audio
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function playSound(freq=200, dur=0.1, type='sine'){
 const o=audioCtx.createOscillator(); const g=audioCtx.createGain();
 o.type=type; o.frequency.value=freq; o.connect(g); g.connect(audioCtx.destination);
 o.start(); g.gain.exponentialRampToValueAtTime(0.001,dur); o.stop(audioCtx.currentTime+dur);
}

// Game state
let score=0, combo=0, highScore=parseInt(localStorage.getItem('highScore'))||0;
let fruits=[], particles=[], mouse={x:0,y:0}, lastPos=[], slashing=false;
let startTime=performance.now(), lastTime=0;
let spawnTimer=0;

// Input
canvas.addEventListener('mousemove', e=>{const r=canvas.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;lastPos.push({x:mouse.x,y:mouse.y});if(lastPos.length>5)lastPos.shift();});
canvas.addEventListener('mousedown', e=>{slashing=true;playSound(300,0.05,'square');});
canvas.addEventListener('mouseup', e=>{slashing=false;});

// Fruit class
class Fruit{
 constructor(type){
 this.type=type; this.x=Math.random()*W; this.y=-30;
 this.vx=(Math.random()-0.5)*4; this.vy=120+Math.random()*80;
 this.size=20+Math.random()*10;
 this.angle=0;
 this.points=type==='apple'?100:type==='melon'?200:type==='pineapple'?500:0;
 this.color=COLORS[type];
 }
 update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.angle+=dt*3;}
 draw(ctx){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(0,0,this.size,0,Math.PI*2);ctx.fill();ctx.restore();}
}

// Particle
class Particle{
 constructor(x,y,c){this.x=x;this.y=y;this.vx=(Math.random()-0.5)*4;this.vy=(Math.random()-0.5)*4;this.life=1;this.c=c;}
 update(dt){this.x+=this.vx; this.y+=this.vy; this.life-=dt*2;}
 draw(ctx){ctx.fillStyle=this.c;ctx.globalAlpha=this.life;ctx.fillRect(this.x,this.y,3,3);ctx.globalAlpha=1;}
}

// Slash detection
function checkSlash(){
 if(!slashing || lastPos.length<3) return;
 const p1=lastPos[lastPos.length-3], p2=lastPos[lastPos.length-2], p3=lastPos[lastPos.length-1];
 const dx=p3.x-p1.x, dy=p3.y-p1.y;
 const dist=Math.sqrt(dx*dx+dy*dy);
 const time=(lastPos.length-1)*16; // approx ms
 const vel=dist/(time/1000);
 if(vel<800) return;
 const angle=Math.atan2(dy,dx);
 // Check each fruit
 for(let i=fruits.length-1;i>=0;i--){
 const f=fruits[i];
 const fx=f.x-mouse.x, fy=f.y-mouse.y;
 const projX=fx*Math.cos(angle)+fy*Math.sin(angle);
 const projY=-fx*Math.sin(angle)+fy*Math.cos(angle);
 if(Math.abs(projY)<f.size+10 && projX>-20 && projX<40){
 // Hit!
 const pts=f.points;
 if(f.type==='bomb'){combo=0;playSound(80,0.2,'sawtooth');}else{score+=pts*(1+combo*0.1);combo++;playSound(200+f.type.charCodeAt(0),0.1,'triangle');}
 for(let j=0;j<10;j++)particles.push(new Particle(f.x,f.y,f.color));
 fruits.splice(i,1);
 }
 }
}

// Spawn fruits
function spawnFruit(){
 const types=['apple','apple','melon','pineapple','bomb'];
 const t=types[Math.floor(Math.random()*types.length)];
 fruits.push(new Fruit(t));
}

// Main loop
function loop(timestamp){
 const dt=(timestamp-lastTime)/1000; lastTime=timestamp;
 if(!dt||dt>0.1) return requestAnimationFrame(loop);
 
 // Update
 spawnTimer+=dt; if(spawnTimer>0.5){spawnFruit();spawnTimer=0;}
 for(const f of fruits)f.update(dt);
 for(let i=particles.length-1;i>=0;i;){const p=particles[i];p.update(dt);if(p.life<=0)particles.splice(i,1);}
 checkSlash();
 
 // Draw
 ctx.fillStyle=COLORS.bg; ctx.fillRect(0,0,W,H);
 for(const f of fruits)f.draw(ctx);
 for(const p of particles)p.draw(ctx);
 
 // UI
 document.getElementById('score').textContent=`Score: ${score.toLocaleString()}`;
 document.getElementById('combo').textContent=`Combo: ${combo}`;
 const elapsed=(timestamp-startTime)/1000;
 document.getElementById('timer').textContent=`Time: ${elapsed.toFixed(3)}`;
 
 // High score
 if(score>highScore){highScore=score;localStorage.setItem('highScore',highScore);} 
 
 requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
