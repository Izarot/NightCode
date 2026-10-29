const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const timerEl=document.getElementById('timer'),scoreEl=document.getElementById('score'),stabEl=document.getElementById('stability'),overlay=document.getElementById('overlay'),finalScoreEl=document.getElementById('finalScore');
let W=800,H=600;canvas.width=W;canvas.height=H;
function resize(){const c=document.getElementById('game-container');const r=c.getBoundingClientRect();const s=Math.min(r.width/W,r.height/H);canvas.style.width=W*s+'px';canvas.style.height=H*s+'px';}window.onresize=resize;resize();
const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();
function snd(f,t){if(ac.state==='suspended')ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.setValueAtTime(f,ac.currentTime);o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(0.1,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.1);o.start();o.stop(ac.currentTime+0.1);}
let score=0,highScore=localStorage.getItem('cs_high')||0,start=Date.now(),over=false,cx=W/2,hy=50,state='idle',held=null,blocks=[];
const cols=['#00f2ff','#ff00ff','#00ff41','#ffff00','#ff6b00'];
class B{constructor(x,y,w,h,c){this.x=x;this.y=y;this.w=w;this.h=h;this.c=c;this.f=0;this.vy=0;this.col=cols[Math.floor(Math.random()*cols.length)]}draw(){ctx.fillStyle=this.col;ctx.fillRect(this.x,this.y,this.w,this.h);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(this.x+this.w/2+this.c,this.y+this.h/2,3,0,Math.PI*2);ctx.fill()}update(){if(this.f){this.vy+=0.5;this.y+=this.vy;}}}
function spawn(){const w=40+Math.random()*40;const c=(Math.random()-0.5)*30;blocks.push(new B(W/2-w/2,-40,w,40,c));}
spawn();
function place(){if(!held)return;const b=held;b.y=hy+10;blocks.push(b);held=null;state='idle';hy=50;score++;snd(400,'sine');check();}
function check(){for(let i=blocks.length-1;i>0;i--){const t=blocks[i],bo=blocks[i-1];if(t.y+t.h<=bo.y+5){const cxw=t.x+t.w/2+t.c;if(cxw<bo.x-5||cxw>bo.x+bo.w+5){t.f=true;snd(100,'sawtooth');setTimeout(()=>{over=true;overlay.classList.remove('hidden');finalScoreEl.textContent=score;if(score>highScore){highScore=score;localStorage.setItem('cs_high',highScore);}scoreEl.textContent=`Score: ${score} | Best: ${highScore}`;},300);}}}}
function loop(){if(over)return;ctx.clearRect(0,0,W,H);
const t=((Date.now()-start)/1000).toFixed(1);timerEl.textContent=`Time: ${t}s`;
scoreEl.textContent=`Score: ${score} | Best: ${highScore}`;
ctx.fillStyle='#333';ctx.fillRect(cx-5,0,10,100);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,100);ctx.lineTo(cx,hy);ctx.stroke();
ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(cx,hy,6,0,Math.PI*2);ctx.fill();
blocks.forEach(b=>{b.update();b.draw();});
if(held){held.x=cx-held.w/2;held.y=hy-40;held.draw();}
requestAnimationFrame(loop);}
loop();
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();cx=((e.clientX-r.left)/(r.width/W));cx=Math.max(40,Math.min(W-40,cx));});
canvas.addEventListener('pointerdown',()=>{if(state==='idle'&&!held){state='down';}else if(state==='holding'){place();}});
setInterval(()=>{if(state==='down'){hy+=2;if(hy>H-100&&blocks.length>0){state='holding';held=blocks.pop();snd(600,'square');}}else if(state==='holding'){hy-=2;if(hy<50){hy=50;state='idle';}}},16);