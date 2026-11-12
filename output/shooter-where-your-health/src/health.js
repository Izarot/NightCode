export class HealthPack {
  constructor(game,x,y){
    this.game=game; this.x=x; this.y=y;
    this.radius=12; this.amount=25;
    this.bob=Math.random()*Math.PI*2;
    this.collected=false;
  }
  update(dt){
    this.bob+=dt*3;
    const dx=this.game.player.x-this.x;
    const dy=this.game.player.y-this.y;
    if(Math.hypot(dx,dy) < this.radius+this.game.player.radius){
      this.collected=true;
      this.game.player.heal(this.amount);
      this.game.audio.play('heal');
      this.game.ui.showPickup(this.x,this.y,this.amount);
    }
  }
}

export class HealthPackManager {
  constructor(game){ this.game=game; this.list=[]; }
  spawnRandom(){
    const margin=200;
    const x=Math.random()*(this.game.worldBounds.w-2*margin)+margin;
    const y=Math.random()*(this.game.worldBounds.h-2*margin)+margin;
    this.list.push(new HealthPack(this.game,x,y));
  }
  update(dt){
    for(let i=this.list.length-1;i>=0;i--){
      this.list[i].update(dt);
      if(this.list[i].collected) this.list.splice(i,1);
    }
  }
}