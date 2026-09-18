class RiserLine{
constructor(row,speed){
this.row=row;
this.speed=speed;
this.alpha=0;
this.fadeIn=true;
}
update(dt){
if(this.fadeIn){this.alpha=Math.min(1,this.alpha+dt*3);if(this.alpha>=1)this.fadeIn=false;}
this.row+=this.speed*dt;
}
getIntactRow(){return Math.floor(this.row);}
getCells(){
const row=this.getIntactRow();
if(row<0||row>=ROWS)return[];
const cells=[];
for(let c=0;c<COLS;c++)cells.push([c,row]);
return cells;
}
isOffScreen(){return Math.floor(this.row)>ROWS;}
}
class RiserManager{
constructor(){
this.lines=[];
}
add(line){this.lines.push(line);}
update(dt){
for(const l of this.lines)l.update(dt);
this.lines=this.lines.filter(l=>!l.isOffScreen());
}
checkCollision(piece){
for(const[c,r]of piece.getCells()){
const rInt=Math.floor(r);
for(const l of this.lines){
if(l.getIntactRow()===rInt&&c>=0&&c<COLS)return true;
}
}
return false;
}
get count(){return this.lines.length;}
getMaxRow(){let m=0;for(const l of this.lines)if(l.row>m)m=l.row;return m;}
getHeight(){return this.lines.length;}
}
