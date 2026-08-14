class ObjectPool{
  constructor(createFn, resetFn, initialSize=50){
    this.createFn=createFn;
    this.resetFn=resetFn;
    this.pool=[];
    for(let i=0;i<initialSize;i++) this.pool.push(this.createFn());
  }
  get(){n=this.pool.pop()||this.createFn();return n;
  }
  release(obj){this.resetFn(obj);this.pool.push(obj);}
}
class PhysicsEngine{
  constructor(){this.g=0.5;this.dt=1/120;}
  update(e,dt){e.vx*=Math.pow(0.98,this.dt);e.vy*=Math.pow(0.98,this.dt);e.x+=e.vx*dt;e.y+=e.vy*dt;}
}
class Player{
  constructor(){this.x=0;this.y=0;this.vx=0;this.vy=0;this.r=12;this.health=100;this.angle=0;this.aimSmooth=0.15;}
}
class Projectile{
  constructor(){this.x=0;this.y=0;this.vx=0;this.vy=0;this.r=3;this.life=2;}
}
class Enemy{
  constructor(){this.x=0;this.y=0;this.vx=0;this.vy=0;this.r=8;this.health=3;}
}
class Particle{
  constructor(){this.x=0;this.y=0;this.vx=0;this.vy=0;this.r=0;this.life=0;}
}
class Game{
  constructor(){this.canvas=document.getElementById('game');this.ctx=this.canvas.getContext('2d');this.resize();window.addEventListener('resize',()=>this.resize());this.player=new Player();this.player.x=this.canvas.width/2;this.player.y=this.canvas.height/2;this.physics=new PhysicsEngine();this.projectiles=new ObjectPool(()=>new Projectile(),p=>{p.x=0;p.y=0;p.vx=0;p.vy=0;p.life=2;});this.enemies=[];this.particles=new ObjectPool(()=>new Particle(),p=>{p.x=0;p.y=0;p.vx=0;p.vy=0;p.r=0;p.life=0;});this.mouseX=0;this.mouseY=0;this.mouseDown=false;this.lastTime=0;this.score=0;this.highScore=parseInt(localStorage.getItem('highScore')||'0');this.spawnTimer=0;this.combatMusic=new Audio();this.combatMusic.src='data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';this.combatMusic.loop=true;this.combatMusic.volume=0.3;}
  resize(){const w=window.innerWidth,h=window.innerHeight;this.canvas.width=w;this.canvas.height=h;this.player.x=w/2;this.player.y=h/2;}
  init(){
    this.player.x=this.canvas.width/2;
    this.player.y=this.canvas.height/2;
    this.player.vx=0;
    this.player.vy=0;
    this.projectiles.pool.forEach(p=>p.life=0);
    this.enemies=[];
    this.particles.pool.forEach(p=>p.life=0);
    this.spawnTimer=0;
    this.lastTime=0;
    this.score=0;
    this.combatMusic.play();
    document.addEventListener('mousemove',e=>{this.mouseX=e.clientX;this.mouseY=e.clientY;});
    document.addEventListener('mousedown',()=>{this.mouseDown=true;});
    document.addEventListener('mouseup',()=>{this.mouseDown=false;});
    window.addEventListener('deviceorientation',e=>{this.alpha=e.alpha;this.beta=e.beta;this.gamma=e.gamma;});
    this.gameLoop(0);
  }
  gameLoop(time){
  const dt=(time-this.lastTime)/1000;this.lastTime=time;
  this.update(dt);
  this.render();
  requestAnimationFrame(t=>this.gameLoop(t));
  }
  update(dt){
    const aimTarget=Math.atan2(this.mouseY-this.canvas.height/2,this.mouseX-this.canvas.width/2);
    this.player.angle+=((aimTarget-this.player.angle)+Math.PI)%(2*Math.PI)-Math.PI;
    this.player.angle=this.player.angle*this.player.aimSmooth+aimeTarget*(1-this.player.aimSmooth);
    if(this.mouseDown){
      const proj=this.projectiles.get();
      proj.x=this.player.x;proj.y=this.player.y;
      proj.vx=Math.cos(this.player.angle)*8;
      proj.vy=Math.sin(this.player.angle)*8;
      proj.life=2;
      this.player.vx-=Math.cos(this.player.angle)*0.3;
      this.player.vy-=Math.sin(this.player.angle)*0.3;
    }
    this.physics.update(this.player,dt);
    this.player.x=Math.max(this.player.r,Math.min(this.canvas.width-this.r,this.player.x));
    this.player.y=Math.max(this.player.r,Math.min(this.canvas.height-this.r,this.player.y));
    this.projectiles.pool.forEach(p=>{if(p.life>0){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)p.x=-1000;}});
    this.spawnTimer-=dt;
    if(this.spawnTimer<=0){this.spawnTimer=2;const edge=Math.floor(Math.random()*4);const e=this.enemies.push(new Enemy())-1;this.enemies[e].health=3;
      switch(edge){case 0:this.enemies[e].x=-20;this.enemies[e].y=Math.random()*this.canvas.height;break;
      case 1:this.enemies[e].x=this.canvas.width+20;this.enemies[e].y=Math.random()*this.canvas.height;break;
      case 2:this.enemies[e].x=Math.random()*this.canvas.width;this.enemies[e].y=-20;break;
      case 3:this.enemies[e].x=Math.random()*this.canvas.width;this.enemies[e].y=this.canvas.height+20;break;}
    }
    this.enemies.forEach(e=>{const dx=this.player.x-e.x;const dy=this.player.y-e.y;const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>0){e.vx=(dx/dist)*2;e.vy=(dy/dist)*2;}else{e.vx=0;e.vy=0;}
      e.x+=e.vx*dt;e.y+=e.vy*dt;
      if(e.x<-20||e.x>this.canvas.width+20||e.y<-20||e.y>this.canvas.height+20){this.enemies.splice(this.enemies.indexOf(e),1);}
    });
    this.projectiles.pool.forEach(p=>{if(p.life>0){this.enemies.forEach((e,i)=>{const dx=p.x-e.x;const dy=p.y-e.y;const d=Math.sqrt(dx*dx+dy*dy);
      if(d<p.r+e.r&&d>0){p.life=0;e.health--;
        if(e.health<=0){this.enemies.splice(i,1);this.score+=10;
        const partCount=15;for(let j=0;j<partCount;j++){const pt=this.particles.get();pt.x=e.x;pt.y=e.y;pt.vx=(Math.random()-0.5)*4;pt.vy=(Math.random()-0.5)*4;pt.r=3;pt.life=0.5;}}
      }});}});
    this.particles.pool.forEach(p=>{if(p.life>0){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.r=Math.max(0,p.r-0.1);}});
    if(this.score>this.highScore){this.highScore=this.score;localStorage.setItem('highScore',this.highScore);}
  }
  render(){
    const ctx=this.ctx;
    ctx.fillStyle='#0a0a0a';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    ctx.strokeStyle='#0ff';
    ctx.lineWidth=1;
    for(let x=0;x<this.canvas.width;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,this.canvas.height);ctx.stroke();}
    for(let y=0;y<this.canvas.height;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(this.canvas.width,y);ctx.stroke();}
    ctx.fillStyle='#0ff';
    ctx.shadowBlur=15;ctx.shadowColor='#0ff';
    ctx.beginPath();ctx.arc(this.player.x,this.player.y,this.player.r,0,2*Math.PI);ctx.fill();
    ctx.fillStyle='#f0f';
    ctx.shadowColor='#f0f';
    this.projectiles.pool.forEach(p=>{if(p.life>0){ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,2*Math.PI);ctx.fill();}});
    ctx.fillStyle='#ff0';
    this.enemies.forEach(e=>{ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,2*Math.PI);ctx.fill();});
    ctx.fillStyle='#fff';
    this.particles.pool.forEach(p=>{if(p.life>0){ctx.globalAlpha=0.5+p.life*2;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,2*Math.PI);ctx.fill();ctx.globalAlpha=1;}});
    ctx.fillStyle='#0f0';
    const healthRatio=this.player.health/100;
    ctx.fillRect(10,10,100*healthRatio,15);
    ctx.strokeStyle='#fff';
    ctx.strokeRect(10,10,100,15);
    ctx.fillStyle='#fff';
    ctx.font='16px monospace';
    ctx.textAlign='right';
    ctx.fillText(''+this.score,this.canvas.width-10,25);
    ctx.fillText('HI:'+this.highScore,this.canvas.width-10,45);
    const crossSize=10+Math.abs(Math.sin(Date.now()/50))*5;
    ctx.strokeStyle='#fff';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(this.player.x-crossSize, this.player.y);ctx.lineTo(this.player.x+crossSize, this.player.y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(this.player.x, this.player.y-crossSize);ctx.lineTo(this.player.x, this.player.y+crossSize);ctx.stroke();
    ctx.fillStyle='#f0f';
    ctx.font='12px monospace';
    ctx.textAlign='center';
    ctx.fillText('GRAVITY-LOCK',this.canvas.width/2,30);
  }
}
const game=new Game();
game.init();
game.combatMusic.play();