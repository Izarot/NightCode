const COLS=10,ROWS=20;
class Grid{
constructor(){
this.cells=new Array(ROWS);
for(let r=0;r<ROWS;r++)this.cells[r]=new Array(COLS).fill(0);
}
get(c,r){if(c<0||c>=COLS||r<0||r>=ROWS)return undefined;return this.cells[r][c];}
set(c,r,v){if(c>=0&&c<COLS&&r>=0&&r<ROWS)this.cells[r][c]=v;}
isEmpty(c,r){return c<0||c>=COLS||r<0||r>=ROWS?false:this.cells[r][c]===0;}
lockPiece(piece){
for(const[c,r]of piece.getCells()){
if(r>=0&&r<ROWS&&c>=0&&c<COLS)this.cells[r][c]=piece.color;
}
}
findFullLines(){
const full=[];
for(let r=0;r<ROWS;r++){
if(this.cells[r].every(c=>c!==0))full.push(r);
}
return full;
}
clearLines(lines){
lines.sort((a,b)=>b-a);
for(const l of lines){
this.cells.splice(l,1);
this.cells.unshift(new Array(COLS).fill(0));
}
}
isEmptyCol(c){
for(let r=0;r<ROWS;r++)if(this.cells[r][c]===0)return true;
return false;
}
getSpawnBlocked(){
for(let c=0;c<COLS;c++){
for(let r=0;r<4;r++){
if(r<ROWS&&this.cells[r][c]!==0)return true;
}
}
return false;
}
}
