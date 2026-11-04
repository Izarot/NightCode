import {clamp} from './utils.js';
export class Player{
constructor(){this.reset(80);}
reset(x){this.x=x;this.y=400;this.w=32;this.h=48;this.speed=0;this.vy=0;this.onGround=false;this.coyote=0;this.buffer=0;this.face=1;this.anim=0;}
update(keys,terrain,dt,boost){const acc=this.onGround?0.8:0.32;let move=0;if(keys.left)move-=1;if(keys.right)move+=1;if(move!==0){this.face=move;this.speed+=move*acc*(dt*60);if(!this.onGround)this.speed=clamp(this.speed,-5,5);}else{const f=1.2*(dt*60);if(this.speed>0)this.speed=Math.max(0,this.speed-f);else this.speed=Math.min(0,this.speed+f);}if(boost&&this.speed!==0)this.speed+=Math.sign(this.speed)*0.15*(dt*60);this.speed=clamp(this.speed,-12,12);this.x+=this.speed*(dt*60);if(this.x<20)this.x=20;
if(keys.jump){this.buffer=0.1;}else this.buffer=Math.max(0,this.buffer-dt);
if(this.onGround)this.coyote=0.12;else this.coyote=Math.max(0,this.coyote-dt);
if(this.buffer>0&&this.coyote>0){this.vy=-14;this.buffer=0;this.coyote=0;this.onGround=false;return true;}
if(!keys.jump&&this.vy<-5)this.vy+=0.9*(dt*60);
this.vy+=0.7*(dt*60);this.vy=clamp(this.vy,-18,18);this.y+=this.vy*(dt*60);
const g=terrain.groundAt(this.x+16);const seg=terrain.segments[Math.floor((this.x+16)/32)];const dissolving=seg&&seg.stability<0.2;
if(!dissolving&&this.y+this.h>=g&&this.vy>=0){this.y=g-this.h;this.vy=0;this.onGround=true;}else this.onGround=false;
this.anim+=Math.abs(this.speed)*dt*0.4;return false;}
draw(ctx,cam){const sx=this.x-cam,sy=this.y;const leg=Math.sin(this.anim*10)*8;ctx.fillStyle='#ffe600';ctx.fillRect(sx,sy,32,48);ctx.fillStyle='#ff2ea6';ctx.fillRect(sx+4,sy+4,24,14);ctx.fillStyle='#000';ctx.fillRect(sx+(this.face>0?20:6),sy+8,6,6);ctx.fillStyle='#00e5ff';ctx.fillRect(sx+4,sy+34,10,14+leg*0.3);ctx.fillRect(sx+18,sy+34,10,14-leg*0.3);if(Math.abs(this.speed)>6){ctx.fillStyle='rgba(255,230,0,0.5)';ctx.beginPath();ctx.arc(sx+16,sy+24,26+Math.sin(this.anim*8)*4,0,7);ctx.fill();}}}
