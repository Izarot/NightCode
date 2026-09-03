export class Bullet{
  constructor(x,y,vx,vy,dmg,owner,color,hitscan=false,arc=false){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.dmg=dmg; this.owner=owner; this.color=color;
    this.hitscan=hitscan; this.arc=arc;
    this.dead=false; this.life=1.5; this.t=0;
  }
  update(dt, world){
    if(this.hitscan){
      this.x += this.vx*dt;
      this.y += this.vy*dt;
    }else if(this.arc){
      this.t += dt;
      this.x += this.vx*dt;
      this.y += this.vy*dt + 200*this.t*dt;
    }else{
      this.x += this.vx*dt;
      this.y += this.vy*dt;
    }
    this.life -= dt;
    if(this.life<=0) this.dead=true;
    const dx = this.x - 640, dy = this.y - 360;
    if(Math.hypot(dx,dy) > 1200) this.dead=true;
    for(const e of world.entities){
      if(e===this.owner || !e.alive) continue;
      if(Math.hypot(e.x-this.x, e.y-this.y) < e.r+3){
        e.takeDmg(this.dmg);
        if(this.owner) this.owner.dmgDealt += this.dmg;
        world.particles.push({x:this.x,y:this.y,life:1,color:'#ffaa00'});
        if(!e.alive && this.owner){
          this.owner.kills++;
          this.owner.killedBy = e.name;
        }
        if(!e.alive) e.killedBy = this.owner?this.owner.name:'void';
        this.dead=true;
        break;
      }
    }
  }
}
