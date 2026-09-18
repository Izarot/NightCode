const COLS=10,ROWS=20;
const BG_COLOR='#1a1a2e';
const GRID_COLOR='#2a2a4a';
let cellSize,canvas,ctx;
function initRenderer(cvs){
canvas=cvs;ctx=cvs.getContext('2d');
resize();
}
function resize(){
const maxW=window.innerWidth-20;
const maxH=window.innerHeight-20;
const targetW=COLS*cellSize||400;
const targetH=ROWS*cellSize||800;
const scale=Math.min(maxW/targetW,maxH/targetH,1.5);
cellSize=Math.floor(40*scale);
const w=COLS*cellSize;
const h=ROWS*cellSize;
canvas.width=w;canvas.height=h;
canvas.style.width=w+'px';canvas.style.height=h+'px';
}
window.addEventListener('resize',resize);
function drawGrid(grid,risers,piece,nextPiece,held,score,level,lines,towerH,danger,time,shakeX,shakeY){
ctx.save();
ctx.translate(shakeX||0,shakeY||0);
const w=COLS*cellSize,h=ROWS*cellSize;
ctx.fillStyle=BG_COLOR;
ctx.fillRect(0,0,w,h);
ctx.strokeStyle=GRID_COLOR;
ctx.lineWidth=.5;
for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*cellSize);ctx.lineTo(w,r*cellSize);ctx.stroke();}
for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*cellSize,0);ctx.lineTo(c*cellSize,h);ctx.stroke();}
for(let r=0;r<ROWS;r++){
for(let c=0;c<COLS;c++){
const v=grid.get(c,r);
if(v)drawCell(c,r,v,1);
}
}
for(const l of risers.lines){
const row=l.getIntactRow();
if(row>=0&&row<ROWS){
ctx.fillStyle=`rgba(255,80,40,${l.alpha*0.4})`;
ctx.fillRect(0,row*cellSize,w,cellSize);
ctx.strokeStyle=`rgba(255,120,60,${l.alpha})`;
ctx.lineWidth=2;
ctx.beginPath();
ctx.moveTo(0,row*cellSize);
ctx.lineTo(w,row*cellSize);
ctx.stroke();
const glow=ctx.createLinearGradient(0,row*cellSize,0,row*cellSize+cellSize);
glow.addColorStop(0,`rgba(255,80,40,${l.alpha*0.3})`);
glow.addColorStop(1,'rgba(255,80,40,0)');
ctx.fillStyle=glow;
ctx.fillRect(0,row*cellSize,w,cellSize);
}
}
if(piece)for(const[c,r]of piece.getCells()){
if(r>=0)drawCell(c,r,piece.color,1);
}
ctx.restore();
}
function drawCell(c,r,color,alpha){
const x=c*cellSize,y=r*cellSize;
ctx.globalAlpha=alpha;
const grad=ctx.createLinearGradient(x,y,x,y+cellSize);
grad.addColorStop(0,color);
grad.addColorStop(1,shadeColor(color,-20));
ctx.fillStyle=grad;
ctx.fillRect(x+1,y+1,cellSize-2,cellSize-2);
ctx.fillStyle='rgba(255,255,255,0.15)';
ctx.fillRect(x+1,y+1,cellSize-2,3);
ctx.globalAlpha=1;
}
function shadeColor(color,percent){
let num=parseInt(color.replace('#',''),16);
let r=Math.min(255,Math.max(0,(num>>16)+percent));
let g=Math.min(255,Math.max(0,((num>>8)&0x00FF)+percent));
let b=Math.min(255,Math.max(0,(num&0x0000FF)+percent));
return'#'+(r<<16|g<<8|b).toString(16).padStart(6,'0');
}
function drawHUD(risers,time,nextPiece,heldPiece){
const w=canvas.width;
ctx.fillStyle='rgba(26,26,46,0.8)';
ctx.fillRect(0,0,w,36);
ctx.font='700 14px Orbitron';
ctx.textBaseline='middle';
ctx.fillStyle='#e94560';ctx.fillText('LVL '+(game?game.level:1),8,18);
ctx.fillStyle='#c4c4c4';ctx.fillText('LINES '+(game?game.lines:0),90,18);
ctx.fillStyle='#0fbcf9';ctx.fillText('TOWER '+(risers?risers.count:0),190,18);
ctx.fillStyle='#fee440';ctx.fillText('SCORE '+(game?game.score:0),w-170,18);
const timerEl=document.getElementById('speedTimer');
if(timerEl){const t=Math.floor(time/1000);const m=Math.floor(t/60);const s=t%60;timerEl.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;}
if(nextPiece)drawMiniPiece(nextPiece,8,44);
if(heldPiece)drawMiniPiece(heldPiece,w-50,44);
}
function drawMiniPiece(piece,x,y){
const s=cellSize*0.5;
ctx.font='600 10px Orbitron';ctx.fillStyle='#888';ctx.textAlign='center';ctx.fillText('NEXT',x+s*2,y-2);
if(!piece)return;
for(let r=0;r<piece.shape.length;r++)
for(let c=0;c<piece.shape[r].length;c++)
if(piece.shape[r][c]){
ctx.fillStyle=piece.color;
ctx.fillRect(x+c*s,y+r*s+10,s-1,s-1);
}
ctx.textAlign='left';
}
function drawDangerBar(danger){
const w=canvas.width;
const barW=120;const barH=6;
const bx=w-barW-10;const by=44;
ctx.fillStyle='rgba(255,255,255,0.3})`;
ctx.fillRect(bx,by,barW,barH);
if(danger>0){const fill=Math.min(barW,danger*barW);ctx.fillStyle=danger>0.7?'#e94560':'#f9a825';ctx.fillRect(bx,by,fill,barH);}
ctx.fillStyle='#e94560';ctx.font='600 10px Orbitron';ctx.textAlign='right';ctx.fillText('DANGER',bx+barW,by-4);
ctx.textAlign='left';
}
function drawCenterText(text,size,color){ctx.font=`900 ${size}px Orbitron`;ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,canvas.width/2,canvas.height/2);ctx.textAlign='left';ctx.textBaseline='alphabetic';}
function drawClearEffect(rows){for(const r of rows){const y=r*cellSize;ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(0,y,COLS*cellSize,cellSize);}}
