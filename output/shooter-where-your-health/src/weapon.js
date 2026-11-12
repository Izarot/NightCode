export class Bullet {
  constructor(x,y,angle,damage,range){
    this.x=x; this.y=y; this.angle=angle;
    this.speed=1200; this.damage=damage; this.range=range;
    this.traveled=0; this.radius=3;
    this.color='#ffff00';
  }
  update(dt){
    const dx=Math.cos(this.angle)*this.speed*dt;
    const dy=Math.sin(this.angle)*this.speed*dt;
    this.x+=dx; this.y+=dy;
    this.traveled+=Math.hypot(dx,dy);
    return this.traveled < this.range;
  }
}

export class Weapon {
  constructor(game){
    this.game=game;
    this.bullets=[];
    this.damage=5;
    this.healthCost=5;
    this.fireRate=0.4;
    this.range=600;
    this.cooldown=0;
    this.recoil=0;
  }
  update(dt){
    if(this.cooldown>0) this.cooldown-=dt;
    if(this.recoil>0) this.recoil-=dt*5;
    for(let i=this.bullets.length-1;i>=0;i--){
      if(!this.bullets[i].update(dt)) this.bullets.splice(i,1);
    }
    const input=this.game.input;
    if((input.mouseDown || input.keys.space) && this.cooldown<=0){
      this.tryFire();
    }
  }
  tryFire(){
    const player=this.game.player;
    if(player.health < this.healthCost) return;
    player.health -= this.healthCost;
    this.cooldown=this.fireRate;
    this.recoil=1;
    const spread=(Math.random()-0.5)*0.08;
    const angle=player.angle+spread;
    this.bullets.push(new Bullet(player.x,player.y,angle,this.damage,this.range));
    this.game.addScreenShake(3,0.08);
    this.game.audio.play('shoot');
  }
}