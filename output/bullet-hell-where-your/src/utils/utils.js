export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const rand=(a,b)=>a+Math.random()*(b-a);
export const dist=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
export const angleTo=(x1,y1,x2,y2)=>Math.atan2(y2-y1,x2-x1);