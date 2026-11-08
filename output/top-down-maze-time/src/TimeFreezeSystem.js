export class TimeFreezeSystem{
 constructor(){this.energy=100;this.active=false;this.freezeTime=0;this.cooldown=0;}
 update(dt,holding){
  if(this.cooldown>0)this.cooldown-=dt;
  if(holding&&this.energy>0&&this.freezeTime<3&&this.cooldown<=0){this.active=true;this.freezeTime+=dt;this.energy=Math.max(0,this.energy-34*dt); if(this.energy<=0||this.freezeTime>=3){this.active=false;this.cooldown=8;this.freezeTime=0;}}
  else{if(this.active){this.active=false;this.freezeTime=0;} this.energy=Math.min(100,this.energy+12.5*dt); if(this.energy>=100)this.cooldown=0;}
  return this.active;
 }
 drain(a){this.energy=Math.max(0,this.energy-a);}
}
