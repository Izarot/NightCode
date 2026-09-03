export class Camera{
  constructor(){this.x=0;this.y=0;this.tx=0;this.ty=0;}
  reset(){this.x=0;this.y=0;this.tx=0;this.ty=0;}
  follow(p){
    this.tx=p.x-400;this.ty=p.y-300;
    this.x+=(this.tx-this.x)*.08;this.y+=(this.ty-this.y)*.08;
    if(this.x<0)this.x=0;
  }
}
