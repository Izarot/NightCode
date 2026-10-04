const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
const tileSize=64;
const cols=3, rows=3;
let player={x:0,y:0,px:0,py:0,targetX:0,targetY:0,moving:false};
let moves=0;
let startTime=null;
let highScore=localStorage.getItem('mazeRotatorHighScore')||null;
let selected=null;
let rooms=[];
const dirs=[{dx:0,dy:-1},{dx:1,dy:0},{dx:0,dy:1},{dx:-1,dy:0}];
function initRooms(){
const base=[
[{r:0,c:0,doors:[true,false,true,false]}],
[{r:0,c:1,doors:[false,true,false,true]}],
[{r:0,c:2,doors:[true,false,false,true]}],
[{r:1,c:0,doors:[false,true,true,false]}],
[{r:1,c:1,doors:[true,true,false,true]}],
[{r:1,c:2,doors:[false,false,true,true]}],
[{r:2,c:0,doors:[true,false,false,true]}],
[{r:2,c:1,doors:[false,true,true,false]}],
[{r:2,c:2,doors:[true,true,false,false]}]
];
rooms=base.flat();}
function doorOpen(room,dir){
const idx=(room.rot+dir)%4;
return room.doors[idx];}
function canMoveTo(nx,ny){
if(nx<0||nx>=cols||ny<0||ny>=rows)return false;
const cur=rooms.find(r=>r.r===player.y&&r.c===player.x);
const next=rooms.find(r=>r.r===ny&&r.c===nx);
let d;
if(nx===player.x+1){d=1;}
else if(nx===player.x-1){d=3;}
else if(ny===player.y+1){d=2;}
else if(ny===player.y-1){d=0;}
else return false;
return doorOpen(cur,d)&&doorOpen(next,(d+2)%4);}
function findPath(){
const start=rooms.find(r=>r.r===0&&r.c===0);
const end=rooms.find(r=>r.r===rows-1&&r.c===cols-1);
const queue=[{r:0,c:0,path:[]}];
const visited=new Set();
visited.add('0,0');
while(queue.length){
const {r,c,path}=queue.shift();
if(r===rows-1&&c===cols-1)return path;
for(let d=0;d<4;d++){
const nr=r+dirs[d].dy,nc=c+dirs[d].dx;
if(nr<0||nr>=rows||nc<0||nc>=cols)continue;
const cur=rooms.find(r=>r.r===r&&r.c===c);
const nxt=rooms.find(r=>r.r===nr&&r.c===nc);
if(!doorOpen(cur,d)||!doorOpen(nxt,(d+2)%4))continue;
const key=`${nr},${nc}`;
if(!visited.has(key)){
visited.add(key);
queue.push({r:nr,c:nc,path:[...path,{r:nr,c:nc}]});
}
}
}
return null;}
function drawRoom(room){
const sx=room.c*tileSize;
const sy=room.r*tileSize;
ctx.save();
ctx.translate(sx+tileSize/2, sy+tileSize/2);
ctx.rotate(room.rot*Math.PI/2);
ctx.translate(-tileSize/2, -tileSize/2);
ctx.fillStyle=room.rot%2===0?'#8B4513':'#2F4F4F';
ctx.fillRect(0,0,tileSize,tileSize);
ctx.strokeStyle='#555';
ctx.lineWidth=2;
ctx.beginPath();
if(!doorOpen(room,0)){ctx.moveTo(0,0);ctx.lineTo(tileSize,0);}
if(!doorOpen(room,1)){ctx.moveTo(tileSize,0);ctx.lineTo(tileSize,tileSize);}
if(!doorOpen(room,2)){ctx.moveTo(tileSize,tileSize);ctx.lineTo(0,tileSize);}
if(!doorOpen(room,3)){ctx.moveTo(0,tileSize);ctx.lineTo(0,0);}
ctx.stroke();
ctx.fillStyle=doorOpen(room,0)?'#0f0':'#f00';
ctx.fillRect(tileSize/2-2,0,4,6);
ctx.fillStyle=doorOpen(room,1)?'#0f0':'#f00';
ctx.fillRect(tileSize-6,tileSize/2-2,6,4);
ctx.fillStyle=doorOpen(room,2)?'#0f0':'#f00';
ctx.fillRect(tileSize/2-2,tileSize-6,4,6);
ctx.fillStyle=doorOpen(room,3)?'#0f0':'#f00';
ctx.fillRect(0,tileSize/2-2,6,4);
ctx.restore();
if(room===selected){
ctx.strokeStyle='#ff0';
ctx.lineWidth=3;
ctx.strokeRect(room.c*tileSize,room.r*tileSize,tileSize,tileSize);
}}
}
function drawPlayer(){
const size=20;
ctx.fillStyle='#0ff';
ctx.beginPath();
ctx.arc(player.px,player.py,size,0,Math.PI*2);
ctx.fill();
}
function updateTimer(){
if(!startTime)return;
const elapsed=Date.now()-startTime;
const secs=Math.floor(elapsed/1000);
const mins=String(Math.floor(secs/60)).padStart(2,'0');
const secsStr=String(secs%60).padStart(2,'0');
document.getElementById('timer').textContent=`${mins}:${secsStr}`;
}
function playRotateSound(){
const ctx=new (window.AudioContext||window.webkitAudioContext)();
const osc=ctx.createOscillator();
const gain=ctx.createGain();
osc.type='square';
osc.frequency.setValueAtTime(440,ctx.currentTime);
osc.frequency.exponentialRampToValueAtTime(220,ctx.currentTime+0.1);
gain.gain.setValueAtTime(0,ctx.currentTime);
gain.gain.linearRampToValueAtTime(0.2,ctx.currentTime+0.01);
gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.1);
osc.connect(gain).connect(ctx.destination);
osc.start();
osc.stop(ctx.currentTime+0.15);}
function loop(){
ctx.clearRect(0,0,canvas.width,canvas.height);
rooms.forEach(drawRoom);
drawPlayer();
document.getElementById('moves').textContent=`Moves: ${moves}`;
const path=findPath();
const statusEl=document.getElementById('status');
if(path){
statusEl.textContent='Path Found';
statusEl.style.color='#0f0';
if(player.x===cols-1&&player.y===rows-1){
if(!startTime)startTime=Date.now();
const elapsed=Date.now()-startTime;
const high=highScore?parseInt(highScore):Infinity;
if(moves<high){
highScore=moves;
localStorage.setItem('mazeRotatorHighScore',highScore);
}
setTimeout(()=>alert(`Victory! Moves:${moves} Time:${Math.floor(elapsed/1000)}s`),100);
}}
}else{
statusEl.textContent='No Path';
statusEl.style.color='#f00';}
updateTimer();
requestAnimationFrame(loop);}
function resize(){
const size=Math.min(window.innerWidth,window.innerHeight)*0.9;
canvas.width=size;
canvas.height=size;
}
window.addEventListener('resize',resize);
window.addEventListener('load',()=>{
resize();
initRooms();
player.px=tileSize/2;
player.py=tileSize/2;
startTime=Date.now();
document.addEventListener('keydown',e=>{
if(e.key==='q'&&selected!==null){selected.rot=(selected.rot+3)%4;moves++;playRotateSound();}
if(e.key==='e'&&selected!==null){selected.rot=(selected.rot+1)%4;moves++;playRotateSound();}
});
canvas.addEventListener('click',e=>{
const rect=canvas.getBoundingClientRect();
const x=Math.floor((e.clientX-rect.left)/tileSize);
const y=Math.floor((e.clientY-rect.top)/tileSize);
if(x>=0&&x<cols&&y>=0&&y<rows){
selected=rooms.find(r=>r.r===y&&r.c===x);
}
});
setInterval(()=>{
if(player.moving){
const speed=10;
const dx=player.targetX-player.px;
const dy=player.targetY-player.py;
const dist=Math.hypot(dx,dy);
if(dist<speed){player.px=player.targetX;player.py=player.targetY;player.moving=false;}
else{player.px+=dx/dist*speed;player.py+=dy/dist*speed;}}
},30);
document.addEventListener('keydown',e=>{
if(player.moving)return;
let nx=player.x,ny=player.y;
if(e.key==='ArrowUp'){ny--;}
else if(e.key==='ArrowDown'){ny++;}
else if(e.key==='ArrowLeft'){nx--;}
else if(e.key==='ArrowRight'){nx++;}
else return;
if(canMoveTo(nx,ny)){
player.targetX=nx*tileSize+tileSize/2;
player.targetY=ny*tileSize+tileSize/2;
player.moving=true;
player.x=nx;player.y=ny;
}
});
});
loop();