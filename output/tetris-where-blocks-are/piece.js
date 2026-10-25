const SHAPES = {
  I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1],[0,0,0]],
  S:[[0,1,1],[1,1,0],[0,0,0]],
  Z:[[1,1,0],[0,1,1],[0,0,0]],
  J:[[1,0,0],[1,1,1],[0,0,0]],
  L:[[0,0,1],[1,1,1],[0,0,0]]
};
const KICKS = {
  JLSTZ:[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  I:[[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  O:[[0,0]]
};
function rotateMatrix(mat, cw=true){ const n=mat.length; const res=Array.from({length:n},()=>Array(n).fill(0)); for(let y=0;y<n;y++) for(let x=0;x<n;x++){ if(cw) res[x][n-1-y]=mat[y][x]; else res[n-1-x][y]=mat[y][x]; } return res; }
class Piece{
  constructor(type, emotion, x=3, y=0, rot=0){ this.type=type; this.emotion=emotion; this.x=x; this.y=y; this.rot=rot; this.matrix=SHAPES[type]; this.spawnAnim=150; }
  clone(){ const p=new Piece(this.type, this.emotion, this.x, this.y, this.rot); p.matrix=this.matrix.map(r=>[...r]); p.spawnAnim=this.spawnAnim; return p; }
  getBlocks(){ const blocks=[]; const m=this.matrix; for(let y=0;y<m.length;y++) for(let x=0;x<m[y].length;x++) if(m[y][x]) blocks.push({x:this.x+x, y:this.y+y}); return blocks; }
  rotate(cw, grid){ const kicks = this.type==='I'?KICKS.I:this.type==='O'?KICKS.O:KICKS.JLSTZ; const oldMat=this.matrix; const newMat=rotateMatrix(oldMat, cw); for(const [dx,dy] of kicks){ const nx=this.x+dx, ny=this.y-dy; let valid=true; for(let y=0;y<newMat.length;y++) for(let x=0;x<newMat[y].length;x++) if(newMat[y][x]){ const gx=nx+x, gy=ny+y; if(gx<0||gx>=10||gy>=20||(gy>=0&&grid[gy][gx])){ valid=false; break; } } if(valid){ this.matrix=newMat; this.x=nx; this.y=ny; return true; } } return false; }
  move(dx, dy, grid){ const nx=this.x+dx, ny=this.y+dy; for(const b of this.getBlocks()){ const gx=b.x+dx, gy=b.y+dy; if(gx<0||gx>=10||gy>=20||(gy>=0&&grid[gy][gx])) return false; } this.x=nx; this.y=ny; return true; }
  hardDrop(grid){ let dist=0; while(this.move(0,1,grid)) dist++; return dist; }
  updateSpawnAnim(dt){ this.spawnAnim=Math.max(0, this.spawnAnim-dt); }
  getSpawnScale(){ const t=1-this.spawnAnim/150; return 0.6+0.4*t; }
}
function createRandomPiece(){ const type=Object.keys(SHAPES)[Math.floor(Math.random()*7)]; const emo=Emotion.randomEmotion(); return new Piece(type, emo); }
window.Piece = { Piece, createRandomPiece, SHAPES, KICKS };