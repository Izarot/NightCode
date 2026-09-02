let canvas,ctx;
function initRenderer(){
  canvas=document.getElementById('game');
  ctx=canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize',resizeCanvas);
}
function resizeCanvas(){
  const w=Math.min(window.innerWidth,900);
  const h=Math.min(window.innerHeight,650);
  const aspect=4/3;
  let cw=w,ch=w/aspect;
  if(ch>h){ch=h;cw=h*aspect;}
  canvas.width=Math.floor(cw*window.devicePixelRatio);
  canvas.height=Math.floor(ch*window.devicePixelRatio);
  canvas.style.width=cw+'px';canvas.style.height=ch+'px';
  ctx.setTransform(window.devicePixelRatio,0,0,window.devicePixelRatio,0,0);
  state.cssW=cw;state.cssH=ch;
}
function drawBlock(b,alpha){
  if(alpha===undefined)alpha=1;
  const x=b.x*CELL,y=b.y*CELL,w=b.w*CELL,h=b.h*CELL;
  ctx.save();
  ctx.globalAlpha=alpha;
  const grad=ctx.createLinearGradient(x,y,x,y+h);
  grad.addColorStop(0,'#ff6b6b');grad.addColorStop(1,'#e94560');
  ctx.fillStyle=grad;
  roundRect(x+2,y+2,w-4,h-4,6);ctx.fill();
  ctx.strokeStyle='#ff6b6b';ctx.lineWidth=2;
  roundRect(x+2,y+2,w-4,h-4,6);ctx.stroke();
  ctx.fillStyle='rgba(255,217,61,0.3)';
  roundRect(x+4,y+4,(w-8)/3,(h-8)/3,4);ctx.fill();
  ctx.restore();
}
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}
function render(){
  const w=state.cssW,h=state.cssH;
  const offX=(w-GRID_COLS*CELL)/2;
  const maxRows=Math.max(state.targetHeight+4,state.currentHeight+2,GROUND_ROWS);
  const totalH=maxRows*CELL;
  const offY=h-80-totalH+state.targetHeight*CELL;
  ctx.save();
  ctx.translate(offX,offY);
  ctx.fillStyle=COLORS.ground;
  ctx.fillRect(-20,state.targetHeight*CELL,GRID_COLS*CELL+40,totalH-state.targetHeight*CELL+100);
  ctx.strokeStyle=COLORS.grid;ctx.lineWidth=1;
  ctx.globalAlpha=0.15+0.05*Math.sin(Date.now()/2000);
  for(let i=0;i<=GRID_COLS;i++){
    ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,totalH);ctx.stroke();
  }
  for(let j=0;j<=maxRows;j++){
    ctx.beginPath();ctx.moveTo(0,j*CELL);ctx.lineTo(GRID_COLS*CELL,j*CELL);ctx.stroke();
  }
  ctx.globalAlpha=1;
  ctx.fillStyle='rgba(78,204,163,0.15)';
  ctx.fillRect(0,0,GRID_COLS*CELL,state.targetHeight*CELL);
  ctx.strokeStyle=COLORS.valid;ctx.lineWidth=3;
  ctx.setLineDash([8,4]);
  ctx.beginPath();ctx.moveTo(0,state.targetHeight*CELL);ctx.lineTo(GRID_COLS*CELL,state.targetHeight*CELL);ctx.stroke();
  ctx.setLineDash([]);
  for(const b of state.placed)drawBlock(b,1);
  if(state.hoverPos&&state.selectedBlock){
    const bt=BLOCK_TYPES[state.selectedBlock];
    const ghost={type:state.selectedBlock,x:state.hoverPos.x,y:state.hoverPos.y,w:bt.w,h:bt.h};
    const valid=isValidPlacement(ghost,ghost.x,ghost.y);
    ctx.globalAlpha=0.45;
    ctx.fillStyle=valid?COLORS.valid:COLORS.invalid;
    roundRect(ghost.x*CELL+2,ghost.y*CELL+2,ghost.w*CELL-4,ghost.h*CELL-4,6);ctx.fill();
    ctx.globalAlpha=0.9;
    ctx.strokeStyle=valid?COLORS.valid:COLORS.invalid;ctx.lineWidth=3;
    roundRect(ghost.x*CELL+2,ghost.y*CELL+2,ghost.w*CELL-4,ghost.h*CELL-4,6);ctx.stroke();
    ctx.globalAlpha=1;
  }
  for(const p of state.particles){
    ctx.globalAlpha=p.life;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-2,p.y-2,4,4);
  }
  ctx.globalAlpha=1;
  ctx.restore();
  for(const s of state.shakeBlocks){
    ctx.save();
    const sx=s.x*CELL+offX+Math.sin(s.t*30)*3;
    const sy=s.y*CELL+offY;
    drawBlock(s,1);
    ctx.restore();
  }
}
function spawnParticles(x,y,color,n){
  n=n||8;
  for(let i=0;i<n;i++){
    state.particles.push({
      x:x,y:y,vx:(Math.random()-0.5)*4,vy:-Math.random()*3-1,
      life:1,color:color||COLORS.accent
    });
  }
}
function drawPaletteIcon(type,canvas){
  const c=canvas.getContext('2d');
  const bt=BLOCK_TYPES[type];
  const cw=canvas.width,ch=canvas.height;
  c.clearRect(0,0,cw,ch);
  const cellW=Math.min((cw-4)/bt.w,(ch-4)/bt.h);
  const ox=(cw-bt.w*cellW)/2,oy=(ch-bt.h*cellW)/2;
  c.fillStyle=COLORS.block;c.strokeStyle=COLORS.stroke;c.lineWidth=1;
  for(const cell of bt.cells){
    const cx=ox+cell[0]*cellW,cy=oy+cell[1]*cellW;
    c.beginPath();
    c.moveTo(cx+2,cy);c.lineTo(cx+cellW-2,cy);
    c.quadraticCurveTo(cx+cellW,cy,cx+cellW,cy+2);
    c.lineTo(cx+cellW,cy+cellW-2);c.quadraticCurveTo(cx+cellW,cy+cellW,cx+cellW-2,cy+cellW);
    c.lineTo(cx+2,cy+cellW);c.quadraticCurveTo(cx,cy+cellW,cx,cy+cellW-2);
    c.lineTo(cx,cy+2);c.quadraticCurveTo(cx,cy,cx+2,cy);
    c.closePath();c.fill();c.stroke();
  }
}
