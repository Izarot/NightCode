const COLS=10,ROWS=20;
const PIECE_TYPES=['I','O','T','S','Z','J','L'];
const PIECE_SHAPES={
I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
O:[[1,1],[1,1]],
T:[[0,1,0],[1,1,1],[0,0,0]],
S:[[0,1,1],[1,1,0],[0,0,0]],
Z:[[1,1,0],[0,1,1],[0,0,0]],
J:[[1,0,0],[1,1,1],[0,0,0]],
L:[[0,0,1],[1,1,1],[0,0,0]]
};
const PIECE_COLORS={
I:'#00f5d4',O:'#fee440',T:'#9b5de5',
S:'#00bbf9',Z:'#f15bb5',J:'#00f5d4',L:'#ff6b35'
};
const SRS_KICKS={
'00':[[0,0]],'01':[[-1,0],[-1,-1],[0,2],[-1,2]],'02':[[-1,0],[-1,1],[0,-2],[-1,-2]],
'03':[[1,0],[1,1],[0,-2],[1,-2]],'10':[[1,0],[1,-1],[0,2],[1,2]],'11':[[0,0]],
'12':[[1,0],[1,1],[0,-2],[1,-2]],'13':[[-1,0],[-1,-1],[0,2],[-1,2]],
'20':[[0,0]],'21':[[1,0],[1,-1],[0,2],[1,2]],'22':[[-1,0],[-1,1],[0,-2],[-1,-2]],
'23':[[-1,0],[-1,-1],[0,2],[-1,2]],'30':[[-1,0],[-1,1],[0,-2],[-1,-2]],
'31':[[0,0]],'32':[[-1,0],[-1,-1],[0,2],[-1,2]],'33':[[1,0],[1,1],[0,-2],[1,-2]]
};
class Piece{
constructor(type){
this.type=type;
this.shape=PIECE_SHAPES[type].map(r=>[...r]);
this.color=PIECE_COLORS[type];
this.x=Math.floor((COLS-this.shape[0].length)/2);
this.y=0;
this.rotation=0;
}
getCells(){
const cells=[];
for(let r=0;r<this.shape.length;r++)
for(let c=0;c<this.shape[r].length;c++)
if(this.shape[r][c])cells.push([this.x+c,this.y+r]);
return cells;
}
getRotated(){
const s=this.shape;
const rotated=[];
for(let c=0;c<s[0].length;c++){
const row=[];
for(let r=s.length-1;r>=0;r--)row.push(s[r][c]);
rotated.push(row);
}
return rotated;
}
rotateCW(){
const newShape=this.getRotated();
const oldRotation=this.rotation;
this.rotation=(this.rotation+1)%4;
const kickKey=oldRotation.toString()+'0'+this.rotation.toString();
const kicks=SRS_KICKS[kickKey]||[[0,0]];
return{shape:newShape,kicks};
}
rotateCCW(){
const newShape=this.getRotated();
const oldRotation=this.rotation;
this.rotation=(this.rotation+3)%4;
const kickKey=oldRotation.toString()+'3'+this.rotation.toString();
const kicks=SRS_KICKS[kickKey]||[[0,0]];
return{shape:newShape,kicks};
}
}
