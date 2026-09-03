export class Player{
  constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.w=28;this.h=44;
    this.grounded=false;this.coyote=0;this.buffer=0;this.trail=[];this.facing=1;
    this.jumpHeld=false;this.squash=1;}
  update(input,plats){
    const left=input.isDown('KeyA')||input.isDown('ArrowLeft');
    const right=input.isDown('KeyD')||input.isDown('ArrowRight');
    const jump=input.isDown('Space')||input.isDown('KeyW')||input.isDown('ArrowUp');
    if(input.pressed('Space')||input.pressed('KeyW')||input.pressed('ArrowUp'))this.buffer=8;
    else if(this.buffer>0)this.buffer--;
    if(left){this.vx-=.8;this.facing=-1;}
    if(right){this.vx+=.8;this.facing=1;}
    if(!left&&!right)this.vx*=.85;
    if(Math.abs(this.vx)>8)this.vx=Math.sign(this.vx)*8;
    this.vy+=.6;
    if(this.coyote>0)this.coyote--;
    if(this.grounded)this.coyote=6;
    if((jump||this.buffer>0)&&(this.coyote>0||this.grounded)){
      this.vy=-14;this.grounded=false;this.coyote=0;this.buffer=0;this.jumpHeld=true;
    }
    if(!jump&&this.vy<-4)this.vy=-4;
    this.x+=this.vx;this.y+=this.vy;
    this.grounded=false;
    for(const p of plats){
      if(this.x+this.w>p.x&&this.x<p.x+p.w&&this.y+this.h>p.y&&this.y+this.h<p.y+20&&this.vy>=0){
        this.y=p.y-this.h;this.vy=0;this.grounded=true;
      }
    }
    if(this.y< -200)this.squash=Math.max(.85,this.squash-.1);else this.squash=Math.min(1,this.squash+.05);
    this.trail.push({x:this.x,y:this.y,a:1});
    if(this.trail.length>6)this.trail.shift();
    for(const t of this.trail)t.a*=.8;
  }
  respawn(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.grounded=false;}
  draw(ctx){
    for(const t of this.trail){ctx.fillStyle="rgba(0,212,255,"+(t.a*.3)+")";ctx.fillRect(t.x,t.y+8,this.w,this.h);}
    ctx.save();
    ctx.translate(this.x+this.w/2,this.y+this.h/2);
    ctx.scale(this.facing,1);
    ctx.scale(1,this.squash);
    ctx.fillStyle='#fff';
    ctx.shadowColor='#00d4ff';ctx.shadowBlur=20;
    ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h);
    ctx.shadowBlur=0;
    ctx.fillStyle='#00d4ff';ctx.fillRect(-6,-10,4,10);
    ctx.restore();
  }
}
