export class Player{x=100,y=400,vx=0,vy=0,w=32,h=48;onGround=false;update(k,g){if(k.left)this.vx=-280;else if(k.right)this.vx=280;else this.vx=0;
if(k.jump&&this.onGround){this.vy=-420;this.onGround=false;}
if(!this.onGround)this.vy+=g;
if(this.vy>600)this.vy=600;
this.x+=this.vx/60;this.y+=this.vy/60;
if(this.y+this.h>=600){this.y=600-this.h;this.vy=0;this.onGround=true;}
}
draw(ctx){ctx.fillStyle='#FF6B6B';ctx.fillRect(this.x,this.y,this.w,this.h);ctx.fillStyle='#CC5555';ctx.fillRect(this.x,this.y,this.w,4);}
}
export class Clone{x;y;w=32;h=48;age=0;constructor(x,y){this.x=x-16;this.y=y+48;}}