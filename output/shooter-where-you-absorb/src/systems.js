const InputSys={
keys:{},mouse:{x:0,y:0,down:false},touch:{left:null,right:null},
init(canvas){
window.addEventListener('keydown',e=>{this.keys[e.key.toLowerCase()]=true;if(e.key===' ')e.preventDefault();});
window.addEventListener('keyup',e=>{this.keys[e.key.toLowerCase()]=false;});
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();this.mouse.x=(e.clientX-r.left)*(1280/r.width);this.mouse.y=(e.clientY-r.top)*(720/r.height);});
canvas.addEventListener('mousedown',()=>{this.mouse.down=true;});
canvas.addEventListener('mouseup',()=>{this.mouse.down=false;});
canvas.addEventListener('touchstart',e=>{e.preventDefault();this.handleTouch(e);},{passive:false});
canvas.addEventListener('touchmove',e=>{e.preventDefault();this.handleTouch(e);},{passive:false});
canvas.addEventListener('touchend',e=>{e.preventDefault();this.handleTouch(e);},{passive:false});
},
handleTouch(e){
const r=c.getBoundingClientRect();
for(let t of e.changedTouches){
const x=(t.clientX-r.left)*(1280/r.width);
const y=(t.clientY-r.top)*(720/r.height);
if(x<640){this.touch.left={id:t.identifier,x,y};}
else{this.touch.right={id:t.identifier,x,y};this.mouse.x=x;this.mouse.y=y;}
}
this.touch.left=null;this.touch.right=null;
for(let t of e.touches){
const x=(t.clientX-r.left)*(1280/r.width);
const y=(t.clientY-r.top)*(720/r.height);
if(x<640){if(!this.touch.left)this.touch.left={id:t.identifier,x,y};}
else{if(!this.touch.right)this.touch.right={id:t.identifier,x,y};this.mouse.x=x;this.mouse.y=y;}
}
this.mouse.down=!!this.touch.right;
},
getMove(){
let dx=0,dy=0;
if(this.touch.left){dx=this.touch.left.x-640;dy=this.touch.left.y-360;const l=Math.hypot(dx,dy);if(l>20){dx/=l;dy/=l;}else{dx=0;dy=0;}}
if(!this.touch.left){if(this.keys['w']||this.keys['arrowup'])dy=-1;if(this.keys['s']||this.keys['arrowdown'])dy=1;if(this.keys['a']||this.keys['arrowleft'])dx=-1;if(this.keys['d']||this.keys['arrowright'])dx=1;if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;}}
return{dx,dy};
}
};
const ParticleSys={
particles:[],
emit(x,y,color,count=6,speed=100,life=0.5,size=2){
for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;const s=speed*(0.5+Math.random()*0.5);this.particles.push(new Particle(x,y,Math.cos(a)*s,Math.sin(a)*s,color,life*(0.5+Math.random()*0.5),size));}
},
update(dt){for(let p of this.particles)p.update(dt);this.particles=this.particles.filter(p=>!p.dead);},
draw(ctx){for(let p of this.particles)p.draw(ctx);}
};
const PatternSys={
firePattern(originX,originY,targetX,targetY,patternId,bullets,enemyRef,friendly=false){
const p=PATTERNS[patternId];const baseAngle=Math.atan2(targetY-originY,targetX-originX);const step=p.count>1?p.spread/(p.count-1):0;const start=baseAngle-p.spread/2;
for(let i=0;i<p.count;i++){const a=start+step*i;bullets.push(new Bullet(originX,originY,Math.cos(a)*p.speed,Math.sin(a)*p.speed,p.color,4,friendly,p.lifetime));}
},
update(dt,player,enemies,bullets,particles,arena,weaveActive){
for(let e of enemies){if(e.dead)continue;const t=enemies.find(x=>x===e);const tgt=weaveActive?{x:player.x,y:player.y-100}:player;if(e.update(dt,tgt,arena)){this.firePattern(e.x,e.y,tgt.x,tgt.y,e.pattern,bullets,e);Audio.play('enemy');}}
for(let b of bullets)b.update(dt);
for(let i=bullets.length-1;i>=0;i--){if(bullets[i].dead||bullets[i].x<-20||bullets[i].x>arena.w+20||bullets[i].y<-20||bullets[i].y>arena.h+20)bullets.splice(i,1);}
}
};
const CollisionSys={
dist2(a,b){const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy;},
check(player,enemies,bullets,particles,onHit){
if(player.invuln<=0){
for(let e of enemies){if(e.dead)continue;if(this.dist2(player,e)<(player.size+e.size)**2){player.hp--;player.invuln=1.5;player.flash=0.2;onHit();break;}}
}
for(let b of bullets){if(b.friendly)continue;if(this.dist2(player,b)<(player.size+b.size)**2){b.dead=true;if(player.invuln<=0){player.hp--;player.invuln=1.5;player.flash=0.2;particles.emit(player.x,player.y,'#ff0044',12,200,0.6,3);onHit();}}}
for(let e of enemies){if(e.dead)continue;for(let b of bullets){if(!b.friendly)continue;if(this.dist2(e,b)<(e.size+b.size)**2){b.dead=true;e.hp--;particles.emit(b.x,b.y,b.color,5,80,0.3,2);if(e.hp<=0){e.dead=true;particles.emit(e.x,e.y,e.color,20,150,0.8,3);onHit(e);}break;}}}
}
};