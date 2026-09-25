export class Physics{
  constructor(){ this.g=1500; this.maxSpd=200; this.grndAcc=800; this.airAcc=400; this.grndDec=1200; this.airDec=600; this.jumpVel=-460; this.term=800; this.coyote=0.1; this.buf=0.1; }
  step(p,keys,dt){
    let acc={x:0,y:0};
    if(keys.left) acc.x=-1;
    if(keys.right) acc.x+=1;
    if(p.grounded){ if(acc.x) acc.x*=this.grndAcc; else acc.x=-this.grndDec; }else{ if(acc.x) acc.x*=this.airAcc; else acc.x=-this.airDec; }
    p.vx+=acc.x*dt; p.vx=Math.max(-this.maxSpd,Math.min(this.maxSpd,p.vx));
    if(!p.grounded) p.vy+=this.g*dt;
    p.vy=Math.max(-this.term,this.min(this.term,p.vy));
    if(keys.jump && p.grounded){ p.vy=this.jumpVel; p.grounded=false; audio?.play('jump'); }
    p.x+=p.vx*dt; p.y+=p.vy*dt;
    p.grounded=false;
    if(p.y+48>=360){ p.y=360-48; p.vy=0; p.grounded=true; }
    p.facing=p.vx>=0?1:-1;
  }
}