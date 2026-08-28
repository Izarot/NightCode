class Game{
constructor(){
this.canvas=document.getElementById('c');this.ctx=this.canvas.getContext('2d');
this.arena={w:1280,h:720};this.lastTime=0;this.dt=0;
this.state='MENU';this.chamber=1;this.score=0;this.highScore=parseInt(localStorage.getItem('vw_high')||'0');
this.player=null;this.enemies=[];this.bullets=[];this.shards=[];this.absorbedPatterns=[];
this.weaveTimer=0;this.weaveEnemy=null;this.damageFlash=0;this.startTime=0;this.elapsedTime=0;
}
formatTime(){const s=Math.floor(this.elapsedTime);return Math.floor(s/60).toString().padStart(2,'0')+':'+(s%60).toString().padStart(2,'0');}
init(){
InputSys.init(this.canvas);
this.canvas.addEventListener('click',()=>Audio.init());
this.canvas.addEventListener('mousedown',()=>Audio.resume());
this.canvas.addEventListener('touchstart',()=>Audio.resume(),{passive:false});
}
start(){
this.state='PLAYING';
this.player=new Player(this.arena);
this.enemies=[];this.bullets=[];this.shards=[];this.absorbedPatterns=[];
this.score=0;this.chamber=1;
this.startTime=performance.now();this.elapsedTime=0;
this.damageFlash=0;this.weaveTimer=0;this.weaveEnemy=null;
this.loadChamber(this.chamber);
}
loadChamber(n){
const c=CHAMBERS[n-1];
const margin=60;
let id=0;
for(const grp of c.enemies){
for(let i=0;i<grp.n;i++){
let x,y,tries=0;
do{const a=Math.random()*Math.PI*2;const r=200+Math.random()*200;x=this.arena.w/2+Math.cos(a)*r;y=this.arena.h/2+Math.sin(a)*r;if(x<margin||x>this.arena.w-margin||y<margin||y>this.arena.h-margin)continue;tries++;if(tries>20)break;}while(this.enemies.some(e=>Math.hypot(e.x-x,e.y-y)<80));
const e=new Enemy(x,y,grp.t);e.id=id++;this.enemies.push(e);
}
}
if(c.boss){const b=new Enemy(this.arena.w/2,150,'boss');b.id=id++;this.enemies.push(b);}
}
spawnShards(){
for(let e of this.enemies){if(e.dead){this.shards.push({x:e.x,y:e.y,pattern:e.pattern,enemyRef:e,timer:0});}}
}
tryAbsorbPattern(){
if(this.player.activePatterns.length>=3)return;
for(let s of this.shards){if(Math.hypot(s.x-this.player.x,s.y-this.player.y)<40){Audio.play('absorb');const p=PATTERNS[s.pattern];this.player.activePatterns.push(s.pattern);this.absorbedPatterns.push(s.pattern);if(this.absorbedPatterns.length>=5&&this.chamber>=5){this.state='GAME_OVER';this.win=true;}s.absorbed=true;ParticleSys.emit(s.x,s.y,p.color,30,200,0.8,3);return;}}
}
tryWeave(){
if(this.player.activePatterns.length<3||this.weaveTimer>0)return;
let nearest=null,nd=200;
for(let s of this.shards){const d=Math.hypot(s.x-this.player.x,s.y-this.player.y);if(d<nd){nd=d;nearest=s;}}
if(!nearest)return;
Audio.play('weave');this.weaveTimer=1.5;this.weaveEnemy={x:nearest.x,y:nearest.y,pattern:nearest.pattern,id:Date.now()};
}
nextChamber(){
this.chamber++;
if(this.chamber>CHAMBERS.length){this.state='GAME_OVER';this.win=true;Audio.play('win');return;}
this.player.activePatterns=[];
this.bullets=[];this.shards=[];this.enemies=[];
this.loadChamber(this.chamber);
this.player.hp=Math.min(this.player.maxHp,this.player.hp+1);
Audio.play('clear');
}
update(dt){
if(this.state==='MENU'){
if(InputSys.mouse.down||InputSys.touch.right){this.start();InputSys.mouse.down=false;}
return;
}
if(this.state==='GAME_OVER'){
if(InputSys.mouse.down||InputSys.touch.right){this.start();InputSys.mouse.down=false;}
return;
}
if(this.state==='PAUSED'){
if(InputSys.keys['escape']){this.state='PLAYING';InputSys.keys['escape']=false;}
return;
}
if(InputSys.keys['p']){this.state='PRACTICE';this.start();this.enemies=[];this.shards=[];for(let k in PATTERNS){this.shards.push({x:200+Math.random()*880,y:200+Math.random()*320,pattern:k,enemyRef:null,timer:0});}InputSys.keys['p']=false;}
this.elapsedTime=(performance.now()-this.startTime)/1000;
if(this.damageFlash>0)this.damageFlash-=dt;
const move=InputSys.getMove();
let canFire=true;
if(this.state==='WEAVE_STATE'){canFire=false;this.weaveTimer-=dt;if(this.weaveTimer<=0){this.state='PLAYING';}}
if(InputSys.keys['e']){this.tryAbsorbPattern();InputSys.keys['e']=false;}
if(InputSys.keys['q']){if(this.player.activePatterns.length>0){const f=this.player.activePatterns.shift();this.player.activePatterns.push(f);}InputSys.keys['q']=false;}
if(this.weaveEnemy&&this.state!=='WEAVE_STATE'&&this.player.activePatterns.length===3){
this.state='WEAVE_STATE';this.weaveTimer=1.5;
}
const wantsFire=this.player.update(dt,InputSys.keys,InputSys.mouse,this.arena,canFire);
this.player.x+=move.dx*320*dt*0.3;this.player.y+=move.dy*320*dt*0.3;
this.player.x=Math.max(this.player.size,Math.min(this.arena.w-this.player.size,this.player.x));
this.player.y=Math.max(this.player.size,Math.min(this.arena.h-this.player.size,this.player.y));
if(wantsFire&&this.player.activePatterns.length>0){
const pid=this.player.activePatterns[0];
PatternSys.firePattern(this.player.x,this.player.y,InputSys.mouse.x,InputSys.mouse.y,pid,this.bullets,null,true);
this.player.fireTimer=0.15;Audio.play('fire');
}
PatternSys.update(dt,this.player,this.enemies,this.bullets,ParticleSys.particles,this.arena,this.state==='WEAVE_STATE');
CollisionSys.check(this.player,this.enemies,this.bullets,ParticleSys,this.onHit.bind(this));
ParticleSys.update(dt);
this.spawnShards();
this.shards=this.shards.filter(s=>!s.absorbed);
if(this.state==='WEAVE_STATE'&&this.weaveEnemy){
for(let s of this.shards){if(s.pattern===this.weaveEnemy.pattern&&Math.hypot(s.x-this.player.x,s.y-this.player.y)<30){s.absorbed=true;this.score+=100;ParticleSys.emit(s.x,s.y,'#00ffff',40,300,1.0,4);}}
const we=this.weaveEnemy;
for(let e of this.enemies){if(e.dead||e.id===we.id)continue;const d=Math.hypot(e.x-we.x,e.y-we.y);if(d<200){e.hp-=dt*40;ParticleSys.emit(e.x+Math.random()*40-20,e.y+Math.random()*40-20,'#00ffff',2,100,0.3,2);if(e.hp<=0){e.dead=true;this.score+=e.score;ParticleSys.emit(e.x,e.y,e.color,30,200,0.8,3);}}}}
}
const alive=this.enemies.some(e=>!e.dead);
if(!alive){this.nextChamber();}
if(this.player.hp<=0){this.state='GAME_OVER';this.win=false;if(this.score>this.highScore){this.highScore=this.score;localStorage.setItem('vw_high',this.highScore);}document.getElementById('hs').textContent=this.highScore;Audio.play('lose');}
}
onHit(enemy){
if(enemy){this.score+=enemy.score;Audio.play('hit');if(this.score>this.highScore){this.highScore=this.score;localStorage.setItem('vw_high',this.highScore);document.getElementById('hs').textContent=this.highScore;}}else{this.damageFlash=0.4;Audio.play('hit');}
}
draw(){
const ctx=this.ctx;
ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,1280,720);
const grad=ctx.createRadialGradient(640,360,0,640,360,500);grad.addColorStop(0,'rgba(0,100,150,0.15)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,1280,720);
ctx.strokeStyle='rgba(0,217,255,0.15)';ctx.lineWidth=1;ctx.strokeRect(0,0,1280,720);
for(let i=0;i<this.shards.length;i++){const s=this.shards[i];const p=PATTERNS[s.pattern];s.timer+=0.016;ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle=p.color;ctx.shadowBlur=15+Math.sin(s.timer*4)*5;ctx.shadowColor=p.color;ctx.globalAlpha=0.5+Math.sin(s.timer*3)*0.3;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();}
for(let e of this.enemies){if(!e.dead)e.draw(ctx);}
for(let b of this.bullets)b.draw(ctx);
if(this.player)this.player.draw(ctx,this.state==='WEAVE_STATE'?Math.max(0,this.weaveTimer/1.5):0);
ParticleSys.draw(ctx);
if(this.state==='MENU'){UI.drawMenu(ctx,this);}
else if(this.state==='GAME_OVER'){UI.drawGameOver(ctx,this,this.win);}
else if(this.state==='PAUSED'){UI.drawPause(ctx,this);}
else{UI.drawHUD(ctx,this);}
}
loop(now){
if(!this.lastTime)this.lastTime=now;let dt=(now-this.lastTime)/1000;this.lastTime=now;dt=Math.min(dt,0.05);
this.update(dt);this.draw();requestAnimationFrame(t=>this.loop(t));
}
}
const game=new Game();game.init();requestAnimationFrame(t=>game.loop(t));