export class Enemy{
  constructor(game){ this.game = game; this.list = []; this.spawnTimer = 0; this.budget = 0; this.maxActive = 70; }
  
  update(dt){
    this.spawnTimer += dt;
    this.budget += (2 + 0.3 * (this.game.state.time/60)) * dt;
    this.budget = Math.min(this.budget, 24);
    
    if(this.spawnTimer >= 0.5){
      this.trySpawn();
      this.spawnTimer = 0;
    }
    
    for(let i=this.list.length-1;i>=0;i--){
      const e = this.list[i];
      e.x += Math.cos(e.angle)*e.speed*dt*60;
      e.y += Math.sin(e.angle)*e.speed*dt*60;
      e.life -= dt;
      if(e.life <= 0) this.list.splice(i,1);
    }
  }
  
  trySpawn(){ if(this.list.length >= this.maxActive) return; const cost = 1; if(this.budget >= cost){ this.budget -= cost; this.list.push({x:0,y:0,angle:0,speed:155,life:5,r:12,mass:5,score:25,hull:24,maxHull:24}); }
  }
}