// Core: Camera, Physics, Surface Snapping
const camera={x:0,y:0,zoom:1,targetX:0,targetY:0,rot:0};
const lerp=(a,b,t)=>a+(b-a)*t;
function updateCamera(){camera.x=lerp(camera.x,camera.targetX,0.12);camera.y=lerp(camera.y,camera.targetY,0.12);}
function verlet(p,dt){p.vx+=p.ax*dt;p.vy+=p.ay*dt;const tx=p.x+p.vx*dt+p.ax*dt*dt*0.5;p.ax=0;p.ay=0;p.x=tx;p.y=ty;}
function snapToSurface(x,y){const d=Math.hypot(x-400,y-300);if(d<64){return {snap:true,normal:{x:Math.cos(Math.atan2(y-300,x-400)),y:Math.sin(Math.atan2(y-300,x-400))}};return{snap:false};}
