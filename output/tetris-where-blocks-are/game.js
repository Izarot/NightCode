class Game{
  constructor(){ this.canvas=document.getElementById('canvas'); this.renderer=new Renderer(this.canvas); this.grid=new Grid.Grid(); this.ui=new UI(); this.currentPiece=null; this.nextPieces=[]; this.holdPiece=null; this.canHold=true; this.score=0; this.level=1; this.lines=0; this.tetrises=0; this.resonances=0; this.tilts=0; this.dropInterval=1000; this.dropTimer=0; this.lockDelay=500; this.lockTimer=0; this.isLocking=false; this.running=false; this.paused=false; this.lastTime=0; this.gravity=1; this.softDrop=false; this.resizeHandler=()=>this.renderer.resize(); window.addEventListener('resize', this.resizeHandler); this.renderer.resize(); Emotion.tracker=new Emotion.EmotionTracker(); this.fillNext(); }
  fillNext(){ while(this.nextPieces.length<5) this.nextPieces.push(Piece.createRandomPiece()); }
  spawn(){ this.currentPiece=this.nextPieces.shift(); this.fillNext(); this.currentPiece.x=3; this.currentPiece.y=0; this.currentPiece.rot=0; this.currentPiece.spawnAnim=150; this.canHold=true; this.isLocking=false; this.lockTimer=0; if(!this.grid.isValid(this.currentPiece)){ this.gameOver(); } }
  hold(){ if(!this.canHold) return; if(this.holdPiece){ const tmp=this.holdPiece; this.holdPiece=this.currentPiece.clone(); this.currentPiece=tmp; this.currentPiece.x=3; this.currentPiece.y=0; this.currentPiece.rot=0; this.currentPiece.spawnAnim=150; }else{ this.holdPiece=this.currentPiece.clone(); this.spawn(); } this.canHold=false; this.ui.updateHold(this.holdPiece); Audio.SFX.move(); }
  move(dx){ if(this.currentPiece.move(dx,0,this.grid.cells)) Audio.SFX.move(); }
  rotate(cw){ if(this.currentPiece.rotate(cw,this.grid.cells)) Audio.SFX.rotate(); }
  softDrop(){ this.softDrop=true; }
  softDropRelease(){ this.softDrop=false; }
  hardDrop(){ const dist=this.currentPiece.hardDrop(this.grid.cells); this.score+=dist*2; this.lockPiece(); Audio.SFX.hardDrop(); }
  lockPiece(){ this.grid.lock(this.currentPiece); Audio.SFX.lock(); const lines=this.grid.checkLines(); if(lines.length>0){ this.clearLines(lines); }else{ this.spawn(); } this.ui.updateNext(this.nextPieces); }
  clearLines(lines){ this.grid.clearLines(lines); this.renderer.emitBurst(0,0,100); const lineCount=lines.length; const base=[0,100,300,500,800]; this.score+=base[lineCount]*this.level; if(lineCount===4) this.tetrises++; this.lines+=lineCount; this.level=Math.floor(this.lines/10)+1; this.dropInterval=Math.max(100, 1000-(this.level-1)*80); Audio.SFX[`clear${lineCount}`](); const dom=Emotion.tracker.getDominant(); if(dom && dom.pct>0.4){ this.resonances++; Audio.SFX.resonance(dom.id); this.renderer.shakeScreen(8,300); } setTimeout(()=>this.spawn(), 300); }
  update(dt){ if(this.paused || !this.running) return;
    this.currentPiece.updateSpawnAnim(dt);
    Emotion.tracker.update(dt);
    this.ui.updatePressure(Emotion.tracker.getPressurePct());
    this.renderer.updateShake(dt);
    this.grid.updateClearAnim(dt);
    
    const dropSpeed=this.softDrop?50:this.dropInterval;
    this.dropTimer+=dt;
    if(this.dropTimer>=dropSpeed){
      if(this.currentPiece.move(0,1,this.grid.cells)){
        this.dropTimer=0;
        if(this.softDrop) this.score+=1;
      }else{
        if(!this.isLocking){
          this.isLocking=true;
          this.lockTimer=0;
        }
      }
    }
    
    if(this.isLocking){
      this.lockTimer+=dt;
      if(this.lockTimer>=this.lockDelay){
        this.lockPiece();
      }else if(this.currentPiece.move(0,1,this.grid.cells)){
        this.isLocking=false;
        this.lockTimer=0;
      }
    }
    
    if(Emotion.tracker.isTiltActive() && Emotion.tracker.isInverted()){
      this.renderer.ctx.save();
      this.renderer.ctx.translate(this.renderer.logicalW, this.renderer.logicalH);
      this.renderer.ctx.rotate(Math.PI);
    }
  }
  draw(){ this.renderer.drawBackground(Emotion.tracker.getDominantId());
    this.renderer.applyShake();
    this.renderer.drawGrid(this.grid);
    if(this.currentPiece){
      const ghost=this.currentPiece.clone();
      while(ghost.move(0,1,this.grid.cells));
      this.renderer.drawPiece(ghost, true);
      this.renderer.drawPiece(this.currentPiece);
    }
    this.renderer.drawParticles();
    if(Emotion.tracker.isTiltActive() && Emotion.tracker.isInverted()){
      this.renderer.ctx.restore();
    }
  }
  loop(time){ const dt=time-this.lastTime; this.lastTime=time; this.update(dt); this.draw(); if(this.running) requestAnimationFrame(t=>this.loop(t)); }
  start(){ Audio.enable(); this.score=0; this.level=1; this.lines=0; this.tetrises=0; this.resonances=0; this.tilts=0; this.dropInterval=1000; this.grid.reset(); Emotion.tracker.reset(); this.fillNext(); this.spawn(); this.ui.updateScore(this.score); this.ui.updateLevel(this.level); this.ui.updateLines(this.lines); this.ui.updateNext(this.nextPieces); this.ui.updateHold(this.holdPiece); this.ui.hideAll(); this.running=true; this.paused=false; this.lastTime=performance.now(); requestAnimationFrame(t=>this.loop(t)); }
  pause(){ if(!this.running) return; this.paused=!this.paused; if(this.paused){ this.ui.showPause(); }else{ this.ui.hidePause(); this.lastTime=performance.now(); requestAnimationFrame(t=>this.loop(t)); } }
  resume(){ this.paused=false; this.ui.hidePause(); this.lastTime=performance.now(); requestAnimationFrame(t=>this.loop(t)); }
  gameOver(){ this.running=false; Audio.SFX.gameover(); this.ui.showGameOver({score:this.score, level:this.level, lines:this.lines, tetrises:this.tetrises, resonances:this.resonances, tilts:this.tilts}); }
  handleInput(action){ if(!this.running || this.paused) return; switch(action){ case 'left': this.move(-1); break; case 'right': this.move(1); break; case 'down': this.softDrop(); break; case 'downRelease': this.softDropRelease(); break; case 'rotate': this.rotate(true); break; case 'hard': this.hardDrop(); break; case 'hold': this.hold(); break; } }
}
window.Game = new Game();