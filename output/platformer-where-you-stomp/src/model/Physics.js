export function aabb(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
export function moveAndCollide(p,solids){p.x+=p.vx;for(const s of solids){if(aabb(p,s)){if(p.vx>0)p.x=s.x-p.w;else if(p.vx<0)p.x=s.x+s.w;p.vx=0}}p.y+=p.vy;p.onGround=false;for(const s of solids){if(aabb(p,s)){if(p.vy>0){p.y=s.y-p.h;p.onGround=true;p.groundRef=s}else if(p.vy<0)p.y=s.y+s.h;p.vy=0}}}
