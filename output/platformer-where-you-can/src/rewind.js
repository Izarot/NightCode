export class Rewind{
  constructor(){ this.buf=[]; this.max=625; this.idx=0; this.rem=10; this.active=false; }
  push(s){ this.buf[this.idx]={x:s.x,y:s.y,vx:s.vx,vy:s.vy,grounded:s.grounded,facing:s.facing,timer:s.timer}; this.idx=(this.idx+1)%this.max; if(this.rem<10) this.rem+=1/60; }
  record(){ this.push({x:player.x,y:player.y,vx:player.vx,vy:player.vy,grounded:player.grounded,facing:player.facing,timer:timer}); }
  update(spd){
    if(!this.active){ this.active=true; }
    this.idx-=spd; if(this.idx<0) this.idx+=this.max;
    const s=this.buf[this.idx];
    if(s){ this.rem=Math.max(0,this.rem-spd/60); }
  }
  get(){ return this.buf[this.idx]; }
  stop(){ this.active=false; }
}