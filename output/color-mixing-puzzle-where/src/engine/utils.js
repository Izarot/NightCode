export const clamp=(v,a,b)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const rgb=(r,g,b)=>`rgb(${r|0},${g|0},${b|0})`;
export const rgba=(r,g,b,a)=>`rgba(${r|0},${g|0},${b|0},${a})`;
export const aabb=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export const tint=(name)=>({red:[255,40,40],green:[40,255,80],blue:[80,120,255],yellow:[255,230,60],cyan:[60,230,255],magenta:[255,80,220],white:[240,240,255]}[name]||[200,200,200]);
