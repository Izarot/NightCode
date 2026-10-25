const COLS=10, ROWS=20;
function createGrid(){ return Array.from({length:ROWS},()=>Array(COLS).fill(null)); }
class Grid{
  constructor(){ this.cells=createGrid(); this.clearAnim=[]; this.clearTimer=0; }
  getCell(r,c){ if(r<0||r>=ROWS||c<0||c>=COLS) return null; return this.cells[r][c]; }
  setCell(r,c,val){ if(r>=0&&r<ROWS&&c>=0&&c<COLS) this.cells[r][c]=val; }
  isValid(piece){ for(const b of piece.getBlocks()){ if(b.x<0||b.x>=COLS||b.y>=ROWS) return false; if(b.y>=0 && this.cells[b.y][b.x]) return false; } return true; }
  lock(piece){ for(const b of piece.getBlocks()){ if(b.y>=0) this.cells[b.y][b.x]={emotion:piece.emotion.id, color:piece.emotion.color}; Emotion.tracker.add(piece.emotion); } }
  checkLines(){ const lines=[]; for(let r=ROWS-1;r>=0;r--){ if(this.cells[r].every(c=>c)) lines.push(r); } return lines; }
  clearLines(lines){ lines.forEach(r=>{ this.clearAnim.push({row:r, progress:0, cells:this.cells[r].map((c,i)=>({col:i, emotion:c.emotion}))}); this.cells[r]=Array(COLS).fill(null); }); for(let r=lines[0]-1;r>=0;r--){ if(this.cells[r].some(c=>c)){ let nr=r; while(nr+1<ROWS && this.cells[nr+1].every(c=>!c)) nr++; if(nr!==r){ this.cells[nr]=this.cells[r]; this.cells[r]=Array(COLS).fill(null); } } } this.clearTimer=300; }
  updateClearAnim(dt){ this.clearTimer=Math.max(0, this.clearTimer-dt); this.clearAnim.forEach(a=>a.progress=Math.min(1, a.progress+dt/200)); if(this.clearTimer===0) this.clearAnim=[]; }
  isClearing(){ return this.clearTimer>0; }
  getClearingRows(){ return this.clearAnim.map(a=>a.row); }
  getClearProgress(row){ const a=this.clearAnim.find(a=>a.row===row); return a?a.progress:0; }
  getClearCells(row){ const a=this.clearAnim.find(a=>a.row===row); return a?a.cells:[]; }
  reset(){ this.cells=createGrid(); this.clearAnim=[]; this.clearTimer=0; }
}
window.Grid = { Grid, createGrid, COLS, ROWS };