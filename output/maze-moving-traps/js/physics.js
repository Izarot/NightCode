function resolvePlayerWalls(p,m){
const r=p.r;const minX=m.cells[0]?0:m.cols;for(let y=0;y<m.rows;y++)for(let x=0;x<m.cols;x++){const c=m.cells[m.idx(x,y)];const rx=x*CELL,ry=y*CELL;if(c.w[0]&&Physics.circleRect(p.x,p.y,r,rx,ry,CELL,2)){p.y=ry-2-r;p.vy*=0.7;if(p.x>rx&&p.x<rx+CELL)p.vx*=0.7}if(c.w[2]&&Physics.circleRect(p.x,p.y,r,rx+CELL-2,ry,2,CELL)){p.y=ry+CELL+r;p.vy*=0.7}if(c.w[1]&&Physics.circleRect(p.x,p.y,r,rx,ry,2,CELL)){p.x=rx-2-r;p.vx*=0.7}if(c.w[3]&&Physics.circleRect(p.x,p.y,r,rx+CELL-2,ry,2,CELL)){p.x=rx+CELL+r;p.vx*=0.7}}if(p.x<r){p.x=r;p.vx*=0.7}if(p.y<r){p.y=r;p.vy*=0.7}if(p.x>m.cols*CELL-r){p.x=m.cols*CELL-r;p.vx*=0.7}if(p.y>m.rows*CELL-r){p.y=m.rows*CELL-r;p.vy*=0.7}
}
const Physics={
circleRect(cx,cy,r,rx,ry,rw,rh){const nx=Math.max(rx,Math.min(cx,rx+rw)),ny=Math.max(ry,Math.min(cy,ry+rh));const dx=cx-nx,dy=cy-ny;return dx*dx+dy*dy<r*r},
applyFriction(p,dt){const f=Math.pow(0.85,dt*60);p.vx*=f;p.vy*=f;if(Math.abs(p.vx)<1)p.vx=0;if(Math.abs(p.vy)<1)p.vy=0},
slide(p,m){resolvePlayerWalls(p,m)}
};