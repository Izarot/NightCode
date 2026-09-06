const Game={
keys:new Set(),state:'start',t:0,level:1,lives:3,startTime:0,mazeStartTime:0,m:null,p:null,trapList:[],audio:null,
init(){
Renderer.init();this.audio=this.makeAudio();
this.bind();
this.newMaze();
this.loop(0)
},
bind(){
window.addEventListener('keydown',e=>{this.keys.add(e.key.toLowerCase());if(this.state==='start'){this.state='playing';this.startTime=performance.now()/1000;this.mazeStartTime=this.startTime;document.getElementById('overlay').style.display='none'}else if(this.state==='gameover'&&e.key===' '){this.restart()}else if(e.key.toLowerCase()==='r'){this.restart()}else if(e.key.toLowerCase()==='n'){this.newMaze()}});
window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()))
},
makeAudio(){
let ctx=null;try{ctx=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}
return{ctx,beep(f,d,v){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;g.gain.value=v||0.05;o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+(d||0.05))},startDrone(){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=55;g.gain.value=0.02;o.connect(g);g.connect(ctx.destination);o.start();this.drone=o}}}
,
newMaze(){
this.m=new Maze(Date.now()|0);
this.p=new Player(CELL/2,CELL/2);
this.m.traps.forEach(t=>{t.ax=t.x;t.ay=t.y;t.bx=t.x+(this.m.cells[0]?0:0);t.by=t.y;t.cx=t.x;t.cy=t.y;t.t=0;t.ang=t.ang||0});
this.mazeStartTime=performance.now()/1000
},
restart(){
this.lives=3;this.state='playing';this.startTime=performance.now()/1000;this.newMaze();document.getElementById('overlay').style.display='none'
},
update(dt){
if(this.state!=='playing')return;
const wasMoving=this.keys.size>0;this.p.update(dt,this.keys);Physics.slide(this.p,this.m);Physics.applyFriction(this.p,dt);
this.m.traps.forEach(tr=>{
if(tr.type==='patrol'){const tt=(tr.t||0)+dt*0.5;const seg=Math.abs(tr.bx-tr.ax);tr.x=tr.ax+Math.cos(tt*3)*seg;tr.y=tr.ay}else{tr.ang=(tr.ang||0)+dt*1.5;tr.x=tr.cx+Math.cos(tr.ang)*tr.r;tr.y=tr.cy+Math.sin(tr.ang)*tr.r}
if(Utils.dist(this.p,tr)<14){this.die()}
});
const ex=(this.m.end.x+0.5)*CELL,ey=(this.m.end.y+0.5)*CELL;if(Utils.dist(this.p,{x:ex,y:ey})<16){this.win()}
},
die(){
if(this.state!=='playing')return;this.lives--;this.audio.beep(80,0.3,0.15);this.state='this.state==='gameover';const o=document.getElementById('overlay');document.getElementById('overlayText').innerHTML='GAME OVER<br><br>TIME: '+(performance.now()/1000-this.startTime).toFixed(1)+'s<br><br>PRESS SPACE';o.style.display='block';
if(this.lives<=0){this.state='gameover';const hs=parseFloat(localStorage.getItem('nl_hi')||'0');const cur=performance.now()/1000-this.startTime;if(cur>hs)localStorage.setItem('nl_hi',cur.toFixed(1))}
},
win(){
this.audio.beep(880,0.2);setTimeout(()=>this.audio.beep(1320,0.2),100);this.level++;this.newMaze()
},
loop(ts){
const now=ts/1000;const dt=Math.min(0.05,now-this.t);this.t=now;
this.update(dt);Renderer.updateCamera(this.p,this.m);Renderer.ctx.fillStyle='#050505';Renderer.ctx.fillRect(0,0,960,640);Renderer.drawWalls(this.m);Renderer.drawExit(this.m,this.t);Renderer.drawTraps(this.m,this.t);Renderer.drawPlayer(this.p,this.t);
const elapsed=this.state==='playing'?now-this.mazeStartTime:0;const hs=parseFloat(localStorage.getItem('nl_hi')||'0');Renderer.drawHUD(elapsed,this.level,this.lives,hs);
if(this.state==='gameover')Renderer.flash('#ff0055');if(this.state==='win')Renderer.flash('#ffd700');
requestAnimationFrame(t=>this.loop(t))
}
};
window.addEventListener('load',()=>Game.init());