class Level {
  constructor(){
    this.walls = [];
    this.exit = null;
    this.loadLevel(1);
  }
  loadLevel(n){
    this.walls = [
      {x:0,y:0,w:800,h:20},
      {x:0,y:580,w:800,h:20},
      {x:0,y:0,w:20,h:600},
      {x:780,y:0,w:20,h:600}
    ];
    this.exit = {x:700,y:500,w:40,h:40};
  }