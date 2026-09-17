import {C} from '../config.js';
// Permanent obstacles alone are rasterized. Removable bricks do not obstruct the flood.
// Grid nodes are 4 units apart; expanded AABBs conservatively overestimate steel corners.
export function accessible(bricks){
 const steel=bricks.filter(b=>b.type==='steel'&&b.alive);
 if(!steel.length)return true;
 const step=4,x0=34,y0=90,nx=224,ny=84,n=nx*ny;
 const blocked=new Uint8Array(n),seen=new Uint8Array(n),queue=new Int32Array(n);
 const margin=C.R+1;
 for(const b of steel){const ax=Math.max(0,Math.ceil((b.x-margin-x0)/step)),bx=Math.min(nx-1,Math.floor((b.x+b.w+margin-x0)/step));const ay=Math.max(0,Math.ceil((b.y-margin-y0)/step)),by=Math.min(ny-1,Math.floor((b.y+b.h+margin-y0)/step));for(let y=ay;y<=by;y++)for(let x=ax;x<=bx;x++)blocked[y*nx+x]=1;}
 let head=0,tail=0;for(let x=0;x<nx;x++){const id=(ny-1)*nx+x;if(!blocked[id]){seen[id]=1;queue[tail++]=id;}}
 while(head<tail){const id=queue[head++],x=id%nx,y=(id/nx)|0;const visit=j=>{if(!blocked[j]&&!seen[j]){seen[j]=1;queue[tail++]=j;}};if(x>0)visit(id-1);if(x<nx-1)visit(id+1);if(y>0)visit(id-nx);if(y<ny-1)visit(id+nx);}
 const reachable=(x,y)=>{if(x<C.LEFT+margin||x>C.RIGHT-margin||y<C.TOP+margin)return false;if(steel.some(b=>x>=b.x-margin&&x<=b.x+b.w+margin&&y>=b.y-margin&&y<=b.y+b.h+margin))return false;const gx=Math.round((x-x0)/step),gy=Math.round((y-y0)/step);return gx>=0&&gx<nx&&gy>=0&&gy<ny&&seen[gy*nx+gx]===1;};
 for(const b of bricks){if(!b.alive||b.type==='steel')continue;let ok=false;for(let x=b.x;x<=b.x+b.w;x+=step)if(reachable(x,b.y-margin)||reachable(x,b.y+b.h+margin)){ok=true;break;}if(!ok)for(let y=b.y;y<=b.y+b.h;y+=step)if(reachable(b.x-margin,y)||reachable(b.x+b.w+margin,y)){ok=true;break;}if(!ok)return false;}
 return true;
}
export function validate(bricks,rows,level){
 const errors=[],live=bricks.filter(b=>b.alive),targets=live.filter(b=>b.type!=='steel');
 if(targets.length<28)errors.push('Fewer than 28 destructible bricks');
 const bottom=Math.max(-1,...live.map(b=>b.row));
 if(targets.filter(b=>b.row>=bottom-1).length<6)errors.push('Insufficient entry faces');
 const ids=new Set();for(const b of live){if(ids.has(b.id))errors.push('Duplicate cell');ids.add(b.id);if(b.x<C.LEFT||b.x+b.w>C.RIGHT||b.y<C.TOP||b.y+b.h>C.PADDLE_Y-100)errors.push('Brick outside safe bounds');}
 if(rows<2||rows>10)errors.push('Invalid row count');
 if(!accessible(live))errors.push('Inaccessible target');
 return {ok:errors.length===0,errors};
}
