// Scale‑Solver core logic
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let canvasWidth=800,canvasHeight=600;
function resize(){
  const w=window.innerWidth, h=window.innerHeight;
  const aspect=canvasWidth/canvasHeight;
  let newW=w, newH=h;
  if(w/h>aspect){newW=h*aspect}else{newH=w/aspect}
  canvas.style.width=newW+'px';
  canvas.style.height=newH+'px';
}
window.addEventListener('resize',resize);resize();
// Audio setup
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playTone(freq,dur){const osc=audioCtx.createOscillator();osc.frequency.value=freq;osc.type='sine';osc.connect(audioCtx.destination);osc.start();setTimeout(()=>osc.stop(),dur);}
// Game data
const levels=[{id:1,objects:[{id:'box1',weight:10,shape:'rect'},{id:'sphere1',weight:5,shape:'circle'},{id:'multiplier1',weight:0,shape:'rect',special:'multiplier'},{id:'reducer1',weight:0,shape:'rect',special:'reducer'},{id:'balancer1',weight:0,shape:'rect',special:'balancer'}],maxCapacity:50,tiltThreshold:5,timeLimit:120}];
let currentLevel=levels[0];
let pool=currentLevel.objects.map(o=>({...o}));
let placed=[];
let dragging=null;
let moves=0;
let timer=0;let timerInterval=null;
let highScore=localStorage.getItem('scaleSolverHighScore')||0;
// Input handling
canvas.addEventListener('pointerdown',e=>{const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;for(let i=pool.length-1;i>=0;i--){const o=pool[i];const ox=o.x||-100,oy=o.y||-100;const w=40,h=40; if(x>=ox&&x<=ox+w&&y>=oy&&y<=oy+h){dragging=o;dragging.offsetX=x-ox;dragging.offsetY=y-oy;break;}}});
canvas.addEventListener('pointermove',e=>{if(dragging){const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;dragging.x=x-dragging.offsetX;dragging.y=y-dragging.offsetY;}});
canvas.addEventListener('pointerup',e=>{if(dragging){const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left;const y=e.clientY-rect.top;const pan=determinePan(x,y);if(pan){placeObject(dragging,pan);}else{dragging.x=-100;dragging.y=-100;}dragging=null;}});
function determinePan(x,y){const cx=canvasWidth/2,cy=canvasHeight/2;const leftX=cx-200, rightX=cx+200;const panY=cy+50; if(x>=leftX-40&&x<=leftX+40&&y>=panY&&y<=panY+40)return 'left'; if(x>=rightX-40&&x<=rightX+40&&y>=panY&&y<=panY+40)return 'right'; return null;}
function placeObject(obj,pan){const weight=obj.weight;let total=0;placed.forEach(p=>{if(p.pan===pan){total+=p.weight;}});if(total+weight>currentLevel.maxCapacity){playTone(200,200);return;}obj.pan=pan;obj.x=pan==='left'?canvasWidth/2-200-20:canvasWidth/2+200-20;obj.y=canvasHeight/2+50;placed.push(obj);pool=pool.filter(o=>o!==obj);moves++;playTone(400,100);checkSpecial(obj);checkBalance();}
function checkSpecial(obj){if(obj.special==='multiplier'){placed.forEach(p=>{if(p.pan===obj.pan){p.weight*=2;}});}if(obj.special==='reducer'){placed.forEach(p=>{if(p.pan===obj.pan){p.weight/=2;}});}if(obj.special==='balancer'){checkBalance(true);}}
function checkBalance(force=false){const left=placed.filter(p=>p.pan==='left').reduce((s,p)=>s+p.weight,0);const right=placed.filter(p=>p.pan==='right').reduce((s,p)=>s+p.weight,0);const diff=Math.abs(left-right);const angle=0.02*diff;const maxAngle=Math.PI/6;if(diff>currentLevel.tiltThreshold){fail('Tip');return;}if(diff===0||force){win();return;}}
function win(){clearInterval(timerInterval);const score=Math.max(0,1000-(moves*10));if(score>highScore){highScore=score;localStorage.setItem('scaleSolverHighScore',highScore);}alert('Level Complete! Score: '+score+'\nMoves: '+moves+'\nTime: '+Math.floor(timer)+'s');resetLevel();}
function fail(reason){clearInterval(timerInterval);alert('Level Failed: '+reason);resetLevel();}
function resetLevel(){placed=[];pool=currentLevel.objects.map(o=>({...o}));moves=0;timer=0;timerInterval=setInterval(()=>{timer++;},1000);}
resetLevel();
// Render loop
function draw(){ctx.clearRect(0,0,canvasWidth,canvasHeight);
// Background
ctx.fillStyle='#e0f7fa';ctx.fillRect(0,0,canvasWidth,canvasHeight);
// Scale arm
const cx=canvasWidth/2,cy=canvasHeight/2;ctx.save();ctx.translate(cx,cy);const left=placed.filter(p=>p.pan==='left').reduce((s,p)=>s+p.weight,0);const right=placed.filter(p=>p.pan==='right').reduce((s,p)=>s+p.weight,0);const diff=left-right;const angle=0.02*diff;ctx.rotate(angle);ctx.fillStyle='#37474f';ctx.fillRect(-200,0,400,10);ctx.restore();
// Pans
ctx.fillStyle='#263238';ctx.fillRect(cx-200-40,cy+50,80,40);ctx.fillRect(cx+200-40,cy+50,80,40);
// Objects on pans
placed.forEach(o=>{ctx.fillStyle=o.special?'#ff8a65':'#ffeb3b';ctx.beginPath();if(o.shape==='rect'){ctx.rect(o.x,o.y,40,40);}else{ctx.arc(o.x+20,o.y+20,20,0,Math.PI*2);}ctx.fill();ctx.fillStyle='#000';ctx.font='12px sans-serif';ctx.fillText(o.weight+''||'X',o.x+10,o.y+25);});
// Pool objects
pool.forEach((o,i)=>{const x=20+ (i%5)*50;const y=canvasHeight-80;ctx.fillStyle=o.special?'#ff8a65':'#ffeb3b';ctx.beginPath();if(o.shape==='rect'){ctx.rect(x,y,40,40);}else{ctx.arc(x+20,y+20,20,0,Math.PI*2);}ctx.fill();ctx.fillStyle='#000';ctx.font='12px sans-serif';ctx.fillText(o.weight+''||'X',x+10,y+25);});
// HUD
ctx.fillStyle='#000';ctx.font='18px sans-serif';ctx.fillText('Score: '+highScore,10,30);ctx.fillText('Moves: '+moves,10,55);ctx.fillText('Time: '+Math.floor(timer)+'s',10,80);}
function loop(){draw();requestAnimationFrame(loop);}loop();