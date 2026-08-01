export class UI{
  constructor(uiContainer, hudEl, timerEl){
    this.uiContainer=uiContainer;
    this.hudEl=hudEl;
    this.timerEl=timerEl;
    this.cash=0;
    this.highScore=0;
  }
  setCash(cash){
    this.cash=cash;
    this.updateHud();
  }
  setHighScore(score){
    this.highScore=score;
    this.updateHud();
  }
  updateHud(){
    this.hudEl.textContent=`Cash: ${this.cash} | High Score: ${this.highScore}`;
  }
  updateTimer(sec){
    const mins=Math.floor(sec/60);
    const secs=Math.floor(sec%60).toString().padStart(2,'0');
    this.timerEl.textContent=`Time: ${mins}:${secs}`;
  }
}
