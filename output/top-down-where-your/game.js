const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = document.getElementById('ui');
let w = canvas.width, h = canvas.height;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur, type='sine') {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.stop(audioCtx.currentTime + dur);
}

// Game state
const keys = {};
const trail = [];
const allies = [];
let car = {x:400,y:300,a:0,s:0,paint:100,paintType:0};
let startTime = 0;
let highScore = localStorage.getItem('highScore') || 0;
const colors = ['#FF6B6B','#4ECDC4','#FFE66D','#A8E6CF'];
const trailWidths = [10,14,12,8];

window.addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

function spawnAlly(x,y){allies.push({x,y,y:0,tx:0,a:Math.random()*Math.PI*2,s:1.2});}
for(let i=0;i<5;i++) spawnAlly(Math.random()*w, Math.random()*h);

function update(dt){
  const acc = keys['w']||keys['arrowup'];
  const brk = keys['s']||keys['arrowdown'];
  const lt = keys['a']||keys['arrowleft'];
  const rt = keys['d']||keys['arrowright'];
  const hb = keys[' '];

  if(acc) car.s += 0.3;
  else if(brk) car.s -= 0.5;
  else car.s *= 0.98;
  car.s = Math.max(-2, Math.min(4, car.s));

  let turn = 0;
  if(lt) turn -= 0.05;
  if(rt) turn += 0.05;
  if(hb) turn *= 1.5;
  car.a += turn;

  car.x += Math.cos(car.a)*car.s;
  car.y += Math.sin(car.a)*car.s;
  car.x = Math.max(0, Math.min(w, car.x));
  car.y = Math.max(0, Math.min(h, car.y));

  if(car.s>0.1 && car.paint>0){
    car.paint -= 0.05;
    trail.push({x:car.x,y:car.y,t:car.paintType,time:performance.now()});
    if(trail.length>2000) trail.shift();
    playSound(200 + car.s*50, 0.05, 'square');
  }
  if(car.paint<100 && !acc) car.paint += 0.1;
  car.paint = Math.max(0, Math.min(100, car.paint));

  // Update allies
  for(const al of allies){
    al.s = 1.2;
    // Simple follow car logic
    const dx = car.x - al.x;
    const dy = car.y - al.y;
    const dist = Math.hypot(dx,dy);
    if(dist < 150){
      al.x += dx/dist * al.s * 1.5;
      al.y += dy/dist * al.s * 1.5;
    } else {
      al.x += Math.cos(al.a)*al.s;
      al.y += Math.sin(al.a)*al.s;
      al.a += (Math.random()-0.5)*0.1;
    }
    al.x = Math.max(0, Math.min(w, al.x));
    al.y = Math.max(0, Math.min(h, al.y));
  }
}

function drawTrail(){
  if(trail.length<2) return;
  ctx.lineCap='round';
  for(let i=1;i<trail.length;i++){
    const p = trail[i], pp = trail[i-1];
    ctx.strokeStyle = colors[p.t] + '80';
    ctx.lineWidth = trailWidths[p.t];
    ctx.beginPath();
    ctx.moveTo(pp.x,pp.y);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
  }
}

function draw(){
  ctx.clearRect(0,0,w,h);
  drawTrail();

  // Draw allies
  for(const al of allies){
    ctx.fillStyle='#00f';
    ctx.beginPath();
    ctx.arc(al.x,al.y,8,0,Math.PI*2);
    ctx.fill();
  }

  // Draw car
  ctx.save();
  ctx.translate(car.x,car.y);
  ctx.rotate(car.a);
  ctx.fillStyle=colors[car.paintType];
  ctx.fillRect(-12,-8,24,16);
  ctx.restore();

  // UI
  ctx.fillStyle='#fff';
  ctx.font='16px sans-serif';
  ctx.fillText('Paint: '+Math.round(car.paint)+'%', 10, 30);
  const elapsed = ((performance.now()-startTime)/1000).toFixed(2);
  ctx.fillText('Time: '+elapsed+'s', 10, 50);
  ctx.fillText('High Score: '+highScore+'s', 10, 70);
}

let last = 0;
function loop(ts){
  if(!startTime) startTime = ts;
  const dt = (ts-last)/1000; last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize',()=>{w=canvas.width;h=canvas.height;});
requestAnimationFrame(loop);
