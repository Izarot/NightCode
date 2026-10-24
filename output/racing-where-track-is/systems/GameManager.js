class GameManager{
  constructor(){
    this.time = 0;
    this.combo = 0;
    this.highScore = parseInt(localStorage.getItem('highScore') || '0');
  }
  update(dt){
    this.time += dt;
  }
  getCombo(){
    return this.combo;
  }
  incrementCombo(){
    this.combo++;
  }
  resetCombo(){
    this.combo = 0;
  }
  checkHighScore(){
    if(this.time > this.highScore){
      this.highScore = this.time;
      localStorage.setItem('highScore', this.highScore);
    }
  }
  getHighScore(){
    return this.highScore;
  }
}