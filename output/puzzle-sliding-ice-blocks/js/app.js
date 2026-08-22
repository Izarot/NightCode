const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
function resize(){canvas.width=window.innerWidth*0.9;canvas.height=window.innerHeight*0.8;}
window.addEventListener('resize',resize);
resize();
const level=window.levelData||{player:{x:100,y:100},blocks:[{x:200,y:100}],targets:[{x:300,y:100}]};
let player=level.player;
let blocks=level.blocks.map(b=>({x:b.x,y:b.y}));
let targets=level.targets.map(t=>({x:t.x,y:t.y}));
let blockCounter=0;
let levelNum=1;
let startTime=Date.now();
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#0a0f2c';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#fff';
  ctx.font='16px monospace';
  ctx.fillText('Level '+levelNum+'/5',10,30);
  ctx.fillText(blockCounter+'/5',10,60);
  ctx.fillStyle='#fff';
  ctx.fillRect(player.x,player.y,16,16);
  blocks.forEach(b=>{ctx.fillStyle='#60c0ff';ctx.fillRect(b.x,b.y,16,16);});
  targets.forEach(t=>{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(t.x+8,t.y+8,8,0,Math.PI*2);ctx.fill();});
  requestAnimationFrame(draw);
}
window.addEventListener('keydown',e=>{
  const k=e.key;
  if(k==='ArrowUp'||k==='w')move(0,-1);
  else if(k==='ArrowDown'||k==='s')move(0,1);
  else if(k==='ArrowLeft'||k==='a')move(-1,0);
  else if(k==='ArrowRight'||k==='d')move(1,0);
});
function move(dx,dy){
  const nx=player.x+dx*16;
  const ny=player.y+dy*16;
  if(!blocks.some(b=>b.x===nx&&b.y===ny)){
    player.x=nx;player.y=ny;
  }else{
    const bx=blocks.find(b=>b.x===nx&&b.y===ny);
    let sx=bx.x,sy=bx.y;
  }
  playSound('move');
}
function playSound(name){
  if(window.sounds?.[name])window.sounds[name].play();
}
function checkCompletion(){
  if(blocks.every(b=>targets.some(t=>t.x===b.x&&t.y===b.y))){
    blockCounter++;
    document.getElementById('counter').textContent=blockCounter+'/5';
    if(blockCounter===5){
      document.getElementById('restart').style.display='block';
    }
  }
}
document.getElementById('restart').addEventListener('click',()=>{location.reload();});
checkCompletion();
draw();