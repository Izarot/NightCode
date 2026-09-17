export class Weapon{
  constructor(game){ this.game = game; this.fireRate = 6; this.lastFire = 0; this.damage = 10; this.projectiles = []; }
  
  update(dt){
    const g = this.game; const p = g.player;
    this.lastFire += dt;
    if(g.input.mouse.left && this.lastFire >= 1/this.fireRate){
      this.fire(p.x, p.y, p.angle);
      this.lastFire = 0;
    }
    for(let i=this.projectiles.length-1;i>=0;i--){
      const pr = this.projectiles[i];
      pr.x += Math.cos(pr.angle)*780*dt*60;
      pr.y += Math.sin(pr.angle)*780*dt*60;
      pr.life -= dt;
      if(pr.life <= 0) this.projectiles.splice(i,1);
    }
  }
  
  fire(x,y,angle){
    this.projectiles.push({x,y,r:3,life:1.25,angle});
    this.game.audio.play('fire');
  }
}