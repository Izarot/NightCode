export class SpatialGrid {
  constructor(size){ this.size=size; this.cells={}; }
  key(x,y){ return Math.floor(x/this.size)+','+Math.floor(y/this.size); }
  insert(e,x,y){ const k=this.key(x,y); if(!this.cells[k])this.cells[k]=[]; this.cells[k].push(e); }
  clear(){ this.cells={}; }
  query(x,y,r){ const result=[]; const minX=Math.floor((x-r)/this.size),minY=Math.floor((y-r)/this.size),maxX=Math.ceil((x+r)/this.size),maxY=Math.ceil((y+r)/this.size); for(let i=minX;i<=maxX;i++)for(let j=minY;j<=maxY;j++){const k=i+','+j;if(this.cells[k])result.push(...this.cells[k]);} return result; }
}
