const Utils={
rand(seed){this._s=seed!==undefined?seed:(this._s?this._s:Date.now()|0);return function(){this._s=this._s*1664525+1013904223|0;return ((this._s>>>0)%100000)/100000}},
clamp(v,a,b){return v<a?a:v>b?b:v},
lerp(a,b,t){return a+(b-a)*t},
dist(a,b){const dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy)},
circleAABB(cx,cy,r,rx,ry,rw,rh){const nx=Utils.clamp(cx,rx,rx+rw),ny=Utils.clamp(cy,ry,ry+rh);const dx=cx-nx,dy=cy-ny;return dx*dx+dy*dy<r*r}
};