class Game{
constructor(){
this.grid=new Grid();this.risers=new RiserManager();this.ui=new UI();
this.piece=null;this.nextPiece=null;this.heldPiece=null;this.canHold=true;
this.score=0;this.level=1;this.lines=0;this.towerH=0;this.danger=0;
this.startTime=0;this.elapsed=0;this.running=false;this.paused=false;
this.dropTimer=0;this.dropInterval=1000;this.lockDelay=500;this.lockTimer=0;this.locking=false;
this.clearAnim=[];this.shakeX=0;this.shakeY=0;this.shakeTimer=0;
this.lastTime=0;
this.input=new InputHandler();
this.canvas=document.getElementById('gameCanvas');
initRenderer(this.canvas);
this.nextPiece=new Piece(this.randomType());
this.loop=this.loop.bind(this);
requestAnimationFrame(this.loop);
}
randomType(){return PIECE_TYPES[Math.floor(Math.random()*PIECE_TYPES.length)];}
start(){audio.init();this.reset();this.running=true;this.paused=false;this.ui.showScreen(null);this.startTime=performance.now();this.lastTime=this.startTime;}
reset(){this.grid=new Grid();this.risers=new RiserManager();this.score=0;this.level=1;this.lines=0;this.towerH=0;this.danger=0;this.piece=null;this.heldPiece=null;this.canHold=true;this.clearAnim=[];this.shakeX=0;this.shakeY=0;this.shakeTimer=0;this.dropTimer=0;this.lockTimer=0;this.locking=false;this.spawnPiece();}
spawnPiece(){if(!this.nextPiece)this.nextPiece=new Piece(this.randomType());this.piece=this.nextPiece;this.nextPiece=new Piece(this.randomType());this.canHold=true;this.lockTimer=0;this.locking=false;this.dropTimer=0;if(this.checkCollision(this.piece))this.gameOver();}
checkCollision(piece,shape,ox,oy){const s=shape||piece.shape;const x=(ox!==undefined?ox:piece.x);const y=(oy!==undefined?oy:piece.y);for(let r=0;r<s.length;r++)for(let c=0;c<s[r].length;c++)if(s[r][c]){const nx=x+c,ny=y+r;if(nx<0||nx>=COLS||ny>=ROWS)return true;if(ny>=0&&!this.grid.isEmpty(nx,ny))return true;}return false;}
moveLeft(){if(!this.piece||this.paused)return;if(!this.checkCollision(this.piece,this.piece.shape,this.piece.x-1,this.piece.y)){this.piece.x--;audio.play('move');if(this.locking)this.lockTimer=0;}}
moveRight(){if(!this.piece||this.paused)return;if(!this.checkCollision(this.piece,this.piece.shape,this.piece.x+1,this.piece.y)){this.piece.x++;audio.play('move');if(this.locking)this.lockTimer=0;}}
moveDown(){if(!this.piece||this.paused)return;if(!this.checkCollision(this.piece,this.piece.shape,this.piece.x,this.piece.y+1)){this.piece.y++;this.score+=1;if(this.locking)this.lockTimer=0;return true;}return false;}
hardDrop(){if(!this.piece||this.paused)return;let d=0;while(!this.checkCollision(this.piece,this.piece.shape,this.piece.x,this.piece.y+1)){this.piece.y++;d++;}this.score+=d*2;audio.play('drop');this.lockPiece();}
rotatePiece(){
if(!this.piece||this.paused)return;
const{shape,kicks}=this.piece.rotateCW();
for(const[kx,ky]of kicks){
if(!this.checkCollision(this.piece,shape,this.piece.x+kx,this.piece.y+ky)){
this.piece.shape=shape;this.piece.x+=kx;this.piece.y+=ky;audio.play('rotate');if(this.locking)this.lockTimer=0;return;
}
}
}
holdPiece(){if(!this.piece||!this.canHold||this.paused)return;this.canHold=false;if(this.heldPiece){const tmp=this.heldPiece;this.heldPiece=new Piece(this.piece.type);this.piece=tmp;}else{this.heldPiece=new Piece(this.piece.type);this.piece=null;this.spawnPiece();}audio.play('hold');}
lockPiece(){
this.grid.lockPiece(this.piece);audio.play('drop');
const full=this.grid.findFullLines();
if(full.length>0){this.clearAnim=full;audio.play('clear');this.score+=full.length*full.length*100;this.lines+=full.length;this.clearAnimRows(full);}
const newTowerH=this.riser.getMaxRow()+this.risers.count;this.towerH=newTowerH;
this.updateLevel();this.updateDanger();
this.checkRisers();
this.spawnPiece();
}
clearAnimRows(rows){const speed=4;for(const r of rows){const rl=new RiserLine(r,speed);this.risers.add(rl);}this.grid.clearLines(rows);this.shakeTimer=0.2;this.shakeX=(Math.random()-0.5)*6;this.shakeY=(Math.random()-0.5)*6;}
updateLevel(){this.level=Math.floor(this.lines/10)+1;this.dropInterval=Math.max(100,1000-Math.pow(2,12-Math.min(this.level,12)));if(this.level>1&&this.lines%10===0){audio.play('levelup');}}
updateDanger(){const topRow=this.risers.getMaxRow();const spawnRow=4;this.danger=Math.max(0,Math.min(1,(spawnRow-topRow+this.risers.count*0.3)/8));}
checkRisers(){if(this.risers.count>=3&&this.risers.count%3===0){const speed=2+this.level*0.5;const rl=new RiserLine(ROWS+2,speed);this.risers.add(rl);audio.play('riser');}}
update(dt){
if(!this.running||this.paused)return;
this.elapsed=performance.now()-this.startTime;
if(this.shakeTimer>0){this.shakeTimer-=dt;if(this.shakeTimer<=0){this.shakeX=0;this.shakeY=0;}}
this.risers.update(dt);
if(this.piece){
this.dropTimer+=dt;
if(this.input.down)this.dropTimer+=dt*5;
if(this.dropTimer>=this.dropInterval){this.dropTimer=0;if(!this.moveDown()){this.locking=true;this.lockTimer=0;}}
if(this.locking){this.lockTimer+=dt;if(this.checkCollision(this.piece,this.piece.shape,this.piece.x,this.piece.y+1)){this.lockTimer=0;}if(this.lockTimer>=this.lockDelay){this.locking=false;this.lockPiece();}}
if(this.input.left)this.moveLeft();
if(this.input.right)this.moveRight();
if(this.input.rotate)this.rotatePiece();
if(this.input.drop)this.hardDrop();
if(this.input.hold)this.holdPiece();
}
if(this.input.pause){this.togglePause();}
}
}
togglePause(){if(!this.running)return;this.paused=!this.paused;if(this.paused){this.ui.showScreen('pause');}else{this.ui.showScreen(null);this.lastTime=performance.now();}}
pause(){this.paused=true;this.ui.showScreen('pause');}
resume(){this.paused=false;this.ui.showScreen(null);this.lastTime=performance.now();}
restart(){this.ui.showScreen(null);this.reset();this.running=true;this.paused=false;this.startTime=performance.now();this.lastTime=this.startTime;}
quit(){this.running=false;this.paused=false;this.ui.showScreen('menu');}
gameOver(){this.running=false;audio.play('gameover');const t=Math.floor(this.elapsed/1000);const m=Math.floor(t/60);const s=t%60;const timeStr=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;this.ui.showGameOver(this.score,this.level,this.lines,timeStr);}
loop(ts){
const dt=Math.min((ts-(this.lastTime||ts))/1000,0.1);
this.lastTime=ts;
if(this.running&&!this.paused)this.update(dt);
ctx.clearRect(0,0,canvas.width,canvas.height);
if(this.running||this.paused){
drawGrid(this.grid,this.risers,this.piece,this.nextPiece,this.heldPiece,this.score,this.level,this.lines,this.towerH,this.danger,this.elapsed,this.shakeX,this.shakeY);
drawHUD(this.risers,this.elapsed,this.nextPiece,this.heldPiece);
if(this.paused)drawCenterText('PAUSED',24,'rgba(255,255,255,0.5)');
if(this.danger>0.7){const pulse=Math.sin(ts*0.005)*0.5+0.5;ctx.fillStyle=`rgba(233,69,96,${pulse*0.08})`;ctx.fillRect(0,0,canvas.width,canvas.height);}
}else{drawGrid(null,null,null,null,null,0,0,0,0,0,0,0,0);drawHUD(null,0,null,null);drawCenterText('TOWER TETRIS',28,'#e94560');}
requestAnimationFrame(this.loop);
}
}
const game=new Game();
