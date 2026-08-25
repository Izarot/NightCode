export function aabb(a,b){return a.x<a.x+a.w&&a.x+a.w>b.x&&a.y<a.y+a.h&&a.y+a.h>b.y;}
export function resolve(a,b){if(aabb(a,b)){const dx=(a.x+a.w/2)-(b.x+b.w/2),dy=(a.y+a.h/2)-(b.y+b.h/2),d=Math.abs(dx)+Math.abs(dy);
if(d!==0){a.x+=dx/d;a.y+=dy/d;}}}
export const GRAVITY=980,JUMP_VEL=-420,RUN_SPEED=280,MAX_FALL=600;