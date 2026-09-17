export class State{
  constructor(){
    this.time = 0;
    this.score = 0;
    this.mass = 0;
    this.stage = 1;
    this.nextStageMass = [0,35,100,220,400];
    this.combo = 0;
    this.comboTimer = 0;
    this.bossActive = false;
    this.gameOver = false;
    this.victory = false;
    this.highScore = this.loadHighScore();
  }
  
  loadHighScore(){ try{ return parseInt(localStorage.getItem('hs')||'0'); }catch(e){ return 0; } }
  
  saveHighScore(){ try{ if(this.score > this.highScore) localStorage.setItem('hs', this.score+''); }catch(e){ }
  }
  
  update(dt){
    if(this.gameOver) return;
    this.time += dt;
    this.comboTimer -= dt;
    if(this.comboTimer <= 0) this.combo = 0;
    if(this.time >= 600 && !this.bossActive) this.spawnBoss();
  }
  
  spawnBoss(){ this.bossActive = true; }
  
  checkStage(){
    if(this.stage < 5 && this.mass >= this.nextStageMass[this.stage]){
      this.stage++;
      return true;
    }
    return false;
  }
}