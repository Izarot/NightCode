export class UI {
  constructor(game){
    this.game=game;
    this.overlay=game.uiOverlay;
    this.pickups=[];
    this.buildHUD();
  }
  buildHUD(){
    this.overlay.innerHTML=`
      <div class="hud hud-top hud-hp">
        <div class="hp-bar"><div class="hp-fill" id="hp-fill" style="width:100%"></div></div>
        <span class="hp-text" id="hp-text">100 / 100 AMMO / HP</span>
      </div>
      <div class="hud hud-timer timer" id="timer">0.00s</div>
      <div class="highscore" id="highscore">BEST: ${this.game.highScore}s</div>
      <div id="gameover" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;color:#ff0066;text-shadow:0 0 16px #ff0066;">
        <h1 style="font-size:48px;margin-bottom:16px">WASTED</h1>
        <div id="final-time" style="font-size:24px;margin-bottom:24px"></div>
        <button id="restart" style="background:#0a0a0f;border:2px solid #ff0066;color:#ff0066;padding:12px 32px;font-size:18px;border-radius:8px;cursor:pointer;text-transform:uppercase;letter-spacing:2px">RETRY</button>
      </div>
    `;
    this.hpFill=document.getElementById('hp-fill');
    this.hpText=document.getElementById('hp-text');
    this.timerEl=document.getElementById('timer');
    this.highscoreEl=document.getElementById('highscore');
    this.gameoverEl=document.getElementById('gameover');
    this.finalTimeEl=document.getElementById('final-time');
    document.getElementById('restart').onclick=()=>this.game.restart();
  }
  update(){
    const p=this.game.player;
    const pct=p.health/p.maxHealth*100;
    this.hpFill.style.width=pct+'%';
    this.hpFill.style.background=pct>30?'linear-gradient(90deg,#ff0066,#ff6600)':'linear-gradient(90deg,#ff0066,#ff0000)';
    this.hpText.textContent=`${Math.ceil(p.health)} / ${p.maxHealth} AMMO / HP`;
    if(pct<25){ this.hpText.style.animation='pulse 0.5s infinite'; this.hpFill.style.boxShadow='0 0 15px #ff0000'; }
    else{ this.hpText.style.animation=''; this.hpFill.style.boxShadow='0 0 10px #ff0066'; }
    this.timerEl.textContent=this.game.timer.toFixed(2)+'s';
    this.highscoreEl.textContent=`BEST: ${this.game.highScore}s`;
    this.pickups=this.pickups.filter(p=>p.update());
  }
  showPickup(x,y,amt){
    const el=document.createElement('div');
    el.className='pickup';
    el.textContent=`+${amt}`;
    el.style.cssText=`position:absolute;color:#00ff88;text-shadow:0 0 8px #00ff88;font-weight:bold;font-size:18px;pointer-events:none;transition:all 0.8s ease-out`;
    const rect=this.game.canvas.getBoundingClientRect();
    const sx=(x-this.game.camera.x)*this.game.scale+this.game.offsetX;
    const sy=(y-this.game.camera.y)*this.game.scale+this.game.offsetY;
    el.style.left=sx+'px'; el.style.top=sy+'px';
    this.overlay.appendChild(el);
    requestAnimationFrame(()=>{ el.style.transform='translateY(-40px)'; el.style.opacity='0'; });
    setTimeout(()=>el.remove(),800);
  }
  showGameOver(){
    this.finalTimeEl.textContent=`SURVIVED: ${this.game.timer.toFixed(2)}s`;
    this.gameoverEl.style.display='block';
  }
  hideGameOver(){ this.gameoverEl.style.display='none'; }
}