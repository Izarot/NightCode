const TILE=64,GRID=8;
function portsFromPath(prev,cur,next){const p=[0,0,0,0];const dirs=[[0,-1],[1,0],[0,1],[-1,0]];if(prev){let dx=cur.x-prev.x,dy=cur.y-prev.y;dirs.forEach((d,i)=>{if(d[0]===-dx&&d[1]===-dy)p[i]=1})}if(next){let dx=next.x-cur.x,dy=next.y-cur.y;dirs.forEach((d,i)=>{if(d[0]===dx&&d[1]===dy)p[i]=1})}return p}
function rotatePorts(p){return [p[3],p[0],p[1],p[2]]}
class Board{
 constructor(level){this.level=level;this.grid=Array.from({length:GRID},()=>Array(GRID).fill(null));this.history=[];this.movesUsed=0;this.hintCell=null;
  this.grid[level.start.y][level.start.x]={fixed:'start',ports:portsFromPath(null,level.start,level.solution[0]||level.end),x:level.start.x,y:level.start.y,anim:1};
  this.grid[level.end.y][level.end.x]={fixed:'end',ports:portsFromPath(level.solution[level.solution.length-1],level.end,null),x:level.end.x,y:level.end.y,anim:1};}
 inBounds(x,y){return x>=0&&x<GRID&&y>=0&&y<GRID}
 place(x,y,ports,invIndex){if(!this.inBounds(x,y))return false;const c=this.grid[y][x];if(c&&c.fixed)return false;if(this.movesUsed>=this.level.moves)return false;
  this.history.push({x,y,prev:c?JSON.parse(JSON.stringify(c)):null,movesUsed:this.movesUsed});
  this.grid[y][x]={ports:[...ports],x,y,anim:0,invIndex,shake:0};this.movesUsed++;return true}
 clear(x,y){const c=this.grid[y]&&this.grid[y][x];if(!c||c.fixed)return false;this.history.push({x,y,prev:JSON.parse(JSON.stringify(c)),movesUsed:this.movesUsed});this.grid[y][x]=null;return true}
 undo(){const h=this.history.pop();if(!h)return null;this.grid[h.y][h.x]=h.prev;this.movesUsed=h.movesUsed;return h}
 reset(){const lvl=this.level;this.grid=Array.from({length:GRID},()=>Array(GRID).fill(null));this.history=[];this.movesUsed=0;this.hintCell=null;this.grid[lvl.start.y][lvl.start.x]={fixed:'start',ports:portsFromPath(null,lvl.start,lvl.solution[0]||lvl.end),x:lvl.start.x,y:lvl.start.y,anim:1};this.grid[lvl.end.y][lvl.end.x]={fixed:'end',ports:portsFromPath(lvl.solution[lvl.solution.length-1],lvl.end,null),x:lvl.end.x,y:lvl.end.y,anim:1}}
 bfs(){const s=this.level.start,e=this.level.end;const dirs=[[0,-1],[1,0],[0,1],[-1,0]];const opp=[2,3,0,1];const q=[[s.x,s.y]];const seen=new Set([s.x+','+s.y]);const parent={};parent[s.x+','+s.y]=null;
  while(q.length){const [x,y]=q.shift();if(x===e.x&&y===e.y){const path=[];let k=x+','+y;while(k){const [px,py]=k.split(',').map(Number);path.unshift({x:px,y:py});k=parent[k]}return path}
   const cell=this.grid[y][x];if(!cell)continue;for(let i=0;i<4;i++){if(!cell.ports[i])continue;const nx=x+dirs[i][0],ny=y+dirs[i][1];if(!this.inBounds(nx,ny))continue;const nc=this.grid[ny][nx];if(!nc||!nc.ports[opp[i]])continue;const k=nx+','+ny;if(seen.has(k))continue;seen.add(k);parent[k]=x+','+y;q.push([nx,ny])}}
  return null}
 reachable(){const p=this.bfs();return p}
 progress(){const p=this.bfs();if(!p)return 0;const total=this.level.solution.length+2;return Math.min(100,Math.round(p.length/total*100))}
}
