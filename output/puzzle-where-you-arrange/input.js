function initInput(){
  canvas.addEventListener('mousemove',onMouseMove);
  canvas.addEventListener('click',onClick);
  canvas.addEventListener('contextmenu',e=>{e.preventDefault();deselect();});
  canvas.addEventListener('touchstart',onTouchStart,{passive:false});
  canvas.addEventListener('touchmove',onTouchMove,{passive:false});
  canvas.addEventListener('touchend',onTouchEnd);
  document.addEventListener('keydown',onKey);
}
function getGridPos(px,py){
  const w=state.cssW,h=state.cssH;
  const offX=(w-GRID_COLS*CELL)/2;
  const maxRows=Math.max(state.targetHeight+4,state.currentHeight+2,GROUND_ROWS);
  const totalH=maxRows*CELL;
  const offY=h-80-totalH+state.targetHeight*CELL;
  const gx=Math.floor((px-offX)/CELL);
  const gy=Math.round((py-offY)/CELL);
  return {x:gx,y:gy};
}
function onMouseMove(e){
  const rect=canvas.getBoundingClientRect();
  state.mouseX=e.clientX-rect.left;state.mouseY=e.clientY-rect.top;
  updateHover();
}
function updateHover(){
  if(!state.selectedBlock){state.hoverPos=null;return;}
  const pos=getGridPos(state.mouseX,state.mouseY);
  const bt=BLOCK_TYPES[state.selectedBlock];
  state.hoverPos={x:pos.x,y:Math.max(0,pos.y)};
}
function onClick(e){
  if(state.activeScreen!=='play')return;
  initAudio();
  const pos=getGridPos(state.mouseX,state.mouseY);
  if(pos.x<0||pos.x>=GRID_COLS){return;}
  tryPlace(pos.x,Math.max(0,pos.y));
}
function onTouchStart(e){e.preventDefault();const t=e.touches[0];
  const rect=canvas.getBoundingClientRect();
  state.mouseX=t.clientX-rect.left;state.mouseY=t.clientY-rect.top;
  updateHover();
}
function onTouchMove(e){e.preventDefault();const t=e.touches[0];
  const rect=canvas.getBoundingClientRect();
  state.mouseX=t.clientX-rect.left;state.mouseY=t.clientY-rect.top;
  updateHover();
}
function onTouchEnd(e){e.preventDefault();if(state.activeScreen==='play'){
  initAudio();
  const pos=getGridPos(state.mouseX,state.mouseY);
  if(state.selectedBlock&&pos.x>=0&&pos.x<GRID_COLS)tryPlace(pos.x,Math.max(0,pos.y));
}}
function tryPlace(px,py){
  if(!state.selectedBlock)return;
  const bt=BLOCK_TYPES[state.selectedBlock];
  if((state.palette[state.selectedBlock]||0)<=0){sndError();return;}
  const block={type:state.selectedBlock,x:px,y:py,w:bt.w,h:bt.h};
  if(!isValidPlacement(block,px,py)){
    sndError();
    state.shakeBlocks.push(Object.assign({},block));
    state.shakeBlocks[state.shakeBlocks.length-1].t=0;
    setTimeout(()=>state.shakeBlocks.pop(),200);
    return;
  }
  state.placed.push(block);
  state.palette[state.selectedBlock]--;
  state.history.push(block);
  state.currentHeight=maxHeight();
  sndPlace();
  const px2=px*CELL+CELL/2,py2=py*CELL+CELL/2;
  spawnParticles(px2,py2,COLORS.accent,10);
  if(state.palette[state.selectedBlock]<=0)state.selectedBlock=null;
  checkWin();
}
function deselect(){state.selectedBlock=null;state.hoverPos=null;}
function onKey(e){
  if(e.key==='Escape'){deselect();}
  else if(e.key==='r'||e.key==='R'){if(state.activeScreen==='play')restartLevel();}
  else if(e.key==='u'||e.key==='U'){undoLast();}
}
function undoLast(){
  if(!state.history.length){sndError();return;}
  const last=state.history.pop();
  state.placed=state.placed.filter(b=>b!==last);
  state.palette[last.type]=(state.palette[last.type]||0)+1;
  state.currentHeight=maxHeight();
  sndClick();
}
