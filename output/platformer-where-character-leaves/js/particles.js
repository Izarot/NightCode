export class Particle{x,y,vx,vy,life,c;constructor(x,y,v,c){this.x=x;this.y=y;this.vx=v;this.vy=v;this.life=life;this.c=c;}
update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.life-=dt;}
draw(ctx){ctx.globalAlpha=this.life;ctx.fillStyle=this.c;ctx.fillRect(this.x,this.y,4,4);}
}