export const math={
dist:(x1,y1,x2,y2)=>Math.sqrt((x2-x1)**2+(y2-y1)**2),
clamp:(v,mn,mx)=>Math.max(mn,Math.min(mx,v)),
lerp:(a,b,t)=>a+(b-a)*t,
rand:(mn,mx)=>mn+Math.random()*(mx-mn),
randi:(mn,mx)=>Math.floor(mn+Math.random()*(mx-mn+1))
};