class PowerUps {
  constructor(){
    this.vacuum = null;
    this.bounce = null;
    this.activePower = null;
    this.powerTimer = 0;
  }
  activate(type){
    this.activePower = type;
    this.powerTimer = 5000;
  }