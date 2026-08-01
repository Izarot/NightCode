class UI {
  constructor(){
    this.highScore=parseInt(localStorage.getItem('craniumHighScore'))||0;
    this.timer=0;
    this.roundText='';
    this.roundTimer=0;
  }
  update(dt){this.timer++;if(this.roundTimer>0)this.roundTimer--;}
  draw(ctx,player1,player2){
    // Health/Daze bars
    this.drawBar(ctx,20,20,player1.health,player1.daze,'#ff3b3b','#ffd700');
    this.drawBar(ctx,1860,20,player2.health,player2.daze,'#ff3b3b','#ffd700',true);
    // Timer
    const m=Math.floor(this.timer/3600);const s=((this.timer/60)%60).toFixed(0).padStart(2,'0');
    ctx.fillStyle='#fff';ctx.font='bold 36px "Courier New"';
    ctx.textAlign='center';
    ctx.fillText(`${m}:${s}`,960,60);
    // Speedrun timer
    ctx.font='bold 24px "Courier New"';
    ctx.fillText(`Speedrun: ${(this.timer/60).toFixed(2)}s`,960,100);
    // Combo
    if(player1.combo>0&&player1.lastHitTime>0){ctx.fillStyle='#ffea00';ctx.font='bold 28px "Courier New"';ctx.fillText(`${player1.combo} HIT COMBO!`,player1.x,player1.y-50);}
    if(player2.combo>0&&player2.lastHitTime>0){ctx.fillStyle='#ffea00';ctx.font='bold 28px "Courier New"';ctx.fillText(`${player2.combo} HIT COMBO!`,player2.x,player2.y-50);}
    // Round overlay
    if(this.roundTimer>0){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,1920,1080);ctx.fillStyle='#fff';ctx.font='bold 80px "Courier New"';ctx.textAlign='center';ctx.fillText(this.roundText,960,540);}
    // High score
    ctx.font='bold 20px "Courier New"';ctx.textAlign='left';
    ctx.fillText(`High Score: ${this.highScore}`,20,1050);
  }
  drawBar(ctx,x,y,h,d,color1,color2,right=false){
    const w=300;
    ctx.fillStyle='#333';ctx.fillRect(x,y,w,20);
    ctx.fillStyle=color1;ctx.fillRect(x,y,h/100*w,20);
    ctx.fillStyle=color2;ctx.fillRect(x,y+22,d/100*w,20);
    if(right){ctx.save();ctx.scale(-1,1);ctx.translate(-x*2-300,0);ctx.fillStyle='#333';ctx.fillRect(0,y,w,20);ctx.fillStyle=color1;ctx.fillRect(0,y,h/100*w,20);ctx.fillStyle=color2;ctx.fillRect(0,y+22,d/100*w,20);ctx.restore();}
  }
  setRound(text){this.roundText=text;this.roundTimer=120;}
  updateHighScore(score){if(score>this.highScore){this.highScore=score;localStorage.setItem('craniumHighScore',score);}}
}
