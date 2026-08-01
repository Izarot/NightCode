class Player {
  constructor(id,x,y,color){
    this.id=id;
    this.x=x;this.y=y;
    this.vx=0;this.vy=0;
    this.color=color;
    this.radius=24;
    this.health=100;
    this.daze=0;
    this.state='NORMAL';
    this.windup=0;
    this.dashCooldown=0;
    this.stunTimer=0;
    this.wobbleTimer=0;
    this.combo=0;
    this.lastHitTime=0;
    this.facing=1;
    this.keys={};
    this.hitbox=null;
    this.trail=[];
  }
  update(input,dt){
    if(this.wobbleTimer>0){this.wobbleTimer--;this.vx*=0.2;this.vy*=0.2;return;}
    if(this.stunTimer>0){this.stunTimer--;this.vx*=0.3;this.vy*=0.3;return;}
    // Movement
    let acc=0;
    if(input.left)acc-=0.15;
    if(input.right)acc+=0.15;
    if(acc!==0){this.facing=Math.sign(acc);this.vx+=acc;}
    // Friction
    const speed=vecMag({x:this.vx,y:this.vy});
    const fr=speed>3?PHYSICS.FRICTION_LOW:PHYSICS.FRICTION_HIGH;
    this.vx*=fr;this.vy*=fr;
    // Dash
    if(input.dash&&this.dashCooldown<=0&&speed>0.5){
      this.vx+=this.facing*PHYSICS.DASH_FORCE;
      this.vx=clamp(this.vx,-6,6);
      this.dashCooldown=20;
      this.trail=[];
    }
    if(this.dashCooldown>0)this.dashCooldown--;
    // Wind-up
    if(input.attack&&this.windup<=0&&this.dashCooldown<=0){
      this.windup=PHYSICS.WINDUP_FRAMES;
      this.state='WINDUP';
    }
    if(this.windup>0){this.windup--;if(this.windup<=0)this.state='NORMAL';}
    // Gravity
    this.vy+=PHYSICS.GRAVITY;
    // Bounds
    if(this.y>this.radius+200){this.y=this.radius+200;this.vy*=-0.5;}
    this.x=clamp(this.x,10,1910);
    this.y=clamp(this.y,10,1070);
    this.x+=this.vx;this.y+=this.vy;
    // Trail for dash
    if(speed>4){this.trail.push({x:this.x,y:this.y});if(this.trail.length>8)this.trail.shift();}
    else this.trail=[];
  }
  draw(ctx,offsetX){
    // Body
    ctx.fillStyle=this.color;
    ctx.fillRect(this.x-14+offsetX,this.y-30,this.radius*2-4,40);
    // Head with squash/stretch
    const squash=this.state==='WINDUP'?0.85:1;
    const stretch=this.state==='WINDUP'?1.15:1;
    ctx.save();
    ctx.translate(this.x+offsetX,this.y);
    ctx.scale(squash,stretch);
    ctx.beginPath();
    ctx.arc(0,0,this.radius,0,Math.PI*2);
    ctx.fill();
    // Eyes
    ctx.fillStyle='#000';
    ctx.beginPath();
    ctx.arc(-6,-3,3,0,Math.PI*2);
    ctx.arc(6,-3,3,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    // Trail
    ctx.strokeStyle=this.color;
    ctx.lineWidth=3;
    for(let i=1;i<this.trail.length;i++){
      ctx.globalAlpha=i/this.trail.length*0.5;
      ctx.beginPath();
      ctx.moveTo(this.trail[i-1].x+offsetX,this.trail[i-1].y);
      ctx.lineTo(this.trail[i].x+offsetX,this.trail[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
}
