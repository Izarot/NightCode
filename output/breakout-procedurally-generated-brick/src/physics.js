import {C,clamp} from './config.js';
// Swept point versus a radius-expanded box, preventing tunneling at high speed.
export function sweep(ball,box,dt){
 const minX=box.x-C.R,maxX=box.x+box.w+C.R,minY=box.y-C.R,maxY=box.y+box.h+C.R;
 let entry=-Infinity,exit=Infinity,nx=0,ny=0;
 for(const axis of ['x','y']){
  const p=ball[axis],v=ball[axis==='x'?'vx':'vy'],lo=axis==='x'?minX:minY,hi=axis==='x'?maxX:maxY;
  if(Math.abs(v)<1e-9){if(p<lo||p>hi)return null;continue;}
  let a=(lo-p)/v,b=(hi-p)/v,normal=-1;if(a>b){[a,b]=[b,a];normal=1;}
  if(a>entry){entry=a;nx=axis==='x'?normal:0;ny=axis==='y'?normal:0;}
  exit=Math.min(exit,b);if(entry>exit)return null;
 }
 if(entry< -1e-7||entry>dt||exit<0)return null;
 return {t:Math.max(0,entry),nx,ny};
}
export function normalize(ball,speed){
 let m=Math.hypot(ball.vx,ball.vy)||1;ball.vx=ball.vx/m*speed;ball.vy=ball.vy/m*speed;
 if(Math.abs(ball.vy)<speed*.22){ball.vy=(ball.vy<0?-1:1)*speed*.22;ball.vx=(ball.vx<0?-1:1)*Math.sqrt(speed*speed-ball.vy*ball.vy);}
}
export function advance(ball,dt,game,onBrick,onBounce){
 let left=dt;
 for(let iteration=0;iteration<10&&left>1e-7;iteration++){
  let hit=null;
  const offer=h=>{if(h&&h.t>=-1e-7&&h.t<=left&&(!hit||h.t<hit.t))hit={...h,t:Math.max(0,h.t)};};
  if(ball.vx<0)offer({t:(C.LEFT+C.R-ball.x)/ball.vx,nx:1,ny:0,kind:'wall'});
  if(ball.vx>0)offer({t:(C.RIGHT-C.R-ball.x)/ball.vx,nx:-1,ny:0,kind:'wall'});
  if(ball.vy<0)offer({t:(C.TOP+C.R-ball.y)/ball.vy,nx:0,ny:1,kind:'wall'});
  if(ball.vy>0){
   const t=(C.PADDLE_Y-C.R-ball.y)/ball.vy,x=ball.x+ball.vx*t;
   if(x>=game.paddle.x-game.paddle.w/2-C.R&&x<=game.paddle.x+game.paddle.w/2+C.R)offer({t,nx:0,ny:-1,kind:'paddle'});
   if(game.shield)offer({t:(C.H-22-C.R-ball.y)/ball.vy,nx:0,ny:-1,kind:'shield'});
  }
  for(const brick of game.bricks)if(brick.alive){const h=sweep(ball,brick,left);if(h)offer({...h,kind:'brick',brick});}
  if(!hit){ball.x+=ball.vx*left;ball.y+=ball.vy*left;break;}
  ball.x+=ball.vx*hit.t;ball.y+=ball.vy*hit.t;left-=hit.t;
  if(hit.kind==='paddle'){
   const u=clamp((ball.x-game.paddle.x)/(game.paddle.w/2),-1,1),angle=u*1.08;
   const speed=Math.hypot(ball.vx,ball.vy);ball.vx=Math.sin(angle)*speed;ball.vy=-Math.cos(angle)*speed;game.combo=0;
  }else{const dot=ball.vx*hit.nx+ball.vy*hit.ny;ball.vx-=2*dot*hit.nx;ball.vy-=2*dot*hit.ny;}
  ball.x+=hit.nx*C.EPS;ball.y+=hit.ny*C.EPS;
  if(hit.kind==='brick')onBrick(hit.brick,ball);else onBounce(hit.kind);
  if(hit.kind==='shield')game.shield=false;
 }
}
