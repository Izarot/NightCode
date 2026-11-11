const canvas=document.getElementById('gameCanvas');const ctx=canvas.getContext('2d');let dpr=window.devicePixelRatio||1;function resize(){canvas.width=window.innerWidth*dpr;canvas.height=window.innerHeight*dpr;ctx.scale(dpr,dpr)}window.addEventListener('resize',resize);resize();
const lanes=4;const laneWidth=Math.min(window.innerWidth/lanes,100);const laneHeight=window.innerHeight*0.8;const targetY=window.innerHeight*0.75;const colors=['#00ffff','#00bfff','#ff00ff','#00ff80'];const keys=['KeyQ','KeyW','KeyE','KeyR'];
let notes=[];let score=0;let combo=0;let energy=100;let highScore=parseInt(localStorage.getItem('luminaHighScore')||'0');let startTime=0;let gameOver=false;let audioCtx=null;
function initAudio(){if(!audioCtx){audioCtx=new (window.AudioContext||window.webkitAudioContext)()}}
function playTone(freq,type='sine',dur=0.1){initAudio();const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.frequency.value=freq;o.type=type;g.gain.value=0.1;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}
function spawnNote(lane){notes.push({x:window.innerWidth+50,lane,hit:false,time:Date.now()})}
function gameLoop(ts){if(!startTime)startTime=ts;const dt=ts-startTime;ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
// lanes
for(let i=0;i<lanes;i++){const x=i*laneWidth+laneWidth/2;ctx.strokeStyle=colors[i];ctx.lineWidth=3;ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(x,targetY-laneHeight/2);ctx.lineTo(x,targetY+laneHeight/2);ctx.stroke();ctx.setLineDash([]);
// target zone
ctx.fillStyle=colors[i]+'44';ctx.beginPath();ctx.arc(x,targetY,40,0,Math.PI*2);ctx.fill()}
// speedrun timer
ctx.fillStyle='#ffd700';ctx.font='24px Orbitron';ctx.fillText(`Time: ${(dt/1000).toFixed(2)}s`,20,40);
// energy bar
ctx.fillStyle='#333';ctx.fillRect(20,60,200,20);ctx.fillStyle=energy>50?'#00ff80':energy>20?'#ffd700':'#ff6b6b';ctx.fillRect(20,60,2*energy,20);ctx.strokeStyle='#fff';ctx.strokeRect(20,60,200,20);
// score & combo
ctx.fillStyle='#fff';ctx.font='20px Orbitron';ctx.fillText(`Score: ${score}`,window.innerWidth-180,40);ctx.fillStyle='#ffd700';ctx.fillText(`Combo: x${combo}`,window.innerWidth-180,70);
// high score
ctx.fillStyle='#666';ctx.font='16px Orbitron';ctx.fillText(`Best: ${highScore}`,window.innerWidth-180,100);
// notes
const noteSpeed=300; // px/s
for(let i=notes.length-1;i>=0;i--){const n=notes[i];n.x-=noteSpeed*(1/60);const laneX=n.lane*laneWidth+laneWidth/2;const dist=Math.abs(n.x-laneX);
if(!n.hit&&dist<40){// auto-hit if missed
  n.hit=true;energy-=5;combo=0;playTone(100,'square',0.2)}
if(n.x<-50){notes.splice(i,1);continue}
ctx.fillStyle=colors[n.lane];ctx.shadowColor=colors[n.lane];ctx.shadowBlur=15;ctx.beginPath();ctx.roundRect(n.x-15,targetY-15,30,30,8);ctx.fill();ctx.shadowBlur=0}
// input handling
if(energy<=0&&!gameOver){gameOver=true;ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,window.innerWidth,window.innerHeight);ctx.fillStyle='#ff6b6b';ctx.font='48px Orbitron';ctx.textAlign='center';ctx.fillText('GAME OVER',window.innerWidth/2,window.innerHeight/2);ctx.font='24px Orbitron';ctx.fillStyle='#fff';ctx.fillText(`Final Score: ${score}`,window.innerWidth/2,window.innerHeight/2+50);if(score>highScore){highScore=score;localStorage.setItem('luminaHighScore',highScore);ctx.fillStyle='#ffd700';ctx.fillText('NEW HIGH SCORE!',window.innerWidth/2,window.innerHeight/2+100)}return}
requestAnimationFrame(gameLoop)}
window.addEventListener('keydown',e=>{const idx=keys.indexOf(e.code);if(idx>=0){hitLane(idx)}});
canvas.addEventListener('pointerdown',e=>{const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left;const idx=Math.floor(x/laneWidth);if(idx>=0&&idx<lanes)hitLane(idx)});
function hitLane(idx){initAudio();const laneX=idx*laneWidth+laneWidth/2;let best=null,bestDist=Infinity;for(const n of notes){if(n.hit)continue;const d=Math.abs(n.x-laneX);if(d<bestDist){bestDist=d;best=n}}if(best&&bestDist<60){best.hit=true;const offset=bestDist;let pts=0;if(offset<20){pts=300;combo++;energy=Math.min(100,energy+2);playTone(880,'sine',0.1)}else if(offset<40){pts=100;combo+=0.5;energy=Math.min(100,energy+1);playTone(440,'sine',0.1)}else{pts=0;combo=0;energy-=5;playTone(100,'square',0.2)}score+=Math.floor(pts*(1+combo/10))}}
// procedural note spawning
setInterval(()=>{if(!gameOver)spawnNote(Math.floor(Math.random()*lanes))},500);
requestAnimationFrame(gameLoop);